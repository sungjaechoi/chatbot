import { create } from 'zustand';
import { ChatSource, Message } from '@/shared/types';

export type { ChatSource, Message };

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;

  addMessage: (message: Message) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearMessages: () => set({ messages: [], error: null }),
}));
