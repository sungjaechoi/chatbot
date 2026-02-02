'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { usePdfStore } from '@/shared/stores/pdfStore';
import { PdfUploadContainer } from '@/features/pdf/PdfUploadContainer';
import { PdfUploadModalContainer } from '@/features/pdf/PdfUploadModalContainer';
import { SpinnerView } from '@/shared/components/SpinnerView';
import { CollectionListView } from '@/features/pdf/CollectionListView';
import type { CollectionInfo } from '@/shared/types';

/**
 * 페이지 상태 정의
 * - loading: 초기 컬렉션 로딩 중
 * - error: 컬렉션 로드 실패
 * - empty: PDF 0개 (업로드 화면 표시)
 * - multiple_select: PDF 1개 이상 (선택 화면 표시)
 */
type PageState = 'loading' | 'error' | 'empty' | 'multiple_select';

export default function Home() {
  const router = useRouter();
  const {
    isEmbedding,
    isLoadingCollections,
    isDeletingPdf,
    collections,
    error,
    fetchCollections,
    deleteCollection,
  } = usePdfStore(
    useShallow((state) => ({
      isEmbedding: state.isEmbedding,
      isLoadingCollections: state.isLoadingCollections,
      isDeletingPdf: state.isDeletingPdf,
      collections: state.collections,
      error: state.error,
      fetchCollections: state.fetchCollections,
      deleteCollection: state.deleteCollection,
    }))
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 초기 컬렉션 데이터 로드
  useEffect(() => {
    fetchCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchCollections is stable store action from zustand
  }, []);

  const handleUploadComplete = async () => {
    setIsModalOpen(false);
    // 업로드 완료 후 목록 갱신하고 루트 페이지에 머무름
    await fetchCollections();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSelectCollection = (collection: CollectionInfo) => {
    // selectCollection은 chat 페이지에서 처리 (clearMessages 중복 호출 방지)
    router.push(`/chat/${collection.pdfId}`);
  };

  const handleNewPdfFromList = () => {
    setIsModalOpen(true);
  };

  const handleDeleteCollection = async (pdfId: string) => {
    try {
      await deleteCollection(pdfId);
      // 삭제 후 상태는 useEffect에서 collections 변경으로 자동 처리됨
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.';
      alert(errorMessage);
    }
  };

  // 현재 페이지 상태 계산 (우선순위 명확화)
  const getCurrentState = (): PageState => {
    // 1. 최우선: 로딩 중
    if (isLoadingCollections) return 'loading';

    // 2. 에러 상태
    if (error) return 'error';

    // 3. PDF 없음 → 업로드 화면
    if (collections.length === 0) return 'empty';

    // 4. PDF 1개 이상 → 선택 화면
    return 'multiple_select';
  };

  const currentState = getCurrentState();

  // 상태별 렌더링 분기
  // 1. loading: 초기 컬렉션 로딩 중
  if (currentState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <SpinnerView message="기존 데이터를 확인하고 있습니다..." size="lg" />
        </div>
      </div>
    );
  }

  // 2. error: 컬렉션 로드 실패
  if (currentState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-lg max-w-md w-full">
          <p className="text-red-500 font-semibold text-center mb-2">
            컬렉션을 불러오는데 실패했습니다.
          </p>
          <p className="text-gray-500 text-sm text-center mb-6">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchCollections()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              다시 시도
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              새 PDF 업로드
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. 임베딩 진행 중 (PDF 업로드 후 처리 중)
  if (isEmbedding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <SpinnerView message="PDF를 분석하고 있습니다..." size="lg" />
          <p className="mt-4 text-center text-sm text-gray-500">
            잠시만 기다려주세요
          </p>
        </div>
      </div>
    );
  }

  // 4. multiple_select: PDF 1개 이상, 선택 화면 표시
  if (currentState === 'multiple_select') {
    return (
      <>
        <CollectionListView
          collections={collections}
          onSelectCollection={handleSelectCollection}
          onDeleteCollection={handleDeleteCollection}
          onNewPdf={handleNewPdfFromList}
          isDeletingPdf={isDeletingPdf}
        />
        <PdfUploadModalContainer
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUploadComplete={handleUploadComplete}
        />
      </>
    );
  }

  // 5. empty: PDF 0개, 업로드 화면 표시
  return <PdfUploadContainer onUploadComplete={handleUploadComplete} />;
}
