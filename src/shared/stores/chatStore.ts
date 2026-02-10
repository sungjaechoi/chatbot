import { create } from 'zustand';
import { ChatSource, Message, ChatSession, SessionListResponse, SessionResponse, TitleGenerationResponse, MessagesResponse } from '@/shared/types';

export type { ChatSource, Message, ChatSession };

interface ChatState {
  // 기본 상태
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  pdfId: string | null;

  // 세션 상태
  currentSessionId: string | null;
  sessionList: ChatSession[];
  isLoadingSessions: boolean;
  isCreatingSession: boolean;
  isGeneratingTitle: boolean;

  // UI 상태
  sidebarOpen: boolean;

  // 기본 액션
  addMessage: (message: Message) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;

  // UI 액션
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // 세션 관련 액션
  fetchSessions: (pdfId: string) => Promise<void>;
  createNewSession: (pdfId: string) => Promise<ChatSession | null>;
  switchSession: (sessionId: string) => Promise<void>;
  deleteSessionById: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  generateSessionTitle: (sessionId: string) => Promise<string | null>;

  // 메시지 로드
  loadMessages: (sessionId: string) => Promise<void>;

  // 초기화
  initializeForPdf: (pdfId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // 초기 상태
  messages: [],
  isLoading: false,
  error: null,
  pdfId: null,

  currentSessionId: null,
  sessionList: [],
  isLoadingSessions: false,
  isCreatingSession: false,
  isGeneratingTitle: false,

  sidebarOpen: true,

  // 기본 액션
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearMessages: () => set({ messages: [], error: null }),

  // UI 액션
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // 세션 목록 가져오기
  fetchSessions: async (pdfId: string) => {
    set({ isLoadingSessions: true, error: null });
    try {
      const response = await fetch(`/api/chat/sessions?pdfId=${pdfId}`);

      if (!response.ok) {
        let errorMessage = '세션 목록 조회 실패';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      const data: SessionListResponse = await response.json();
      set({ sessionList: data.sessions, isLoadingSessions: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '세션 목록 조회 실패';
      set({ isLoadingSessions: false, error: errorMessage });
    }
  },

  // 새 세션 생성
  createNewSession: async (pdfId: string) => {
    const state = get();
    set({ isCreatingSession: true, error: null });

    try {
      // 현재 세션이 있고, 메시지가 1개 이상이고, 제목이 없으면 제목 생성
      if (
        state.currentSessionId &&
        state.messages.length > 0 &&
        state.sessionList.find((s) => s.id === state.currentSessionId)?.title === null
      ) {
        await get().generateSessionTitle(state.currentSessionId);
      }

      // 새 세션 생성
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfId }),
      });

      if (!response.ok) {
        let errorMessage = '세션 생성 실패';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      const data: SessionResponse = await response.json();
      const newSession = data.session;

      // 세션 목록에 추가 (맨 앞에 추가)
      set((state) => ({
        sessionList: [newSession, ...state.sessionList],
        isCreatingSession: false,
      }));

      // 새 세션으로 전환
      await get().switchSession(newSession.id);

      return newSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '세션 생성 실패';
      set({ isCreatingSession: false, error: errorMessage });
      return null;
    }
  },

  // 세션 전환
  switchSession: async (sessionId: string) => {
    set({ currentSessionId: sessionId, messages: [], error: null });
    await get().loadMessages(sessionId);
  },

  // 세션 삭제
  deleteSessionById: async (sessionId: string) => {
    const state = get();
    set({ error: null });

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMessage = '세션 삭제 실패';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      // 세션 목록에서 제거
      const newSessionList = state.sessionList.filter((s) => s.id !== sessionId);
      set({ sessionList: newSessionList });

      // 삭제된 세션이 현재 세션이면 다른 세션으로 전환
      if (state.currentSessionId === sessionId) {
        if (newSessionList.length > 0) {
          // 남은 세션 중 최신 세션으로 전환
          await get().switchSession(newSessionList[0].id);
        } else if (state.pdfId) {
          // 남은 세션이 없으면 새 세션 생성
          await get().createNewSession(state.pdfId);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '세션 삭제 실패';
      set({ error: errorMessage });
      throw err;
    }
  },

  // 세션 이름 변경
  renameSession: async (sessionId: string, title: string) => {
    set({ error: null });

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        let errorMessage = '세션 이름 변경 실패';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      // 세션 목록에서 해당 세션 title 업데이트
      set((state) => ({
        sessionList: state.sessionList.map((s) =>
          s.id === sessionId ? { ...s, title } : s
        ),
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '세션 이름 변경 실패';
      set({ error: errorMessage });
      throw err;
    }
  },

  // 세션 제목 자동 생성
  generateSessionTitle: async (sessionId: string) => {
    set({ isGeneratingTitle: true, error: null });

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}/title`, {
        method: 'POST',
      });

      if (!response.ok) {
        let errorMessage = '제목 생성 실패';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      const data: TitleGenerationResponse = await response.json();
      const title = data.title;

      // 세션 목록에서 해당 세션 title 업데이트
      set((state) => ({
        sessionList: state.sessionList.map((s) =>
          s.id === sessionId ? { ...s, title } : s
        ),
        isGeneratingTitle: false,
      }));

      return title;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '제목 생성 실패';
      set({ isGeneratingTitle: false, error: errorMessage });
      return null;
    }
  },

  // 메시지 로드
  loadMessages: async (sessionId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`);

      if (!response.ok) {
        let errorMessage = '메시지 조회 실패';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      const data: MessagesResponse = await response.json();
      const messages: Message[] = data.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

      set({ messages, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '메시지 조회 실패';
      set({ isLoading: false, error: errorMessage });
    }
  },

  // PDF 초기화 (진입 시)
  initializeForPdf: async (pdfId: string) => {
    set({ pdfId, error: null });

    // 1. 세션 목록 가져오기
    await get().fetchSessions(pdfId);

    const state = get();

    // 2. 세션이 있으면 첫 번째(최신) 세션으로 전환
    if (state.sessionList.length > 0) {
      await get().switchSession(state.sessionList[0].id);
    } else {
      // 3. 세션이 없으면 새 세션 생성
      await get().createNewSession(pdfId);
    }
  },
}));
