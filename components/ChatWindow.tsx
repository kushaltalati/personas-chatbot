"use client";

import { useEffect, useRef, useState, FormEvent, KeyboardEvent } from "react";
import { Persona } from "@/lib/personas";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import SuggestionChips from "./SuggestionChips";

type Message = {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

type Props = {
  persona: Persona;
  onLoadingChange?: (loading: boolean) => void;
};

const STORAGE_PREFIX = "scaler-chat:";

export default function ChatWindow({ persona, onLoadingChange }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHydrated(false);
    const raw = localStorage.getItem(STORAGE_PREFIX + persona.id);
    setMessages(raw ? JSON.parse(raw) : []);
    setInput("");
    setHydrated(true);
  }, [persona.id]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_PREFIX + persona.id, JSON.stringify(messages));
  }, [messages, persona.id, hydrated]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaId: persona.id,
          messages: next.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages([
          ...next,
          { role: "assistant", content: data.error || "Something went wrong.", isError: true },
        ]);
      } else {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Network error — please check your connection and try again.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    localStorage.removeItem(STORAGE_PREFIX + persona.id);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const count = messages.length;
  const countLabel = count === 0 ? "New conversation" : `${count} message${count === 1 ? "" : "s"}`;

  return (
    <div className="chat" style={{ ["--accent" as string]: persona.accentColor }}>
      <div className="chat-toolbar">
        <span className="chat-toolbar-label">{countLabel}</span>
        <button
          type="button"
          className="clear-btn"
          onClick={clearChat}
          disabled={loading || count === 0}
        >
          Clear chat
        </button>
      </div>

      <div className="messages" ref={scrollRef}>
        {count === 0 ? (
          <div className="empty-state">
            <strong>You are now chatting with {persona.name}.</strong>
            Ask anything, or pick a suggestion below to get started.
          </div>
        ) : (
          messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} isError={m.isError} />
          ))
        )}
        {loading && <TypingIndicator />}
      </div>

      {count === 0 && (
        <SuggestionChips
          chips={persona.suggestionChips}
          onPick={sendMessage}
          disabled={loading}
        />
      )}

      <form className="composer" onSubmit={onSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Ask ${persona.name.split(" ")[0]} something...`}
          rows={1}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
