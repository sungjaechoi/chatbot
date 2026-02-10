# Google OAuth 정식 승인 작업 가이드

> Google OAuth 로그인 연동 시 정식(프로덕션) 승인을 받기 위한 종합 작업 가이드입니다.
> 본 문서는 **필수 법적 문서, 브랜드 가이드라인, 서비스 설명, 도메인/앱 정보 일치** 등 승인 심사에 필요한 모든 항목을 체크리스트와 함께 정리합니다.

---

## 목차

1. [승인이 필요한 경우](#1-승인이-필요한-경우)
2. [전체 작업 체크리스트 (요약)](#2-전체-작업-체크리스트-요약)
3. [필수 법적 문서 준비](#3-필수-법적-문서-준비)
4. [Google 브랜드 가이드라인 준수](#4-google-브랜드-가이드라인-준수)
5. [서비스 설명 및 데이터 활용처 작성](#5-서비스-설명-및-데이터-활용처-작성)
6. [도메인 및 앱 정보 일치](#6-도메인-및-앱-정보-일치)
7. [OAuth 동의 화면 설정](#7-oauth-동의-화면-설정)
8. [데모 영상 제작 (YouTube)](#8-데모-영상-제작-youtube)
9. [제출 및 심사 프로세스](#9-제출-및-심사-프로세스)
10. [자주 발생하는 거절 사유와 대응 방법](#10-자주-발생하는-거절-사유와-대응-방법)
11. [심사 후 유지·관리 사항](#11-심사-후-유지관리-사항)
12. [공식 참고 문서 링크](#12-공식-참고-문서-링크)

---

## 1. 승인이 필요한 경우

### 승인이 필요한 앱

- **Sensitive scope**(민감한 범위)를 요청하는 앱
- **Restricted scope**(제한된 범위)를 요청하는 앱
- **외부 사용자(External)** 유형으로 설정된 앱
- 사용자 100명 이상에게 서비스를 제공하는 앱

### 승인이 필요 없는 앱

- 비민감(non-sensitive) scope만 사용하는 앱
- 개인용 앱(사용자 100명 미만)
- **내부(Internal)** 사용자 유형 전용 앱 (Google Workspace 조직 내부)

---

## 2. 전체 작업 체크리스트 (요약)

아래 체크리스트를 모두 완료한 뒤 심사를 제출하세요.

### 법적 문서

- [ ] 개인정보처리방침(Privacy Policy) 페이지 작성 및 공개
- [ ] 서비스 이용약관(Terms of Service) 페이지 작성 및 공개
- [ ] 홈페이지에서 두 문서 링크 확인 가능

### 브랜드 가이드라인

- [ ] "Sign in with Google" 공식 버튼 사용
- [ ] Google 로고/아이콘 가이드라인 준수
- [ ] 앱 이름에 Google 상표 미포함
- [ ] 앱 로고에 Google 로고 미사용

### 서비스 설명 & 데이터 활용

- [ ] 서비스 목적 및 기능 설명문 작성
- [ ] 요청 scope별 사용 용도 정당화 문서 작성
- [ ] 데이터 수집·저장·공유 방식 명시
- [ ] Google API Services User Data Policy 준수 확인

### 도메인 & 앱 정보

- [ ] Google Search Console에서 도메인 소유권 인증
- [ ] 홈페이지 URL, 개인정보처리방침 URL, 이용약관 URL의 도메인 일치
- [ ] OAuth 리다이렉트 URI와 JavaScript Origin의 도메인 일치
- [ ] 모든 URL이 HTTPS로 동작

### OAuth 동의 화면

- [ ] 사용자 유형: External로 설정
- [ ] 게시 상태: Production으로 설정
- [ ] 앱 이름, 로고, 설명 정확히 입력
- [ ] 승인된 도메인 모두 등록

### 데모 영상 (Sensitive/Restricted scope인 경우)

- [ ] 전체 OAuth 인증 흐름 녹화
- [ ] scope 사용 기능 시연
- [ ] YouTube에 "미등록(Unlisted)"으로 업로드

---

## 3. 필수 법적 문서 준비

### 3.1 개인정보처리방침 (Privacy Policy)

#### 필수 기재 항목

| 항목 | 설명 |
|------|------|
| 수집하는 데이터 종류 | Google 계정에서 가져오는 데이터 (이름, 이메일, 프로필 사진 등) |
| 데이터 사용 목적 | 각 데이터를 어떤 기능에 활용하는지 구체적으로 명시 |
| 데이터 저장 방식 및 기간 | 서버 위치, 암호화 방식, 보관 기간 |
| 데이터 공유 여부 | 제3자 제공 여부, 제공 대상, 제공 목적 |
| 사용자 권리 | 데이터 열람, 수정, 삭제 요청 방법 |
| 연락처 | 개인정보 관련 문의를 위한 이메일 또는 연락처 |
| Google API 데이터 관련 별도 조항 | Google API를 통해 받은 데이터의 제한적 사용(Limited Use) 준수 명시 |

#### 기재 예시 (Google API 데이터 관련)

```
Google API를 통해 수신한 사용자 데이터의 사용 및 다른 앱으로의 전송은
Google API Services User Data Policy
(https://developers.google.com/terms/api-services-user-data-policy)를 준수하며,
Limited Use 요구사항을 포함합니다.
```

#### 기술적 요구사항

- 공개 URL에 호스팅 (로그인 없이 누구나 접근 가능)
- 앱 홈페이지와 **동일한 도메인** 또는 인증된 하위 도메인에 배치
- 홈페이지에서 쉽게 찾을 수 있도록 링크 배치 (Footer 등)
- Google Cloud Console의 OAuth 동의 화면에 URL 등록

### 3.2 서비스 이용약관 (Terms of Service)

#### 필수 기재 항목

| 항목 | 설명 |
|------|------|
| 서비스 범위 | 앱이 제공하는 기능과 서비스의 범위 |
| 사용자 의무 | 사용자가 준수해야 할 사항 |
| 책임 제한 | 서비스 제공자의 책임 범위 |
| 계정 관리 | 계정 생성, 해지, 데이터 삭제 절차 |
| 분쟁 해결 | 분쟁 발생 시 해결 절차 및 관할 법원 |
| 약관 변경 | 약관 변경 시 사용자 통지 방법 |

#### 기술적 요구사항

- 공개 URL에 호스팅 (로그인 없이 접근 가능)
- 홈페이지에서 링크 가능
- Google Cloud Console의 OAuth 동의 화면에 URL 등록

---

## 4. Google 브랜드 가이드라인 준수

### 4.1 공식 로그인 버튼

#### 허용되는 버튼 텍스트

| 영문 | 한국어 |
|------|--------|
| Sign in with Google | Google로 로그인 |
| Sign up with Google | Google로 가입 |
| Continue with Google | Google로 계속 |

#### 버튼 디자인 규칙

- Google 공식 "Sign in with Google" 버튼 컴포넌트를 사용하는 것이 가장 안전
- 커스텀 버튼 사용 시 아래 규칙을 반드시 준수

| 규칙 | 설명 |
|------|------|
| Google 'G' 로고 | 버튼 왼쪽에 공식 Google 'G' 아이콘 배치 |
| 텍스트 동반 | 'G' 아이콘만 단독 사용 금지, 반드시 텍스트와 함께 |
| 비율 유지 | 로고의 가로·세로 비율을 변형하지 않을 것 |
| 색상 유지 | Google 공식 색상 그대로 사용 (색상 변경 금지) |
| 폰트 | SVG 버튼의 경우 Roboto 폰트 사용 |
| 동등한 위치 | 다른 소셜 로그인 버튼과 최소 동등 이상의 크기·위치 |

#### 절대 하면 안 되는 것

- Google 'G' 로고만 텍스트 없이 단독 사용
- Google 로고를 왜곡, 변형, 회전
- Google 로고의 색상을 변경
- 앱 로고에 Google 로고 삽입
- 앱 이름에 "Google"이라는 단어 포함 (예: "Google Helper" ❌)

#### 공식 리소스

Google 공식 버튼 에셋은 아래에서 다운로드할 수 있습니다:

- Sign in with Google Branding Guidelines: `https://developers.google.com/identity/branding-guidelines`
- Google Identity Services (GIS) 라이브러리를 사용하면 자동으로 가이드라인 준수

### 4.2 구현 예시

```html
<!-- Google Identity Services (GIS) 라이브러리 사용 (권장) -->
<script src="https://accounts.google.com/gsi/client" async></script>

<div id="g_id_onload"
     data-client_id="YOUR_CLIENT_ID.apps.googleusercontent.com"
     data-login_uri="https://your-domain.com/api/auth/callback/google"
     data-auto_prompt="false">
</div>

<div class="g_id_signin"
     data-type="standard"
     data-size="large"
     data-theme="outline"
     data-text="sign_in_with"
     data-shape="rectangular"
     data-logo_alignment="left">
</div>
```

---

## 5. 서비스 설명 및 데이터 활용처 작성

### 5.1 서비스 설명문 작성

OAuth 동의 화면에 입력하는 앱 설명은 다음을 포함해야 합니다:

- 앱의 핵심 기능과 사용 목적을 명확하게 기술
- 사용자에게 제공하는 가치
- Google 데이터를 어떻게 활용하는지 간결하게 설명

#### 예시

```
[앱 이름]은 사용자의 일정 관리를 돕는 서비스입니다.
Google 계정 연동을 통해 간편 로그인을 제공하며,
사용자의 기본 프로필 정보(이름, 이메일)를 활용하여
계정을 생성하고 개인화된 경험을 제공합니다.
```

### 5.2 Scope별 사용 용도 정당화

각 요청하는 scope에 대해 다음 형식으로 정당화 문서를 준비합니다:

| Scope | 용도 | 기능과의 연관성 |
|-------|------|-----------------|
| `openid` | 사용자 인증 | Google 계정 기반 로그인에 필수 |
| `email` | 이메일 주소 확인 | 계정 생성 및 알림 발송에 사용 |
| `profile` | 이름, 프로필 사진 | 앱 내 사용자 프로필 표시 |

#### Scope 요청 원칙

- **최소 권한 원칙**: 꼭 필요한 scope만 요청
- **점진적 요청**: 기능 사용 시점에 해당 scope를 요청 (한 번에 모두 요청하지 않음)
- **기능 구현 선행**: scope를 요청하기 전에 해당 기능이 실제로 구현되어 있어야 함

### 5.3 Google API Services User Data Policy 준수

다음 사항을 반드시 충족해야 합니다:

- **제한적 사용(Limited Use)**: Google 데이터를 앱의 핵심 기능 제공에만 사용
- **데이터 전송 제한**: 사용자 동의 없이 제3자에게 데이터를 전달하지 않음
- **데이터 판매 금지**: Google 사용자 데이터를 판매하지 않음
- **광고 목적 사용 금지**: Google 데이터를 광고 타겟팅에 사용하지 않음
- **보안 유지**: 전송 중(in transit) 및 저장 시(at rest) 데이터를 암호화

---

## 6. 도메인 및 앱 정보 일치

### 6.1 도메인 소유권 인증

#### Google Search Console을 통한 인증 절차

1. [Google Search Console](https://search.google.com/search-console) 접속
2. 속성 추가(Add Property) → 도메인 또는 URL 접두사 선택
3. 인증 방법 선택:
   - DNS TXT 레코드 추가 (권장)
   - HTML 파일 업로드
   - HTML 메타 태그 추가
   - Google Analytics 연동
   - Google Tag Manager 연동
4. 인증 완료 확인

#### 중요 사항

- Google Cloud Console 프로젝트와 연결된 Google 계정이 Search Console의 **소유자(Owner)** 또는 **편집자(Editor)** 역할을 가져야 함
- 인증 후 **7일 이내에 앱을 게시**하지 않으면 상태가 "Need to re-verify"로 변경
- 재인증 필요 시 다시 인증 절차를 진행해야 함

### 6.2 도메인 일치 요구사항

아래 모든 URL이 **동일한 인증된 도메인** 아래에 있어야 합니다:

| 항목 | 예시 |
|------|------|
| 홈페이지 URL | `https://yourapp.com` |
| 개인정보처리방침 URL | `https://yourapp.com/privacy` |
| 이용약관 URL | `https://yourapp.com/terms` |
| OAuth 리다이렉트 URI | `https://yourapp.com/api/auth/callback/google` |
| JavaScript Origin | `https://yourapp.com` |

#### 절대 안 되는 것

- 홈페이지는 `yourapp.com`인데 개인정보처리방침이 `docs.google.com/...`에 있는 경우 ❌
- HTTP 주소 사용 (모두 HTTPS 필수) ❌
- 리다이렉트 URI 도메인이 등록된 도메인과 다른 경우 ❌

### 6.3 앱 정보 일관성

| 확인 항목 | 설명 |
|-----------|------|
| 앱 이름 | Google Cloud Console, OAuth 동의 화면, 실제 서비스 페이지에서 동일 |
| 앱 로고 | Google Cloud Console에 등록한 로고와 실제 서비스에서 사용하는 로고 동일 |
| 서비스 설명 | OAuth 동의 화면의 설명과 실제 서비스 기능이 일치 |
| 개발자 연락처 | 실제로 응답 가능한 이메일 주소 사용 |

---

## 7. OAuth 동의 화면 설정

### 7.1 Google Cloud Console 설정 절차

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **API 및 서비스** → **OAuth 동의 화면** 이동
3. 아래 항목을 정확히 입력

#### 필수 입력 항목

| 항목 | 설명 | 예시 |
|------|------|------|
| 앱 이름 | 서비스 공식 이름 (Google 상표 미포함) | `MyApp` |
| 사용자 지원 이메일 | 사용자 문의 대응 이메일 | `support@yourapp.com` |
| 앱 로고 | 120×120px 이상, PNG/JPEG | (로고 파일) |
| 앱 홈페이지 | 공개 접근 가능한 홈페이지 URL | `https://yourapp.com` |
| 개인정보처리방침 링크 | 공개 접근 가능한 URL | `https://yourapp.com/privacy` |
| 서비스 이용약관 링크 | 공개 접근 가능한 URL | `https://yourapp.com/terms` |
| 승인된 도메인 | 인증 완료된 도메인 | `yourapp.com` |
| 개발자 연락처 이메일 | Google이 연락할 수 있는 이메일 | `dev@yourapp.com` |

### 7.2 Scope 선택

1. **API 및 서비스** → **OAuth 동의 화면** → **범위(Scopes)** 설정
2. 앱에서 실제로 사용하는 scope만 추가
3. scope 카테고리 확인

| 카테고리 | 심사 수준 | 소요 시간 |
|----------|-----------|-----------|
| Non-sensitive | 인증 불요 | 즉시 |
| Sensitive | 브랜드 인증 + scope 인증 | 3~5 영업일 |
| Restricted | 브랜드 인증 + scope 인증 + 보안 심사 | 수 주 ~ 수 개월 |

### 7.3 게시 설정

- **사용자 유형**: `External`로 설정
- **게시 상태**: `Production`으로 변경

> ⚠️ Testing 상태에서는 100명까지만 사용 가능하며, 심사 제출이 불가합니다.

---

## 8. 데모 영상 제작 (YouTube)

Sensitive 또는 Restricted scope를 요청하는 경우 데모 영상이 **필수**입니다.

### 8.1 영상에 반드시 포함해야 하는 내용

| 순서 | 항목 | 세부 사항 |
|------|------|-----------|
| 1 | OAuth 인증 시작 | 사용자가 로그인 버튼을 클릭하는 장면 |
| 2 | OAuth 동의 화면 | 동의 화면에 앱 이름, 요청 scope가 표시되는 장면 |
| 3 | 브라우저 주소창 | OAuth Client ID가 URL에 포함된 것을 확인 |
| 4 | 인증 완료 | 사용자가 동의 후 앱으로 리다이렉트되는 장면 |
| 5 | 기능 시연 | 각 scope를 활용하는 실제 기능 동작 시연 |
| 6 | 언어 설정 | 동의 화면 언어를 **영어(English)**로 설정한 상태로 녹화 |

### 8.2 영상 제작 팁

- 화면 녹화 소프트웨어 사용 (OBS Studio, Loom 등)
- **음성 또는 자막 해설**을 추가하여 각 단계를 설명
- 요청 scope와 해당 기능의 연관성을 명확히 보여주기
- 모든 OAuth Client가 프로젝트에 여러 개 있다면 각각 시연

### 8.3 YouTube 업로드 설정

| 항목 | 설정값 |
|------|--------|
| 공개 범위 | **미등록(Unlisted)** — Private ❌, Public 불필요 |
| 언어 | 영어 권장 (또는 영어 자막 포함) |

> ⚠️ Private으로 설정하면 Google 심사팀이 볼 수 없어 거절됩니다.

---

## 9. 제출 및 심사 프로세스

### 9.1 제출 전 최종 점검

```
✅ 1. 모든 URL이 HTTPS로 접근 가능한가?
✅ 2. 홈페이지에서 개인정보처리방침/이용약관 링크가 보이는가?
✅ 3. 개인정보처리방침에 Google 데이터 활용 내역이 기재되어 있는가?
✅ 4. 도메인 소유권이 Google Search Console에서 인증되었는가?
✅ 5. OAuth 동의 화면에 모든 정보가 정확히 입력되었는가?
✅ 6. 앱 이름과 로고에 Google 상표를 사용하지 않았는가?
✅ 7. 요청 scope가 실제 구현된 기능과 일치하는가?
✅ 8. (해당 시) 데모 영상이 Unlisted로 YouTube에 업로드되었는가?
✅ 9. 사용자 유형이 External, 게시 상태가 Production인가?
✅ 10. 모든 리다이렉트 URI와 JavaScript Origin이 등록되어 있는가?
```

### 9.2 제출 방법

1. [Google Cloud Console](https://console.cloud.google.com/) → **API 및 서비스** → **OAuth 동의 화면**
2. **앱 게시(Publish App)** 버튼 클릭
3. 심사 대상 정보를 확인하고 **제출(Submit)** 클릭

### 9.3 심사 소요 시간

| 심사 유형 | 예상 소요 시간 |
|-----------|----------------|
| 브랜드 인증 | 2~3 영업일 |
| Sensitive scope 인증 | 3~5 영업일 |
| Restricted scope 인증 | 수 주 ~ 수 개월 |
| 보안 심사 (CASA) | 수 주 |

### 9.4 심사 중 주의사항

- Google로부터 추가 질문이 올 수 있음 → 빠르게 응답
- 추가 질문에 대한 답변 후 **재제출** 필요 (전체 타임라인 연장)
- 심사 중에는 OAuth 동의 화면 설정을 변경하지 않는 것이 좋음

---

## 10. 자주 발생하는 거절 사유와 대응 방법

### 10.1 OAuth 설정 문제

| 거절 사유 | 대응 방법 |
|-----------|-----------|
| 사용자 유형이 Internal로 설정됨 | External로 변경 |
| 게시 상태가 Testing | Production으로 변경 후 재제출 |
| 미인증 도메인 사용 | Google Search Console에서 도메인 인증 |

### 10.2 브랜드 및 링크 문제

| 거절 사유 | 대응 방법 |
|-----------|-----------|
| 앱 이름에 "Google" 포함 | 앱 이름에서 Google 관련 단어 제거 |
| 개인정보처리방침 링크 404 | URL 확인 후 공개 접근 가능하도록 수정 |
| 링크가 다른 페이지로 연결 | 올바른 URL로 수정 (예: 개인정보처리방침 링크가 고객센터로 연결되는 경우) |
| 로고 품질이 낮음 | 120×120px 이상의 고해상도 로고 업로드 |

### 10.3 개인정보 및 데이터 문제

| 거절 사유 | 대응 방법 |
|-----------|-----------|
| Google 데이터 활용 미기재 | 개인정보처리방침에 Google API 데이터 관련 조항 추가 |
| Limited Use 정책 미준수 | Google API Services User Data Policy 준수 명시 |
| 불필요한 scope 요청 | 사용하지 않는 scope 제거, 최소 권한만 요청 |

### 10.4 데모 영상 문제

| 거절 사유 | 대응 방법 |
|-----------|-----------|
| 영상이 Private으로 설정됨 | Unlisted로 변경 |
| OAuth 동의 화면이 보이지 않음 | 동의 화면이 명확히 보이도록 재녹화 |
| scope 활용 기능 미시연 | 각 scope를 사용하는 기능을 모두 시연 |
| Client ID가 보이지 않음 | 브라우저 주소창에 Client ID가 보이도록 녹화 |

---

## 11. 심사 후 유지·관리 사항

### 11.1 지속적 준수 사항

- 개인정보처리방침과 이용약관을 최신 상태로 유지
- scope 변경 시 재심사 필요
- OAuth 동의 화면 정보 변경 시 재심사 필요 (로고, 이름, URL 등)
- Google API Services User Data Policy 지속 준수

### 11.2 Restricted Scope 앱의 연간 보안 심사

Restricted scope를 사용하는 앱은 다음을 매년 수행해야 합니다:

- **연간 보안 평가(Annual Security Assessment)** 갱신
- **Letter of Assessment(LoA)** 유효기간 관리
- 12개월마다 재검증 필요

### 11.3 미사용 OAuth 클라이언트 자동 삭제 정책

2025년 10월부터 Google은 **장기 미사용 OAuth 2.0 클라이언트를 자동 삭제**하는 정책을 시행합니다. 정기적으로 클라이언트를 사용하거나 관리 상태를 확인하세요.

---

## 12. 공식 참고 문서 링크

| 문서 | URL |
|------|-----|
| OAuth 인증 요구사항 | https://support.google.com/cloud/answer/13464321 |
| 브랜드 인증 제출 | https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification |
| OAuth 2.0 정책 준수 | https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance |
| Sensitive scope 인증 | https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification |
| Restricted scope 인증 | https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification |
| Sign in with Google 브랜드 가이드라인 | https://developers.google.com/identity/branding-guidelines |
| OAuth 2.0 정책 | https://developers.google.com/identity/protocols/oauth2/policies |
| OAuth 동의 화면 설정 | https://developers.google.com/workspace/guides/configure-oauth-consent |
| Google API Services User Data Policy | https://developers.google.com/terms/api-services-user-data-policy |
| 데모 영상 가이드 | https://support.google.com/cloud/answer/13804565 |
| 심사 제출 가이드 | https://support.google.com/cloud/answer/13461325 |
| Scope 최소 요청 가이드 | https://support.google.com/cloud/answer/13807380 |

---

> 본 가이드는 2025~2026년 기준 Google 공식 문서를 바탕으로 작성되었습니다.
> Google 정책은 수시로 변경될 수 있으므로, 제출 전 반드시 공식 문서를 확인하세요.
