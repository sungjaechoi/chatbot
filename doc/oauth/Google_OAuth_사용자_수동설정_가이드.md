# Google OAuth 정식 승인 - 사용자 수동 설정 가이드

> 코드 변경은 완료되었습니다. 아래 항목들은 **사용자가 직접** Google Cloud Console 및 관련 서비스에서 설정해야 합니다.

---

## 완료된 코드 작업 (자동 처리됨)

| 항목 | 상태 | 파일 |
|------|------|------|
| 개인정보처리방침 페이지 | 생성 완료 | `src/app/privacy/page.tsx` |
| 서비스 이용약관 페이지 | 생성 완료 | `src/app/terms/page.tsx` |
| 미들웨어 공개 경로 추가 | 완료 | `src/shared/lib/supabase/middleware.ts` |
| Google G 로고 공식 색상 적용 | 완료 | `src/app/login/page.tsx` |
| 로그인 페이지 Footer 링크 | 완료 | `src/app/login/page.tsx` |

---

## 사용자 수동 설정 항목

### 1단계: 개인정보처리방침 연락처 이메일 입력 (필수)

**파일:** `src/app/privacy/page.tsx`

페이지 하단의 7번(연락처) 섹션에서 `[연락처 이메일을 입력하세요]` 부분을 실제 이메일 주소로 교체하세요.

```
변경 전: [연락처 이메일을 입력하세요]
변경 후: support@yourdomain.com (실제 이메일)
```

---

### 2단계: 프로덕션 도메인 배포 (필수)

Vercel에 프로젝트를 배포하고 커스텀 도메인을 연결해야 합니다.

