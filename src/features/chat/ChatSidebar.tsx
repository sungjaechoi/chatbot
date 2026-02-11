'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore, ChatSession } from '@/shared/stores/chatStore';
import { usePdfStore } from '@/shared/stores/pdfStore';
import { useAuth } from '@/shared/hooks/useAuth';
import { AccountDeleteModal } from '@/shared/components/AccountDeleteModal';
import { UserProfile } from '@/shared/components/UserProfile';

interface ChatSidebarProps {
  onNewPdf: () => void;
  onClose?: () => void;
}

export function ChatSidebar({ onNewPdf, onClose }: ChatSidebarProps) {
  const router = useRouter();
  const { signOut } = useAuth();
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
    <div
      className="stitch-sidebar-bg flex h-full flex-col border-r"
      style={{ borderColor: 'var(--color-border-light)' }}
    >
      {/* 새 문서 버튼 */}
      <div className="px-4 pt-4">
        <button
          onClick={onNewPdf}
          className="focus-ring btn-lift flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all"
          style={{ background: 'var(--color-primary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          새 문서
        </button>
      </div>

      {/* 스크롤 영역 */}
      <div className="stitch-sidebar-scroll flex-1 overflow-y-auto px-4 py-4">
        {/* 문서 목록 */}
        <div className="mb-5">
          <h3
            className="mb-2 px-2 text-xs font-medium tracking-wide"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            문서 목록
          </h3>
          <div className="space-y-1">
            {collections.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                문서가 없습니다
              </p>
            ) : (
              collections.map((collection) => {
                const isActive = currentPdfId === collection.pdfId;
                return (
                  <button
                    key={collection.pdfId}
                    onClick={() => handlePdfClick(collection.pdfId)}
                    className="focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all"
                    style={{
                      background: isActive ? 'var(--color-paper)' : 'transparent',
                      boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span
                      className="material-symbols-outlined shrink-0"
                      style={{ fontSize: '20px', color: 'var(--color-pdf-red)' }}
                    >
                      picture_as_pdf
                    </span>
                    <span
                      className="truncate font-medium"
                      style={{ color: isActive ? 'var(--color-ink)' : 'var(--color-ink-muted)' }}
                    >
                      {collection.fileName}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 대화 기록 */}
        {currentPdfId && (
          <div>
            <div className="mb-2 flex items-center justify-between px-2">
              <h3
                className="text-xs font-medium tracking-wide"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                대화 기록
              </h3>
              <button
                onClick={handleNewSession}
                disabled={isCreatingSession}
                className="focus-ring rounded-md p-1 transition-all disabled:opacity-40"
                style={{ color: 'var(--color-ink-muted)' }}
                aria-label="새 세션"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              </button>
            </div>
            <div className="space-y-1">
              {sessionList.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs" style={{ color: 'var(--color-ink-muted)' }}>
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
      <div
        className="border-t px-4 py-3"
        style={{ borderColor: 'var(--color-border-light)' }}
      >
        <UserProfile
          panelDirection="up"
          onDeleteAccount={() => setIsDeleteModalOpen(true)}
        />
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
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2"
        style={{ background: 'var(--color-paper)' }}
      >
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          maxLength={20}
          autoFocus
          className="focus-ring flex-1 rounded-md border px-2 py-1 text-sm"
          style={{
            background: 'var(--color-cream)',
            color: 'var(--color-ink)',
            borderColor: 'var(--color-border-light)',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all"
      style={{
        cursor: 'pointer',
        background: isActive ? 'var(--color-paper)' : 'transparent',
        boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
      onClick={handleSwitch}
    >
      {/* 아이콘: 활성=채워진 네이비, 비활성=아웃라인 */}
      <span
        className="material-symbols-outlined shrink-0"
        style={{
          fontSize: '20px',
          color: isActive ? 'var(--color-primary)' : 'var(--color-ink-muted)',
          fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
        }}
      >
        chat_bubble
      </span>

      {/* 제목 */}
      <span
        className="min-w-0 flex-1 truncate text-sm font-medium"
        style={{ color: isActive ? 'var(--color-ink)' : 'var(--color-ink-muted)' }}
      >
        {session.title || '새 대화'}
      </span>

      {/* 액션 버튼 — hover 시에만 표시 */}
      <div
        className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleEdit}
          disabled={isDeleting}
          className="focus-ring rounded p-1 transition-colors"
          style={{ color: 'var(--color-ink-muted)' }}
          aria-label="세션 이름 변경"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="focus-ring rounded p-1 transition-colors"
          style={{ color: 'var(--color-ink-muted)' }}
          aria-label="세션 삭제"
        >
          {isDeleting ? (
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete_outline</span>
          )}
        </button>
      </div>
    </div>
  );
}
