import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  getEffectiveTheme: () => 'light' | 'dark';
  handleSystemThemeChange: (systemTheme: 'light' | 'dark') => void;
}

/**
 * 테마 상태 관리 스토어
 * - localStorage에 사용자 선택 저장
 * - 시스템 설정 추종 지원
 * - SSR-safe (hydration mismatch 방지)
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',

      setTheme: (theme: Theme) => {
        // DOM에 즉시 반영 (클라이언트에서만 실행)
        if (typeof window !== 'undefined') {
          const root = document.documentElement;
          const effectiveTheme = theme === 'system'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
            : theme;

          set({ theme, resolvedTheme: effectiveTheme });
          root.setAttribute('data-theme', effectiveTheme);
        } else {
          set({ theme });
        }
      },

      getEffectiveTheme: () => {
        const { theme } = get();

        if (theme === 'system') {
          // 클라이언트에서만 시스템 설정 체크
          if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light';
          }
          // 서버에서는 기본값
          return 'light';
        }

        return theme;
      },

      handleSystemThemeChange: (systemTheme: 'light' | 'dark') => {
        const { theme } = get();
        if (theme === 'system') {
          set({ resolvedTheme: systemTheme });
          if (typeof window !== 'undefined') {
            document.documentElement.setAttribute('data-theme', systemTheme);
          }
        }
      }
    }),
    {
      name: 'theme-storage',
      // hydration mismatch 방지: 클라이언트에서 수동 rehydrate
      skipHydration: true,
    }
  )
);

