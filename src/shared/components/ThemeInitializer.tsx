'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/shared/stores/themeStore';

/**
 * 테마 초기화 및 시스템 테마 변경 감지
 * - localStorage에서 테마 복원 (rehydrate)
 * - system 모드일 때 OS 테마 변경 감지
 * - cleanup을 통한 메모리 누수 방지
 */
export function ThemeInitializer() {
  const { handleSystemThemeChange } = useThemeStore();

  useEffect(() => {
    // skipHydration이 true이므로 수동으로 rehydrate 호출
    if (useThemeStore.persist?.rehydrate) {
      useThemeStore.persist.rehydrate();
    }

    // mediaQuery 리스너 등록
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      handleSystemThemeChange(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);

    // cleanup: 메모리 누수 방지
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [handleSystemThemeChange]);

  return null;
}
