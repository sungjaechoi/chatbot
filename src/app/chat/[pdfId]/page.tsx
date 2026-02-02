'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePdfStore } from '@/shared/stores/pdfStore';
import { ChatContainer } from '@/features/chat/ChatContainer';
import { PdfUploadModalContainer } from '@/features/pdf/PdfUploadModalContainer';
import { SpinnerView } from '@/shared/components/SpinnerView';

/**
 * 동적 라우트: /chat/[pdfId]
 * - URL의 pdfId로 PDF 정보 조회
 * - 존재하지 않는 pdfId 접근 시 루트로 리다이렉트
 * - ChatContainer 렌더링 및 뒤로가기 지원
 */
export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const {
    pdfId: storePdfId,
    collections,
    isLoadingCollections,
    error: collectionsError,
    fetchCollections,
    selectCollection,
    clearSelection,
  } = usePdfStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const urlPdfId = params.pdfId as string;

  // 초기화: collections 로드 및 pdfId 검증
  useEffect(() => {
    const initialize = async () => {
      // collections가 비어있으면 로드
      if (collections.length === 0 && !isLoadingCollections) {
        await fetchCollections();
      }
      setIsInitializing(false);
    };

    initialize();
  }, [collections.length, isLoadingCollections, fetchCollections]);

  // pdfId 검증 및 스토어 동기화
  useEffect(() => {
    // 초기화 중이거나 collections 로딩 중이면 대기
    if (isInitializing || isLoadingCollections) return;

    // 에러 발생 시 에러 UI 표시 (리다이렉트 X)
    if (collectionsError) {
      // 에러는 UI에서 표시됨
      return;
    }

    // collections가 로드되었을 때
    if (collections.length > 0) {
      const targetCollection = collections.find((c) => c.pdfId === urlPdfId);

      if (!targetCollection) {
        // 존재하지 않는 pdfId → notFound 상태 설정
        setNotFound(true);
        return;
      }

      // 스토어의 pdfId와 URL의 pdfId가 다르면 동기화
      if (storePdfId !== urlPdfId) {
        selectCollection(targetCollection);
      }
    } else {
      // 로딩 완료 + 에러 없음 + 컬렉션 비어있음 → 정상적인 빈 상태로 리다이렉트
      router.replace('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectCollection is stable store action from zustand, router is stable reference from Next.js
  }, [
    urlPdfId,
    storePdfId,
    collections,
    isInitializing,
    isLoadingCollections,
    collectionsError,
  ]);

  // notFound 상태일 때 3초 후 루트로 리다이렉트 (cleanup 포함)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (notFound) {
      timeoutId = setTimeout(() => {
        router.replace('/');
      }, 3000);
    }

    // cleanup 함수 - 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router is stable reference from Next.js
  }, [notFound]);

  const handleBack = () => {
    clearSelection();
    router.push('/');
  };

  const handleNewPdf = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleUploadComplete = () => {
    setIsModalOpen(false);
    // 업로드 완료 후 루트 페이지로 이동 (목록에서 선택하도록)
    router.push('/');
  };

  // 로딩 중 (초기화 또는 collections 로드 중)
  if (isInitializing || isLoadingCollections) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <SpinnerView message="채팅을 준비하고 있습니다..." size="lg" />
        </div>
      </div>
    );
  }

  // 컬렉션 로드 실패 시 에러 UI 표시
  if (collectionsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-lg max-w-md w-full">
          <p className="text-red-500 font-semibold text-center mb-2">
            채팅을 불러오는데 실패했습니다.
          </p>
          <p className="text-gray-500 text-sm text-center mb-6">{collectionsError}</p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchCollections()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              다시 시도
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              메인으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 존재하지 않는 pdfId 접근 시 사용자 피드백 제공
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-lg max-w-md w-full">
          <p className="text-gray-700 font-semibold text-center mb-2">해당 PDF를 찾을 수 없습니다.</p>
          <p className="text-sm text-gray-500 text-center">잠시 후 메인 화면으로 이동합니다...</p>
        </div>
      </div>
    );
  }

  // pdfId가 스토어에 없으면 로딩 표시 (리다이렉트 대기)
  if (!storePdfId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <SpinnerView message="로딩 중..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <>
      <ChatContainer onNewPdf={handleNewPdf} onBack={handleBack} />
      <PdfUploadModalContainer
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUploadComplete={handleUploadComplete}
      />
    </>
  );
}
