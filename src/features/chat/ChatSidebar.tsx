'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore, ChatSession } from '@/shared/stores/chatStore';
import { usePdfStore } from '@/shared/stores/pdfStore';
import { useAuth } from '@/shared/hooks/useAuth';
import { ThemeToggleButton } from '@/shared/components/ThemeToggleButton';
import { AccountDeleteModal } from '@/shared/components/AccountDeleteModal';

interface ChatSidebarProps {
  onNewPdf: () => void;
  onClose?: () => void;
}

export function ChatSidebar({ onNewPdf, onClose }: ChatSidebarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const {
    pdfId: currentPdfId,
    sessionList,
    currentSessionId,
    createNewSession,
    switchSession,
    deleteSessionById,
    renameSession,
    isCreatingSession,
  } = useChatStore();
  const { collections } = usePdfStore();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handlePdfClick = (pdfId: string) => {
    router.push(`/chat/${pdfId}`);
    onClose?.();
  };

  const handleNewSession = async () => {
    if (!currentPdfId || isCreatingSession) return;
    await createNewSession(currentPdfId);
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

  return (
    <div className="sidebar-root flex h-full flex-col">
      {/* 새 문서 버튼 */}
      <div className="px-3 pt-4 md:px-4">
        <button
          onClick={onNewPdf}
          className="focus-ring btn-lift sidebar-new-doc-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
        >
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          새 문서
        </button>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-3 py-4 md:px-4">
        {/* PDF 목록 */}
        <div className="mb-5">
          <h3 className="sidebar-section-label mb-2 px-2 text-xs font-medium uppercase tracking-widest">
            문서 목록
          </h3>
          <div className="space-y-0.5">
            {collections.length === 0 ? (
              <p className="sidebar-empty-text px-2 py-6 text-center text-xs">
                문서가 없습니다
              </p>
            ) : (
              collections.map((collection) => {
                const isActive = currentPdfId === collection.pdfId;
                return (
                  <button
                    key={collection.pdfId}
                    onClick={() => handlePdfClick(collection.pdfId)}
                    className={`sidebar-item focus-ring relative w-full rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                      isActive ? 'sidebar-item--active' : 'sidebar-item--idle'
                    }`}
                  >
                    {/* 활성 인디케이터 바 */}
                    <span
                      className={`sidebar-indicator absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full transition-all ${
                        isActive
                          ? 'h-6 w-[3px] opacity-100'
                          : 'h-0 w-[3px] opacity-0'
                      }`}
                    />
                    <div className="truncate font-medium">{collection.fileName}</div>
                    <div className="sidebar-meta truncate text-xs">
                      {collection.documentCount}개 청크
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 현재 PDF 세션 목록 */}
        {currentPdfId && (
          <div>
            <div className="mb-2 flex items-center justify-between px-2">
              <h3 className="sidebar-section-label text-xs font-medium uppercase tracking-widest">
                대화 세션
              </h3>
              <button
                onClick={handleNewSession}
                disabled={isCreatingSession}
                className="focus-ring sidebar-add-btn rounded-md p-1 transition-all disabled:opacity-40"
                aria-label="새 세션"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="space-y-0.5">
              {sessionList.length === 0 ? (
                <p className="sidebar-empty-text px-2 py-6 text-center text-xs">
                  세션이 없습니다
                </p>
              ) : (
                sessionList.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={currentSessionId === session.id}
                    onSwitch={switchSession}
                    onDelete={deleteSessionById}
                    onRename={renameSession}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 유저 정보 푸터 */}
      <div className="sidebar-footer px-3 py-3 md:px-4 md:py-4">
        <div className="flex items-center gap-3">
          {user?.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="프로필"
              className="h-8 w-8 shrink-0 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="sidebar-user-name truncate text-sm font-medium">
              {user?.user_metadata?.full_name || user?.email || '사용자'}
            </p>
          </div>
          <ThemeToggleButton size="sm" />
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="focus-ring sidebar-icon-btn shrink-0 rounded-lg p-1.5 transition-colors"
            aria-label="회원 탈퇴"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
              />
            </svg>
          </button>
          <button
            onClick={signOut}
            className="focus-ring sidebar-icon-btn shrink-0 rounded-lg p-1.5 transition-colors"
            aria-label="로그아웃"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 회원 탈퇴 모달 */}
      <AccountDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeletingAccount}
      />
    </div>
  );
}

/* ─── SessionItem ─── */

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSwitch: (sessionId: string) => void;
  onDelete: (sessionId: string) => Promise<void>;
  onRename: (sessionId: string, title: string) => Promise<void>;
}

function SessionItem({
  session,
  isActive,
  onSwitch,
  onDelete,
  onRename,
}: SessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(session.title || '');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSwitch = () => {
    if (!isActive) onSwitch(session.id);
  };

  const handleEdit = () => {
    setEditValue(session.title || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === session.title) {
      setIsEditing(false);
      return;
    }
    if (trimmed.length > 20) {
      alert('제목은 최대 20자까지 입력할 수 있습니다.');
      return;
    }
    try {
      await onRename(session.id, trimmed);
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : '이름 변경에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(session.title || '');
  };

  const handleDelete = async () => {
    if (!window.confirm('이 세션을 삭제하시겠습니까?')) return;
    setIsDeleting(true);
    try {
      await onDelete(session.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
      setIsDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <div className="sidebar-edit-row flex items-center gap-2 rounded-lg px-3 py-2">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          maxLength={20}
          autoFocus
          className="sidebar-edit-input focus-ring flex-1 rounded-md border px-2 py-1 text-sm"
        />
      </div>
    );
  }

  return (
    <div
      className={`sidebar-item group relative flex items-center gap-2 rounded-lg py-2.5 pl-3 pr-2 transition-all ${
        isActive ? 'sidebar-item--active' : 'sidebar-item--idle'
      }`}
      style={{ cursor: 'pointer' }}
    >
      {/* 활성 인디케이터 바 */}
      <span
        className={`sidebar-indicator absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full transition-all ${
          isActive
            ? 'h-6 w-[3px] opacity-100'
            : 'h-0 w-[3px] opacity-0'
        }`}
      />

      <button
        onClick={handleSwitch}
        className="min-w-0 flex-1 overflow-hidden text-left"
        disabled={isDeleting}
      >
        <p className="truncate text-sm font-medium">
          {session.title || '새 대화'}
        </p>
        <p className="sidebar-meta truncate text-xs">
          {new Date(session.lastMessageAt).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </button>

      {/* 액션 버튼 — 모바일에서는 항상 표시, 데스크탑은 hover */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <button
          onClick={handleEdit}
          disabled={isDeleting}
          className="focus-ring sidebar-icon-btn rounded p-1.5 transition-colors"
          aria-label="세션 이름 변경"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="focus-ring sidebar-delete-btn rounded p-1.5 transition-colors"
          aria-label="세션 삭제"
        >
          {isDeleting ? (
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
