'use client';

import { useEffect } from 'react';
import { useCreditsStore } from '@/shared/stores/creditsStore';

interface UseCreditsResult {
  balance: number | null;
  totalUsed: number | null;
  isLoading: boolean;
  error: string | null;
  isBlocked: boolean;
  refetch: () => Promise<void>;
}

/**
 * useCredits 훅 (최적화)
 * - 최초 1회만 크레딧 정보를 가져옴 (fetchCreditsIfNeeded)
 * - 이후에는 수동 refetch로만 갱신
 */
export function useCredits(): UseCreditsResult {
  const { balance, totalUsed, isLoading, error, isBlocked, fetchCredits, fetchCreditsIfNeeded } =
    useCreditsStore();

  useEffect(() => {
    // 최초 1회만 fetch (lastFetchedAt이 null일 때만)
    fetchCreditsIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 최초 마운트 1회만 실행
  }, []);

  return {
    balance,
    totalUsed,
    isLoading,
    error,
    isBlocked,
    refetch: fetchCredits,
  };
}
