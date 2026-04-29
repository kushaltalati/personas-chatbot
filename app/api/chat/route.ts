import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { personas, PersonaId } from "@/lib/personas";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

type Body = { personaId: PersonaId; messages: ChatMessage[] };

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { personaId, messages } = body;
  const persona = personas[personaId];

  if (!persona) {
    return NextResponse.json({ error: "Unknown persona" }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages must be a non-empty array" }, { status: 400 });
  }

  const lastUser = messages[messages.length - 1];
  if (lastUser.role !== "user" || !lastUser.content?.trim()) {
    return NextResponse.json({ error: "Last message must be a user turn" }, { status: 400 });
  }

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      systemInstruction: persona.systemPrompt,
    });

    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 2048,
        // thinkingConfig is supported by 2.5-flash but not in the SDK types yet
        thinkingConfig: { thinkingBudget: 0 },
      } as Record<string, unknown>,
    });

    const result = await sendWithRetry(() => chat.sendMessage(lastUser.content));
    const cleaned = cleanReply(result.response.text(), persona.name);
    return NextResponse.json({ reply: cleaned });
  } catch (err) {
    console.error("[/api/chat]", err);
    const overloaded = err instanceof Error && /503|overload|unavailable/i.test(err.message);
    return NextResponse.json(
      {
        error: overloaded
          ? "The model is overloaded right now. Give it a few seconds and try again."
          : "The model could not respond right now. Please try again.",
      },
      { status: 502 }
    );
  }
}

// Defense-in-depth: strip leaked CoT preambles and self-name prefixes
// the model sometimes copies from the few-shot formatting.
function cleanReply(text: string, personaName: string): string {
  let out = text.trimStart();

  // Leading parenthesised/bracketed reasoning block.
  out = out.replace(
    /^\s*[([][^)\]]*?(internal\s+reasoning|reasoning|thinking|chain[-\s]of[-\s]thought|step\s*1)[^)\]]*?[)\]]\s*/i,
    ""
  );

  // Leading "Reasoning: ..." / "Thinking: ..." line.
  out = out.replace(/^\s*(internal\s+reasoning|reasoning|thinking)\s*:[^\n]*\n+/i, "");

  // Leading "<Name>: " or "<First name>: " prefix (e.g. "Kshitij: ...").
  const escapedFull = personaName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const firstName = personaName.split(" ")[0];
  const escapedFirst = firstName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  out = out.replace(new RegExp(`^\\s*(${escapedFull}|${escapedFirst})\\s*:\\s*`, "i"), "");

  return out.trimStart();
}

// Gemini occasionally 503s under load. Two quick retries clear most of them.
async function sendWithRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const transient = err instanceof Error && /503|overload|unavailable/i.test(err.message);
      if (!transient || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw lastErr;
}
