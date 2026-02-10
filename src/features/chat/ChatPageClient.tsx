'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePdfStore } from '@/shared/stores/pdfStore';
import { useChatStore } from '@/shared/stores/chatStore';
import { useCredits } from '@/shared/hooks/useCredits';
import { ChatContainer } from '@/features/chat/ChatContainer';
import { PdfUploadModalContainer } from '@/features/pdf/PdfUploadModalContainer';
import { SpinnerView } from '@/shared/components/SpinnerView';
import { CreditBlockOverlay } from '@/shared/components/CreditBlockOverlay';

export default function ChatPageClient() {
  const params = useParams();
  const router = useRouter();
  const {
    pdfId: storePdfId,
    collections,
    isLoadingCollections,
    error: collectionsError,
    fetchCollections,
    selectCollection,
  } = usePdfStore();

  const { initializeForPdf } = useChatStore();
  const { balance, isBlocked, isLoading: isLoadingCredits } = useCredits();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const urlPdfId = params.pdfId as string;

  // 초기화: collections 로드 및 pdfId 검증
  useEffect(() => {
    const initialize = async () => {
      if (collections.length === 0 && !isLoadingCollections) {
        await fetchCollections();
      }
      setIsInitializing(false);
    };

    initialize();
  }, [collections.length, isLoadingCollections, fetchCollections]);

  // pdfId 검증 및 스토어 동기화
  useEffect(() => {
    if (isInitializing || isLoadingCollections) return;

    if (collectionsError) return;

    if (collections.length > 0) {
      const targetCollection = collections.find((c) => c.pdfId === urlPdfId);

      if (!targetCollection) {
        setNotFound(true);
        return;
      }

      if (storePdfId !== urlPdfId) {
        selectCollection(targetCollection);
      }
    } else {
      router.replace('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    urlPdfId,
    storePdfId,
    collections,
    isInitializing,
    isLoadingCollections,
    collectionsError,
  ]);

  // 채팅 초기화 (세션 로드)
  useEffect(() => {
    if (storePdfId === urlPdfId) {
      initializeForPdf(urlPdfId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storePdfId, urlPdfId]);

  // notFound 상태일 때 3초 후 루트로 리다이렉트
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (notFound) {
      timeoutId = setTimeout(() => {
        router.replace('/');
      }, 3000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notFound]);

  const handleNewPdf = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleUploadComplete = () => {
    setIsModalOpen(false);
    router.push('/');
  };

  // 공통 배경 레이아웃
  const BackgroundLayout = ({ children }: { children: React.ReactNode }) => (
    <div
      className="relative flex min-h-screen items-center justify-center"
      style={{ background: 'var(--color-cream)' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 122, 157, 0.08), transparent),
            radial-gradient(ellipse 60% 40% at 100% 100%, rgba(91, 122, 157, 0.05), transparent)
          `
        }}
      />
      {children}
    </div>
  );

  // 로딩 중
  if (isInitializing || isLoadingCollections) {
    return (
      <BackgroundLayout>
        <div
          className="relative rounded-3xl p-10"
          style={{
            background: 'var(--color-paper)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-ai-border)'
          }}
        >
          <SpinnerView message="채팅을 준비하고 있습니다..." size="lg" />
        </div>
      </BackgroundLayout>
    );
  }

  // 크레딧 차단 (로딩 완료 후에만 판정)
  if (!isLoadingCredits && isBlocked) {
    return <CreditBlockOverlay balance={balance} />;
  }

  // 에러
  if (collectionsError) {
    return (
      <BackgroundLayout>
        <div
          className="relative w-full max-w-md rounded-3xl p-10 text-center"
          style={{
            background: 'var(--color-paper)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-ai-border)'
          }}
        >
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
          <h2 className="mb-2 text-xl" style={{ color: 'var(--color-ink)' }}>
            채팅을 불러올 수 없습니다
          </h2>
          <p className="mb-8 text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            {collectionsError}
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
              onClick={() => router.push('/')}
              className="focus-ring flex-1 rounded-xl px-4 py-3 font-medium transition-colors"
              style={{
                background: 'var(--color-cream)',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-ai-border)'
              }}
            >
              메인으로
            </button>
          </div>
        </div>
      </BackgroundLayout>
    );
  }

  // notFound
  if (notFound) {
    return (
      <BackgroundLayout>
        <div
          className="relative w-full max-w-md rounded-3xl p-10 text-center"
          style={{
            background: 'var(--color-paper)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-ai-border)'
          }}
        >
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: 'var(--color-accent-glow)',
              border: '1px solid var(--color-ai-border)'
            }}
          >
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              style={{ color: 'var(--color-accent)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl" style={{ color: 'var(--color-ink)' }}>
            문서를 찾을 수 없습니다
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            잠시 후 메인 화면으로 이동합니다...
          </p>
        </div>
      </BackgroundLayout>
    );
  }

  // pdfId 대기
  if (!storePdfId) {
    return (
      <BackgroundLayout>
        <div
          className="relative rounded-3xl p-10"
          style={{
            background: 'var(--color-paper)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-ai-border)'
          }}
        >
          <SpinnerView message="로딩 중..." size="lg" />
        </div>
      </BackgroundLayout>
    );
  }

  return (
    <>
      <ChatContainer onNewPdf={handleNewPdf} />
      <PdfUploadModalContainer
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUploadComplete={handleUploadComplete}
      />
    </>
  );
}
