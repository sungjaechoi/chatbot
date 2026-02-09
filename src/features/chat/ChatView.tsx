import { Message } from "@/shared/stores/chatStore";
import { ThemeToggleButton } from "@/shared/components/ThemeToggleButton";
import { useCredits } from "@/shared/hooks/useCredits";
import { useAuth } from "@/shared/hooks/useAuth";
import { MessageListView } from "./MessageListView";
import { MessageInputView } from "./MessageInputView";

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  historyError: string | null;
  pdfFileName: string | null;
  onSendMessage: (message: string) => void;
  onNewPdf: () => void;
  onBack?: () => void;
}

export function ChatView({
  messages,
  isLoading,
  isLoadingHistory,
  historyError,
  pdfFileName,
  onSendMessage,
  onNewPdf,
  onBack,
}: ChatViewProps) {
  const { balance, isLoading: isLoadingCredits } = useCredits();
  const { user, signOut } = useAuth();

  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden"
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

      {/* 헤더 */}
      <header
        className="glass relative z-10 border-b"
        style={{
          borderColor: "var(--color-ai-border)",
        }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {/* 뒤로가기 버튼 */}
            {onBack && (
              <button
                onClick={onBack}
                className="focus-ring btn-lift flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                style={{
                  background: "var(--color-cream-dark)",
                  color: "var(--color-ink-light)",
                }}
                aria-label="뒤로가기"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            {/* 로고 & 타이틀 */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-soft) 100%)",
                  boxShadow: "0 4px 12px var(--color-accent-glow)",
                }}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="white"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1
                    className="text-xl tracking-tight"
                    style={{ color: "var(--color-ink)" }}
                  >
                    Document Chat
                  </h1>
                  {/* 크레딧 잔액 표시 */}
                  {isLoadingCredits ? (
                    <div
                      className="h-3.5 w-16 animate-pulse rounded"
                      style={{ background: "var(--color-cream-dark)" }}
                    />
                  ) : balance !== null ? (
                    <span
                      className="text-xs tracking-wide"
                      style={{ color: "var(--color-ink-muted)" }}
                    >
                      ${balance.toFixed(2)}
                    </span>
                  ) : null}
                </div>
                {pdfFileName && (
                  <p
                    className="text-xs tracking-wide"
                    style={{ color: "var(--color-ink-muted)" }}
                  >
                    {pdfFileName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 액션 버튼 그룹 */}
          <div className="flex items-center gap-3">
            {/* 사용자 아바타 */}
            {user?.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="프로필"
                className="h-8 w-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}

            {/* 로그아웃 버튼 */}
            <button
              onClick={signOut}
              className="focus-ring rounded-lg px-3 py-1.5 text-xs transition-colors"
              style={{
                color: "var(--color-ink-muted)",
                border: "1px solid var(--color-ai-border)",
              }}
            >
              로그아웃
            </button>

            {/* 테마 토글 버튼 */}
            <ThemeToggleButton size="md" />

            {/* 새 PDF 버튼 */}
            <button
              onClick={onNewPdf}
              className="focus-ring btn-lift flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
              style={{
                background: "var(--color-ink)",
                color: "var(--color-cream)",
              }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              새 문서
            </button>
          </div>
        </div>
      </header>

      {/* 메시지 영역 */}
      <MessageListView messages={messages} isLoading={isLoading} isLoadingHistory={isLoadingHistory} historyError={historyError} />

      {/* 입력 영역 */}
      <MessageInputView isLoading={isLoading} isLoadingHistory={isLoadingHistory} historyError={historyError} onSend={onSendMessage} />
    </div>
  );
}
