import { createAdminClient } from "./supabase/admin";
// pdf-parse의 테스트 파일 로드 버그를 피하기 위해 lib 직접 import
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

/**
 * Supabase Storage에서 PDF를 다운로드하여 페이지별로 텍스트 추출
 */
export async function loadPDFByPages(
  storagePath: string,
  fileName: string,
): Promise<{
  pages: Array<{ pageNumber: number; text: string }>;
  fileName: string;
  totalPages: number;
}> {
  try {
    const supabase = createAdminClient();

    // Supabase Storage에서 PDF 다운로드
    const { data, error } = await supabase.storage
      .from("pdfs")
      .download(storagePath);

    if (error || !data) {
      throw new Error(
        `PDF 다운로드 실패: ${error?.message || "Unknown error"}`,
      );
    }

    // Blob → Buffer 변환
    const arrayBuffer = await data.arrayBuffer();
    const dataBuffer = Buffer.from(arrayBuffer);

    // 페이지별 텍스트를 저장할 맵
    const pageTexts = new Map<number, string>();

    // pagerender 함수를 사용하여 각 페이지의 텍스트를 추출
    const pdfData = await pdfParse(dataBuffer, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pagerender: async (pageData: any) => {
        const textContent = await pageData.getTextContent();

        const pageText = textContent.items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => item.str)
          .join(" ")
          .replace(/\u0000/g, ""); // PostgreSQL이 지원하지 않는 null byte 제거

        // pageIndex는 0부터 시작하므로 +1
        const pageNumber = pageData.pageIndex + 1;
        pageTexts.set(pageNumber, pageText);

        return pageText;
      },
    });

    const totalPages = pdfData.numpages;

    // 페이지별 텍스트를 배열로 변환
    const pages: Array<{ pageNumber: number; text: string }> = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageText = pageTexts.get(pageNum);
      if (pageText && pageText.trim()) {
        pages.push({
          pageNumber: pageNum,
          text: pageText.trim(),
        });
      }
    }

    if (pages.length === 0) {
      throw new Error(
        "PDF에서 텍스트를 추출할 수 없습니다. 빈 문서이거나 이미지 기반 PDF일 수 있습니다.",
      );
    }

    return {
      pages,
      fileName,
      totalPages,
    };
  } catch (error) {
    throw new Error(
      `PDF 파일 로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Supabase Storage에서 PDF 파일 삭제
 */
export async function deletePDFFile(storagePath: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from("pdfs").remove([storagePath]);

    if (error) {
      throw new Error(`PDF 삭제 실패: ${error.message}`);
    }

    return true;
  } catch (error) {
    throw new Error(
      `PDF 파일 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
