'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/shared/stores/authStore';

/**
 * useAuth 훅 (Zustand 스토어 기반 싱글턴)
 * - 여러 컴포넌트에서 호출해도 초기화는 1회만 실행
 * - getUser() API 호출 없이 onAuthStateChange 이벤트로만 user 상태 관리
 */
export function useAuth() {
  const { user, loading, initialize, signOut } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return { user, loading, signOut };
}
