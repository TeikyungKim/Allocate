# 앱 스토어 등록 가이드 (Google Play & Apple App Store)

> Allocate 앱을 Google Play Store와 Apple App Store에 등록하는 전체 절차를 다룹니다.
> Expo EAS Build/Submit 기반입니다.

---

## Part 1: Google Play Store (Android)

### 1-1. 개발자 계정 생성

1. [Google Play Console](https://play.google.com/console/signup) 접속
2. Google 계정으로 로그인
3. **개발자 배포 계약** 동의
4. **등록 수수료 $25** 결제 (1회성, 신용/체크카드)
5. 계정 유형 선택: **개인** 또는 **조직**

#### 개인 계정 본인 인증 (필수)

| 항목 | 내용 |
|------|------|
| 신분증 | 유효한 국가 발급 신분증 (주민등록증, 여권 등) |
| 전화번호 | 한국 개발자는 전화번호 등록 필수 (없으면 게시 차단) |
| Android 기기 인증 | 2023년 11월 이후 생성 계정은 Play Console 모바일 앱에서 실제 기기 인증 필요 |

> 인증 완료까지 최대 며칠 소요될 수 있으므로, **앱 개발 초기에 미리 계정을 만들어 두세요.**

### 1-2. 앱 만들기

1. Play Console → **모든 앱** → **앱 만들기**
2. 기본 정보 입력:

| 항목 | 입력값 |
|------|--------|
| 앱 이름 | Allocate - 자산 배분 |
| 기본 언어 | 한국어 (ko) |
| 앱/게임 | 앱 |
| 무료/유료 | 무료 |

3. 개발자 프로그램 정책 및 미국 수출법 선언 체크
4. **앱 만들기** 클릭

### 1-3. 스토어 등록정보 작성

Play Console → **스토어 등록정보** → **기본 스토어 등록정보**

#### 필수 텍스트 정보

| 항목 | 제한 | 예시 |
|------|------|------|
| 앱 이름 | 30자 | Allocate - 자산 배분 |
| 간단한 설명 | 80자 | 19가지 자산 배분 전략으로 ETF 매수 수량을 자동 계산합니다. |
| 자세한 설명 | 4,000자 | 앱의 전체 기능 설명 (전략 목록, 계산기, 포트폴리오 등) |

#### 필수 그래픽 에셋

| 항목 | 사양 | 수량 |
|------|------|------|
| 앱 아이콘 | 512 × 512px, PNG (32비트, 알파 포함) | 1개 |
| 스크린샷 (휴대전화) | 최소 320px, 최대 3840px, PNG/JPEG, 2~8장 | 최소 2장 |
| 스크린샷 (태블릿 7인치) | 위와 동일 | 선택 |
| 스크린샷 (태블릿 10인치) | 위와 동일 | 선택 |
| 그래픽 이미지 | 1024 × 500px, PNG/JPEG | 1개 |

> 스크린샷은 앱의 핵심 화면(전략 목록, 계산 결과, 포트폴리오)을 캡처하세요.

### 1-4. 앱 콘텐츠 설정

Play Console → **앱 콘텐츠** 에서 아래 항목을 모두 완료해야 합니다:

#### (1) 개인정보처리방침
- URL 필수 (GitHub Pages 등에 호스팅)
- Allocate는 개인정보를 수집하지 않지만, AdMob이 광고 ID를 수집하므로 이를 명시

#### (2) 앱 액세스 권한
- 로그인 없음 → **"앱의 모든 기능에 특별한 액세스 권한 없이 이용 가능"** 선택

#### (3) 광고
- **"예, 앱에 광고가 포함되어 있습니다"** 선택

#### (4) 콘텐츠 등급
- IARC 등급 설문지 작성
- Allocate는 금융 정보 앱 → 대부분 **전체 이용가** 수준
- 설문지 질문에 정직하게 답변 (폭력, 성적 콘텐츠 등 없음)

#### (5) 타겟층
- **만 18세 이상** 설정 (금융/투자 앱)

#### (6) 데이터 안전
- AdMob 광고 ID 수집 명시
- 기기 식별자 관련 항목 체크

### 1-5. 첫 번째 릴리스 (중요)

> Google Play Store API 제한으로, **첫 번째 APK/AAB는 반드시 수동 업로드**해야 합니다.
> 이후부터 EAS Submit으로 자동화할 수 있습니다.

#### 수동 업로드 절차

```bash
# 1. 프로덕션 빌드 생성
eas build --platform android --profile production

# 2. 빌드 완료 후 .aab 파일 다운로드
# (EAS 대시보드 또는 CLI에서 다운로드 링크 확인)
```

3. Play Console → **프로덕션** → **새 버전 만들기**
4. 다운로드한 `.aab` 파일 업로드
5. 출시 노트 작성
6. **검토를 위해 제출**

> 첫 심사는 보통 **1~7일** 소요됩니다. 비공개 테스트(Closed Testing)를 먼저 진행하면 심사가 빠릅니다.

### 1-6. Google Service Account Key 설정 (EAS Submit용)

첫 번째 수동 업로드 이후, EAS Submit 자동화를 위해 서비스 계정 키를 설정합니다:

1. [Google Cloud Console](https://console.cloud.google.com/) → **IAM 및 관리자** → **서비스 계정**
2. **서비스 계정 만들기** → 이름: `eas-submit`
3. 역할 없이 생성 → 키 추가 → **JSON** 선택 → 키 파일 다운로드
4. Google Play Console → **설정** → **API 액세스** → **서비스 계정 연결**
5. 해당 서비스 계정에 **릴리스 관리자** 권한 부여
6. 다운로드한 JSON 키 파일 경로를 `eas.json`에 설정

---

## Part 2: Apple App Store (iOS)

### 2-1. Apple Developer Program 등록

1. [Apple Developer Program](https://developer.apple.com/programs/enroll/) 접속
2. Apple ID로 로그인 (없으면 생성)
3. **개인** 또는 **조직** 선택

| 항목 | 내용 |
|------|------|
| 등록비 | **연 $99 (약 129,000원)** — 매년 갱신 필요 |
| 이름 | 영문으로 입력 (개인 등록 시 이름 변경 불가) |
| 본인 인증 | Apple Developer 앱(iPhone)에서 인증 또는 웹에서 진행 |

> 등록 승인까지 **최대 48시간** 소요될 수 있습니다.

### 2-2. App Store Connect에서 앱 등록

1. [App Store Connect](https://appstoreconnect.apple.com/) 접속
2. **나의 앱** → **+** → **새로운 앱**

| 항목 | 입력값 |
|------|--------|
| 플랫폼 | iOS |
| 이름 | Allocate - 자산 배분 |
| 기본 언어 | 한국어 |
| 번들 ID | `com.yourname.allocate` (app.json의 bundleIdentifier와 동일) |
| SKU | allocate-001 (고유 식별자, 자유롭게 설정) |
| 사용자 액세스 | 전체 액세스 |

### 2-3. 앱 정보 입력

#### 일반 정보

| 항목 | 내용 |
|------|------|
| 카테고리 | **금융** (주 카테고리), **유틸리티** (보조 카테고리) |
| 콘텐츠 권한 | 타사 콘텐츠 없음 |
| 연령 등급 | 설문 작성 → 금융 정보 앱이므로 대부분 4+ |

#### 가격 및 사용 가능 여부

- **무료** 선택
- 사용 가능 지역: 전체 또는 원하는 국가 선택

#### 개인정보처리방침

- URL 필수 (Google Play와 동일한 URL 사용 가능)

### 2-4. 앱 버전 정보

#### 스크린샷 (필수)

| 디바이스 | 사이즈 | 비고 |
|----------|--------|------|
| iPhone 6.9인치 | 1320 × 2868px | iPhone 16 Pro Max (필수) |
| iPhone 6.7인치 | 1290 × 2796px | iPhone 15 Pro Max |
| iPhone 6.5인치 | 1284 × 2778px | iPhone 14 Plus |
| iPhone 5.5인치 | 1242 × 2208px | iPhone 8 Plus (필수) |
| iPad Pro 12.9인치 | 2048 × 2732px | iPad 지원 시 |

> 최소 **6.9인치**와 **5.5인치** 2세트는 필수입니다.

#### 텍스트 정보

| 항목 | 제한 | 비고 |
|------|------|------|
| 설명 | 4,000자 | 앱의 전체 기능 설명 |
| 키워드 | 100자 | 쉼표로 구분 (예: 자산배분,ETF,투자,포트폴리오,리밸런싱) |
| 지원 URL | 필수 | GitHub repo 또는 지원 페이지 |
| 마케팅 URL | 선택 | 랜딩 페이지 |

#### 앱 심사 정보

| 항목 | 내용 |
|------|------|
| 로그인 필요 여부 | 아니요 |
| 연락처 정보 | 이름, 이메일, 전화번호 |
| 심사 참고사항 | "이 앱은 자산 배분 전략을 기반으로 ETF 매수 수량을 계산하는 유틸리티입니다. 투자 조언은 제공하지 않습니다." |

### 2-5. 빌드 업로드

```bash
# 프로덕션 빌드 생성
eas build --platform ios --profile production

# 빌드 완료 후 자동으로 App Store Connect에 업로드 (또는 수동 제출)
eas submit --platform ios
```

> iOS는 Google Play와 달리 **첫 제출도 EAS Submit으로 가능**합니다.

### 2-6. 심사 제출

1. App Store Connect → 해당 앱 → 버전 선택
2. 업로드된 빌드 선택
3. **심사를 위해 제출** 클릭
4. 심사 기간: 보통 **24~48시간** (리젝 시 사유 확인 후 수정 재제출)

---

## Part 3: EAS 프로젝트 설정

### 3-1. EAS CLI 설치 및 로그인

```bash
npm install -g eas-cli
eas login
```

### 3-2. 프로젝트 초기화

```bash
eas build:configure
```

이 명령어는 `eas.json` 파일을 생성합니다.

### 3-3. eas.json 설정

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account-key.json",
        "track": "production"
      },
      "ios": {
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### 3-4. 빌드 및 제출 명령어

```bash
# Android 빌드 + 자동 제출
eas build --platform android --profile production --auto-submit

# iOS 빌드 + 자동 제출
eas build --platform ios --profile production --auto-submit

# 빌드만 (제출은 나중에)
eas build --platform all --profile production

# 기존 빌드를 제출
eas submit --platform android
eas submit --platform ios
```

### 3-5. 시크릿 등록 (API 키 등)

```bash
# AdMob 키 등록
eas secret:create --name EXPO_PUBLIC_ADMOB_APP_ANDROID --value "ca-app-pub-XXXX~XXXX"
eas secret:create --name EXPO_PUBLIC_ADMOB_APP_IOS --value "ca-app-pub-XXXX~XXXX"
eas secret:create --name EXPO_PUBLIC_BANNER_STRATEGY --value "ca-app-pub-XXXX/XXXX"
eas secret:create --name EXPO_PUBLIC_BANNER_PORTFOLIO --value "ca-app-pub-XXXX/XXXX"
eas secret:create --name EXPO_PUBLIC_INTERSTITIAL --value "ca-app-pub-XXXX/XXXX"
```

---

## Part 4: 체크리스트

### 제출 전 준비물

- [ ] 개발자 계정 생성 완료 (Google Play + Apple)
- [ ] 앱 아이콘 (1024 × 1024px 원본)
- [ ] 스크린샷 (Android 2장+, iOS 2세트+)
- [ ] 그래픽 이미지 (Google Play: 1024 × 500px)
- [ ] 앱 설명 텍스트 (한국어)
- [ ] 개인정보처리방침 URL
- [ ] 면책조항 (앱 내 + 스토어 설명에 포함)
- [ ] AdMob 앱 ID 및 광고 단위 ID
- [ ] EAS Secrets에 환경 변수 등록

### 앱 심사 주의사항

| 주의점 | 설명 |
|--------|------|
| 투자 조언 문구 금지 | "수익 보장", "최고의 투자" 등 절대 사용 금지 |
| 면책조항 필수 | 앱 내 + 스토어 설명 모두에 포함 |
| AdMob 테스트 ID | 심사 빌드에도 테스트 ID 사용하지 않도록 주의 (실제 ID 사용) |
| 금융 앱 규제 | 일부 국가는 금융 앱에 추가 규제 있음 (한국은 정보 제공 앱이므로 해당 없음) |
| app-ads.txt | Google Play 출시 전 도메인에 app-ads.txt 설정 |

---

## Sources

- [Google Play Console 시작하기](https://support.google.com/googleplay/android-developer/answer/6112435?hl=ko)
- [Google Play 앱 만들기 및 설정](https://support.google.com/googleplay/android-developer/answer/9859152?hl=ko)
- [Google Play 스토어 등록정보 권장사항](https://support.google.com/googleplay/android-developer/answer/13393723?hl=ko)
- [Google Play 콘텐츠 등급 요구사항](https://support.google.com/googleplay/android-developer/answer/9859655?hl=ko)
- [Apple Developer Program 등록](https://developer.apple.com/programs/enroll/)
- [App Store 앱 제출 가이드](https://developer.apple.com/app-store/submitting/)
- [Expo EAS Submit 문서](https://docs.expo.dev/submit/introduction/)
- [Expo EAS Build 설정](https://docs.expo.dev/build/eas-json/)
- [EAS Submit - Google Play](https://docs.expo.dev/submit/android/)
- [EAS Submit eas.json 설정](https://docs.expo.dev/submit/eas-json/)
