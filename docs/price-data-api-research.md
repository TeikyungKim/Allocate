# ETF 실시간 가격 데이터 API 조사 및 구현 가이드

> 조사일: 2026-03-28 | 동적 전략 모멘텀 계산용 과거 가격 데이터 확보 방안

---

## 1. 요구사항

동적 자산배분 전략(VAA, DAA, Dual Momentum 등)의 모멘텀 스코어 계산에는 최소 **12개월 과거 가격 이력**이 필요합니다.

| 필요 데이터 | 설명 |
|---|---|
| 1/3/6/12개월 수익률 | R_1m, R_3m, R_6m, R_12m |
| 13612W 스코어 | 12×R_1m + 4×R_3m + 2×R_6m + 1×R_12m |
| SMA (10개월) | 10개월간 종가 평균 |
| 대상 티커 | US: SPY, EFA, EEM, AGG, TLT, GLD, QQQ 등 (~20종) |
| | KR: 069500, 360750, 308620 등 (~20종) |

---

## 2. API 비교 분석

### Twelve Data (선택됨)

| 항목 | 내용 |
|---|---|
| URL | `https://api.twelvedata.com/time_series` |
| 무료 한도 | **800회/일, 8회/분** |
| CORS | **지원** (`access-control-allow-origin: *`) — 웹에서 직접 호출 가능 |
| API 키 | 필요 (무료 가입, 즉시 발급: twelvedata.com) |
| 한국 ETF | **지원** (KRX 거래소, 티커: `069500`, `360750` 등) |
| 미국 ETF | **지원** (SPY, EFA, AGG 등 전체) |
| 데이터 깊이 | 10년+ |
| 인터벌 | 1day, 1week, 1month, 분봉 |

**예시 요청:**
```
GET https://api.twelvedata.com/time_series?symbol=SPY&interval=1week&outputsize=52&apikey=YOUR_KEY
```

**응답 포맷:**
```json
{
  "meta": { "symbol": "SPY", "interval": "1week" },
  "values": [
    { "datetime": "2026-03-27", "close": "522.50", "open": "520", "high": "525", "low": "515", "volume": "..." },
    ...
  ]
}
```
- values는 최신순 정렬 (newest first)
- close는 문자열 → parseFloat 필요

### Yahoo Finance (비공식)

| 항목 | 내용 |
|---|---|
| URL | `https://query1.finance.yahoo.com/v8/finance/chart/SPY?range=1y&interval=1wk` |
| 무료 한도 | 비공식, 레이트 리밋 있음 |
| CORS | **미지원** — 서버 프록시 필요 |
| API 키 | 불필요 |
| 한국 ETF | 지원 (`069500.KS` 형식) |
| 안정성 | 비공식 API, 언제든 변경/차단 가능 |

### Alpha Vantage

| 항목 | 내용 |
|---|---|
| URL | `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=SPY&apikey=KEY` |
| 무료 한도 | **25회/일** — 매우 적음 |
| CORS | **미지원** |
| 한국 ETF | 미지원 (추정) |
| 결론 | 한도 부족, CORS 미지원 → 부적합 |

### Finnhub

| 항목 | 내용 |
|---|---|
| URL | `https://finnhub.io/api/v1/stock/candle?symbol=SPY&resolution=W&from=...&to=...&token=KEY` |
| 무료 한도 | **60회/분** (일 한도 없음) |
| CORS | **지원** |
| 한국 ETF | 미확인 |
| 결론 | CORS OK, 관대한 한도, 한국 ETF 미지원 가능 |

### Financial Modeling Prep

| 항목 | 내용 |
|---|---|
| 무료 한도 | 250회/일 |
| CORS | 미확인 |
| 한국 ETF | 미확인 |
| 결론 | 보조 옵션 |

### KRX Open API (한국거래소 공식)

