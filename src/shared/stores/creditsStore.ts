'use client';

import { create } from 'zustand';

interface CreditsState {
  balance: number | null;
  totalUsed: number | null;
  isLoading: boolean;
  error: string | null;
  fetchCredits: () => Promise<void>;
  reset: () => void;
}

export const useCreditsStore = create<CreditsState>((set) => ({
  balance: null,
  totalUsed: null,
  isLoading: true,
  error: null,

  fetchCredits: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/credits');

      if (!response.ok) {
        let errorMessage = '크레딧 정보를 가져오는데 실패했습니다.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      set({
        balance: data.balance != null ? Number(data.balance) : null,
        totalUsed: data.total_used != null ? Number(data.total_used) : null,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  reset: () => {
    set({
      balance: null,
      totalUsed: null,
      isLoading: true,
      error: null,
    });
  },
}));
