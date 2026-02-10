'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore, ChatSession } from '@/shared/stores/chatStore';
import { usePdfStore } from '@/shared/stores/pdfStore';
import { useAuth } from '@/shared/hooks/useAuth';
import { useThemeStore, Theme } from '@/shared/stores/themeStore';
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 설정 패널 외부 클릭 시 닫기
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSettingsOpen]);

  const handleThemeToggle = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(nextTheme);
  };

  const themeLabel = !mounted
    ? '테마'
    : theme === 'light'
      ? '라이트 모드'
      : theme === 'dark'
        ? '다크 모드'
        : '시스템 설정';

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

          {/* 설정 버튼 + 패널 */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className="focus-ring sidebar-icon-btn shrink-0 rounded-lg p-1.5 transition-colors"
              aria-label="설정"
              aria-expanded={isSettingsOpen}
            >
              <svg
                className={`h-5 w-5 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90' : 'rotate-0'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* 설정 패널 */}
            {isSettingsOpen && (
              <div
                className="settings-panel absolute bottom-full right-0 mb-2 w-56 overflow-hidden rounded-xl"
                style={{
                  background: 'var(--color-paper)',
                  border: '1px solid var(--color-ai-border)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                {/* 테마 전환 */}
                <button
                  onClick={handleThemeToggle}
                  className="settings-panel-item flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors"
                >
                  <span className="settings-panel-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    {mounted && theme === 'dark' ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0112 21.75 9.75 9.75 0 013.75 12 9.718 9.718 0 0110.498 2.248a9.75 9.75 0 0011.254 12.754z" />
                      </svg>
                    ) : mounted && theme === 'system' ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium" style={{ color: 'var(--color-ink)' }}>테마</p>
                    <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>{themeLabel}</p>
                  </div>
                </button>

                {/* 구분선 */}
                <div style={{ height: '1px', background: 'var(--color-ai-border)' }} />

                {/* 회원 탈퇴 */}
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="settings-panel-item flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors"
                >
                  <span className="settings-panel-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                  </span>
                  <p className="font-medium" style={{ color: 'var(--color-ink)' }}>회원 탈퇴</p>
                </button>

                {/* 구분선 */}
                <div style={{ height: '1px', background: 'var(--color-ai-border)' }} />

                {/* 로그아웃 */}
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    signOut();
                  }}
                  className="settings-panel-item flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors"
                >
                  <span className="settings-panel-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                  </span>
                  <p className="font-medium" style={{ color: 'var(--color-ink)' }}>로그아웃</p>
                </button>
              </div>
            )}
          </div>
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
