'use client';

import { useEffect } from 'react';
import { useCreditsStore } from '@/shared/stores/creditsStore';

interface UseCreditsResult {
  balance: number | null;
  totalUsed: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCredits(): UseCreditsResult {
  const { balance, totalUsed, isLoading, error, fetchCredits } = useCreditsStore();

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    balance,
    totalUsed,
    isLoading,
    error,
    refetch: fetchCredits,
  };
}
