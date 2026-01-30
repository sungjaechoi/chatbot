import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
// pdf-parse의 테스트 파일 로드 버그를 피하기 위해 lib 직접 import
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

/**
 * PDF 파일을 로드하고 전체 텍스트 반환
 * pdf-parse를 사용하여 텍스트 추출
 *
 * @deprecated 페이지 단위 처리로 전환되었습니다. loadPDFByPages()를 사용하세요.
 */
export async function loadPDFFullText(
  filePath: string,
  fileName: string
): Promise<{ fullText: string; fileName: string }> {
  try {
    // PDF 파일 읽기
    const dataBuffer = fs.readFileSync(filePath);

    // pdf-parse로 PDF 파싱
    const pdfData = await pdfParse(dataBuffer);

    const fullText = pdfData.text;

    if (!fullText || fullText.trim().length === 0) {
      throw new Error(
        "PDF에서 텍스트를 추출할 수 없습니다. 빈 문서이거나 이미지 기반 PDF일 수 있습니다."
      );
    }

    return {
      fullText: fullText.trim(),
      fileName,
    };
  } catch (error) {
    throw new Error(
      `PDF 파일 로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * PDF 파일을 페이지별로 로드
 * pdf-parse의 pagerender 옵션을 사용하여 페이지별 텍스트 추출
 */
export async function loadPDFByPages(
  filePath: string,
  fileName: string
): Promise<{
  pages: Array<{ pageNumber: number; text: string }>;
  fileName: string;
  totalPages: number;
}> {
  try {
    // PDF 파일 읽기
    const dataBuffer = fs.readFileSync(filePath);

    // 페이지별 텍스트를 저장할 맵
    const pageTexts = new Map<number, string>();

    // pagerender 함수를 사용하여 각 페이지의 텍스트를 추출
    const pdfData = await pdfParse(dataBuffer, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pagerender: async (pageData: any) => {
        const textContent = await pageData.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageText = textContent.items.map((item: any) => item.str).join(' ');

        // pageIndex는 0부터 시작하므로 +1
        const pageNumber = pageData.pageIndex + 1;
        pageTexts.set(pageNumber, pageText);

        return pageText;
      }
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
        "PDF에서 텍스트를 추출할 수 없습니다. 빈 문서이거나 이미지 기반 PDF일 수 있습니다."
      );
    }

    return {
      pages,
      fileName,
      totalPages,
    };
  } catch (error) {
    throw new Error(
      `PDF 파일 로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 임시 업로드 디렉토리 생성
 */
export function ensureUploadDir(): string {
  const uploadDir = process.env.UPLOAD_DIR || "/tmp/pdf-uploads";

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return uploadDir;
}

/**
 * PDF 파일 저장
 */
export function savePDFFile(
  buffer: Buffer,
  originalFileName: string,
): { pdfId: string; filePath: string; fileName: string } {
  const pdfId = uuidv4();
  const uploadDir = ensureUploadDir();
  const ext = path.extname(originalFileName);
  const fileName = `${pdfId}${ext}`;
  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, buffer);

  return {
    pdfId,
    filePath,
    fileName: originalFileName,
  };
}

/**
 * PDF 파일 존재 여부 확인
 */
export function pdfFileExists(pdfId: string): {
  exists: boolean;
  filePath?: string;
} {
  const uploadDir = process.env.UPLOAD_DIR || "/tmp/pdf-uploads";

  if (!fs.existsSync(uploadDir)) {
    return { exists: false };
  }

  const files = fs.readdirSync(uploadDir);
  const pdfFile = files.find((file) => file.startsWith(pdfId));

  if (pdfFile) {
    return {
      exists: true,
      filePath: path.join(uploadDir, pdfFile),
    };
  }

  return { exists: false };
}

/**
 * PDF 파일 삭제
 */
export function deletePDFFile(pdfId: string): boolean {
  try {
    const { exists, filePath } = pdfFileExists(pdfId);

    if (!exists || !filePath) {
      return false;
    }

    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    throw new Error(
      `PDF 파일 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
