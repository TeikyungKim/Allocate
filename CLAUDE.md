# Allocate — AI 개발 가이드

> 이 파일은 AI(Claude 등)와 개발자가 이 프로젝트를 작업할 때 반드시 숙지해야 할 핵심 지침서입니다.

---

## 0-α. WebSearch 활용 원칙 (Research-First Policy)

> ⚠️ **작업 진행 시 WebSearch를 적극 활용하세요.**

### 핵심 원칙: 모르면 검색부터

코드 작성, 버그 수정, 라이브러리 연동 등 모든 작업에서 **확실하지 않은 정보는 WebSearch로 먼저 확인**합니다.
AI의 학습 데이터는 최신이 아닐 수 있으므로, 최신 문서/API/버전 정보는 반드시 웹 검색으로 검증합니다.

### WebSearch를 사용해야 하는 상황

| 상황 | 예시 |
|---|---|
| 라이브러리 최신 버전/API 변경 확인 | Expo SDK 52 변경사항, react-navigation v7 최신 사용법 |
| 에러 메시지 해결 | 빌드 오류, 런타임 에러의 원인 및 해결책 검색 |
| ETF 종목/티커 정확성 확인 | 한국 상장 ETF 티커 코드, 퇴직연금 가능 여부 |
| 자산 배분 전략 규칙 확인 | VAA/DAA/GTAA 등 전략의 정확한 로직 검증 |
| 베스트 프랙티스 확인 | AdMob 정책 변경, App Store 심사 가이드라인 |
| 금융 데이터 API | KRX API, Yahoo Finance API 사용법 및 제한 |

### WebSearch 행동 규칙

1. **추측보다 검색** — 확신이 80% 미만이면 검색 먼저
2. **공식 문서 우선** — 검색 결과 중 공식 문서(docs, GitHub repo)를 우선 참고
3. **검색 결과 반영** — 검색으로 얻은 최신 정보를 코드에 즉시 반영
4. **출처 언급** — 중요한 결정에 WebSearch를 활용했다면 사용자에게 간략히 알림

---

## 0. 검증 우선 원칙 (Verification-First Policy)

> ⚠️ **이 섹션은 프로젝트의 최우선 원칙입니다. 코드 작성 전에 반드시 읽으세요.**

### 핵심 원칙: 검증 없는 완료는 없다

모든 기능 구현, 버그 수정, 리팩토링은 반드시 **검증 통과 후** 완료로 간주합니다.
"코드를 작성했다" ≠ "기능이 동작한다". 검증이 기본(default)입니다.

### 검증 2단계 파이프라인

```
[1단계] 정적 검사       [2단계] 빌드 검증
npx tsc --noEmit  →  npx expo export --platform web
   (타입 오류 0)      (번들 오류 0)
```

**모든 단계가 통과해야** PR 머지 / 작업 완료 처리 가능.
어느 한 단계라도 실패하면 수정 후 전체 파이프라인을 다시 실행합니다.

### AI가 코드 수정 후 반드시 실행할 명령

```bash
# 필수 검증 순서 (절대 생략 불가)
npx tsc --noEmit                         # Step 1: 타입 검사
npx expo export --platform web           # Step 2: 빌드
```

### 검증 실패 시 행동 규칙

| 실패 유형 | 조치 |
|---|---|
| TypeScript 오류 | 타입 오류 수정 → 재검사 |
| 빌드 오류 | 오류 메시지 분석 → 수정 → 재빌드 |
| 실패 원인 불명확 | WebSearch로 에러 메시지/원인 검색 → 해결 안 되면 사용자에게 보고 (추측으로 우회 금지) |

---

## 1. 프로젝트 개요 (Project Overview)

| 항목 | 내용 |
|---|---|
| **앱 이름** | Allocate (자산 배분) |
| **플랫폼** | iOS / Android (React Native + Expo) |
| **타겟 사용자** | 자산 배분 전략에 관심 있는 개인 투자자 |
| **핵심 목적** | 자산 배분 전략을 선택하고, 투자 금액을 입력하면 ETF별 매수 수량을 자동 계산 |
| **핵심 차별점** | 동적/정적 전략 19종, 한국/미국/퇴직연금 3개 ETF 유니버스, 오프라인 동작 |
| **수익 모델** | AdMob (배너 + 전면 광고) |

