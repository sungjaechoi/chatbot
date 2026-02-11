'use client';

import { useCredits } from '@/shared/hooks/useCredits';
import { UserProfile } from '@/shared/components/UserProfile';

interface NavigationBarProps {
  onDeleteAccount?: () => void;
}

export function NavigationBar({ onDeleteAccount }: NavigationBarProps) {
  const { balance, isLoading: isLoadingCredits } = useCredits();

  return (
    <nav
      className="sticky top-0 z-30 border-b backdrop-blur-md"
      style={{
        background: 'var(--color-header-bg)',
        borderColor: 'var(--color-border-light)',
      }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-3">
        {/* 좌: 로고 + 앱명 + 크레딧 */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'var(--color-primary)' }}
          >
            <span className="material-symbols-outlined text-white sr-only" style={{ fontSize: '22px' }} aria-hidden="true">
              auto_awesome
            </span>
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--color-ink)' }}>
            Document Chat
          </span>
          {isLoadingCredits ? (
            <span className="inline-block h-4 w-16 animate-pulse rounded" style={{ background: 'var(--color-cream-dark)' }} />
          ) : balance !== null ? (
            <span className="text-xs tracking-wide" style={{ color: 'var(--color-ink-muted)' }}>
              ${balance.toFixed(2)}
            </span>
          ) : null}
        </div>

        {/* 우: 프로필 + 설정 */}
        <UserProfile panelDirection="down" onDeleteAccount={onDeleteAccount} />
      </div>
    </nav>
  );
}
