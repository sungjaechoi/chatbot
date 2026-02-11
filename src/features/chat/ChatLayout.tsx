"use client";

import Link from "next/link";
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
      {/* 헤더 (전체 너비) — Stitch 스타일 */}
      <header
        className="relative z-10 border-b backdrop-blur-md"
        style={{
          borderColor: "var(--color-border-light)",
          background: "var(--color-header-bg)",
        }}
      >
        <div className="flex w-full items-center justify-between px-6 py-3">
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
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {sidebarOpen ? 'left_panel_close' : 'left_panel_open'}
              </span>
            </button>

            {/* 로고 & 타이틀 — 클릭 시 문서 목록으로 이동 */}
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg transition-opacity hover:opacity-80"
              title="문서 목록으로 이동"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "var(--color-primary)" }}
              >
                <span className="material-symbols-outlined text-white sr-only" style={{ fontSize: '22px' }} aria-hidden="true">
                  auto_awesome
                </span>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1
                    className="text-lg font-bold tracking-tight md:text-xl"
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
                    className="flex items-center gap-1.5 text-xs tracking-wide"
                    style={{ color: "var(--color-ink-muted)" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-pdf-red)' }}>
                      picture_as_pdf
                    </span>
                    {pdfFileName}
                  </p>
                )}
              </div>
            </Link>
          </div>

          {/* 액션 버튼 그룹 */}
          <div className="flex items-center gap-3">
            {/* 새 세션 버튼 */}
            <button
              onClick={onNewSession}
              disabled={messages.length === 0}
              className="focus-ring btn-lift flex items-center justify-center gap-2 rounded-lg p-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 md:px-5 md:py-2.5"
              style={{
                background: "var(--color-cream)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-border-light)",
              }}
              aria-label="새 세션 시작"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_comment</span>
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
