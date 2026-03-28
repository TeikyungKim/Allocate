# Allocate - 자산 배분 전략 앱

자산 배분 전략을 선택하고, 투자 금액을 입력하면 ETF별 매수 수량을 자동 계산하는 모바일/웹 앱입니다.

## 주요 기능

- **19종 전략 지원** - 정적 4종 (올웨더, 60/40, Golden Butterfly, 영구 포트폴리오) + 동적 15종 (듀얼 모멘텀, VAA, DAA, GTAA 등)
- **3개 ETF 유니버스** - 한국 상장 / 퇴직연금 / 미국 상장
- **매수 수량 자동 계산** - 전략 선택 → 금액 입력 → ETF별 매수 수량 + 잔여 현금
- **커스텀 전략** - 자산군과 비중을 직접 설정하여 나만의 정적 전략 생성
- **실시간 모멘텀 스코어** - 동적 전략의 13612W, SMA 등 공식 인자값을 실제 데이터로 표시
- **포트폴리오 저장/관리** - 계산 결과 저장, 보유 수량 추적, 괴리율 모니터링
- **클라우드 동기화** - Google 계정 로그인 후 포트폴리오 백업/복원
- **다크 모드** - 시스템 설정 연동 또는 수동 전환

## 기술 스택

| 항목 | 기술 |
|---|---|
| 프레임워크 | React Native + Expo (SDK 52) |
| 언어 | TypeScript |
| 네비게이션 | React Navigation v7 |
| 저장소 | AsyncStorage (로컬) + Firestore (클라우드) |
| 인증 | Firebase Auth + Google Sign-In |
| 광고 | Google AdMob |
| 가격 데이터 | Twelve Data API → GitHub Actions → GitHub Pages |

## 프로젝트 구조

```
src/
├── core/engine/          # 전략 엔진 (모멘텀 계산, 배분 계산, 전략 실행)
├── data/
│   ├── etfs/             # ETF 데이터 (한국/퇴직연금/미국)
│   └── strategies.ts     # 19종 전략 정의
├── contexts/             # React Context (포트폴리오, 테마, 인증)
├── hooks/                # 커스텀 훅 (가격 데이터 등)
├── services/             # 서비스 (가격 API, Firestore 동기화, 광고)
├── ui/
│   ├── components/       # 공통 UI 컴포넌트
│   ├── navigation/       # 탭 + 스택 네비게이터
│   └── screens/          # 화면 (전략/계산기/포트폴리오/설정)
├── theme/                # 색상, 타이포그래피
└── utils/                # 포맷 유틸리티
```

## 시작하기

### 사전 요구사항

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (Android 빌드) 또는 Xcode (iOS 빌드)

### 설치

```bash
git clone https://github.com/TeikyungKim/Allocate.git
cd Allocate
npm install
```

### 실행

```bash
# 웹 개발 서버
npm run web

# Android (EAS Build 필요 — Expo Go 미지원)
npm run android

# iOS
npm run ios
```

### 환경 변수

`.env` 파일을 프로젝트 루트에 생성:

```env
# AdMob (선택 — 미설정 시 테스트 광고)
EXPO_PUBLIC_ADMOB_APP_ANDROID=ca-app-pub-xxx
EXPO_PUBLIC_ADMOB_APP_IOS=ca-app-pub-xxx

# 가격 데이터 URL (선택 — 기본값: GitHub Pages)
EXPO_PUBLIC_PRICE_DATA_URL=https://teikyungkim.github.io/Allocate/prices
```

## 가격 데이터 설정

동적 전략의 모멘텀 스코어 계산을 위해 ETF 과거 가격 데이터가 필요합니다.

GitHub Actions가 매일 Twelve Data API에서 52주 주간 종가를 수집하여 GitHub Pages에 정적 호스팅합니다.

### 설정 방법

1. [Twelve Data](https://twelvedata.com) 무료 가입 → API 키 발급
2. GitHub 리포 → Settings → Secrets → `TWELVE_DATA_API_KEY` 등록
3. GitHub 리포 → Settings → Pages → Branch: `gh-pages` 선택 → Save
4. Actions 탭 → "Update ETF Prices" → Run workflow (첫 수동 실행)

이후 매일 한국시간 오전 7시에 자동 갱신됩니다.

상세 가이드: [docs/price-data-api-research.md](docs/price-data-api-research.md)

## 빌드

```bash
# TypeScript 타입 검사
npx tsc --noEmit

# 웹 빌드
npx expo export --platform web

# Android 릴리스 빌드 (디바이스 연결 필요)
npx expo run:android --variant release
```

## 면책조항

본 앱은 투자 조언을 제공하지 않습니다. 모든 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다. ETF 가격 데이터는 실시간이 아닐 수 있으며, 실제 매매 시 가격 차이가 발생할 수 있습니다.

## 라이선스

Private repository - All rights reserved.
