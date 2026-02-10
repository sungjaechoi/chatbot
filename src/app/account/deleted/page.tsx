'use client';

import { useState } from 'react';
import { createClient } from '@/shared/lib/supabase/client';

export default function AccountDeletedPage() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReactivate = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/account/reactivate', {
        method: 'POST',
      });

      if (!response.ok) {
        let errorMessage = '계정 초기화에 실패했습니다.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      window.location.href = '/';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '오류가 발생했습니다.';
      alert(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center p-6"
      style={{ background: 'var(--color-cream)' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 122, 157, 0.08), transparent),
            radial-gradient(ellipse 60% 40% at 100% 100%, rgba(91, 122, 157, 0.05), transparent)
          `,
        }}
      />

      <div
        className="relative w-full max-w-md rounded-3xl p-10 text-center"
        style={{
          background: 'var(--color-paper)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-ai-border)',
        }}
      >
        {/* 아이콘 */}
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: 'var(--color-error-bg)',
          }}
        >
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            style={{ color: 'var(--color-error)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1
          className="mb-3 text-2xl tracking-tight"
          style={{ color: 'var(--color-ink)' }}
        >
          탈퇴된 계정입니다
        </h1>

        <p
          className="mb-2 text-sm leading-relaxed"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          이 계정은 탈퇴 처리되어 삭제 대기 중입니다.
        </p>
        <p
          className="mb-8 text-sm leading-relaxed"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          새로 시작하면 기존 데이터(PDF, 채팅 기록 등)가
          <br />
          <strong style={{ color: 'var(--color-error)' }}>즉시 영구 삭제</strong>
          되고 새 계정으로 시작합니다.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleReactivate}
            disabled={isProcessing}
            className="focus-ring btn-lift w-full rounded-2xl px-6 py-4 font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isProcessing
                ? 'var(--color-ink-muted)'
                : 'var(--color-accent)',
            }}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                처리 중...
              </span>
            ) : (
              '새로 시작하기'
            )}
          </button>

          <button
            onClick={handleSignOut}
            disabled={isProcessing}
            className="focus-ring w-full rounded-2xl border px-6 py-4 font-medium transition-all disabled:opacity-50"
            style={{
              background: 'var(--color-cream)',
              color: 'var(--color-ink)',
              borderColor: 'var(--color-ai-border)',
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
