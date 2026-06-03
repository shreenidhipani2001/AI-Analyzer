export type MessageType = "factual" | "refusal" | "pii_refusal" | "not_found" | "rate_limit";

interface Message {
  role: "user" | "bot";
  text: string;
  type?: MessageType;
  sourceUrl?: string | null;
  sourceDate?: string | null;
}

interface MessageBubbleProps {
  message: Message;
}

const REFUSAL_TYPES: MessageType[] = ["refusal", "pii_refusal", "not_found", "rate_limit"];

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser    = message.role === "user";
  const isRefusal = message.type && REFUSAL_TYPES.includes(message.type);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-coral text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-sm text-sm font-body font-medium shadow-button">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className={`rounded-2xl rounded-tl-sm px-5 py-4 max-w-xl text-sm font-body leading-relaxed ${
          isRefusal
            ? "bg-orange-50 border-2 border-orange-300 text-orange-800 shadow-card"
            : "sunny-card text-orange-900"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>

        {message.sourceUrl && (
          <a
            href={message.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-xs text-coral hover:text-coral-dark transition-colors truncate font-semibold"
          >
            📎 {message.sourceUrl}
          </a>
        )}

        {message.sourceDate && (
          <p className="mt-1 text-xs text-orange-400 font-medium">
            Last updated from sources: {message.sourceDate}
          </p>
        )}
      </div>
    </div>
  );
}
