import { Message } from "@/shared/stores/chatStore";
import { MessageListView } from "./MessageListView";
import { MessageInputView } from "./MessageInputView";

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
}

export function ChatView({
  messages,
  isLoading,
  error,
  onSendMessage,
}: ChatViewProps) {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden"
      style={{ background: "var(--color-cream)" }}
    >
      {/* 배경 그라디언트 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 122, 157, 0.08), transparent),
            radial-gradient(ellipse 60% 40% at 100% 100%, rgba(91, 122, 157, 0.05), transparent)
          `,
        }}
      />

      {/* 메시지 영역 */}
      <MessageListView messages={messages} isLoading={isLoading} error={error} />

      {/* 입력 영역 */}
      <MessageInputView isLoading={isLoading} error={error} onSend={onSendMessage} />
    </div>
  );
}
