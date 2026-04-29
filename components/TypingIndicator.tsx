export default function TypingIndicator() {
  return (
    <div className="message assistant" aria-live="polite" aria-label="assistant is typing">
      <div className="bubble">
        <div className="typing">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
