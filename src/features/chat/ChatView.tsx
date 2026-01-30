import { Message } from '@/shared/stores/chatStore';
import { MessageListView } from './MessageListView';
import { MessageInputView } from './MessageInputView';

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  pdfFileName: string | null;
  onSendMessage: (message: string) => void;
  onNewPdf: () => void;
  onBack?: () => void;
}

export function ChatView({
  messages,
  isLoading,
  pdfFileName,
  onSendMessage,
  onNewPdf,
  onBack,
}: ChatViewProps) {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* 헤더 */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 뒤로가기 버튼 */}
            {onBack && (
              <button
                onClick={onBack}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
                aria-label="뒤로가기"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                PDF 챗봇
              </h1>
              {pdfFileName && (
                <p className="text-xs text-gray-500">{pdfFileName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onNewPdf}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            새로운 PDF
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <MessageListView messages={messages} />

      {/* 입력 영역 */}
      <MessageInputView isLoading={isLoading} onSend={onSendMessage} />
    </div>
  );
}