### 앱의 존재 이유 (Why This App Exists)
자산 배분 전략은 논문과 블로그에 잘 설명되어 있지만, 실제 "내 돈으로 뭘 얼마나 사야 하나?"를 계산하려면 스프레드시트를 직접 만들어야 합니다. 이 앱은 전략 선택 → 금액 입력 → 매수 목록 출력을 원스텝으로 제공합니다.

---

## 2. 기술 스택 (Tech Stack)

### 핵심 프레임워크
- **React Native + Expo (SDK 52+)** — 크로스 플랫폼
- **TypeScript** — 타입 안전성 필수
- **React Navigation v7** — 탭 + 스택 네비게이션

### 필수 라이브러리

```json
{
  "dependencies": {
    "expo": "~52.x",
    "@react-navigation/native": "^7.x",
    "@react-navigation/bottom-tabs": "^7.x",
    "@react-navigation/native-stack": "^7.x",
    "react-native-chart-kit": "^6.x",
    "@react-native-async-storage/async-storage": "^2.x",
    "react-native-google-mobile-ads": "^14.x",
    "nativewind": "^4.x",
    "expo-sharing": "~13.x",
    "react-native-view-shot": "^4.x",
    "@expo/vector-icons": "^14.x"
  }
}
```

### 빌드 요구사항
- **EAS Build 필수** — `react-native-google-mobile-ads`는 Expo Go 미지원
- **EAS Secrets** — API 키, AdMob ID는 절대 코드에 하드코딩 금지
- `.env` 파일 + `app.config.ts`의 `Constants.expoConfig.extra` 패턴 사용

---

## 3. UI/UX 개발 원칙

> ⚠️ 아래 원칙은 **모든 화면 개발에 예외 없이 적용**해야 합니다.

### 원칙 1: 한글 우선 UI
- 전략명은 영문 원래 이름 병기 가능 (예: "듀얼 모멘텀 (Dual Momentum)")
- 버튼, 탭, 헤더, 토스트 메시지는 **한국어 기본**
- ETF 티커는 원래 표기 유지 (SPY, 360750 등)

### 원칙 2: 깔끔한 금융 앱 디자인
```typescript
// src/app/theme/colors.ts
export const LIGHT_THEME = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  accent: '#2563EB',        // 파란색 — 금융 앱 기본 색감
  accentLight: '#DBEAFE',
  positive: '#10B981',      // 수익 — 초록
  negative: '#EF4444',      // 손실 — 빨강
  border: '#E5E7EB',
  warning: '#F59E0B',
};

export const DARK_THEME = {
  background: '#0F172A',
  surface: '#1E293B',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  accent: '#3B82F6',
  accentLight: '#1E3A5F',
  positive: '#34D399',
  negative: '#F87171',
  border: '#334155',
  warning: '#FBBF24',
};
```

### 원칙 3: 숫자 가독성
- 금액은 항상 천 단위 쉼표 표시: `1,000,000원`, `$10,000`
- 퍼센트는 소수점 1자리: `30.0%`
- 주식 수량은 정수 표시: `15주`
- 통화 기호: KRW → `원`, USD → `$`

### 원칙 4: 최소 터치 영역
- 모든 버튼/터치 요소: **44px × 44px 이상**
- 터치 시 시각적 피드백 필수

### 원칙 5: 다크 모드
- 기본값: 시스템 설정 따름 (`useColorScheme()`)
- 설정 화면에서 수동 전환 가능

### 원칙 6: 면책조항 필수
- 앱 최초 실행 시 면책조항 표시
- 모든 계산 결과 화면 하단에 면책 문구:
  "본 앱은 투자 조언을 제공하지 않습니다. 모든 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다."

---

## 4. 네비게이션 구조

### 하단 탭 네비게이터 (4탭)

```
[전략]  StrategyStack
  ├── StrategyListScreen      — 동적/정적 전략 목록
  ├── StrategyDetailScreen    — 전략 상세 + 규칙 설명
  └── StrategyRecommendScreen — 현재 시장 상황 추천

[계산기]  CalculatorStack
  ├── CalculatorScreen        — 투자금액 입력 + 전략 선택
  ├── AllocationResultScreen  — ETF 매수 수량 결과
  └── ETFDetailScreen         — 개별 ETF 정보

[포트폴리오]  PortfolioStack
  ├── PortfolioListScreen     — 저장된 포트폴리오
  ├── PortfolioDetailScreen   — 포트폴리오 상세
  └── CustomStrategyScreen    — 커스텀 정적 배분 생성

[설정]  SettingsStack
  ├── SettingsScreen          — 가격 업데이트, 테마
  └── AboutScreen             — 앱 정보, 면책조항
```

