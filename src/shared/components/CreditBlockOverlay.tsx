'use client';

interface CreditBlockOverlayProps {
  balance: number | null;
}

/**
 * 크레딧 차단 오버레이 컴포넌트
 * - 크레딧이 임계값 이하일 때 전체 화면을 덮는 오버레이 표시
 * - 기존 디자인 시스템(CSS 변수) 사용
 */
export function CreditBlockOverlay({ balance }: CreditBlockOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'var(--color-cream)' }}
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

      {/* 메인 카드 */}
      <div
        className="relative w-full max-w-md rounded-3xl p-10 text-center animate-float-in"
        style={{
          background: 'var(--color-paper)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-ai-border)',
        }}
      >
        {/* 아이콘 */}
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{
            background: 'var(--color-accent-glow)',
            border: '1px solid var(--color-ai-border)',
          }}
        >
          <svg
            className="h-10 w-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            style={{ color: 'var(--color-accent)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
            />
          </svg>
        </div>

        {/* 제목 */}
        <h2
          className="mb-4 text-2xl font-bold"
          style={{ color: 'var(--color-ink)' }}
        >
          서비스 일시 중단
        </h2>

        {/* 안내 문구 */}
        <p
          className="mb-6 text-sm leading-relaxed"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          이 페이지는 RAG(Retrieval-Augmented Generation)를 학습하기 위한
          사이드 프로젝트입니다. 현재 Vercel AI Gateway의 기본 제공 크레딧이
          소진되어 서비스를 일시적으로 이용하실 수 없습니다.
        </p>

        <p
          className="mb-8 text-sm leading-relaxed"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          크레딧이 다시 충전되면 자동으로 서비스가 재개됩니다.
        </p>

        {/* 잔액 표시 */}
        {balance !== null && (
          <div
            className="rounded-2xl px-6 py-4"
            style={{
              background: 'var(--color-cream-dark)',
              border: '1px solid var(--color-ai-border)',
            }}
          >
            <div
              className="mb-1 text-xs font-medium"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              현재 잔액
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: 'var(--color-error)' }}
            >
              ${balance.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
