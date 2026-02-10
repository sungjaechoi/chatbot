'use client';

import { create } from 'zustand';

// 크레딧 임계값 (이 값 이하일 때 서비스 차단)
const CREDIT_THRESHOLD = 0.2;

/**
 * 크레딧 임계값 가져오기
 * - 기본값: 0.2
 * - 테스트용: localStorage에 '__CREDIT_THRESHOLD_OVERRIDE' 키가 있으면 해당 값 사용
 *
 * 테스트 방법:
 * - 브라우저 콘솔에서 `localStorage.setItem('__CREDIT_THRESHOLD_OVERRIDE', '999')` 입력
 *   → 크레딧이 999 이하일 때 차단 (사실상 항상 차단)
 * - 원래대로 복원: `localStorage.removeItem('__CREDIT_THRESHOLD_OVERRIDE')`
 */
function getCreditThreshold(): number {
  if (typeof window === 'undefined') return CREDIT_THRESHOLD;

  const override = localStorage.getItem('__CREDIT_THRESHOLD_OVERRIDE');
  if (override) {
    const parsed = parseFloat(override);
    if (!isNaN(parsed)) return parsed;
  }
  return CREDIT_THRESHOLD;
}

interface CreditsState {
  balance: number | null;
  totalUsed: number | null;
  isLoading: boolean;
  error: string | null;
  isBlocked: boolean;
  lastFetchedAt: number | null;
  fetchCredits: () => Promise<void>;
  fetchCreditsIfNeeded: () => Promise<void>;
  checkBlocked: () => void;
  reset: () => void;
}

export const useCreditsStore = create<CreditsState>((set, get) => ({
  balance: null,
  totalUsed: null,
  isLoading: true,
  error: null,
  isBlocked: false,
  lastFetchedAt: null,

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
      const balance = data.balance != null ? Number(data.balance) : null;
      const totalUsed = data.total_used != null ? Number(data.total_used) : null;

      set({
        balance,
        totalUsed,
        isLoading: false,
        lastFetchedAt: Date.now(),
      });

      // 차단 여부 확인
      get().checkBlocked();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchCreditsIfNeeded: async () => {
    const { lastFetchedAt, fetchCredits } = get();
    if (lastFetchedAt === null) {
      await fetchCredits();
    }
  },

  checkBlocked: () => {
    const { balance } = get();
    const threshold = getCreditThreshold();
    const isBlocked = balance !== null && balance <= threshold;
    set({ isBlocked });
  },

  reset: () => {
    set({
      balance: null,
      totalUsed: null,
      isLoading: true,
      error: null,
      isBlocked: false,
      lastFetchedAt: null,
    });
  },
}));
