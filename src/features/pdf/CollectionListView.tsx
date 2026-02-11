import { NavigationBar } from "@/shared/components/NavigationBar";
import { DocumentCard } from "@/shared/components/DocumentCard";
import type { CollectionInfo } from "@/shared/types";

interface CollectionListViewProps {
  collections: CollectionInfo[];
  onSelectCollection: (collection: CollectionInfo) => void;
  onDeleteCollection: (pdfId: string) => void;
  onNewPdf: () => void;
  isDeletingPdf: boolean;
  deletingPdfId?: string | null;
  onDeleteAccount?: () => void;
}

export function CollectionListView({
  collections,
  onSelectCollection,
  onDeleteCollection,
  onNewPdf,
  isDeletingPdf,
  deletingPdfId,
  onDeleteAccount,
}: CollectionListViewProps) {

  const handleDelete = (pdfId: string) => {
    onDeleteCollection(pdfId);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-cream)' }}>
      {/* Stitch 스타일 Sticky 네비게이션 바 */}
      <NavigationBar onDeleteAccount={onDeleteAccount} />

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-[1200px] px-6 py-12">
        {/* 헤더 */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[1.875rem] font-bold tracking-tight" style={{ color: 'var(--color-ink)' }}>
              내 문서
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-ink-muted)' }}>
              RAG 데이터베이스로 변환된 PDF 문서를 관리하세요
            </p>
          </div>

          {/* + PDF 업로드 버튼 */}
          <button
            onClick={onNewPdf}
            className="focus-ring btn-lift flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white shadow-lg transition-all"
            style={{ background: 'var(--color-primary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            PDF 업로드
          </button>
        </div>

        {/* 문서 그리드 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collections.map((collection, index) => (
            <DocumentCard
              key={collection.pdfId}
              collection={collection}
              index={index}
              onSelect={onSelectCollection}
              onDelete={handleDelete}
              isDeleting={isDeletingPdf}
              isDeletingThis={deletingPdfId === collection.pdfId}
            />
          ))}
        </div>

        {/* 푸터 */}
        <p className="mt-10 text-center text-sm" style={{ color: 'var(--color-ink-muted)' }}>
          전체 {collections.length}개 문서
        </p>
      </main>
    </div>
  );
}