1. [Vercel Dashboard](https://vercel.com) 접속
2. 프로젝트 Settings → Domains
3. 커스텀 도메인 추가 (예: `yourdomain.com`)
4. DNS 설정에서 Vercel이 안내하는 레코드 추가
5. HTTPS 자동 적용 확인

> 모든 URL은 반드시 **HTTPS**로 접근 가능해야 합니다.

---

### 3단계: Google Search Console 도메인 인증 (필수)

1. [Google Search Console](https://search.google.com/search-console) 접속
2. **속성 추가(Add Property)** 클릭
3. **URL 접두사** 방식 선택 → `https://yourdomain.com` 입력
4. 인증 방법 선택 (권장: **DNS TXT 레코드**)
   - DNS 관리자(Vercel/도메인 등록 업체)에서 TXT 레코드 추가
   - 또는 HTML 파일 업로드 방식 사용 가능
5. **인증 완료** 확인

> ⚠️ Google Cloud Console 프로젝트에 연결된 Google 계정이 Search Console의 **소유자(Owner)** 역할이어야 합니다.
> ⚠️ 인증 후 **7일 이내에 앱을 게시**하지 않으면 재인증이 필요합니다.

---

### 4단계: Google Cloud Console OAuth 동의 화면 설정 (필수)

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **API 및 서비스** → **OAuth 동의 화면** 이동

#### 4-1. 기본 정보 입력

| 항목 | 입력값 |
|------|--------|
| 앱 이름 | `Document Chat` (Google 상표 미포함 확인) |
| 사용자 지원 이메일 | 실제 응답 가능한 이메일 |
| 앱 로고 | 120×120px 이상 PNG/JPEG (Google 로고 사용 금지) |
| 앱 홈페이지 | `https://yourdomain.com` |
| 개인정보처리방침 링크 | `https://yourdomain.com/privacy` |
| 서비스 이용약관 링크 | `https://yourdomain.com/terms` |
| 승인된 도메인 | `yourdomain.com` |
| 개발자 연락처 이메일 | Google이 연락할 수 있는 이메일 |

#### 4-2. Scope 설정

**범위(Scopes)** 탭에서 다음 scope만 추가합니다:

| Scope | 카테고리 | 용도 |
|-------|----------|------|
| `openid` | Non-sensitive | 사용자 인증 (Google 계정 기반 로그인) |
| `email` | Non-sensitive | 이메일 주소 확인 (계정 생성) |
| `profile` | Non-sensitive | 이름/프로필 사진 (앱 내 표시) |

> 이 scope들은 모두 **Non-sensitive**이므로 데모 영상이 필요 없을 수 있습니다.
> 다만 외부 사용자(External) 유형이라면 **브랜드 인증**은 필요합니다.

#### 4-3. 게시 설정 변경

1. **사용자 유형**: `External`로 설정
2. **게시 상태**: `Testing` → **`Production`**으로 변경
3. **앱 게시(Publish App)** 버튼 클릭

> ⚠️ Testing 상태에서는 100명까지만 사용 가능하며 심사 제출이 불가합니다.

---

### 5단계: OAuth 클라이언트 리다이렉트 URI 확인 (필수)

1. **API 및 서비스** → **사용자 인증 정보** → OAuth 2.0 클라이언트 선택
2. 다음 URI들이 등록되어 있는지 확인:

| 항목 | 값 |
|------|-----|
| 승인된 JavaScript Origin | `https://yourdomain.com` |
| 승인된 리다이렉트 URI | Supabase에서 제공하는 Callback URL |

> Supabase Dashboard → Authentication → URL Configuration에서 리다이렉트 URL을 확인하세요.
> 일반적으로 `https://<project-ref>.supabase.co/auth/v1/callback` 형태입니다.

---

### 6단계: Supabase 리다이렉트 URL 설정 (필수)

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 → **Authentication** → **URL Configuration**
3. **Site URL**: `https://yourdomain.com` 으로 설정
4. **Redirect URLs**: `https://yourdomain.com/auth/callback` 추가

---

### 7단계: 심사 제출 전 최종 체크리스트

제출 전 아래 항목을 모두 확인하세요:

```
✅ 1. https://yourdomain.com 에 접근 가능한가?
✅ 2. https://yourdomain.com/privacy 에 접근 가능한가? (로그인 없이)
✅ 3. https://yourdomain.com/terms 에 접근 가능한가? (로그인 없이)
✅ 4. 로그인 페이지 하단에 개인정보처리방침/이용약관 링크가 보이는가?
✅ 5. Google G 로고가 공식 색상(파랑/초록/노랑/빨강)으로 표시되는가?
✅ 6. 개인정보처리방침에 Google API 데이터 Limited Use 조항이 있는가?
✅ 7. 개인정보처리방침에 실제 연락처 이메일이 기재되어 있는가?
✅ 8. Google Search Console에서 도메인 인증이 완료되었는가?
✅ 9. OAuth 동의 화면에 모든 정보가 정확히 입력되었는가?
✅ 10. 게시 상태가 Production인가?
✅ 11. 앱 이름에 "Google" 단어가 포함되지 않았는가?
✅ 12. 앱 로고에 Google 로고가 사용되지 않았는가?
```

---

### 8단계: 심사 제출

1. Google Cloud Console → **API 및 서비스** → **OAuth 동의 화면**
2. **앱 게시(Publish App)** 클릭
3. 심사 정보 확인 후 **제출(Submit)**

#### 예상 심사 소요 시간

| 심사 유형 | 예상 기간 |
|-----------|-----------|
| 브랜드 인증 (Non-sensitive scope) | 2~3 영업일 |

> Non-sensitive scope(openid, email, profile)만 사용하므로 비교적 빠르게 처리됩니다.

---

## FAQ

### Q: 데모 영상이 필요한가요?
A: Non-sensitive scope만 사용하는 경우 일반적으로 필요하지 않습니다. 다만 Google 심사팀에서 추가 요청할 수 있으므로, 필요 시 준비하세요.

### Q: 심사 중 설정을 변경해도 되나요?
A: 심사 중에는 OAuth 동의 화면 설정을 변경하지 않는 것이 좋습니다. 변경 시 심사가 초기화될 수 있습니다.

### Q: 심사가 거절되면 어떻게 하나요?
A: 거절 사유를 확인하고 수정한 뒤 재제출하세요. 자주 발생하는 거절 사유는 `doc/Google_OAuth_정식승인_작업가이드.md`의 10장을 참고하세요.

### Q: `yourdomain.com`을 어디서 변경하나요?
A: 이 문서에서 `yourdomain.com`으로 표시된 부분은 모두 실제 배포 도메인으로 대체해야 합니다.
