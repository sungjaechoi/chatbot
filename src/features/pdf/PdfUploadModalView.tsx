import { useState, useEffect } from 'react';

interface PdfUploadModalViewProps {
  isOpen: boolean;
  fileName: string | null;
  isUploading: boolean;
  error: string | null;
  onClose: () => void;
  onFileSelect: (file: File) => void;
  onSave: () => void;
}

export function PdfUploadModalView({
  isOpen,
  fileName,
  isUploading,
  error,
  onClose,
  onFileSelect,
  onSave,
}: PdfUploadModalViewProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    } else if (file) {
      alert('PDF 파일만 업로드 가능합니다.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    } else if (file) {
      alert('PDF 파일만 업로드 가능합니다.');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isUploading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 transition-all duration-300"
      style={{
        background: isVisible ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
        backdropFilter: isVisible ? 'blur(8px)' : 'blur(0px)',
      }}
      onClick={handleBackdropClick}
    >
      {/* 배경 장식 (블러 원형 그라데이션) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-20 -top-20 h-96 w-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--color-primary)' }}
        />
        <div
          className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--color-accent)' }}
        />
      </div>

      {/* 모달 카드 — 테마 반응형 */}
      <div
        className="relative w-full max-w-xl rounded-2xl transition-all duration-300"
        style={{
          background: 'var(--color-paper)',
          border: '1px solid var(--color-border-light)',
          boxShadow: 'var(--shadow-xl)',
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between px-8 pt-8 pb-4">
          <div>
            <h2
              className="text-2xl font-semibold tracking-tight"
              style={{ color: 'var(--color-ink)' }}
            >
              PDF 업로드
            </h2>
            <p className="mt-1 text-sm font-light" style={{ color: 'var(--color-ink-muted)' }}>
              분석할 문서를 업로드하여 AI와 대화를 시작하세요
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: 'var(--color-ink-muted)' }}
            aria-label="닫기"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* 업로드 콘텐츠 */}
        <div className="px-8 pb-6">
          {!fileName && !isUploading ? (
            /* S4: 드래그&드롭 상태 */
            <label
              htmlFor="pdf-modal-upload"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="group block cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200"
              style={{
                borderColor: isDragOver ? 'var(--color-primary)' : 'var(--color-border-light)',
                background: isDragOver ? 'rgba(22, 67, 156, 0.05)' : 'var(--color-cream)',
              }}
            >
              <div
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
                style={{ background: 'rgba(22, 67, 156, 0.08)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--color-primary)' }}>
                  cloud_upload
                </span>
              </div>
              <p className="mb-1 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                PDF 파일을 드래그하거나 클릭하여 선택하세요
              </p>
              <p className="mb-4 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                최대 50MB, PDF 형식만 지원됩니다
              </p>
              <span
                className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                파일 선택하기
              </span>
              <input
                id="pdf-modal-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          ) : fileName && !isUploading ? (
            /* S5: 파일 선택됨 상태 */
            <div>
              <p className="mb-1 text-xl font-medium" style={{ color: 'var(--color-ink)' }}>
                파일이 선택되었습니다
              </p>
              <p className="mb-6 text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                분석을 시작하려면 업로드 버튼을 눌러주세요.
              </p>

              <div
                className="flex items-center gap-4 rounded-lg p-6"
                style={{
                  background: 'var(--color-cream)',
                  border: '2px solid var(--color-primary)',
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--color-pdf-red)' }}>
                    picture_as_pdf
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                    {fileName}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>PDF 문서</p>
                </div>
                {/* 체크 뱃지 */}
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                  style={{ background: 'var(--color-primary)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                </div>
              </div>

              <p className="mt-4 flex items-center gap-1 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
                모든 문서는 암호화되어 안전하게 처리됩니다.
              </p>
            </div>
          ) : (
            /* S6: 업로드/임베딩 진행중 */
            <div className="py-4 text-center">
              <div
                className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full"
                style={{ background: 'var(--color-cream-dark)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--color-ink-muted)' }}>
                  cloud_upload
                </span>
              </div>
              <div className="mb-1 flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--color-ink-muted)' }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>업로드 및 임베딩 처리 중...</span>
              </div>
              <p className="mb-6 text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                잠시만 기다려주세요. 문서가 분석되고 있습니다.
              </p>

              {/* 프로그레스 바 */}
              <div className="mx-auto max-w-xs">
                <div
                  className="relative h-2.5 w-full overflow-hidden rounded-full"
                  style={{ background: 'var(--color-cream-dark)' }}
                >
                  <div
                    className="stitch-shimmer relative h-full overflow-hidden rounded-full"
                    style={{ width: '65%', background: 'var(--color-primary)' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div
              className="mt-4 flex items-center gap-2 rounded-lg p-3"
              style={{
                background: 'var(--color-error-bg)',
                border: '1px solid rgba(185, 28, 28, 0.2)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-error)' }}>error</span>
              <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div
          className="flex items-center justify-between border-t px-8 py-5"
          style={{ borderColor: 'var(--color-border-light)' }}
        >
          {!isUploading && !fileName && (
            <div className="flex gap-6 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
                보안 암호화 전송
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>bolt</span>
                빠른 AI 분석
              </span>
            </div>
          )}

          <div className="ml-auto flex gap-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              취소
            </button>
            {fileName && !isUploading && (
              <button
                onClick={onSave}
                className="focus-ring btn-lift rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all"
                style={{ background: 'var(--color-primary)' }}
              >
                업로드
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