| 항목 | 내용 |
|---|---|
| URL | https://openapi.krx.co.kr/ |
| 가입 | 승인 필요 (최대 1일) |
| 데이터 | 한국 주식/ETF 공식 데이터 |
| 결론 | 한국 ETF 전용 보조 소스 |

---

## 3. 선택: Twelve Data

**이유:**
1. CORS 지원 → 웹에서 프록시 없이 직접 호출
2. 한국 + 미국 ETF 모두 지원 → 단일 API로 통합
3. 무료 800회/일 → ~20개 전략 × ~15 티커 = 300회/세션, 하루 2-3회 충분
4. 즉시 사용 가능 (가입 후 바로 키 발급)

**레이트 리밋 대응:**
- AsyncStorage에 24시간 TTL 캐시
- 6개씩 병렬 fetch + 8초 간격 (8/min 제한)
- 사용자가 명시적으로 새로고침할 때만 재fetch

---

## 4. 구현 상세

### 파일 구조

```
src/services/priceService.ts     ← API 호출 + 캐시 + 모멘텀 계산
src/hooks/usePriceData.ts        ← React hook (fetch + state 관리)
src/ui/screens/strategy/FormulaExplainer.tsx  ← UI에서 실시간 값 표시
```

### 설정 방법

1. https://twelvedata.com 가입 (무료)
2. API Key 복사
3. `.env` 파일에 추가:
   ```
   EXPO_PUBLIC_TWELVE_DATA_API_KEY=your_api_key_here
   ```
4. 앱 재시작 → 전략 상세 화면에서 자동으로 데이터 로드

### 모멘텀 계산 방식

주간 종가 데이터 52주분을 받아서:

```
R_Nm = (현재 종가 - N개월전 종가) / N개월전 종가
     = (prices[latest] - prices[latest - N*4]) / prices[latest - N*4]

13612W = 12 × R_1m + 4 × R_3m + 2 × R_6m + 1 × R_12m

SMA_10m = mean(최근 40주 종가)
```

### 캐시 전략

| 키 형식 | TTL | 내용 |
|---|---|---|
| `@allocate:prices:SPY` | 24시간 | 52주 주간 종가 + fetchedAt |
| `@allocate:prices:069500` | 24시간 | 한국 ETF 동일 |

### 한국 ETF 티커 매핑

Twelve Data에서 한국 ETF는 숫자 티커 그대로 사용:

| 앱 내 티커 | Twelve Data 티커 |
|---|---|
| 360750 | 360750 |
| 069500 | 069500 |
| 308620 | 308620 |

---

## 5. 제한사항 및 향후 개선

### 현재 제한

1. **무료 한도 800회/일**: 개인 사용에는 충분하나 다수 사용자 시 서버 프록시 + 캐시 서버 필요
2. **주간 데이터**: 월간 수익률 계산 시 ±1주 오차 가능 (주간 4주 = 28일 ≈ 1개월)
3. **실시간 아님**: 최신 데이터는 전일 또는 전주 종가

### 향후 개선 방향

1. **서버 프록시 도입**: Firebase Functions 또는 Vercel Edge Functions로 API 호출 중앙화
2. **일간 데이터**: 정밀 계산을 위해 `interval=1day&outputsize=252` 사용 (API 크레딧 동일)
3. **자동 리밸런싱 알림**: 모멘텀 변화 감지 시 푸시 알림
4. **Yahoo Finance 폴백**: Twelve Data 장애 시 Yahoo Finance (native만) 자동 전환

---

## 6. Google Sheets 방식 참고

사용자가 제시한 Google Sheets 공식:
```
=GoogleFinance(C12, "close", TODAY()-450, TODAY(), "weekly")
```

이는 Google Finance의 과거 가격 데이터를 주간 단위로 가져오는 방식입니다.
- `TODAY()-450`: 약 15개월 전부터
- `"weekly"`: 주간 종가
- 인덱스 접근으로 특정 시점 가격 비교

Twelve Data API가 동일한 역할을 하며, 앱 내에서 프로그래밍적으로 접근 가능합니다.
