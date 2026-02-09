'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePdfStore } from '@/shared/stores/pdfStore';
import { useAuth } from '@/shared/hooks/useAuth';
import { createClient } from '@/shared/lib/supabase/client';
import { PdfUploadView } from './PdfUploadView';

interface PdfUploadContainerProps {
  onUploadComplete: () => void | Promise<void>;
}

export function PdfUploadContainer({ onUploadComplete }: PdfUploadContainerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();
  const {
    pdfFileName,
    isUploading,
    isEmbedding,
    error,
    setPdfId,
    setPdfFileName,
    setIsUploading,
    setIsEmbedding,
    setError,
  } = usePdfStore();

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError('파일 크기가 너무 큽니다. (최대 10MB)');
      return;
    }
    setSelectedFile(file);
    setPdfFileName(file.name);
    setError(null);
  };

  const handleSave = async () => {
    if (!selectedFile || !user) return;

    try {
      setIsUploading(true);
      setError(null);

      const pdfId = uuidv4();
      const storagePath = `${user.id}/${pdfId}.pdf`;

      // 1. Supabase Storage에 직접 업로드
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(storagePath, selectedFile, {
          contentType: 'application/pdf',
        });

      if (uploadError) {
        throw new Error(`Storage 업로드 실패: ${uploadError.message}`);
      }

      // 2. 서버에 메타데이터 전송
      const uploadRes = await fetch('/api/pdf/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfId, fileName: selectedFile.name, storagePath }),
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'PDF 업로드에 실패했습니다.');
      }

      setPdfId(pdfId);

      setIsUploading(false);
      setIsEmbedding(true);

      // 3. 임베딩 저장
      const saveRes = await fetch(`/api/pdf/${pdfId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: selectedFile.name, storagePath }),
      });

      if (!saveRes.ok) {
        const errorData = await saveRes.json().catch(() => ({}));
        throw new Error(errorData.error || '임베딩 생성에 실패했습니다.');
      }

      setIsEmbedding(false);

      if (pdfId && typeof pdfId === 'string' && pdfId.trim() !== '') {
        await onUploadComplete();
      } else {
        setError('PDF 업로드는 완료되었으나 PDF ID를 가져오는데 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      setIsUploading(false);
      setIsEmbedding(false);
    }
  };

  const isLoading = isUploading || isEmbedding;

  return (
    <PdfUploadView
      fileName={pdfFileName}
      isUploading={isLoading}
      error={error}
      onFileSelect={handleFileSelect}
      onSave={handleSave}
    />
  );
}
