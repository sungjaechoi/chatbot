'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/shared/stores/themeStore';
import type { Theme } from '@/shared/stores/themeStore';

interface ThemeToggleButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 테마 토글 버튼
 * - Editorial Luxury 컨셉에 맞는 세련된 디자인
 * - light / dark / system 3가지 모드 순환
 * - 접근성: aria-label, keyboard navigation
 * - 호버/포커스 효과: btn-lift, focus-ring
 */
export function ThemeToggleButton({ className = '', size = 'md' }: ThemeToggleButtonProps) {
  const { theme, setTheme, getEffectiveTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // 클라이언트에서만 렌더링 (hydration mismatch 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(nextTheme);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  // 서버 렌더링 시 기본 아이콘 표시
  if (!mounted) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-xl opacity-0 transition-opacity`}
        style={{
          background: 'var(--color-cream)',
          border: '1px solid var(--color-ai-border)',
          width: size === 'sm' ? '36px' : size === 'md' ? '44px' : '52px',
          height: size === 'sm' ? '36px' : size === 'md' ? '44px' : '52px',
        }}
        aria-hidden="true"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      </div>
    );
  }

  const effectiveTheme = getEffectiveTheme();
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6';
  const buttonSize = size === 'sm' ? '36px' : size === 'md' ? '44px' : '52px';

  // 테마별 레이블
  const getLabel = () => {
    if (theme === 'system') return '시스템 설정 추종 중 (라이트모드로 전환)';
    if (theme === 'light') return '라이트모드 (다크모드로 전환)';
    return '다크모드 (시스템 설정 추종으로 전환)';
  };

  return (
    <button
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`${className} focus-ring btn-lift group relative flex items-center justify-center overflow-hidden rounded-xl transition-all`}
      style={{
        background: effectiveTheme === 'dark'
          ? 'linear-gradient(135deg, var(--color-ink-light) 0%, var(--color-ink) 100%)'
          : 'var(--color-cream)',
        border: '1px solid var(--color-ai-border)',
        boxShadow: 'var(--shadow-sm)',
        width: buttonSize,
        height: buttonSize,
      }}
      aria-label={getLabel()}
      title={getLabel()}
      type="button"
    >
      {/* 아이콘 컨테이너 */}
      <div className="relative flex items-center justify-center">
        {/* Light 모드 아이콘 */}
        <svg
          className={`${iconSize} absolute transition-all duration-300 ${
            theme === 'light' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
          style={{ color: 'var(--color-accent)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>

        {/* Dark 모드 아이콘 */}
        <svg
          className={`${iconSize} absolute transition-all duration-300 ${
            theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
          }`}
          style={{ color: 'var(--color-accent)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0112 21.75 9.75 9.75 0 013.75 12 9.718 9.718 0 0110.498 2.248a9.75 9.75 0 0011.254 12.754z"
          />
        </svg>

        {/* System 모드 아이콘 */}
        <svg
          className={`${iconSize} absolute transition-all duration-300 ${
            theme === 'system' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}
          style={{ color: 'var(--color-accent)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
          />
        </svg>
      </div>

      {/* 호버 시 글로우 효과 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background: 'var(--color-accent-glow)',
          borderRadius: 'inherit',
        }}
      />
    </button>
  );
}