---

## 5. 핵심 기능 명세 (Core Features)

### 5-1. 전략 목록 화면 (StrategyListScreen)
- 두 섹션: **동적 전략** / **정적 전략**
- 전략 카드: 이름, 한줄 설명, 위험도 뱃지, 리밸런싱 주기
- 필터 칩: 전체 / 공격형 / 방어형 / 올웨더형
- 하단 배너 광고

### 5-2. 전략 상세 화면 (StrategyDetailScreen)
- 전략명 + 저자/출처
- 상세 규칙 설명 (한국어)
- 사용 자산군 테이블
- "이 전략으로 계산하기" 버튼 → 계산기로 이동

### 5-3. 계산기 화면 (CalculatorScreen)
- **투자 금액** 입력 (KRW 또는 USD)
- **ETF 유니버스** 선택: 한국 상장 / 퇴직연금 / 미국 상장
- **전략** 선택 (모달 또는 스크롤 리스트)
- **계좌 유형** 토글: 일반 / 퇴직연금(IRP/DC)
- "계산하기" 버튼

### 5-4. 배분 결과 화면 (AllocationResultScreen)
- **파이 차트**: 자산군별 배분 비중
- **매수 테이블**: ETF 티커, 이름, 목표 비중%, 목표 금액, 매수 수량, 실제 금액
- **잔여 현금** 표시
- "포트폴리오 저장" 버튼
- "이미지로 공유" 버튼
- 하단 면책조항

### 5-5. 내 포트폴리오 (PortfolioListScreen)
- 저장된 포트폴리오 카드 목록
- 카드: 전략명, 생성일, 총 금액, 자산 수
- 스와이프 삭제
- FAB 버튼 → 커스텀 전략 생성

### 5-6. 커스텀 전략 (CustomStrategyScreen)
- 전략 이름 입력
- ETF 추가: ETF 선택 + 비중(%) 입력
- 비중 합계 100% 프로그레스 바
- 저장 시 커스텀 정적 전략으로 등록

### 5-7. 설정 화면 (SettingsScreen)
- ETF 가격 데이터: 최종 업데이트 시각, 수동 갱신 버튼
- 화면 모드: 밝게 / 어둡게 / 자동
- 앱 정보, 면책조항, 버전

---

## 6. 전략 명세 (Strategy Specifications)

### 6-1. 정적 전략 (4개 + 커스텀)

**All Weather (올웨더 — 레이 달리오)**
| 자산군 | 비중 |
|--------|------|
| 미국 주식 | 30% |
| 장기 국채 | 40% |
| 중기 국채 | 15% |
| 금 | 7.5% |
| 원자재 | 7.5% |

**60/40**
| 자산군 | 비중 |
|--------|------|
| 미국 주식 | 60% |
| 미국 채권 | 40% |

**Golden Butterfly (황금 나비)**
| 자산군 | 비중 |
|--------|------|
| 미국 전체 주식 | 20% |
| 소형 가치주 | 20% |
| 장기 국채 | 20% |
| 단기 국채 | 20% |
| 금 | 20% |

**Permanent Portfolio (영구 포트폴리오 — 해리 브라운)**
| 자산군 | 비중 |
|--------|------|
| 주식 | 25% |
| 장기 국채 | 25% |
| 금 | 25% |
| 현금/단기채 | 25% |

### 6-2. 동적 전략 (15개)

**1. Dual Momentum (듀얼 모멘텀 — Gary Antonacci)**
- 유니버스: 미국 주식(SPY), 선진국 주식(EFA), 채권(AGG)
- 규칙: SPY vs EFA 12개월 수익률 비교 → 승자 선택. 승자의 12개월 수익률 < 0이면 AGG로 전환
- 리밸런싱: 월간

**2. GTAA (글로벌 전술 자산 배분 — Meb Faber)**
- 유니버스: 미국 주식, 선진국 주식, 채권, 리츠, 원자재 (5자산)
- 규칙: 각 자산의 현재가 > 10개월 SMA이면 포함, 동일비중 배분. 모두 미달이면 현금
- 리밸런싱: 월간

