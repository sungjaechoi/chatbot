# Google Stitch UI/UX 생성 프롬프트 양식

> **프로젝트**: PDF RAG Chatbot
> **플랫폼**: stitch.withgoogle.com
> **Tech Stack**: Next.js 15 / React 19 / Tailwind CSS 4 / Supabase / Gemini 2.5 Flash

---

## 공통 디자인 컨텍스트 (모든 프롬프트 앞에 붙여 사용)

```
Product Context:
A PDF-based RAG (Retrieval-Augmented Generation) chatbot web application.
Users upload PDF documents, and an AI assistant answers questions about the content
using semantic vector search. The app supports multi-session conversations per PDF,
dark/light theme, and user authentication.

Target Users: Knowledge workers, researchers, students who need to quickly
extract and understand information from PDF documents.

Brand Identity:
- Style: Editorial Luxury, clean and minimal
- Primary Color: Deep navy ink (#1a1f2e)
- Accent Color: Slate blue (#5b7a9d)
- Background (Light): Cream (#faf9f7)
- Background (Dark): Dark navy (#0f1118)
- AI Message Tone: Warm cream (#f8f6f3)
- User Message: Deep navy background with white text
- Font: Pretendard (Korean-optimized sans-serif, variable weight 100-900)
- Border Radius: 12px (cards), 8px (buttons), 24px (chat bubbles)
- Grid: 8pt spacing system
- Shadow: 4-level system (sm/md/lg/xl)
```

---

## 1. 홈페이지 (PDF 컬렉션 목록)

### Web 버전

```
[공통 디자인 컨텍스트 삽입]

Screen: Homepage / PDF Collection Dashboard (Web)
Platform: Web (desktop-first, responsive)

Goal: Display the user's uploaded PDF document collection and provide
quick access to start chatting with any document.

Layout & Hierarchy:
- Sticky top navigation bar with:
  - App logo (left)
  - Theme toggle button (light/dark switch, right)
  - User avatar with dropdown menu (right)
- Main content area (centered, max-width 1200px):
  - Page title "내 문서" with document count badge
  - "PDF 업로드" primary action button (top-right of content area)
  - Grid layout (3 columns desktop, 2 tablet, 1 mobile) of PDF document cards
- Each PDF card includes:
  - PDF icon or thumbnail
  - Document title (truncated to 2 lines)
  - Upload date
  - Page count / chunk count indicator
  - "채팅 시작" button
  - Delete icon button (top-right corner of card)

Visual Direction: Clean, minimal, editorial luxury feel.
Use cream background (#faf9f7) with subtle card shadows.
Cards should have white background with 12px border-radius.

Constraints:
- Must support dark mode (dark navy #0f1118 background, dark card surfaces)
- Korean text support required (Pretendard font)
- Empty state: Show illustration with "PDF를 업로드하여 AI와 대화를 시작하세요" message
- Loading state: Skeleton card placeholders

Output: Generate both light and dark mode variants.
```

### Mobile 버전

```
[공통 디자인 컨텍스트 삽입]

Screen: Homepage / PDF Collection (Mobile)
Platform: Mobile (iOS/Android style, 390px width)

Goal: Mobile-optimized PDF document list with easy upload access.

Layout & Hierarchy:
- Top app bar with hamburger menu, app title, theme toggle
- Floating action button (FAB) at bottom-right for PDF upload
- Vertical scrolling list of PDF document cards (single column)
- Each card: PDF icon, title, date, page count, tap to open chat
- Pull-to-refresh gesture indicator
- Bottom navigation: 홈 | 문서 | 설정

Visual Direction: Material Design 3 inspired, clean and spacious.
Use 16px horizontal padding, 12px card gaps.

Constraints: One-hand usage, thumb-friendly tap targets (min 44px),
accessible text sizes (min 14px body text).
```

---

## 2. 로그인 / 회원가입 페이지

### Web 버전

