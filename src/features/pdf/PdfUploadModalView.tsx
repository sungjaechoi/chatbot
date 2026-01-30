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
  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    } else if (file) {
      alert('PDF 파일만 업로드 가능합니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">새로운 PDF</h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="pdf-modal-upload"
              className="block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-blue-500 hover:bg-blue-50"
            >
              <div className="space-y-2">
                <svg
                  className="mx-auto h-10 w-10 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-sm text-gray-600">
                  클릭하여 PDF 파일 선택
                </p>
              </div>
              <input
                id="pdf-modal-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {fileName && (
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-900">{fileName}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={onSave}
              disabled={!fileName || isUploading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            >
              {isUploading ? '업로드 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
