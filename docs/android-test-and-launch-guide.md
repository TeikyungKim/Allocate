# Android 앱 테스트 등록 & 런칭 가이드

> Allocate 앱을 Google Play Console에 테스트 등록하고, 정식 출시까지 진행하는 전체 과정입니다.
> 작성일: 2026-04-05

---

## 전체 흐름 요약

```
[1] EAS 빌드 준비 → [2] AAB 빌드 → [3] Play Console 앱 생성
→ [4] 내부 테스트 등록 → [5] 비공개 테스트 → [6] 프로덕션 출시
```

---

## Phase 1: 사전 준비

### 1-1. 개발자 계정 확인

| 항목 | 상태 |
|------|------|
| Google Play 개발자 계정 | 등록 완료 ($25 결제) |
| 신원 확인 | 승인 필요 (1~3일 소요) |
| 연락처 인증 | 신원 확인 완료 후 진행 |

> 신원 확인이 완료되지 않으면 앱 게시가 불가합니다.

### 1-2. EAS CLI 준비

```bash
# Expo 계정 로그인
npx eas login

# 프로젝트 연결 (최초 1회)
npx eas init
```

### 1-3. eas.json 프로필 확인

| 프로필 | 용도 | 출력 형식 |
|--------|------|-----------|
| `development` | 개발용 (dev client) | APK |
| `preview` | 실기기 빠른 테스트 | APK |
| `production` | Play Store 제출용 | AAB |

---

## Phase 2: 앱 빌드

### 2-1. 프로덕션 AAB 빌드

```bash
npx eas build --platform android --profile production
```

- Expo 클라우드에서 AAB (Android App Bundle) 생성
- 최초 빌드 시 앱 서명 키 자동 생성
- 빌드 완료까지 약 10~20분 소요

### 2-2. 빌드 결과 확인 & 다운로드

```bash
# 빌드 목록 확인
npx eas build:list

# 또는 Expo 대시보드에서 AAB 다운로드
# https://expo.dev > 프로젝트 > Builds
```

### 2-3. (선택) 로컬 APK로 먼저 테스트

Play Store 없이 내 폰에서 바로 확인하려면:

```bash
npx eas build --platform android --profile preview
```

- APK 파일 생성 → QR 코드 스캔 또는 USB 전송으로 설치
- 가장 빠른 실기기 테스트 방법

---

## Phase 3: Google Play Console — 앱 생성

### 3-1. 앱 만들기

