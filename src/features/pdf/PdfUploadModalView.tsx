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
      // 모달이 열릴 때 약간의 지연 후 애니메이션 시작
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
        background: isVisible ? 'rgba(26, 31, 46, 0.6)' : 'rgba(26, 31, 46, 0)',
        backdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)'
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl p-8 transition-all duration-300"
        style={{
          background: 'var(--color-paper)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-ai-border)',
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          opacity: isVisible ? 1 : 0
        }}
      >
        {/* 헤더 */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-soft) 100%)',
                boxShadow: '0 4px 12px var(--color-accent-glow)'
              }}
            >
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <div>
              <h2
                className="text-2xl"
                style={{ color: 'var(--color-ink)' }}
              >
                새 문서 추가
              </h2>
              <p
                className="text-sm"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                PDF 파일을 업로드하세요
              </p>
            </div>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            disabled={isUploading}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: 'var(--color-cream)' }}
            aria-label="닫기"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              style={{ color: 'var(--color-ink-muted)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 업로드 영역 */}
        <div className="space-y-5">
          <label
            htmlFor="pdf-modal-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="group block cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200"
            style={{
              borderColor: isDragOver ? 'var(--color-accent)' : 'var(--color-ai-border)',
              background: isDragOver ? 'var(--color-accent-glow)' : 'var(--color-cream)'
            }}
          >
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
              style={{ background: 'var(--color-accent-glow)' }}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                style={{ color: 'var(--color-accent)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>

            <p className="mb-1 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              클릭하거나 파일을 드래그하세요
            </p>
            <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              PDF 파일만 지원됩니다
            </p>

            <input
              id="pdf-modal-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </label>

          {/* 선택된 파일 표시 */}
          {fileName && (
            <div
              className="animate-float-in flex items-center gap-3 rounded-xl p-3"
              style={{
                background: 'var(--color-success-bg)',
                border: '1px solid rgba(22, 101, 52, 0.2)'
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'rgba(22, 101, 52, 0.1)' }}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  style={{ color: 'var(--color-success)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="truncate text-sm font-medium" style={{ color: 'var(--color-success)' }}>
                {fileName}
              </p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div
              className="animate-float-in flex items-center gap-3 rounded-xl p-3"
              style={{
                background: 'var(--color-error-bg)',
                border: '1px solid rgba(185, 28, 28, 0.2)'
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'rgba(185, 28, 28, 0.1)' }}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  style={{ color: 'var(--color-error)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-error)' }}>
                {error}
              </p>
            </div>
          )}

          {/* 버튼 그룹 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="focus-ring flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: 'var(--color-cream)',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-ai-border)'
              }}
            >
              취소
            </button>
            <button
              onClick={onSave}
              disabled={!fileName || isUploading}
              className="focus-ring btn-lift flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: fileName && !isUploading ? 'var(--color-ink)' : 'var(--color-cream-dark)',
                color: fileName && !isUploading ? 'var(--color-cream)' : 'var(--color-ink-muted)'
              }}
            >
              {isUploading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  업로드 중...
                </>
              ) : (
                '저장'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