```
[공통 디자인 컨텍스트 삽입]

Screen: Login / Authentication Page (Web)
Platform: Web (centered layout)

Goal: Simple, trustworthy authentication page supporting
Google OAuth and email/password login.

Layout & Hierarchy:
- Split layout (2 columns on desktop):
  - Left side: Hero illustration or brand imagery with tagline
    "PDF 문서와 AI 대화를 시작하세요"
  - Right side: Login form card (centered vertically)
- Login form includes:
  - App logo at top
  - "로그인" heading
  - Google OAuth button (full-width, with Google icon)
  - Divider with "또는" text
  - Email input field with label
  - Password input field with label and show/hide toggle
  - "비밀번호 찾기" link (right-aligned)
  - "로그인" primary submit button (full-width)
  - "계정이 없으신가요? 회원가입" link at bottom
- Form card: white background, subtle shadow, 24px padding, 12px radius

Visual Direction: Professional, minimal, trust-inspiring.
Deep navy primary button with white text.
Cream (#faf9f7) page background.

Constraints:
- Form validation states (error borders in red #b91c1c, success in green #166534)
- Loading spinner on submit button
- Responsive: single column on mobile (form only, no hero)
```

### Mobile 버전

```
[공통 디자인 컨텍스트 삽입]

Screen: Login Page (Mobile)
Platform: Mobile (390px width)

Goal: Streamlined mobile login with prominent Google OAuth.

Layout:
- Full-screen centered layout
- App logo and name at top (with subtle animation feel)
- "PDF와 대화하세요" subtitle
- Google 로그인 button (prominent, full-width)
- Divider "또는 이메일로 로그인"
- Email & Password fields
- 로그인 button
- 회원가입 link at bottom
- Keyboard-aware: form scrolls up when keyboard appears

Visual Direction: Clean, spacious, large touch targets.
Soft cream background with deep navy accents.
```

---

## 3. 채팅 인터페이스 (핵심 화면)

### Web 버전

```
[공통 디자인 컨텍스트 삽입]

Screen: Chat Interface with PDF (Web)
Platform: Web (desktop, full-height layout)

Goal: The main chat interface where users converse with an AI about
their uploaded PDF document. This is the core experience of the app.

Layout & Hierarchy:
- Left sidebar (280px, collapsible):
  - PDF document title at top with back arrow
  - "새 대화" button (create new session)
  - Scrollable list of chat sessions:
    - Each session: title, last message timestamp
    - Active session highlighted with accent color
    - Hover: show rename/delete icons
    - Sessions sorted by most recent
  - Collapse toggle button at sidebar edge

- Main chat area (remaining width):
  - Top bar:
    - Current session title (editable on click)
    - Token/credit usage indicator (right)
    - Theme toggle (right)
  - Message list (scrollable, vertically centered when few messages):
    - User messages: right-aligned, deep navy (#1a1f2e) background,
      white text, 24px border-radius, max-width 70%
    - AI messages: left-aligned, warm cream (#f8f6f3) background,
      dark text, 24px border-radius, max-width 80%
    - AI messages include:
      - Markdown-rendered text (headers, lists, code blocks, bold/italic)
      - Source attribution badges (page numbers from PDF)
      - Copy button on hover
    - Typing indicator: 3 animated dots in AI bubble
    - Timestamp on hover for each message
  - Input area (sticky bottom):
    - Multi-line text input with placeholder "PDF에 대해 질문하세요..."
    - Send button (deep navy, arrow icon) - disabled when empty
    - Character/token count indicator
    - Shift+Enter for new line hint text

- Empty state (no messages yet):
  - Centered illustration
  - "이 PDF에 대해 무엇이든 물어보세요" heading
  - 3-4 suggested question chips/buttons

Visual Direction: Clean conversation UI similar to ChatGPT/Claude.
Generous whitespace, clear visual distinction between user and AI messages.
Smooth scrolling with auto-scroll to latest message.

Constraints:
- Must support dark mode:
  - AI messages: dark surface (#1e2330)
  - User messages: slate blue (#5b7a9d)
  - Input area: dark surface with lighter border
- Code blocks in AI responses: syntax-highlighted, dark theme
- Long messages: smooth expand/collapse
- Mobile responsive: sidebar becomes drawer overlay
```

### Mobile 버전

```
[공통 디자인 컨텍스트 삽입]

Screen: Chat Interface (Mobile)
Platform: Mobile (390px width, full-screen)

Goal: Full-screen mobile chat optimized for one-hand use.

Layout:
- Top bar:
  - Back arrow (left) → returns to home
  - Session title (center, truncated)
  - Menu icon (right) → opens session list drawer
- Message list (full width, edge-to-edge bubbles with 16px padding):
  - User bubbles: right-aligned, navy background, 85% max-width
  - AI bubbles: left-aligned, cream background, 90% max-width
  - Source badges inline below AI messages
- Bottom input bar (safe-area aware):
  - Expandable text input (grows up to 4 lines)
  - Send button (circular, navy)
  - Keyboard push-up behavior

- Swipe right: opens session sidebar drawer (overlay)
- Pull down: shows session title with option to rename

Visual Direction: Native-feeling chat app (iMessage/KakaoTalk inspired).
Smooth animations, haptic-ready design.

Constraints:
- Safe area insets for notch/home indicator
- Thumb-friendly: send button near bottom-right
- Keyboard avoidance for input area
```

