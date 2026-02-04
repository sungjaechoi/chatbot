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
      <div
        className="relative flex min-h-screen items-center justify-center"
        style={{ background: 'var(--color-cream)' }}
      >
        {/* 배경 그라디언트 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 122, 157, 0.08), transparent),
              radial-gradient(ellipse 60% 40% at 100% 100%, rgba(91, 122, 157, 0.05), transparent)
            `
          }}
        />
        <div
          className="relative rounded-3xl p-10"
          style={{
            background: 'var(--color-paper)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-ai-border)'
          }}
        >
          <SpinnerView message="문서를 불러오는 중..." size="lg" />
        </div>
      </div>
    );
  }

  // 2. error: 컬렉션 로드 실패
  if (currentState === 'error') {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center p-6"
        style={{ background: 'var(--color-cream)' }}
      >
        {/* 배경 그라디언트 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 122, 157, 0.08), transparent),
              radial-gradient(ellipse 60% 40% at 100% 100%, rgba(91, 122, 157, 0.05), transparent)
            `
          }}
        />
        <div
          className="relative w-full max-w-md rounded-3xl p-10 text-center"
          style={{
            background: 'var(--color-paper)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-ai-border)'
          }}
        >
          {/* 에러 아이콘 */}
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: 'var(--color-error-bg)',
              border: '1px solid rgba(185, 28, 28, 0.2)'
            }}
          >
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              style={{ color: 'var(--color-error)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          <h2
            className="mb-2 text-xl"
            style={{ color: 'var(--color-ink)' }}
          >
            불러오기 실패
          </h2>
          <p
            className="mb-8 text-sm"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            {error}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => fetchCollections()}
              className="focus-ring btn-lift flex-1 rounded-xl px-4 py-3 font-medium transition-all"
              style={{
                background: 'var(--color-ink)',
                color: 'var(--color-cream)'
              }}
            >
              다시 시도
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="focus-ring flex-1 rounded-xl px-4 py-3 font-medium transition-colors"
              style={{
                background: 'var(--color-cream)',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-ai-border)'
              }}
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
      <div
        className="relative flex min-h-screen items-center justify-center"
        style={{ background: 'var(--color-cream)' }}
      >
        {/* 배경 그라디언트 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 122, 157, 0.08), transparent),
              radial-gradient(ellipse 60% 40% at 100% 100%, rgba(91, 122, 157, 0.05), transparent)
            `
          }}
        />
        <div
          className="relative rounded-3xl p-10 text-center"
          style={{
            background: 'var(--color-paper)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-ai-border)'
          }}
        >
          <SpinnerView message="PDF를 분석하고 있습니다..." size="lg" />
          <p
            className="mt-2 text-xs"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            문서 내용을 AI가 이해할 수 있도록 처리 중입니다
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
