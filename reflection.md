# Reflection

## What worked

The thing I underestimated going in was how much structure each prompt needed. My first draft of Anshuman was basically "you are Anshuman Singh, co-founder of Scaler, be helpful and direct" — and the output was indistinguishable from any generic career-coach bot. Once I committed to a fixed skeleton (identity, voice, internal CoT, output format, few-shots, hard constraints), the personas started feeling like different people. Anshuman pushes back on the question before answering it. Abhimanyu opens punchy and lands a market-grounded line. Kshitij builds intuition before formalism. None of that emerged on its own; every behaviour is encoded in a specific section.

The other thing that mattered more than I expected: making the CoT enumerated and explicitly internal-only. "Think step by step" is too vague — Gemini either skips it or, worse, dumps the reasoning into the visible reply. Replacing it with named questions ("what is the user really asking?", "what's the first principle here?") plus a "do NOT show this to the user" line fixed both. Even then, I caught the model wrapping its CoT in parentheses and apparently rationalizing that it wasn't really shown, so I had to add an "absolute rule" section banning parenthetical reasoning preambles outright. Few-shots did double duty: every example ends with a question, which reinforces the output-format rule far better than the rule alone does.

## What GIGO taught me

Garbage in, garbage out is easy to nod along to and harder to actually internalize. The fix for the lazy first prompt wasn't asking the model to "be more like Anshuman" — that's just garbage rephrased. It was putting real signal in: ICPC World Finalist, Facebook background, scepticism of bootcamp shortcuts, the "structured deliberate practice" worldview. Specificity in, specificity out.

It bit me again on Kshitij. There's much less public material on him than on the two co-founders, and I was tempted to either invent strong opinions or fall back on a vague "patient teacher" voice. Both are GIGO failures dressed up — one fabricates views in a real person's mouth, the other produces a forgettable bot. I went with a teaching archetype instead: model the verifiable behaviours of a senior Scaler instructor (Socratic, intuition-first, exercise-driven) without pretending to channel the specific person. That trade-off is documented honestly in `prompts.md` so an evaluator knows where the research is thin.

A separate thing that bit me, and it isn't really a prompt issue: `gemini-2.5-flash` enables internal "thinking" by default, and thinking tokens count against the response budget. My early replies kept getting truncated mid-sentence. Setting `thinkingBudget: 0` and switching to `gemini-2.5-flash-lite` fixed it. The lesson generalised: when the output looks broken, sometimes the prompt is fine and the model config is the bug.

## What I'd improve

If I had another iteration: streaming responses (token-by-token would be a real UX upgrade for almost no effort), per-persona evals (a small rubric run on every prompt edit so I'm not just verifying by feel), and proper research on Kshitij so that prompt can move from archetype to actual person. Anshuman and Abhimanyu feel about 8/10 because the research is real; Kshitij is closer to 6/10, and you can tell.
