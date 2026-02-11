import { useState } from 'react';

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
      {/* 배경 그라디언트 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 85% 10%, rgba(22, 67, 156, 0.06), transparent 70%),
            radial-gradient(ellipse 40% 30% at 10% 90%, rgba(91, 122, 157, 0.04), transparent)
          `
        }}
      />

      <div
        className="relative w-full max-w-lg rounded-2xl p-10"
        style={{
          background: 'var(--color-paper)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border-light)'
        }}
      >
        {/* 헤더 */}
        <div className="mb-10 text-center">
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: 'var(--color-primary)',
              boxShadow: '0 8px 24px rgba(22, 67, 156, 0.2)'
            }}
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: '32px' }}>
              auto_awesome
            </span>
          </div>

          <h1
            className="mb-3 text-3xl font-bold tracking-tight"
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
            className="group block cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200"
            style={{
              borderColor: isDragOver ? 'var(--color-primary)' : 'var(--color-border-light)',
              background: isDragOver ? 'rgba(22, 67, 156, 0.05)' : 'var(--color-cream)'
            }}
          >
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105"
              style={{ background: 'rgba(22, 67, 156, 0.08)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--color-primary)' }}>
                cloud_upload
              </span>
            </div>

            <p className="mb-1 font-medium" style={{ color: 'var(--color-ink)' }}>
              클릭하거나 파일을 드래그하세요
            </p>
            <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
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
              className="animate-float-in flex items-center gap-3 rounded-xl p-4"
              style={{
                background: 'var(--color-success-bg)',
                border: '1px solid rgba(22, 101, 52, 0.2)'
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'rgba(22, 101, 52, 0.1)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-success)' }}>
                  check_circle
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: 'var(--color-success)' }}>
                  {fileName}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                  업로드 준비 완료
                </p>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div
              className="animate-float-in flex items-center gap-3 rounded-xl p-4"
              style={{
                background: 'var(--color-error-bg)',
                border: '1px solid rgba(185, 28, 28, 0.2)'
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'rgba(185, 28, 28, 0.1)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-error)' }}>
                  error
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-error)' }}>
                {error}
              </p>
            </div>
          )}

          {/* 저장 버튼 */}
          <button
            onClick={onSave}
            disabled={!fileName || isUploading}
            className="focus-ring btn-lift flex w-full items-center justify-center gap-3 rounded-xl px-6 py-4 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: fileName && !isUploading
                ? 'var(--color-primary)'
                : 'var(--color-cream-dark)',
              color: fileName && !isUploading
                ? 'white'
                : 'var(--color-ink-muted)'
            }}
          >
            {isUploading ? (
              <>
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                업로드 중...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check</span>
                문서 저장
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