**3. VAA (Vigilant Asset Allocation — Wouter Keller)**
- 공격: SPY, EFA, EEM, AGG (4자산)
- 방어: SHY, IEF, LQD (3자산)
- 모멘텀: 13612W = 12×(1개월) + 4×(3개월) + 2×(6개월) + 1×(12개월)
- 규칙: 공격자산 **전부** 양수 모멘텀 → 공격 top-1 보유. **하나라도** 음수 → 방어 top-1 100%
- 리밸런싱: 월간

**4. DAA (Defensive Asset Allocation — Wouter Keller)**
- 카나리아: EEM, AGG
- 공격: SPY, IWM, QQQ, VGK, EWJ, EEM, VNQ, GSG, GLD, TLT, HYG, LQD (12자산)
- 방어: SHY, IEF, LQD (3자산)
- 규칙: 카나리아 둘 다 양수 → 공격 top-6 동일비중. 하나 음수 → 50% 공격 + 50% 방어. 둘 다 음수 → 100% 방어 top-1
- 리밸런싱: 월간

**5. LAA (Lethargic Asset Allocation — Wouter Keller)**
- 자산: SPY, GLD, IWD, IEF (각 25%)
- 규칙: 고정 25% 배분이지만, 미국 실업률 상승 시 SPY → SHY로 전환
- 리밸런싱: 분기

**6. BAA (Bold Asset Allocation)**
- DAA와 유사하지만 공격 시 top-1 집중 (bold)
- 카나리아 전부 양수 → 공격 top-1. 그 외 → 방어 top-1 100%
- 리밸런싱: 월간

**7. Accelerating Dual Momentum (가속 듀얼 모멘텀)**
- Dual Momentum 기반, 다중 룩백(1/3/6/12개월) 평균 사용
- SPY vs EFA vs AGG 구조 동일
- 리밸런싱: 월간

**8. Vigilant Asset Allocation 확장**
- VAA와 동일 구조, 자산군 확대 가능
- 13612W 모멘텀 사용
- 리밸런싱: 월간

**9. Adaptive Asset Allocation (적응형 — Butler/Philbrick/Gordillo)**
- 유니버스: 10개 글로벌 자산군
- Step 1: 6개월 모멘텀 상위 5개 선택
- Step 2: 상위 5개의 상관관계 기반 최소분산 비중 계산
- Step 3: 비중 제한 (최소 5%, 최대 25%)
- 리밸런싱: 월간

**10. Papa Dual Momentum (파파 듀얼 모멘텀)**
- Dual Momentum 확장: 주식/리츠/금/채권 각 "레그"별 독립 모멘텀
- 각 레그가 독립적으로 risk-on/risk-off 판단
- 리밸런싱: 월간

**11. Protective Asset Allocation (PAA)**
- 유니버스: 12개 위험자산 + 채권(안전자산)
- 브레드스: 12개 중 양수 SMA 모멘텀 자산 수 카운트
- 보호계수로 채권 비중 결정, 나머지는 양수 모멘텀 자산 top-N 동일비중
- 리밸런싱: 월간

**12. Composite Absolute Momentum**
- 다중 룩백 평균 모멘텀
- 절대 모멘텀 임계값(양수) 통과 자산만 동일비중
- 나머지는 채권/현금
- 리밸런싱: 월간

**13. Extended Dual Momentum (확장 듀얼 모멘텀)**
- Dual Momentum에 리츠, 금 레그 추가
- 4개 독립 모멘텀 체크 → 각 레그별 risk-on/off
- 리밸런싱: 월간

**14. Protective Dual Momentum**
- PAA 브레드스 신호 + Dual Momentum 종목 선택 결합
- 브레드스 기반 점진적 위험 축소
- 리밸런싱: 월간

**15. Generalized Protective Momentum (GPM)**
- 일반화 프레임워크: N자산, top-K 선택, 보호계수 설정 가능
- 어떤 유니버스에도 적용 가능
- 리밸런싱: 월간

---

## 7. ETF 유니버스 매핑

### 자산군별 ETF 매핑 테이블

