"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { usePdfStore } from "@/shared/stores/pdfStore";
import { useAuth } from "@/shared/hooks/useAuth";
import { useCredits } from "@/shared/hooks/useCredits";
import { PdfUploadModalContainer } from "@/features/pdf/PdfUploadModalContainer";
import { SpinnerView } from "@/shared/components/SpinnerView";
import { CollectionListView } from "@/features/pdf/CollectionListView";
import { CreditBlockOverlay } from "@/shared/components/CreditBlockOverlay";
import { AccountDeleteModal } from "@/shared/components/AccountDeleteModal";
import { NavigationBar } from "@/shared/components/NavigationBar";
import type { CollectionInfo } from "@/shared/types";

type PageState = "loading" | "error" | "empty" | "multiple_select";

export default function HomeClient() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { balance, isBlocked, isLoading: isLoadingCredits } = useCredits();
  const {
    isLoadingCollections,
    isDeletingPdf,
    collections,
    error,
    fetchCollections,
    deleteCollection,
  } = usePdfStore(
    useShallow((state) => ({
      isLoadingCollections: state.isLoadingCollections,
      isDeletingPdf: state.isDeletingPdf,
      collections: state.collections,
      error: state.error,
      fetchCollections: state.fetchCollections,
      deleteCollection: state.deleteCollection,
    })),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletingPdfId, setDeletingPdfId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchCollections().finally(() => setInitialLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploadComplete = async () => {
    setIsModalOpen(false);
    await fetchCollections();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSelectCollection = (collection: CollectionInfo) => {
    router.push(`/chat/${collection.pdfId}`);
  };

  const handleNewPdfFromList = () => {
    setIsModalOpen(true);
  };

  const handleDeleteCollection = async (pdfId: string) => {
    setDeletingPdfId(pdfId);
    try {
      await deleteCollection(pdfId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.";
      alert(errorMessage);
    } finally {
      setDeletingPdfId(null);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
      });

      if (!response.ok) {
        let errorMessage = '회원 탈퇴에 실패했습니다.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      alert(data.message || '회원 탈퇴가 완료되었습니다.');

      // 로그아웃 후 로그인 페이지로 리다이렉트
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '회원 탈퇴 중 오류가 발생했습니다.';
      alert(errorMessage);
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
    }
  };

  const getCurrentState = (): PageState => {
    if (isLoadingCollections || initialLoading) return "loading";
    if (error) return "error";
    if (collections.length === 0) return "empty";
    return "multiple_select";
  };

  const currentState = getCurrentState();

  // 크레딧 차단 (로딩 완료 후에만 판정)
  if (!isLoadingCredits && isBlocked) {
    return <CreditBlockOverlay balance={balance} />;
  }

  // loading
  if (currentState === "loading") {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
        <NavigationBar />
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <div
            className="relative rounded-2xl p-10"
            style={{
              background: "var(--color-paper)",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--color-border-light)",
            }}
          >
            <SpinnerView message="문서를 불러오는 중..." size="lg" />
          </div>
        </div>
      </div>
    );
  }

  // error
  if (currentState === "error") {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
        <NavigationBar />
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
          <div
            className="relative w-full max-w-md rounded-2xl p-10 text-center"
            style={{
              background: "var(--color-paper)",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--color-border-light)",
            }}
          >
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: "var(--color-error-bg)",
                border: "1px solid rgba(185, 28, 28, 0.2)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-error)' }}>
                error
              </span>
            </div>
            <h2 className="mb-2 text-xl font-bold" style={{ color: "var(--color-ink)" }}>
              불러오기 실패
            </h2>
            <p className="mb-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
              {error}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => fetchCollections()}
                className="focus-ring btn-lift flex-1 rounded-xl px-4 py-3 font-medium text-white transition-all"
                style={{ background: "var(--color-primary)" }}
              >
                다시 시도
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="focus-ring flex-1 rounded-xl px-4 py-3 font-medium transition-colors"
                style={{
                  background: "var(--color-cream)",
                  color: "var(--color-ink)",
                  border: "1px solid var(--color-border-light)",
                }}
              >
                새 PDF 업로드
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // multiple_select: collections
  if (currentState === "multiple_select") {
    return (
      <>
        <CollectionListView
          collections={collections}
          onSelectCollection={handleSelectCollection}
          onDeleteCollection={handleDeleteCollection}
          onNewPdf={handleNewPdfFromList}
          isDeletingPdf={isDeletingPdf}
          deletingPdfId={deletingPdfId}
          onDeleteAccount={() => setIsDeleteModalOpen(true)}
        />

        <PdfUploadModalContainer
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUploadComplete={handleUploadComplete}
        />

        <AccountDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteAccount}
          isDeleting={isDeletingAccount}
        />
      </>
    );
  }

  // empty — Stitch 빈 상태 디자인
  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      <NavigationBar
        onDeleteAccount={() => setIsDeleteModalOpen(true)}
      />

      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="text-center">
          {/* 큰 원형 아이콘 */}
          <div className="relative mx-auto mb-8 flex h-40 w-40 items-center justify-center rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(22, 67, 156, 0.05) 0%, rgba(91, 122, 157, 0.08) 100%)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '80px', color: 'var(--color-ink-muted)', opacity: 0.2 }}>
              folder_open
            </span>
            {/* + 뱃지 */}
            <div
              className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg"
              style={{ background: 'var(--color-primary)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>add</span>
            </div>
          </div>

          <h2 className="mb-3 text-3xl font-bold" style={{ color: 'var(--color-ink)' }}>
            업로드된 문서가 없습니다
          </h2>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
            PDF 문서를 업로드하여<br />AI와 대화를 시작해보세요.
          </p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="focus-ring btn-lift mx-auto inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-medium text-white shadow-xl transition-all"
            style={{ background: 'var(--color-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = 'var(--color-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'var(--color-primary)';
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            PDF 업로드
          </button>
        </div>
      </div>

      <PdfUploadModalContainer
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUploadComplete={handleUploadComplete}
      />

      <AccountDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeletingAccount}
      />
    </div>
  );
}
