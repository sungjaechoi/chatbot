import type { CollectionInfo } from "@/shared/types";

interface CollectionListViewProps {
  collections: CollectionInfo[];
  onSelectCollection: (collection: CollectionInfo) => void;
  onDeleteCollection: (pdfId: string) => void;
  onNewPdf: () => void;
  isDeletingPdf: boolean;
}

export function CollectionListView({
  collections,
  onSelectCollection,
  onDeleteCollection,
  onNewPdf,
  isDeletingPdf,
}: CollectionListViewProps) {
  const handleDelete = async (
    e: React.MouseEvent,
    pdfId: string,
    fileName: string,
  ) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      `"${fileName}" 파일을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
    );

    if (confirmed) {
      onDeleteCollection(pdfId);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          저장된 PDF 선택
        </h1>
        <p className="mb-6 text-gray-600">
          채팅을 시작할 PDF를 선택하거나 새로운 PDF를 업로드하세요
        </p>

        <div className="space-y-3">
          {collections.map((collection) => (
            <div
              key={collection.pdfId}
              className="group relative flex w-full items-stretch rounded-lg border border-gray-200 bg-white transition-all hover:border-blue-500 hover:bg-gray-50 hover:shadow-md"
            >
              {/* 컬렉션 선택 버튼 - 주요 클릭 영역 */}
              <button
                onClick={() => onSelectCollection(collection)}
                disabled={isDeletingPdf}
                className="relative flex-1 cursor-pointer rounded-l-lg p-4 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`${collection.fileName} 선택`}
              >
                <h3 className="font-semibold text-gray-900">
                  {collection.fileName}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  문서 개수: {collection.documentCount}개
                </p>
                {collection.createdAt && (
                  <p className="mt-1 text-xs text-gray-400">
                    생성일:{" "}
                    {new Date(collection.createdAt).toLocaleDateString(
                      "ko-KR",
                    )}
                  </p>
                )}
                {/* 화살표 아이콘 - 클릭 가능성 시각적 힌트 */}
                <svg
                  className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-hover:text-blue-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* 삭제 버튼 - 우측 끝, hover 시 표시 */}
              <button
                onClick={(e) =>
                  handleDelete(e, collection.pdfId, collection.fileName)
                }
                disabled={isDeletingPdf}
                className="min-h-[44px] min-w-[44px] shrink-0 rounded-r-lg px-5 text-gray-400 opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 group-hover:opacity-100"
                aria-label={`${collection.fileName} 삭제`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <button
            onClick={onNewPdf}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            새 PDF 업로드
          </button>
        </div>
      </div>
    </div>
  );
}
