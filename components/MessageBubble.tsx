type Props = {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

export default function MessageBubble({ role, content, isError }: Props) {
  return (
    <div className={`message ${role}`}>
      <div className={`bubble${isError ? " error" : ""}`}>{content}</div>
    </div>
  );
}
