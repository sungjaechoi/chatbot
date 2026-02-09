import { create } from 'zustand';
import { ChatSource, Message } from '@/shared/types';

export type { ChatSource, Message };

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  sessionId: string | null;

  addMessage: (message: Message) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  loadHistory: (pdfId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  isLoadingHistory: false,
  error: null,
  sessionId: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearMessages: () => set({ messages: [], error: null, sessionId: null }),

  loadHistory: async (pdfId: string) => {
    set({ isLoadingHistory: true });
    try {
      const response = await fetch(`/api/chat/history?pdfId=${pdfId}`);
      if (!response.ok) {
        set({ isLoadingHistory: false });
        return;
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

      set({ messages, isLoadingHistory: false });
    } catch {
      set({ isLoadingHistory: false });
    }
  },
}));
