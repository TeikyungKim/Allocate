# Google Play 내부 테스트 배포 가이드

> Allocate 앱을 Google Play Console에 업로드하고 내부 테스트를 진행하는 전체 과정을 정리한 문서입니다.

---

## 현재 프로젝트 상태 (2026-03-29 기준)

| 항목 | 상태 |
|------|------|
| EAS CLI | v18.4.0 설치됨 |
| Expo SDK | 55 (canary) |
| Android 패키지명 | `com.allocate.app` |
| google-services.json | 설정됨 |
| eas.json | 생성됨 (production/preview/development 프로필) |
| EAS 로그인 | **아직 안 함** |

---

## 전체 진행 순서

### Step 1: EAS 로그인 & 초기화

```bash
npx eas login                # Expo 계정 로그인 (인터랙티브)
npx eas init                 # 프로젝트 연결
```

### Step 2: 프로덕션 빌드 (AAB)

```bash
npx eas build --platform android --profile production
```

- Expo 클라우드에서 AAB(Android App Bundle) 빌드
- 최초 빌드 시 앱 서명 키 자동 생성 (Google Play App Signing 사용 권장)
- 빌드 완료까지 약 10~20분 소요

### Step 3: Google Play Console 서비스 계정 키 설정

Play Console에서 자동 제출(`eas submit`)을 하려면 **Google Cloud 서비스 계정 키**가 필요합니다:

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. **IAM & Admin > Service Accounts > 서비스 계정 만들기**
3. 이름: `eas-submit` 등으로 설정
4. JSON 키 다운로드 → 프로젝트 루트에 `pc-api-key.json`으로 저장
5. [Play Console > 설정 > API 액세스](https://play.google.com/console/developers/api-access)에서 해당 서비스 계정에 **릴리스 관리자** 권한 부여

> ⚠️ `pc-api-key.json`은 `.gitignore`에 추가하여 Git에 커밋되지 않도록 해야 합니다.

### Step 4: Play Store에 제출

```bash
# 방법 A: 빌드 후 별도 제출
npx eas submit --platform android --profile production

# 방법 B: 빌드 + 제출 한번에
npx eas build --platform android --profile production --auto-submit
```

### Step 5: 내부 테스트 설정 (Play Console)

1. Play Console 접속 → **테스트 > 내부 테스트** 트랙 확인
2. **테스터 목록** 만들기 → 본인 이메일 추가
3. **내부 테스트 링크** 복사 → 테스터에게 공유
4. 링크 접속 → Play Store에서 앱 설치 가능

---

## 빠른 테스트 (서비스 계정 키 없이 수동 업로드)

서비스 계정 설정이 번거롭다면 AAB를 수동으로 업로드할 수 있습니다:

```bash
# 1. 빌드
npx eas build --platform android --profile production

# 2. 빌드 목록에서 AAB 다운로드 URL 확인
npx eas build:list

# 3. Play Console에서 수동 업로드
#    테스트 > 내부 테스트 > 새 릴리스 만들기 > AAB 파일 드래그 앤 드롭
```

---

## 로컬 기기에서 바로 테스트 (APK)

Play Store를 거치지 않고 내 폰에서 직접 테스트:

```bash
npx eas build --platform android --profile preview
```

- APK 파일 생성 → 다운로드 링크 제공
- 폰에 직접 설치 (USB 전송 또는 QR 코드 스캔)
- 가장 빠르게 실기기 테스트 가능

---

## eas.json 프로필 설명

| 프로필 | 용도 | 출력 |
|--------|------|------|
| `development` | 개발용 (dev client) | APK |
| `preview` | 실기기 빠른 테스트 | APK |
| `production` | Play Store 제출용 | AAB (App Bundle) |

---

## 체크리스트

- [ ] `npx eas login` — Expo 계정 로그인
- [ ] `npx eas init` — 프로젝트 연결
- [ ] `npx eas build --platform android --profile production` — AAB 빌드
- [ ] Play Console에 AAB 업로드 (수동 또는 `eas submit`)
- [ ] 내부 테스트 트랙에 테스터 이메일 추가
- [ ] 테스트 링크로 설치 & 테스트
- [ ] 스토어 등록정보 (아이콘, 스크린샷, 설명) 입력 완료 확인

---

## 주의사항

### 서명 키 관리
- 최초 `eas build` 시 Expo가 앱 서명 키를 자동 생성하고 관리
- Google Play App Signing을 사용하면 Expo가 **업로드 키**를 관리하고, Google이 **배포 키**를 관리
- 키를 분실하면 같은 패키지명으로 앱 업데이트 불가 → Expo 대시보드에서 키 백업 권장

### AdMob 테스트 ID
- 현재 `app.json`에 **테스트 AdMob ID** (`ca-app-pub-3940256099942544~3347511713`)가 설정되어 있음
- 프로덕션 출시 전에 실제 AdMob 앱 ID로 교체 필요
- EAS Secrets를 사용하여 환경변수로 관리 권장:
  ```bash
  eas secret:create --name ADMOB_ANDROID_APP_ID --value "ca-app-pub-XXXX~XXXX"
  ```

### 내부 테스트 vs 비공개 테스트 vs 프로덕션

| 트랙 | 테스터 수 | 심사 | 용도 |
|------|----------|------|------|
| 내부 테스트 | 최대 100명 | 없음 (즉시 배포) | 개발팀 QA |
| 비공개 테스트 | 제한 없음 | 있음 (빠른 심사) | 베타 테스트 |
| 프로덕션 | 전체 공개 | 정식 심사 | 정식 출시 |

> 권장 순서: 내부 테스트 → 비공개 테스트 → 프로덕션

---

*최종 수정: 2026-03-29*
