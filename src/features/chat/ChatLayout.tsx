"use client";

import { useChatStore } from "@/shared/stores/chatStore";
import { useCredits } from "@/shared/hooks/useCredits";
import { ChatSidebar } from "./ChatSidebar";
import { ChatView } from "./ChatView";

interface ChatLayoutProps {
  onSendMessage: (message: string) => void;
  onNewSession: () => void;
  onNewPdf: () => void;
  pdfFileName: string | null;
}

export function ChatLayout({
  onSendMessage,
  onNewSession,
  onNewPdf,
  pdfFileName,
}: ChatLayoutProps) {
  const { messages, isLoading, error, sidebarOpen, setSidebarOpen } =
    useChatStore();
  const { balance, isLoading: isLoadingCredits } = useCredits();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* 헤더 (전체 너비) */}
      <header
        className="glass relative z-10 border-b"
        style={{
          borderColor: "var(--color-ai-border)",
        }}
      >
        <div className="flex w-full items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {/* 사이드바 토글 */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--color-ink-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--color-ink)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--color-ink-muted)")
              }
              aria-label={sidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                {sidebarOpen ? (
                  <>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <path strokeLinecap="round" d="M15 10l-2 2 2 2" />
                  </>
                ) : (
                  <>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <path strokeLinecap="round" d="M13 10l2 2-2 2" />
                  </>
                )}
              </svg>
            </button>

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
                    className="text-lg tracking-tight md:text-xl"
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
            {/* 새 세션 버튼 */}
            <button
              onClick={onNewSession}
              disabled={messages.length === 0}
              className="focus-ring btn-lift flex items-center justify-center gap-2 rounded-xl p-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 md:px-5 md:py-2.5"
              style={{
                background: "var(--color-cream-dark)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-ai-border)",
              }}
              aria-label="새 세션 시작"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              <span className="hidden md:inline">새 세션</span>
            </button>
          </div>
        </div>
      </header>

      {/* 사이드바 + 채팅 영역 */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* 사이드바 - 데스크탑 */}
        <div
          className={`hidden md:block transition-all ${
            sidebarOpen ? "w-[280px]" : "w-0"
          }`}
          style={{ transition: "width var(--transition-base)" }}
        >
          {sidebarOpen && <ChatSidebar onNewPdf={onNewPdf} />}
        </div>

        {/* 사이드바 - 모바일 (Overlay) */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{
              background: "rgba(0, 0, 0, 0.5)",
            }}
          >
            <div
              className="h-full w-[85vw] max-w-[320px]"
              onClick={(e) => e.stopPropagation()}
              style={{
                animation: "slideInFromLeft 0.3s ease-out",
              }}
            >
              <ChatSidebar
                onNewPdf={onNewPdf}
                onClose={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* 메인 채팅 영역 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatView
            messages={messages}
            isLoading={isLoading}
            error={error}
            onSendMessage={onSendMessage}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInFromLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
