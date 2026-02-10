"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { usePdfStore } from "@/shared/stores/pdfStore";
import { useAuth } from "@/shared/hooks/useAuth";
import { useCredits } from "@/shared/hooks/useCredits";
import { PdfUploadContainer } from "@/features/pdf/PdfUploadContainer";
import { PdfUploadModalContainer } from "@/features/pdf/PdfUploadModalContainer";
import { SpinnerView } from "@/shared/components/SpinnerView";
import { CollectionListView } from "@/features/pdf/CollectionListView";
import { CreditBlockOverlay } from "@/shared/components/CreditBlockOverlay";
import { AccountDeleteModal } from "@/shared/components/AccountDeleteModal";
import type { CollectionInfo } from "@/shared/types";

type PageState = "loading" | "error" | "empty" | "multiple_select";

export default function HomeClient() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { balance, isBlocked, isLoading: isLoadingCredits } = useCredits();
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
    })),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    fetchCollections();
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
    try {
      await deleteCollection(pdfId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.";
      alert(errorMessage);
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
    if (isLoadingCollections) return "loading";
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
      <div
        className="relative flex min-h-screen items-center justify-center"
        style={{ background: "var(--color-cream)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 122, 157, 0.08), transparent),
              radial-gradient(ellipse 60% 40% at 100% 100%, rgba(91, 122, 157, 0.05), transparent)
            `,
          }}
        />
        <div
          className="relative rounded-3xl p-10"
          style={{
            background: "var(--color-paper)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--color-ai-border)",
          }}
        >
          <SpinnerView message="문서를 불러오는 중..." size="lg" />
        </div>
      </div>
    );
  }

  // error
  if (currentState === "error") {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center p-6"
        style={{ background: "var(--color-cream)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 122, 157, 0.08), transparent),
              radial-gradient(ellipse 60% 40% at 100% 100%, rgba(91, 122, 157, 0.05), transparent)
            `,
          }}
        />
        <div
          className="relative w-full max-w-md rounded-3xl p-10 text-center"
          style={{
            background: "var(--color-paper)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--color-ai-border)",
          }}
        >
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: "var(--color-error-bg)",
              border: "1px solid rgba(185, 28, 28, 0.2)",
            }}
          >
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              style={{ color: "var(--color-error)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl" style={{ color: "var(--color-ink)" }}>
            불러오기 실패
          </h2>
          <p
            className="mb-8 text-sm"
            style={{ color: "var(--color-ink-muted)" }}
          >
            {error}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchCollections()}
              className="focus-ring btn-lift flex-1 rounded-xl px-4 py-3 font-medium transition-all"
              style={{
                background: "var(--color-ink)",
                color: "var(--color-cream)",
              }}
            >
              다시 시도
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="focus-ring flex-1 rounded-xl px-4 py-3 font-medium transition-colors"
              style={{
                background: "var(--color-cream)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-ai-border)",
              }}
            >
              새 PDF 업로드
            </button>
          </div>
        </div>
      </div>
    );
  }

  // embedding
  if (isEmbedding) {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center"
        style={{ background: "var(--color-cream)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 122, 157, 0.08), transparent),
              radial-gradient(ellipse 60% 40% at 100% 100%, rgba(91, 122, 157, 0.05), transparent)
            `,
          }}
        />
        <div
          className="relative rounded-3xl p-10 text-center"
          style={{
            background: "var(--color-paper)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--color-ai-border)",
          }}
        >
          <SpinnerView message="PDF를 분석하고 있습니다..." size="lg" />
          <p
            className="mt-2 text-xs"
            style={{ color: "var(--color-ink-muted)" }}
          >
            문서 내용을 AI가 이해할 수 있도록 처리 중입니다
          </p>
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
          user={user}
          onSignOut={signOut}
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

  // empty
  return <PdfUploadContainer onUploadComplete={handleUploadComplete} />;
}
