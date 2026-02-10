'use client';

import { useState, useEffect } from 'react';

interface AccountDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function AccountDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: AccountDeleteModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const isConfirmValid = confirmText === '탈퇴합니다';

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  // 모달이 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 모달 닫힐 때 입력값 초기화
  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!isConfirmValid || isDeleting) return;
    await onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26, 31, 46, 0.7)' }}
      onClick={handleBackdropClick}
    >
      {/* 모달 카드 */}
      <div
        className="relative w-full max-w-md rounded-3xl p-8"
        style={{
          background: 'var(--color-paper)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-ai-border)',
        }}
      >
        {/* 경고 아이콘 */}
        <div
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: 'var(--color-error-bg)',
            border: '1px solid rgba(185, 28, 28, 0.2)',
          }}
        >
          <svg
            className="h-7 w-7"
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

        {/* 제목 */}
        <h2
          className="mb-4 text-center text-2xl font-bold"
          style={{ color: 'var(--color-ink)' }}
        >
          회원 탈퇴
        </h2>

        {/* 안내 문구 */}
        <div
          className="mb-6 space-y-2 rounded-xl p-4 text-sm"
          style={{
            background: 'var(--color-cream)',
            border: '1px solid var(--color-ai-border)',
          }}
        >
          <p style={{ color: 'var(--color-ink)' }}>
            <strong>탈퇴 시 계정이 즉시 비활성화됩니다.</strong>
          </p>
          <p style={{ color: 'var(--color-ink-muted)' }}>
            30일간 데이터가 보존되며, 이후 영구 삭제됩니다.
          </p>
          <p style={{ color: 'var(--color-ink-muted)' }}>
            <strong>삭제되는 데이터:</strong> 업로드한 PDF, 채팅 기록, 사용량 로그
          </p>
        </div>

        {/* 확인 입력 */}
        <div className="mb-6">
          <label
            className="mb-2 block text-sm font-medium"
            style={{ color: 'var(--color-ink)' }}
          >
            계속하려면 <strong>&ldquo;탈퇴합니다&rdquo;</strong>를 입력하세요:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={isDeleting}
            placeholder="탈퇴합니다"
            className="focus-ring w-full rounded-xl px-4 py-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: 'var(--color-paper)',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-ai-border)',
            }}
            autoFocus
          />
        </div>

        {/* 버튼 그룹 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="focus-ring flex-1 rounded-xl px-4 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: 'var(--color-cream)',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-ai-border)',
            }}
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
            className="focus-ring flex-1 rounded-xl px-4 py-3 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: isConfirmValid
                ? 'var(--color-error)'
                : 'var(--color-ink-muted)',
            }}
          >
            {isDeleting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                처리 중...
              </span>
            ) : (
              '회원 탈퇴'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