| 자산군 | 미국 ETF | 한국 상장 ETF | 퇴직연금 ETF |
|--------|----------|--------------|-------------|
| 미국 주식 | SPY | TIGER 미국S&P500 (360750) | KODEX 미국S&P500TR (379800) |
| 선진국 주식 | EFA | TIGER 선진국MSCI World (195930) | ACE 선진국MSCI World (251350) |
| 신흥국 주식 | EEM | TIGER 신흥국MSCI (195980) | KODEX MSCI EM (261060) |
| 미국 채권 | AGG | KODEX 미국채10년선물 (308620) | ACE 미국채10년 (453850) |
| 장기 국채 | TLT | TIGER 미국채30년 (451540) | KODEX 미국채울트라30년 (304660) |
| 중기 국채 | IEF | KODEX 미국채10년선물 (308620) | ACE 미국채10년 (453850) |
| 단기 국채/현금 | SHY/BIL | KODEX 단기채권 (214330) | TIGER 단기채권액티브 (272580) |
| 금 | GLD | KODEX 골드선물(H) (132030) | ACE KRX금현물 (411060) |
| 원자재 | GSG/DJP | KODEX WTI원유선물(H) (261220) | — |
| 리츠 | VNQ | TIGER 미국MSCI리츠 (352560) | KODEX 다우존스미국리츠 (352540) |
| 소형 가치주 | IWN/VBR | TIGER 미국러셀2000 (381180) | — |
| 하이일드 | HYG | — | — |
| 투자등급 회사채 | LQD | — | — |
| 나스닥 | QQQ | TIGER 미국나스닥100 (133690) | KODEX 미국나스닥100TR (379810) |
| 유럽 주식 | VGK | — | — |
| 일본 주식 | EWJ | — | — |
| 한국 주식 | — | KODEX 200 (069500) | KODEX 200TR (278530) |

> ⚠️ 퇴직연금 ETF 목록은 변경될 수 있음. 최종 확인 시점을 데이터에 기록할 것.

---

## 8. 핵심 타입 정의 (Core Types)

```typescript
// src/types/index.ts

// ===== ETF =====
type ETFUniverse = 'KR' | 'KR_PENSION' | 'US';
type AssetClass =
  | 'US_EQUITY' | 'INTL_EQUITY' | 'EM_EQUITY' | 'KR_EQUITY'
  | 'US_BOND' | 'KR_BOND' | 'INTL_BOND' | 'LONG_BOND' | 'MID_BOND' | 'SHORT_BOND'
  | 'TIPS' | 'GOLD' | 'COMMODITY' | 'REIT' | 'CASH'
  | 'HIGH_YIELD' | 'IG_CORP' | 'SMALL_VALUE'
  | 'NASDAQ' | 'EUROPE_EQUITY' | 'JAPAN_EQUITY';

interface ETF {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  universe: ETFUniverse[];
  isPensionEligible: boolean;
  price?: number;
  priceUpdatedAt?: string;
  currency: 'KRW' | 'USD';
  expenseRatio?: number;
}

// ===== Strategy =====
type StrategyType = 'DYNAMIC' | 'STATIC';
type RiskLevel = 'AGGRESSIVE' | 'MODERATE' | 'DEFENSIVE' | 'ALL_WEATHER';
type RebalancePeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

interface StrategyMeta {
  id: string;
  name: string;
  nameKo: string;
  author: string;
  type: StrategyType;
  riskLevel: RiskLevel;
  rebalancePeriod: RebalancePeriod;
  description: string;
  descriptionDetail: string;
  universes: ETFUniverse[];
}

interface StaticAllocation {
  assetClass: AssetClass;
  weight: number;  // 0~1
  etfTickers: Record<ETFUniverse, string>;
}

interface StaticStrategy extends StrategyMeta {
  type: 'STATIC';
  allocations: StaticAllocation[];
}

interface AssetGroup {
  name: string;
  role: 'OFFENSIVE' | 'DEFENSIVE' | 'CANARY';
  assets: { assetClass: AssetClass; etfTickers: Record<ETFUniverse, string> }[];
  selectTop?: number;
}

interface DynamicStrategy extends StrategyMeta {
  type: 'DYNAMIC';
  assetGroups: AssetGroup[];
  momentumRule: {
    type: 'ABSOLUTE' | 'RELATIVE' | 'DUAL';
    lookbackMonths: number[];
    weights?: number[];
    scoreFormula: string;
  };
  switchRules: {
    condition: string;
    action: 'SWITCH_TO_DEFENSIVE' | 'REDUCE_OFFENSIVE' | 'CUSTOM';
    defensiveWeight?: number;
  }[];
  offensiveCount: number;
  defensiveCount: number;
}

type Strategy = StaticStrategy | DynamicStrategy;

// ===== Portfolio =====
interface AllocationItem {
  etf: ETF;
  targetWeight: number;
  targetAmount: number;
  shares: number;
  actualAmount: number;
  actualWeight: number;
}

interface PortfolioCalculation {
  id: string;
  strategyId: string;
  universe: ETFUniverse;
  totalAmount: number;
  currency: 'KRW' | 'USD';
  allocations: AllocationItem[];
  cashRemainder: number;
  calculatedAt: string;
}

interface SavedPortfolio extends PortfolioCalculation {
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomStaticStrategy {
  id: string;
  name: string;
  universe: ETFUniverse;
  allocations: { etfTicker: string; weight: number }[];
  createdAt: string;
}
```