[Play Console](https://play.google.com/console) 접속 → **"앱 만들기"**

| 항목 | 입력값 |
|------|--------|
| 앱 이름 | Allocate - 자산배분 투자 계산기 |
| 기본 언어 | 한국어 (ko-KR) |
| 앱/게임 | 앱 |
| 무료/유료 | 무료 |
| 광고 포함 | 예 |

### 3-2. 스토어 등록정보 입력

| 항목 | 사양 | 비고 |
|------|------|------|
| 간단한 설명 | 80자 이내 | 검색에 노출되는 핵심 문구 |
| 자세한 설명 | 4000자 이내 | 상세 기능 소개 |
| 앱 아이콘 | 512x512 PNG | 필수 |
| 대표 이미지 | 1024x500 PNG | 필수 |
| 스크린샷 | 최소 2장, 권장 8장 | 휴대전화 사이즈 |

> 상세 내용은 `docs/google-play-console-listing.md` 참조

### 3-3. 앱 콘텐츠 설정

다음 항목을 **모두 완료**해야 앱 게시가 가능합니다:

| 항목 | 설정값 |
|------|--------|
| 개인정보처리방침 URL | GitHub Pages 등에 호스팅 |
| 앱 액세스 | 제한 없음 (로그인 불필요) |
| 광고 | 예 (Google AdMob) |
| 콘텐츠 등급 | IARC 설문 완료 → 전체이용가 예상 |
| 타겟 연령 | **18세 이상** (금융 앱) |
| 데이터 안전 | 광고 ID 수집 명시 |
| 뉴스 앱 여부 | 아니요 |
| 카테고리 | 금융 (Finance) |

---

## Phase 4: 내부 테스트 (Internal Testing)

> 심사 없이 즉시 배포. 최대 100명 테스터.

### 4-1. 내부 테스트 트랙 생성

1. Play Console → **테스트 > 내부 테스트**
2. **"새 릴리스 만들기"** 클릭
3. AAB 파일 업로드 (드래그 앤 드롭)
4. 출시 노트 작성 (한국어)

```
초기 테스트 버전입니다.
- 19가지 자산배분 전략 제공
- 한국/미국/퇴직연금 ETF 유니버스 지원
- 투자 금액 입력 → ETF 매수 수량 자동 계산
```

5. **"릴리스 검토"** → **"내부 테스트 트랙에 출시 시작"**

### 4-2. 테스터 추가

1. **테스트 > 내부 테스트 > 테스터** 탭
2. **이메일 목록 만들기** → 목록 이름 입력 (예: "개발팀")
3. 테스터 이메일 주소 추가 (본인 + 팀원)
4. **변경사항 저장**

### 4-3. 테스트 링크 공유

1. 테스터 탭 하단 → **"링크 복사"**
2. 테스터에게 링크 전달
3. 테스터가 링크 접속 → **Play Store에서 앱 설치**

> 링크 접속 후 Play Store에 앱이 나타나기까지 최대 몇 분 소요될 수 있습니다.

### 4-4. 테스트 체크리스트

- [ ] 앱 설치 정상 확인
- [ ] 전략 목록 화면 로딩
- [ ] 계산기 → 결과 화면 정상 동작
- [ ] 포트폴리오 저장/불러오기
- [ ] 다크 모드 전환
- [ ] AdMob 테스트 광고 표시
- [ ] 면책조항 표시 확인
- [ ] 크래시 없음 확인 (Play Console > Android vitals)

---

## Phase 5: 비공개 테스트 (Closed Testing)

> Google 심사 있음 (빠른 심사). 테스터 수 제한 없음.

### 5-1. 비공개 테스트 트랙 생성

1. Play Console → **테스트 > 비공개 테스트**
2. **"트랙 만들기"** → 트랙 이름: `beta`
3. 내부 테스트와 동일하게 AAB 업로드 + 출시 노트 작성
4. 테스터 목록 추가 (이메일 또는 Google 그룹)
5. **"릴리스 검토"** → 제출

### 5-2. 심사 대기

- 비공개 테스트도 Google 심사를 거침 (보통 수 시간 ~ 수일)
- 심사 통과 후 테스터가 Play Store에서 설치 가능

### 5-3. 비공개 테스트 목적

| 확인 사항 | 설명 |
|-----------|------|
| 더 넓은 기기 호환성 | 다양한 Android 버전/기기에서 테스트 |
| 실제 AdMob 광고 | 테스트 ID → 실제 ID 전환 후 확인 |
| 사용자 피드백 수집 | Play Store 내부 피드백 채널 |
| 심사 프로세스 예행연습 | 프로덕션 심사 전 사전 검증 |

---

## Phase 6: 프로덕션 출시 (Production Release)

### 6-1. 출시 전 최종 점검

#### 필수 확인 사항
- [ ] 스토어 등록정보 모든 항목 완료 (초록색 체크)
- [ ] 콘텐츠 등급 설문 완료
- [ ] 개인정보처리방침 URL 유효
- [ ] 데이터 안전 섹션 작성 완료
- [ ] 타겟 연령 18세 이상 설정
- [ ] 앱 내 면책조항 표시 확인
- [ ] 최종 빌드 기준 스크린샷 (실제 앱과 일치)

#### AdMob 전환
- [ ] 테스트 AdMob ID → 실제 AdMob ID로 교체
- [ ] EAS Secrets에 실제 ID 등록:

```bash
eas secret:create --name ADMOB_ANDROID_APP_ID --value "ca-app-pub-XXXX~XXXX"
eas secret:create --name BANNER_STRATEGY --value "ca-app-pub-XXXX/XXXX"
eas secret:create --name BANNER_PORTFOLIO --value "ca-app-pub-XXXX/XXXX"
eas secret:create --name INTERSTITIAL --value "ca-app-pub-XXXX/XXXX"
```

- [ ] 실제 AdMob ID로 빌드 후 광고 표시 확인

### 6-2. 프로덕션 릴리스 생성

1. Play Console → **프로덕션**
2. **"새 릴리스 만들기"**
3. 최종 AAB 업로드
4. 출시 노트 작성:

```
Allocate v1.0.0 정식 출시

◆ 19가지 자산배분 전략 (동적 15종 + 정적 4종)
◆ 한국/미국/퇴직연금 3가지 ETF 유니버스
◆ 투자 금액 입력 → ETF 매수 수량 자동 계산
◆ 포트폴리오 저장 및 이미지 공유
◆ 커스텀 전략 생성 기능
```

5. **"릴리스 검토"** → **"프로덕션에 출시 시작"**

### 6-3. 배포 국가 설정

1. **프로덕션 > 국가/지역**
2. 초기: **대한민국** 우선
3. 추후 전체 국가로 확대

### 6-4. 심사 대기

| 항목 | 내용 |
|------|------|
| 최초 심사 | 보통 3~7일 (최대 14일) |
| 업데이트 심사 | 보통 1~3일 |
| 심사 상태 | Play Console > 대시보드에서 확인 |

---

## Phase 7: 출시 후 운영

### 7-1. 모니터링

| 확인 항목 | 위치 |
|-----------|------|
| 설치 수 / DAU | Play Console > 통계 |
| 크래시 리포트 | Play Console > Android vitals |
| ANR (앱 응답 없음) | Play Console > Android vitals |
| 사용자 리뷰 | Play Console > 평점 및 리뷰 |
| AdMob 수익 | AdMob 대시보드 |

### 7-2. 업데이트 배포

```bash
# 1. 버전 올리기 (app.json 또는 app.config.ts)
#    version: "1.0.1", versionCode +1

# 2. 빌드
npx eas build --platform android --profile production

# 3-A. 자동 제출
npx eas submit --platform android

# 3-B. 수동 업로드
# Play Console > 프로덕션 > 새 릴리스 > AAB 업로드
```

### 7-3. 단계적 출시 (Staged Rollout)

업데이트 시 전체 사용자에게 한꺼번에 배포하지 않고 단계적으로 배포 가능:

1. 프로덕션 릴리스 생성 시 **"단계적 출시"** 선택
2. 초기 비율 설정 (예: 10%)
3. 문제 없으면 점진적으로 확대 → 100%
4. 문제 발생 시 **"출시 중단"**으로 즉시 중지

---

## 서비스 계정 키 설정 (자동 제출용)

`eas submit`으로 AAB를 자동 업로드하려면 Google Cloud 서비스 계정 키가 필요합니다:

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. **IAM & Admin > Service Accounts > 서비스 계정 만들기**
3. 이름: `eas-submit`
4. **JSON 키 다운로드** → 프로젝트 루트에 `pc-api-key.json`으로 저장
5. [Play Console > 설정 > API 액세스](https://play.google.com/console/developers/api-access)에서 서비스 계정에 **릴리스 관리자** 권한 부여

> **`pc-api-key.json`은 반드시 `.gitignore`에 추가하세요.**

---

## 심사 리젝 방지 가이드

### Google Play 금융 앱 정책 핵심

| 정책 | 대응 |
|------|------|
| 투자 조언 금지 | "수익 보장", "최고의 투자" 등 문구 절대 사용 금지 |
| 면책조항 필수 | 앱 내 + 스토어 설명 모두에 명시 |
| 과거 수익률 ≠ 미래 보장 | 백테스트 결과 표시 시 반드시 경고 문구 |
| 금융 라이선스 | 단순 계산기/정보 제공 = 라이선스 불필요 |
| 광고 정책 | 전면 광고가 앱 기능 방해 금지 (세션당 1회 제한) |

### 흔한 리젝 사유

| 사유 | 방지 방법 |
|------|-----------|
| 메타데이터 오해 소지 | 과장 문구 제거, 면책조항 포함 |
| 개인정보처리방침 미비 | AdMob 광고 ID 수집 명시 |
| 기능 미완성 | 모든 전략 계산 동작 확인 |
| 등급 불일치 | 18세 이상 정확히 설정 |
| 스크린샷 불일치 | 최종 빌드 기준으로 촬영 |

---

## 트랙별 비교

| 트랙 | 테스터 수 | 심사 | 용도 | 소요 시간 |
|------|----------|------|------|-----------|
| 내부 테스트 | 최대 100명 | 없음 | 개발팀 QA | 즉시 |
| 비공개 테스트 | 무제한 | 빠른 심사 | 베타 테스트 | 수 시간~수일 |
| 공개 테스트 | 무제한 | 심사 | 오픈 베타 | 수일 |
| 프로덕션 | 전체 공개 | 정식 심사 | 정식 출시 | 3~7일 |

**권장 순서: 내부 테스트 → 비공개 테스트 → 프로덕션**

---

## 빠른 명령어 요약

```bash
# 로그인
npx eas login

# 로컬 테스트용 APK 빌드
npx eas build --platform android --profile preview

# Play Store 제출용 AAB 빌드
npx eas build --platform android --profile production

# Play Store에 자동 제출
npx eas submit --platform android

# 빌드 + 제출 한번에
npx eas build --platform android --profile production --auto-submit

# 빌드 목록 확인
npx eas build:list
```

---

*최종 수정: 2026-04-05*