---

## 4. PDF 업로드 모달

### Web 버전

```
[공통 디자인 컨텍스트 삽입]

Screen: PDF Upload Modal (Web)
Platform: Web (overlay modal)

Goal: Allow users to upload a PDF file, see upload progress,
and trigger the embedding/processing pipeline.

Layout & Hierarchy:
- Modal overlay (backdrop blur, centered)
- Modal card (max-width 520px):
  - Header: "PDF 업로드" title with close (X) button
  - Drag & drop zone:
    - Dashed border area (200px height)
    - Cloud upload icon (centered)
    - "PDF 파일을 드래그하거나 클릭하여 선택하세요" text
    - "최대 50MB, PDF 형식만 지원" sub-text
    - Active state: blue border highlight on drag-over
  - Selected file info:
    - PDF icon + filename + file size
    - Remove (X) button
  - Progress states:
    - Upload progress bar (0-100%) with percentage text
    - "임베딩 처리 중..." with spinner (after upload)
    - "완료! 채팅을 시작하세요" success state with checkmark
  - Action buttons:
    - "취소" secondary button (left)
    - "업로드" primary button (right, disabled until file selected)
    - After success: "채팅 시작" primary button

Visual Direction: Clean, minimal modal. White card on blurred backdrop.
Progress bar uses slate blue (#5b7a9d) accent color.

Constraints:
- File validation: PDF only, max 50MB
- Error state: red border, error message below drop zone
- Cannot close modal during upload/processing
- Dark mode: dark card surface, lighter drop zone border
```

### Mobile 버전

```
[공통 디자인 컨텍스트 삽입]

Screen: PDF Upload (Mobile)
Platform: Mobile (bottom sheet style)

Goal: Mobile-friendly PDF upload experience.

Layout:
- Bottom sheet (slides up from bottom, 80% screen height):
  - Drag handle bar at top
  - "PDF 업로드" title
  - Large tap area for file selection (no drag-drop on mobile)
  - Native file picker integration button
  - Selected file preview with remove option
  - Upload progress bar
  - Processing status with spinner
  - Action buttons at bottom (safe area aware)

Visual Direction: iOS-style bottom sheet with smooth spring animation.
```

---

## 5. 설정 / 프로필 페이지

### Web 버전

```
[공통 디자인 컨텍스트 삽입]

Screen: Settings / Profile Page (Web)
Platform: Web

Goal: User profile management, theme preferences, and account settings.

Layout & Hierarchy:
- Top navigation (same as homepage)
- Centered content card (max-width 680px):
  - Section 1: 프로필
    - User avatar (editable)
    - Display name
    - Email (read-only, greyed out)
    - "프로필 수정" button
  - Section 2: 환경설정
    - Theme toggle (라이트/다크/시스템)
    - Language selector (한국어/English)
  - Section 3: 사용량
    - Token usage progress bar
    - "이번 달 사용량: 1,234 / 10,000 토큰"
    - Usage history chart (simple line chart, last 7 days)
  - Section 4: 계정
    - "비밀번호 변경" button
    - "로그아웃" button (outlined, red)
    - "계정 삭제" text link (subtle, red)
  - Sections separated by thin divider lines

Visual Direction: Clean settings page, organized sections.
Cream background, white section cards with subtle shadows.
```

---

## 6. 온보딩 / 첫 방문 화면

```
[공통 디자인 컨텍스트 삽입]

Screen: Onboarding / Welcome Flow (Web + Mobile)
Platform: Web (also generate mobile variant)

Goal: Guide first-time users through the app's value proposition
and how to get started.

Layout (Multi-step carousel):
- Step 1: "PDF를 업로드하세요"
  - Illustration: document being uploaded
  - Description text explaining the upload feature
- Step 2: "AI가 문서를 분석합니다"
  - Illustration: AI processing/analyzing document
  - Description of the embedding and vector search process (simple terms)
- Step 3: "질문하고 답변받으세요"
  - Illustration: chat interface with AI response
  - Description of the chat experience with source citations
- Navigation:
  - Dot indicators (3 dots)
  - "다음" / "이전" buttons
  - "건너뛰기" link (top-right)
  - Final step: "시작하기" primary CTA button

Visual Direction: Friendly, welcoming illustrations.
Cream background, navy accent for buttons and dots.
Large, readable Korean text.

Constraints:
- Swipe gesture support on mobile
- Auto-advance option with 5-second timer
- Can be dismissed and never shown again
```

