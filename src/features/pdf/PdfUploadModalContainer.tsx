'use client';

import { useState } from 'react';
import { usePdfStore } from '@/shared/stores/pdfStore';
import { useChatStore } from '@/shared/stores/chatStore';
import { PdfUploadModalView } from './PdfUploadModalView';

interface PdfUploadModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export function PdfUploadModalContainer({
  isOpen,
  onClose,
  onUploadComplete,
}: PdfUploadModalContainerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tempFileName, setTempFileName] = useState<string | null>(null);

  const {
    isUploading,
    isEmbedding,
    error,
    setPdfId,
    setPdfFileName,
    setIsUploading,
    setIsEmbedding,
    setError,
  } = usePdfStore();

  const { clearMessages } = useChatStore();

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (file: File) => {
    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      setError('파일 크기가 너무 큽니다. (최대 10MB)');
      return;
    }
    setSelectedFile(file);
    setTempFileName(file.name);
    setError(null);
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError(null);

      // 1. PDF 업로드
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadRes = await fetch('/api/pdf/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        try {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || 'PDF 업로드에 실패했습니다.');
        } catch {
          throw new Error('PDF 업로드에 실패했습니다.');
        }
      }

      const { pdfId } = await uploadRes.json();
      setPdfId(pdfId);
      setPdfFileName(selectedFile.name);

      setIsUploading(false);
      setIsEmbedding(true);

      // 2. 임베딩 저장
      const saveRes = await fetch(`/api/pdf/${pdfId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: selectedFile.name }),
      });

      if (!saveRes.ok) {
        try {
          const errorData = await saveRes.json();
          throw new Error(errorData.error || '임베딩 생성에 실패했습니다.');
        } catch {
          throw new Error('임베딩 생성에 실패했습니다.');
        }
      }

      setIsEmbedding(false);

      // 채팅 메시지 초기화
      clearMessages();

      // 모달 상태 초기화
      setSelectedFile(null);
      setTempFileName(null);

      onUploadComplete();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      setIsUploading(false);
      setIsEmbedding(false);
    }
  };

  const handleClose = () => {
    if (!isUploading && !isEmbedding) {
      setSelectedFile(null);
      setTempFileName(null);
      setError(null);
      onClose();
    }
  };

  const isLoading = isUploading || isEmbedding;

  return (
    <PdfUploadModalView
      isOpen={isOpen}
      fileName={tempFileName}
      isUploading={isLoading}
      error={error}
      onClose={handleClose}
      onFileSelect={handleFileSelect}
      onSave={handleSave}
    />
  );
}
