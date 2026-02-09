import { create } from 'zustand';
import type { CollectionInfo, GetCollectionsResponse, DeletePdfResponse } from '@/shared/types';
import { useChatStore } from './chatStore';

interface PdfState {
  pdfId: string | null;
  pdfFileName: string | null;
  isUploading: boolean;
  isEmbedding: boolean;
  isLoadingCollections: boolean;
  isDeletingPdf: boolean;
  collections: CollectionInfo[];
  error: string | null;

  setPdfId: (id: string | null) => void;
  setPdfFileName: (name: string | null) => void;
  setIsUploading: (loading: boolean) => void;
  setIsEmbedding: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchCollections: () => Promise<void>;
  selectCollection: (collection: CollectionInfo) => void;
  deleteCollection: (pdfId: string) => Promise<void>;
  clearSelection: () => void;
  reset: () => void;
}

export const usePdfStore = create<PdfState>((set, get) => ({
  pdfId: null,
  pdfFileName: null,
  isUploading: false,
  isEmbedding: false,
  isLoadingCollections: false,
  isDeletingPdf: false,
  collections: [],
  error: null,

  setPdfId: (id) => set({ pdfId: id }),
  setPdfFileName: (name) => set({ pdfFileName: name }),
  setIsUploading: (loading) => set({ isUploading: loading }),
  setIsEmbedding: (loading) => set({ isEmbedding: loading }),
  setError: (error) => set({ error }),

  fetchCollections: async () => {
    set({ isLoadingCollections: true, error: null });
    try {
      const response = await fetch('/api/collections');

      if (!response.ok) {
        let errorMessage = 'Failed to fetch collections';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      const data: GetCollectionsResponse = await response.json();
      set({ collections: data.collections });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, collections: [] });
    } finally {
      set({ isLoadingCollections: false });
    }
  },

  selectCollection: (collection: CollectionInfo) => {
    set({
      pdfId: collection.pdfId,
      pdfFileName: collection.fileName,
    });
    // 채팅 히스토리 로드
    useChatStore.getState().loadHistory(collection.pdfId);
  },

  deleteCollection: async (pdfId: string) => {
    set({ isDeletingPdf: true, error: null });
    try {
      const response = await fetch(`/api/pdf/${pdfId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete PDF';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      const data: DeletePdfResponse = await response.json();

      // 완전 실패 시 에러 throw (부분 성공은 허용)
      if (!data.deleted && !data.partialSuccess) {
        throw new Error(data.message || 'Failed to delete PDF');
      }

      // 삭제 성공 또는 부분 성공 시 컬렉션 목록에서 제거
      set((state) => ({
        collections: state.collections.filter((c) => c.pdfId !== pdfId),
      }));

      // 현재 선택된 PDF가 삭제된 경우 선택 해제
      const currentPdfId = get().pdfId;
      if (currentPdfId === pdfId) {
        set({
          pdfId: null,
          pdfFileName: null,
        });
        // 채팅 스토어 초기화
        useChatStore.getState().clearMessages();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isDeletingPdf: false });
    }
  },

  clearSelection: () => {
    set({
      pdfId: null,
      pdfFileName: null,
    });
    // 채팅 스토어 초기화
    useChatStore.getState().clearMessages();
  },

  reset: () => set({
    pdfId: null,
    pdfFileName: null,
    isUploading: false,
    isEmbedding: false,
    error: null,
  }),
}));
