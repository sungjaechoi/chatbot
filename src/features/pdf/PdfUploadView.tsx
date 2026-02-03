import { useState } from 'react';
import { ThemeToggleButton } from '@/shared/components/ThemeToggleButton';

interface PdfUploadViewProps {
  fileName: string | null;
  isUploading: boolean;
  error: string | null;
  onFileSelect: (file: File) => void;
  onSave: () => void;
}

export function PdfUploadView({
  fileName,
  isUploading,
  error,
  onFileSelect,
  onSave,
}: PdfUploadViewProps) {
  const [isDragOver, setIsDragOver] = useState(false);

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

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center p-6"
      style={{ background: 'var(--color-cream)' }}
    >
      {/* 테마 토글 버튼 */}
      <ThemeToggleButton className="fixed right-6 top-6 z-50" size="md" />

      {/* 배경 그라디언트 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 122, 157, 0.08), transparent),
            radial-gradient(ellipse 60% 40% at 100% 100%, rgba(91, 122, 157, 0.05), transparent)
          `
        }}
      />

      <div
        className="relative w-full max-w-lg rounded-3xl p-10"
        style={{
          background: 'var(--color-paper)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-ai-border)'
        }}
      >
        {/* 헤더 */}
        <div className="mb-10 text-center">
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-soft) 100%)',
              boxShadow: '0 8px 24px var(--color-accent-glow)'
            }}
          >
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>

          <h1
            className="mb-3 text-3xl tracking-tight"
            style={{ color: 'var(--color-ink)' }}
          >
            Document Chat
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            PDF 문서를 업로드하고 AI와 대화하세요
          </p>
        </div>

        {/* 업로드 영역 */}
        <div className="space-y-6">
          <label
            htmlFor="pdf-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="group block cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200"
            style={{
              borderColor: isDragOver ? 'var(--color-accent)' : 'var(--color-ai-border)',
              background: isDragOver ? 'var(--color-accent-glow)' : 'var(--color-cream)'
            }}
          >
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
              style={{
                background: 'var(--color-accent-glow)'
              }}
            >
              <svg
                className="h-7 w-7"
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

            <p
              className="mb-1 font-medium"
              style={{ color: 'var(--color-ink)' }}
            >
              클릭하거나 파일을 드래그하세요
            </p>
            <p
              className="text-xs"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              PDF 파일만 지원됩니다
            </p>

            <input
              id="pdf-upload"
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
              className="animate-float-in flex items-center gap-3 rounded-2xl p-4"
              style={{
                background: 'var(--color-success-bg)',
                border: '1px solid rgba(22, 101, 52, 0.2)'
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'rgba(22, 101, 52, 0.1)' }}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  style={{ color: 'var(--color-success)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium"
                  style={{ color: 'var(--color-success)' }}
                >
                  {fileName}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  업로드 준비 완료
                </p>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div
              className="animate-float-in flex items-center gap-3 rounded-2xl p-4"
              style={{
                background: 'var(--color-error-bg)',
                border: '1px solid rgba(185, 28, 28, 0.2)'
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'rgba(185, 28, 28, 0.1)' }}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  style={{ color: 'var(--color-error)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p
                className="text-sm"
                style={{ color: 'var(--color-error)' }}
              >
                {error}
              </p>
            </div>
          )}

          {/* 저장 버튼 */}
          <button
            onClick={onSave}
            disabled={!fileName || isUploading}
            className="focus-ring btn-lift flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: fileName && !isUploading
                ? 'var(--color-ink)'
                : 'var(--color-cream-dark)',
              color: fileName && !isUploading
                ? 'var(--color-cream)'
                : 'var(--color-ink-muted)'
            }}
          >
            {isUploading ? (
              <>
                <svg
                  className="h-5 w-5 animate-spin"
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
                업로드 중...
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                문서 저장
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