---

## 9. 전략 엔진 설계 (Strategy Engine)

### 핵심 모듈 3개

```
src/core/engine/
├── momentumCalculator.ts   — 모멘텀 계산 함수
├── allocationEngine.ts     — 비중 → 매수 수량 변환
└── strategyExecutor.ts     — 전략 실행 디스패처
```

### momentumCalculator.ts

```typescript
// 월간 수익률 (N개월)
function monthlyReturn(prices: number[], months: number): number;

// 가중 모멘텀 스코어 (13612W 등)
function momentumScore(prices: number[], lookbacks: number[], weights?: number[]): number;

// 단순 이동평균
function sma(prices: number[], period: number): number;

// 절대 모멘텀 체크
function isAboveSMA(prices: number[], period: number): boolean;
```

### allocationEngine.ts

```typescript
// 비중 배열 → 매수 수량 배열 (잔여 현금 최소화)
function calculateShares(
  amount: number,
  weights: { etf: ETF; weight: number }[],
): AllocationItem[];
```

### strategyExecutor.ts

```typescript
// 전략 ID → 배분 비중 반환
function executeStrategy(
  strategy: Strategy,
  universe: ETFUniverse,
  prices?: Record<string, number[]>,
): { etfTicker: string; weight: number }[];
```

---

## 10. 광고 수익화 전략 (Monetization)

### AdMob 구성

```typescript
// src/constants/ads.ts

// ⚠️ 실제 유닛 ID는 EAS Secrets에서 관리. 개발 중에는 테스트 ID 사용
export const AD_IDS = {
  BANNER_STRATEGY_LIST: process.env.EXPO_PUBLIC_BANNER_STRATEGY
    ?? 'ca-app-pub-3940256099942544/6300978111',
  BANNER_PORTFOLIO_LIST: process.env.EXPO_PUBLIC_BANNER_PORTFOLIO
    ?? 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL_CALCULATE: process.env.EXPO_PUBLIC_INTERSTITIAL
    ?? 'ca-app-pub-3940256099942544/1033173712',
};

export const AD_CONFIG = {
  INTERSTITIAL_MAX_PER_SESSION: 1,  // 세션당 전면광고 최대 1회
  SESSION_WARMUP_MS: 60 * 1000,      // 앱 시작 후 1분 유예
};
```

### 광고 배치 원칙
- **배너 광고**: 전략 목록, 포트폴리오 목록 화면 하단
- **전면 광고**: "계산하기" 클릭 시 (세션당 최대 1회)
- **결과/상세 화면에는 광고 없음** — 분석 중 방해 금지

---

## 11. 디렉토리 구조 (Directory Structure)

