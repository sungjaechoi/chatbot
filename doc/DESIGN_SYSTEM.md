# Design System Specification

> Document Chat 애플리케이션의 디자인 시스템 가이드

## 개요

**컨셉**: Editorial Luxury
**특징**: 고급 잡지 느낌의 정제된 타이포그래피, 깊이감 있는 레이어, 절제된 색상 팔레트

---

## 테마 시스템

### 테마 전환 방식

시스템 설정 자동 추종 (`prefers-color-scheme` 미디어 쿼리)

```css
/* 라이트모드 (기본) */
:root { ... }

/* 다크모드 (시스템 설정 감지) */
@media (prefers-color-scheme: dark) {
  :root { ... }
}
```

| 사용자 시스템 설정 | 적용 테마 |
|------------------|----------|
| 라이트모드        | 라이트    |
| 다크모드          | 다크      |

---

## 색상 팔레트

### 기본 색상 (Ink & Cream)

| 변수명 | 라이트모드 | 다크모드 | 용도 |
|-------|-----------|---------|------|
| `--color-ink` | `#1a1f2e` | `#f0eeea` | 주요 텍스트 |
| `--color-ink-light` | `#2d3548` | `#d1cdc4` | 보조 텍스트 |
| `--color-ink-muted` | `#6b7280` | `#8b8680` | 비활성/힌트 텍스트 |
| `--color-cream` | `#faf9f7` | `#0f1118` | 페이지 배경 |
| `--color-cream-dark` | `#f0eeea` | `#1a1f2e` | 섹션 배경 |
| `--color-paper` | `#ffffff` | `#161b26` | 카드/모달 배경 |

### 악센트 색상 (Slate Blue)

| 변수명 | 값 | 용도 |
|-------|---|------|
| `--color-accent` | `#5b7a9d` | 주요 악센트 (버튼, 강조) |
| `--color-accent-soft` | `#7a9bbf` | 그라디언트 끝점 |
| `--color-accent-glow` | `rgba(91, 122, 157, 0.15)` | 글로우/배경 효과 |

### 채팅 메시지 색상

| 변수명 | 라이트모드 | 다크모드 | 용도 |
|-------|-----------|---------|------|
| `--color-ai-bg` | `#f8f6f3` | `#1e2330` | AI 메시지 배경 |
| `--color-ai-border` | `#e8e4de` | `#2d3548` | AI 메시지 테두리 |
| `--color-user-bg` | `#1a1f2e` | `#5b7a9d` | 사용자 메시지 배경 |
| `--color-user-text` | `#faf9f7` | `#0f1118` | 사용자 메시지 텍스트 |

### 시멘틱 색상

| 변수명 | 값 | 용도 |
|-------|---|------|
| `--color-error` | `#b91c1c` | 에러 텍스트/아이콘 |
| `--color-error-bg` | `#fef2f2` | 에러 배경 |
| `--color-success` | `#166534` | 성공 텍스트/아이콘 |
| `--color-success-bg` | `#f0fdf4` | 성공 배경 |

---

## 타이포그래피

### 폰트 패밀리

```css
--font-display: var(--font-sans), system-ui, sans-serif;  /* Pretendard */
--font-body: var(--font-sans), system-ui, sans-serif;     /* Pretendard */
```

- **폰트**: Pretendard Variable (100-900 weight)
- **로드**: `next/font/local`로 최적화 로딩

### 제목 스타일

```css
h1, h2, h3 {
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
}
```

### 본문 스타일

```css
body {
  line-height: 1.6;
}
```

---

## 그림자 시스템

### 라이트모드

| 변수명 | 값 | 용도 |
|-------|---|------|
| `--shadow-sm` | `0 1px 2px rgba(26, 31, 46, 0.04)` | 미세한 깊이감 |
| `--shadow-md` | `0 4px 12px rgba(26, 31, 46, 0.08)` | 호버 상태, 작은 카드 |
| `--shadow-lg` | `0 8px 30px rgba(26, 31, 46, 0.12)` | 모달, 드롭다운 |
| `--shadow-xl` | `0 20px 50px rgba(26, 31, 46, 0.15)` | 대형 카드, 오버레이 |
| `--shadow-float` | `0 10px 40px rgba(26, 31, 46, 0.1), 0 2px 10px rgba(26, 31, 46, 0.05)` | 떠있는 느낌 (메시지 버블) |

### 다크모드

| 변수명 | 값 |
|-------|---|
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.2)` |
| `--shadow-md` | `0 4px 12px rgba(0, 0, 0, 0.3)` |
| `--shadow-lg` | `0 8px 30px rgba(0, 0, 0, 0.4)` |
| `--shadow-xl` | `0 20px 50px rgba(0, 0, 0, 0.5)` |
| `--shadow-float` | `0 10px 40px rgba(0, 0, 0, 0.3), 0 2px 10px rgba(0, 0, 0, 0.2)` |

---

## 레이아웃 토큰

### Border Radius

| 변수명 | 값 | 용도 |
|-------|---|------|
| `--radius-sm` | `8px` | 작은 요소 (뱃지, 태그) |
| `--radius-md` | `12px` | 버튼, 입력 필드 |
| `--radius-lg` | `20px` | 카드, 메시지 버블 |
| `--radius-xl` | `28px` | 대형 카드, 모달 |

### Spacing

| 변수명 | 값 | 용도 |
|-------|---|------|
| `--space-xs` | `4px` | 아이콘-텍스트 간격 |
| `--space-sm` | `8px` | 요소 내부 간격 |
| `--space-md` | `16px` | 기본 간격 |
| `--space-lg` | `24px` | 섹션 내부 간격 |
| `--space-xl` | `40px` | 섹션 간 간격 |
| `--space-2xl` | `64px` | 대형 여백 |

---

## 트랜지션

| 변수명 | 값 | 용도 |
|-------|---|------|
| `--transition-fast` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` | 호버, 포커스 |
| `--transition-base` | `250ms cubic-bezier(0.4, 0, 0.2, 1)` | 일반 상태 변경 |
| `--transition-slow` | `400ms cubic-bezier(0.4, 0, 0.2, 1)` | 페이지 전환, 모달 |

