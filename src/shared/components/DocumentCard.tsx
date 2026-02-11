'use client';

import { useState } from 'react';
import type { CollectionInfo } from '@/shared/types';

interface DocumentCardProps {
  collection: CollectionInfo;
  index: number;
  onSelect: (collection: CollectionInfo) => void;
  onDelete: (pdfId: string, fileName: string) => void;
  isDeleting: boolean;
  isDeletingThis?: boolean;
}

export function DocumentCard({ collection, index, onSelect, onDelete, isDeleting, isDeletingThis }: DocumentCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    const confirmed = window.confirm(
      `"${collection.fileName}" 파일을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );
    if (confirmed) {
      onDelete(collection.pdfId, collection.fileName);
    }
  };

  return (
    <div
      className="animate-float-in group relative cursor-pointer rounded-lg border p-5 transition-all duration-200"
      style={{
        animationDelay: `${index * 50}ms`,
        background: 'var(--color-paper)',
        borderColor: 'var(--color-border-light)',
        boxShadow: 'var(--shadow-luxury)',
        opacity: isDeletingThis ? 0.7 : 1,
        pointerEvents: isDeletingThis ? 'none' : 'auto',
      }}
      onMouseEnter={(e) => {
        if (!isDeletingThis) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-luxury)';
      }}
      onClick={() => !isDeletingThis && onSelect(collection)}
    >
      {/* 삭제 중 스피너 오버레이 */}
      {isDeletingThis && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg"
          style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(2px)' }}
        >
          <div className="flex flex-col items-center gap-2">
            <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--color-primary)' }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>삭제 중...</span>
          </div>
        </div>
      )}

      {/* 상단: PDF 아이콘 + 더보기 */}
      <div className="mb-3 flex items-start justify-between">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{ background: 'rgba(22, 67, 156, 0.05)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--color-pdf-red)' }}>
            picture_as_pdf
          </span>
        </div>

        {/* 더보기 메뉴 */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg opacity-0 transition-all group-hover:opacity-100"
            style={{ color: 'var(--color-ink-muted)' }}
            aria-label="옵션"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>more_vert</span>
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg"
              style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--color-border-light)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-red-50 disabled:opacity-50"
                style={{ color: 'var(--color-error)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete_outline</span>
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 제목 */}
      <h3 className="truncate font-bold" style={{ color: 'var(--color-ink)' }}>
        {collection.fileName}
      </h3>

      {/* 업로드일 */}
      <p className="mt-1 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
        {collection.createdAt
          ? new Date(collection.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
          : ''}
      </p>

      {/* 구분선 */}
      <div className="my-3" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)' }} />

      {/* 메타 정보 */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>
            CHUNKS
          </p>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
            {collection.documentCount}
          </p>
        </div>
      </div>

      {/* 채팅 시작 버튼 */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(collection); }}
        disabled={isDeleting}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all"
        style={{
          background: 'rgba(22, 67, 156, 0.05)',
          color: 'var(--color-primary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(22, 67, 156, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(22, 67, 156, 0.05)';
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat_bubble</span>
        채팅 시작
      </button>
    </div>
  );
}