---

## 7. 에러 / 빈 상태 페이지

```
[공통 디자인 컨텍스트 삽입]

Screen: Error & Empty States Collection (Web + Mobile)
Platform: Web (also generate mobile variants)

Goal: Design friendly, helpful error and empty states.

Generate the following states:

1. 404 Page Not Found:
   - Playful illustration
   - "페이지를 찾을 수 없습니다" heading
   - "홈으로 돌아가기" button

2. Network Error:
   - Disconnected illustration
   - "연결에 문제가 있습니다" heading
   - "다시 시도" button

3. Empty PDF Collection:
   - Illustration of empty folder/documents
   - "아직 업로드된 문서가 없습니다" heading
   - "첫 번째 PDF를 업로드하세요" sub-text
   - "PDF 업로드" primary CTA button

4. Empty Chat (no messages):
   - Friendly AI avatar/illustration
   - "이 문서에 대해 무엇이든 물어보세요" heading
   - 3-4 suggested question chips:
     - "이 문서의 핵심 내용은?"
     - "주요 결론을 요약해줘"
     - "이 문서에서 중요한 수치는?"

Visual Direction: Warm, friendly, not intimidating.
Use subtle illustrations with cream/navy color palette.
Each state should feel helpful, not like a dead end.
```

---

## 프롬프트 사용 가이드

### Google Stitch에서 사용하는 방법

1. **stitch.withgoogle.com** 접속 후 Google 계정으로 로그인
2. **Standard Mode** (빠른 초안) 또는 **Experimental Mode** (고품질) 선택
3. 위 프롬프트 중 원하는 화면의 `공통 디자인 컨텍스트` + `화면별 프롬프트`를 복사하여 입력
4. 생성된 결과에서 마음에 드는 변형을 선택
5. 채팅박스를 통해 세부 수정 요청 (예: "네비게이션 바를 더 작게", "버튼 색상 변경")
6. **Export** 옵션:
   - Figma로 복사 (디자인 작업 계속)
   - HTML/Tailwind CSS 내보내기 (개발 적용)
   - JSX 코드 내보내기 (React 프로젝트에 바로 적용)

### 수정 프롬프트 예시

```
Follow-up 1: "사이드바의 너비를 240px로 줄이고, 세션 목록 아이템의 간격을 더 촘촘하게 해줘"
Follow-up 2: "AI 메시지 버블에 소스 출처 뱃지를 추가해줘. '[p.3]' 형태로 페이지 번호를 표시"
Follow-up 3: "다크 모드 변형을 생성해줘. 배경은 #0f1118, 카드는 #1e2030 사용"
Follow-up 4: "모바일 반응형 버전을 만들어줘. 사이드바는 햄버거 메뉴로 전환"
```

### 디자인 토큰 빠른 참조

```
Design Tokens Quick Reference:
- Grid: 8pt spacing system
- Radius: 8px (buttons), 12px (cards), 24px (chat bubbles)
- Font: Pretendard, weights 400/500/600/700
- Text sizes: 12px (caption), 14px (body-sm), 16px (body), 20px (h3), 24px (h2), 32px (h1)
- Colors:
  - Primary: #1a1f2e (navy)
  - Accent: #5b7a9d (slate blue)
  - BG Light: #faf9f7 (cream)
  - BG Dark: #0f1118
  - Surface Light: #ffffff
  - Surface Dark: #1e2030
  - AI Bubble: #f8f6f3
  - Error: #b91c1c
  - Success: #166534
  - Border Light: #e5e3df
  - Border Dark: #2a2d3a
  - Text Primary Light: #1a1f2e
  - Text Primary Dark: #e8e6e3
  - Text Secondary: #6b7280
- Shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
- Shadow-md: 0 4px 6px rgba(0,0,0,0.07)
- Shadow-lg: 0 10px 15px rgba(0,0,0,0.1)
```
