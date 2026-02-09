import { create } from 'zustand';
import { ChatSource, Message } from '@/shared/types';

export type { ChatSource, Message };

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  historyError: string | null;
  sessionId: string | null;
  pdfId: string | null;

  addMessage: (message: Message) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  loadHistory: (pdfId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  isLoadingHistory: false,
  error: null,
  historyError: null,
  sessionId: null,
  pdfId: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearMessages: () => set({ messages: [], error: null, historyError: null, sessionId: null, pdfId: null }),

  loadHistory: async (pdfId: string) => {
    const state = get();
    // 이미 로딩 중이면 중복 호출 방지
    if (state.isLoadingHistory) return;

    set({ isLoadingHistory: true, historyError: null, pdfId });
    try {
      const response = await fetch(`/api/chat/history?pdfId=${pdfId}`);

      // 응답 수신 시점에 현재 pdfId가 여전히 같은지 확인 (stale response 무시)
      if (get().pdfId !== pdfId) {
        set({ isLoadingHistory: false });
        return;
      }

      if (!response.ok) {
        throw new Error('히스토리 조회 실패');
      }

      const data = await response.json();
      const messages: Message[] = (data.messages || []).map((msg: {
        id: string;
        role: 'user' | 'assistant';
        content: string;
        sources?: ChatSource[];
        usage?: { prompt_tokens: number; completion_tokens: number; total_cost: number };
        is_error?: boolean;
        created_at: string;
      }) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        sources: msg.sources || undefined,
        usage: msg.usage || undefined,
        isError: msg.is_error || false,
      }));

      set({ messages, isLoadingHistory: false, historyError: null });
    } catch {
      // stale response 무시
      if (get().pdfId !== pdfId) {
        set({ isLoadingHistory: false });
        return;
      }
      set({ isLoadingHistory: false, historyError: '이전 대화를 불러올 수 없습니다.' });
    }
  },
}));
