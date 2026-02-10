import { useCredits } from "@/shared/hooks/useCredits";
import type { CollectionInfo } from "@/shared/types";
import type { User } from "@supabase/supabase-js";

interface CollectionListViewProps {
  collections: CollectionInfo[];
  onSelectCollection: (collection: CollectionInfo) => void;
  onDeleteCollection: (pdfId: string) => void;
  onNewPdf: () => void;
  isDeletingPdf: boolean;
  user?: User | null;
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
}

export function CollectionListView({
  collections,
  onSelectCollection,
  onDeleteCollection,
  onNewPdf,
  isDeletingPdf,
  user,
  onSignOut,
  onDeleteAccount,
}: CollectionListViewProps) {
  const { balance, isLoading: isLoadingCredits } = useCredits();

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
    <div
      className="relative flex min-h-screen items-center justify-center p-6"
      style={{ background: "var(--color-cream)" }}
    >
      {/* 배경 그라디언트 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 122, 157, 0.08), transparent),
            radial-gradient(ellipse 60% 40% at 100% 100%, rgba(91, 122, 157, 0.05), transparent)
          `,
        }}
      />

      <div
        className="relative w-full max-w-2xl rounded-3xl px-10 py-12 sm:px-12 sm:py-14"
        style={{
          background: "var(--color-paper)",
          boxShadow: "var(--shadow-xl)",
          border: "1px solid var(--color-ai-border)",
        }}
      >
        {/* 헤더 섹션 */}
        <div className="mb-10">
          {/* 유저 정보 + 타이틀 */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-soft) 100%)",
                  boxShadow: "0 4px 12px var(--color-accent-glow)",
                }}
              >
                <svg
                  className="h-5 w-5 text-white"
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
              <div>
                <h1
                  className="text-2xl tracking-tight"
                  style={{ color: "var(--color-ink)" }}
                >
                  내 문서
                </h1>
                <p
                  className="mt-1 text-xs tracking-wide"
                  style={{ color: "var(--color-ink-muted)" }}
                >
                  {isLoadingCredits ? (
                    <span
                      className="inline-block h-3.5 w-16 animate-pulse rounded"
                      style={{ background: "var(--color-cream-dark)" }}
                    />
                  ) : balance !== null ? (
                    <>
                      대화를 시작할 문서를 선택하세요 · 잔액 $
                      {balance.toFixed(2)}
                    </>
                  ) : (
                    <>대화를 시작할 문서를 선택하세요</>
                  )}
                </p>
              </div>
            </div>

            {/* 유저 프로필 */}
            {user && (
              <div className="flex items-center gap-2.5 pt-1">
                <span
                  className="hidden text-xs sm:block"
                  style={{ color: "var(--color-ink-muted)" }}
                >
                  {user.user_metadata?.full_name || user.email}
                </span>
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="프로필"
                    className="h-7 w-7 rounded-full"
                    style={{
                      outline: "2px solid var(--color-ai-border)",
                      outlineOffset: "1px",
                    }}
                    referrerPolicy="no-referrer"
                  />
                )}
                {onDeleteAccount && (
                  <button
                    onClick={onDeleteAccount}
                    className="focus-ring rounded-lg px-2.5 py-1 text-xs transition-colors"
                    style={{
                      color: "var(--color-ink-muted)",
                      border: "1px solid var(--color-ai-border)",
                    }}
                    aria-label="회원 탈퇴"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                      />
                    </svg>
                  </button>
                )}
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="focus-ring rounded-lg px-2.5 py-1 text-xs transition-colors"
                    style={{
                      color: "var(--color-ink-muted)",
                      border: "1px solid var(--color-ai-border)",
                    }}
                  >
                    로그아웃
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div
            className="mt-6"
            style={{ borderTop: "1px solid var(--color-ai-border)" }}
          />
        </div>

        {/* 컬렉션 리스트 */}
        <div className="space-y-4">
          {collections.map((collection, index) => (
            <div
              key={collection.pdfId}
              className="animate-float-in group relative"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className="relative flex w-full items-stretch overflow-hidden rounded-2xl transition-all duration-200"
                style={{
                  background: "var(--color-cream)",
                  border: "1px solid var(--color-ai-border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--color-accent-soft)";
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-ai-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* 좌측 악센트 바 */}
                <div
                  className="w-1 shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(to bottom, var(--color-accent), var(--color-accent-soft))",
                  }}
                />

                {/* 메인 버튼 영역 */}
                <button
                  onClick={() => onSelectCollection(collection)}
                  disabled={isDeletingPdf}
                  className="focus-ring relative flex flex-1 items-center gap-4 p-5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`${collection.fileName} 선택`}
                >
                  {/* PDF 아이콘 */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: "var(--color-accent-glow)",
                    }}
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      style={{ color: "var(--color-accent)" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                  </div>

                  {/* 문서 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="truncate font-medium"
                      style={{ color: "var(--color-ink)" }}
                    >
                      {collection.fileName}
                    </h3>
                    <div
                      className="mt-1 flex items-center gap-3 text-xs"
                      style={{ color: "var(--color-ink-muted)" }}
                    >
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                          />
                        </svg>
                        {collection.documentCount}개 청크
                      </span>
                      {collection.createdAt && (
                        <span>
                          {new Date(collection.createdAt).toLocaleDateString(
                            "ko-KR",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 화살표 아이콘 */}
                  <svg
                    className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    style={{ color: "var(--color-ink-muted)" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>

                {/* 삭제 버튼 */}
                <button
                  onClick={(e) =>
                    handleDelete(e, collection.pdfId, collection.fileName)
                  }
                  disabled={isDeletingPdf}
                  className="focus-ring flex shrink-0 items-center justify-center px-4 opacity-0 transition-all duration-200 group-hover:opacity-100 disabled:cursor-not-allowed"
                  style={{ color: "var(--color-ink-muted)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--color-error)";
                    e.currentTarget.style.background = "var(--color-error-bg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-ink-muted)";
                    e.currentTarget.style.background = "transparent";
                  }}
                  aria-label={`${collection.fileName} 삭제`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 새 PDF 업로드 버튼 */}
        <div
          className="mt-8 border-t pt-8"
          style={{ borderColor: "var(--color-ai-border)" }}
        >
          <button
            onClick={onNewPdf}
            className="focus-ring btn-lift flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 font-medium transition-all"
            style={{
              background: "var(--color-ink)",
              color: "var(--color-cream)",
            }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            새 문서 업로드
          </button>
        </div>
      </div>
    </div>
  );
}