```text
Allocate/
├── App.tsx
├── app.json
├── app.config.ts
├── tsconfig.json
├── babel.config.js
├── .env
├── .env.example
│
├── src/
│   ├── app/
│   │   ├── navigation/
│   │   │   ├── RootNavigator.tsx
│   │   │   ├── StrategyStack.tsx
│   │   │   ├── CalculatorStack.tsx
│   │   │   ├── PortfolioStack.tsx
│   │   │   ├── SettingsStack.tsx
│   │   │   └── types.ts
│   │   ├── providers/
│   │   │   ├── AppProvider.tsx
│   │   │   ├── PortfolioContext.tsx
│   │   │   └── SettingsContext.tsx
│   │   └── theme/
│   │       ├── colors.ts
│   │       ├── typography.ts
│   │       └── spacing.ts
│   │
│   ├── features/
│   │   ├── strategy/
│   │   │   ├── screens/
│   │   │   │   ├── StrategyListScreen.tsx
│   │   │   │   ├── StrategyDetailScreen.tsx
│   │   │   │   └── StrategyRecommendScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── StrategyCard.tsx
│   │   │   │   ├── RiskBadge.tsx
│   │   │   │   └── AssetGroupTable.tsx
│   │   │   └── hooks/
│   │   │       └── useStrategyFilter.ts
│   │   │
│   │   ├── calculator/
│   │   │   ├── screens/
│   │   │   │   ├── CalculatorScreen.tsx
│   │   │   │   ├── AllocationResultScreen.tsx
│   │   │   │   └── ETFDetailScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── AmountInput.tsx
│   │   │   │   ├── UniverseSelector.tsx
│   │   │   │   ├── StrategyPicker.tsx
│   │   │   │   ├── AllocationPieChart.tsx
│   │   │   │   └── AllocationTable.tsx
│   │   │   └── hooks/
│   │   │       └── useAllocationCalculator.ts
│   │   │
│   │   ├── portfolio/
│   │   │   ├── screens/
│   │   │   │   ├── PortfolioListScreen.tsx
│   │   │   │   ├── PortfolioDetailScreen.tsx
│   │   │   │   └── CustomStrategyScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── PortfolioCard.tsx
│   │   │   │   └── WeightEditor.tsx
│   │   │   └── hooks/
│   │   │       └── usePortfolioStorage.ts
│   │   │
│   │   └── settings/
│   │       ├── screens/
│   │       │   ├── SettingsScreen.tsx
│   │       │   └── AboutScreen.tsx
│   │       └── components/
│   │           └── SettingsRow.tsx
│   │
│   ├── core/
│   │   ├── engine/
│   │   │   ├── momentumCalculator.ts
│   │   │   ├── allocationEngine.ts
│   │   │   ├── strategyExecutor.ts
│   │   │   ├── dynamicStrategies/
│   │   │   │   ├── dualMomentum.ts
│   │   │   │   ├── gtaa.ts
│   │   │   │   ├── vaa.ts
│   │   │   │   ├── daa.ts
│   │   │   │   ├── laa.ts
│   │   │   │   ├── baa.ts
│   │   │   │   ├── acceleratingDualMomentum.ts
│   │   │   │   ├── vigilantAssetAllocation.ts
│   │   │   │   ├── adaptiveAssetAllocation.ts
│   │   │   │   ├── papaDualMomentum.ts
│   │   │   │   ├── paa.ts
│   │   │   │   ├── compositeAbsoluteMomentum.ts
│   │   │   │   ├── extendedDualMomentum.ts
│   │   │   │   ├── protectiveDualMomentum.ts
│   │   │   │   ├── gpm.ts
│   │   │   │   └── index.ts
│   │   │   └── staticStrategies/
│   │   │       ├── allWeather.ts
│   │   │       ├── sixtyForty.ts
│   │   │       ├── goldenButterfly.ts
│   │   │       ├── permanentPortfolio.ts
│   │   │       └── index.ts
│   │   │
│   │   ├── services/
│   │   │   ├── priceService.ts
│   │   │   ├── storageService.ts
│   │   │   └── shareService.ts
│   │   │
│   │   └── utils/
│   │       ├── formatCurrency.ts
│   │       ├── formatPercent.ts
│   │       ├── dateUtils.ts
│   │       └── mathUtils.ts
│   │
│   ├── data/
│   │   ├── etfs/
│   │   │   ├── kr_etfs.json
│   │   │   ├── kr_pension_etfs.json
│   │   │   └── us_etfs.json
│   │   ├── strategies/
│   │   │   ├── dynamic_strategies.json
│   │   │   └── static_strategies.json
│   │   └── prices/
│   │       └── sample_prices.json
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── AdBanner.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── ScreenWrapper.tsx
│   │   │   ├── SectionHeader.tsx
│   │   │   ├── Disclaimer.tsx
│   │   │   └── EmptyState.tsx
│   │   └── hooks/
│   │       ├── useColorScheme.ts
│   │       └── useFormattedCurrency.ts
│   │
│   ├── constants/
│   │   └── ads.ts
│   │
│   └── types/
│       └── index.ts
│
├── assets/
│   ├── fonts/
│   ├── images/
│   │   ├── icon.png
│   │   ├── splash.png
│   │   └── adaptive-icon.png
│   └── i18n/
│       └── ko.json
│
└── __tests__/
    └── engine/
        ├── momentumCalculator.test.ts
        ├── allocationEngine.test.ts
        └── strategies/
            ├── dualMomentum.test.ts
            └── vaa.test.ts
```