---

## 애니메이션

### float-in

요소가 아래에서 위로 떠오르며 등장

```css
@keyframes float-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-float-in {
  animation: float-in 0.4s var(--transition-slow) forwards;
}
```

**사용처**: 메시지 버블, 카드 리스트 아이템

### fade-in

단순 페이드 인

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.3s var(--transition-base) forwards;
}
```

**사용처**: 모달 배경, 오버레이

### pulse-subtle

미묘한 펄스 효과

```css
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}
```

**사용처**: 로딩 인디케이터

---

## 유틸리티 클래스

### .glass

글래스모피즘 효과

```css
.glass {
  background: rgba(255, 255, 255, 0.8);  /* 다크모드: rgba(22, 27, 38, 0.85) */
  backdrop-filter: blur(12px);
}
```

**사용처**: 헤더, 플로팅 요소

### .noise-overlay

노이즈 텍스처 오버레이

```css
.noise-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,...");
  opacity: 0.03;
  pointer-events: none;
}
```

**사용처**: 배경에 질감 추가 (선택적)

### .gradient-subtle

미묘한 그라디언트 배경

```css
.gradient-subtle {
  background: linear-gradient(
    145deg,
    var(--color-cream) 0%,
    var(--color-cream-dark) 50%,
    var(--color-cream) 100%
  );
}
```

### .focus-ring

접근성을 위한 포커스 링

```css
.focus-ring:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-cream), 0 0 0 4px var(--color-accent);
}
```

### .btn-lift

버튼 호버 시 떠오르는 효과

```css
.btn-lift:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-lift:active:not(:disabled) {
  transform: translateY(0);
}
```

---

## 컴포넌트 패턴

### 버튼

**Primary (Dark)**
```jsx
style={{
  background: 'var(--color-ink)',
  color: 'var(--color-cream)'
}}
className="focus-ring btn-lift rounded-xl px-5 py-3 font-medium"
```

**Accent (Gold Gradient)**
```jsx
style={{
  background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-soft) 100%)',
  boxShadow: '0 4px 12px var(--color-accent-glow)'
}}
```

**Secondary (Outline)**
```jsx
style={{
  background: 'var(--color-cream)',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-ai-border)'
}}
```

### 카드

```jsx
style={{
  background: 'var(--color-paper)',
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--color-ai-border)'
}}
className="rounded-3xl p-8"
```

### 메시지 버블

**사용자 메시지**
```jsx
style={{
  background: 'var(--color-user-bg)',
  color: 'var(--color-user-text)',
  boxShadow: 'var(--shadow-md)',
  borderRadius: '20px 20px 4px 20px'
}}
```

**AI 메시지**
```jsx
style={{
  background: 'var(--color-paper)',
  color: 'var(--color-ink)',
  boxShadow: 'var(--shadow-float)',
  border: '1px solid var(--color-ai-border)',
  borderRadius: '20px 20px 20px 4px'
}}
```

AI 메시지에는 좌측 블루 악센트 바 추가:
```jsx
<div style={{
  background: 'linear-gradient(to bottom, var(--color-accent), var(--color-accent-soft))'
}} className="absolute left-0 top-0 h-full w-1" />
```

---

## 배경 그라디언트

페이지 배경에 사용되는 슬레이트 블루 톤 그라디언트:

```jsx
style={{
  background: `
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 122, 157, 0.08), transparent),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(91, 122, 157, 0.05), transparent)
  `
}}
```

---

## 접근성

### 포커스 상태

모든 인터랙티브 요소에 `.focus-ring` 클래스 적용

### 키보드 네비게이션

- 모든 버튼에 `aria-label` 제공
- Tab 순서 논리적 구성
- Enter/Space 키 동작 지원

### 색상 대비

- 텍스트/배경 대비 WCAG AA 기준 충족
- 에러/성공 상태는 색상 외 아이콘으로도 표시

---

## 파일 구조

```
src/
├── app/
│   ├── globals.css          # 디자인 시스템 정의
│   └── layout.tsx           # Pretendard 폰트 로드
├── features/
│   ├── chat/
│   │   ├── ChatView.tsx     # 채팅 레이아웃
│   │   ├── MessageListView.tsx
│   │   └── MessageInputView.tsx
│   └── pdf/
│       ├── PdfUploadView.tsx
│       ├── PdfUploadModalView.tsx
│       └── CollectionListView.tsx
└── shared/
    └── components/
        └── SpinnerView.tsx  # 로딩 인디케이터
```

---

## 커스터마이징 가이드

### 악센트 색상 변경

`globals.css`에서 악센트 색상 변수 수정:

```css
:root {
  --color-accent: #your-color;
  --color-accent-soft: #your-lighter-color;
  --color-accent-glow: rgba(r, g, b, 0.15);
}
```

### 다크모드만 사용

`@media (prefers-color-scheme: dark)` 내부 값을 `:root`로 이동

### 라이트모드만 사용

`@media (prefers-color-scheme: dark)` 블록 삭제

### 수동 테마 토글 추가

1. `data-theme` 속성 기반으로 CSS 변경
2. 상태 관리로 토글 구현
3. `localStorage`에 사용자 선호 저장
