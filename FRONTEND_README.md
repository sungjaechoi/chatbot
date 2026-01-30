# PDF 기반 RAG 챗봇 프론트엔드

## 구현된 기능

### 1. 상태 관리 (Zustand)
- **PDF Store** (`/src/shared/stores/pdfStore.ts`)
  - PDF ID, 파일명 관리
  - 업로드/임베딩 로딩 상태
  - 에러 상태 관리

- **Chat Store** (`/src/shared/stores/chatStore.ts`)
  - 메시지 리스트 관리
  - 로딩 상태
  - 에러 상태 관리

### 2. UI 컴포넌트 (프리젠테이션/컨테이너 패턴)

#### PDF 업로드 관련
- **PdfUploadView.tsx**: 최초 PDF 업로드 화면 (순수 UI)
- **PdfUploadContainer.tsx**: 업로드 로직 처리
- **PdfUploadModalView.tsx**: 모달 형태의 PDF 업로드 UI
- **PdfUploadModalContainer.tsx**: 모달 로직 처리

#### 채팅 관련
- **ChatView.tsx**: 채팅 화면 레이아웃
- **ChatContainer.tsx**: 채팅 로직 처리
- **MessageListView.tsx**: 메시지 리스트 렌더링
- **MessageInputView.tsx**: 메시지 입력 UI

#### 공통 컴포넌트
- **SpinnerView.tsx**: 로딩 스피너

## 폴더 구조

```
src/
├── app/
│   └── page.tsx              # 메인 페이지 (화면 전환 로직)
├── features/
│   ├── pdf/                  # PDF 업로드 기능
│   │   ├── PdfUploadView.tsx
│   │   ├── PdfUploadContainer.tsx
│   │   ├── PdfUploadModalView.tsx
│   │   └── PdfUploadModalContainer.tsx
│   └── chat/                 # 채팅 기능
│       ├── ChatView.tsx
│       ├── ChatContainer.tsx
│       ├── MessageListView.tsx
│       └── MessageInputView.tsx
└── shared/
    ├── components/           # 공통 컴포넌트
    │   └── SpinnerView.tsx
    └── stores/               # Zustand 스토어
        ├── pdfStore.ts
        └── chatStore.ts
```

## 화면 흐름

1. **최초 진입**: PDF 업로드 화면
   - 파일 선택 버튼
   - 선택된 파일명 표시
   - 저장 버튼

2. **업로드 중**: 로딩 스피너
   - "PDF를 분석하고 있습니다..." 메시지

3. **채팅 화면**: 메인 채팅 UI
   - 헤더 (PDF 파일명 + "새로운 PDF" 버튼)
   - 메시지 리스트
   - 메시지 입력창

4. **새 PDF 업로드**: 모달 형태
   - 기존 채팅 유지
   - 새 PDF 선택 후 채팅 초기화

## API 연동

### 1. PDF 업로드
```typescript
POST /api/pdf/upload
Content-Type: multipart/form-data
Body: { file: File }

Response: { pdfId: string }
```

### 2. PDF 임베딩 저장
```typescript
POST /api/pdf/[pdfId]/save

Response: { message: string }
```

### 3. 채팅
```typescript
POST /api/chat
Content-Type: application/json
Body: { pdfId: string, message: string }

Response: { answer: string }
```

## 주요 기능

### 상태 처리
- 로딩 상태: 업로드 중, 임베딩 중, 채팅 응답 대기 중
- 에러 상태: 업로드 실패, 채팅 실패 등
- 빈 상태: 메시지 없을 때 안내 메시지

### 사용자 경험
- 입력 중 Enter로 전송 (Shift+Enter로 줄바꿈)
- 메시지 자동 스크롤
- 시간 표시 (한국 시간 기준)
- 버튼 비활성화 (조건 미충족 시)

### 접근성
- 키보드 포커스 관리
- 버튼 비활성화 상태 표시
- 로딩 중 상태 명확히 표시

## 실행 방법

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 기술 스택
- Next.js 15 (App Router)
- React 19
- TypeScript
- Zustand (상태 관리)
- Tailwind CSS (스타일링)

## 주의사항
- 모든 컴포넌트는 프리젠테이션/컨테이너 패턴을 따릅니다
- View 컴포넌트는 순수 UI만 담당 (상태 없음)
- Container 컴포넌트는 로직과 상태 관리 담당
- 'use client' 지시어는 Container 컴포넌트에만 사용