---

## 12. AsyncStorage 키 네이밍

모든 AsyncStorage 키는 `@allocate:` 접두사 통일:

| 키 | 용도 |
|---|---|
| `@allocate:portfolios` | 저장된 포트폴리오 목록 |
| `@allocate:custom_strategies` | 커스텀 정적 전략 목록 |
| `@allocate:settings` | 사용자 설정 (테마, 가격 소스 등) |
| `@allocate:prices` | 캐시된 ETF 가격 데이터 |
| `@allocate:disclaimer_accepted` | 면책조항 동의 여부 |

---

## 13. 환경 설정 (Environment Setup)

```bash
# .env.example — Git에 포함, 실제 값 없이 키만

EXPO_PUBLIC_ADMOB_APP_ANDROID=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
EXPO_PUBLIC_ADMOB_APP_IOS=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
EXPO_PUBLIC_BANNER_STRATEGY=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
EXPO_PUBLIC_BANNER_PORTFOLIO=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
EXPO_PUBLIC_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
```

```typescript
// app.config.ts
import 'dotenv/config';

export default {
  expo: {
    name: 'Allocate',
    slug: 'allocate',
    version: '1.0.0',
    plugins: [
      ['react-native-google-mobile-ads', {
        androidAppId: process.env.EXPO_PUBLIC_ADMOB_APP_ANDROID,
        iosAppId: process.env.EXPO_PUBLIC_ADMOB_APP_IOS,
      }],
    ],
  },
};
```

---

## 14. 개발 규칙 및 금지사항

### 반드시 지켜야 할 규칙 ✅

1. **UI 텍스트는 한국어 기본** — ETF 티커, 전략 원어명은 영문 병기 가능
2. **최소 터치 영역 44px** — 모든 인터랙티브 요소
3. **API 키는 절대 코드에 하드코딩 금지** — .env + EAS Secrets 사용
4. **금액 표시 시 천 단위 쉼표 필수** — `1,000,000원`
5. **면책조항 항상 표시** — 계산 결과 화면에 필수
6. **AsyncStorage 키 네이밍**: `@allocate:{key}` 형식 통일
7. **전략 엔진은 순수 함수** — React 의존성 없이 `src/core/engine/`에 격리
8. **모든 계산은 정수 주식 수** — 소수점 주식 매수 불가 (잔여 현금으로 표시)

### 금지사항 ❌

- 회원가입/로그인 화면 구현
- 투자 수익률 예측/보장하는 문구 사용
- 전면 광고를 세션당 2회 이상 표시
- 결과/상세 화면에 광고 배치
- ETF 가격 데이터를 캐시 없이 매번 API 호출
- 소수점 주식 수량 표시 (한국/미국 모두 정수 단위)

---

## 15. 검증 체크리스트

### 코드 품질
- [ ] `npx tsc --noEmit` — TypeScript 오류 0개
- [ ] 금액 포맷 천 단위 쉼표 확인
- [ ] 면책조항 누락 없음

### 빌드
- [ ] `npx expo export --platform web` 성공
- [ ] 번들 크기 이전 대비 +20% 이하

### 기능
- [ ] 모든 정적 전략: 비중 합계 = 100%
- [ ] 모든 동적 전략: 모멘텀 스코어 계산 정확
- [ ] 매수 수량 × 가격 + 잔여 현금 = 총 투자 금액
- [ ] 3개 ETF 유니버스 각각 정상 동작

---

*이 문서는 Allocate 개발의 단일 진실 공급원(Single Source of Truth)입니다. 새로운 기능 추가 시 이 문서를 먼저 업데이트하세요.*
