# ETF 가격 데이터 아키텍처

> 최종 업데이트: 2026-03-28

---

## 1. 아키텍처 개요

```
┌─────────────────┐     cron (매일)     ┌──────────────┐
│  Twelve Data API │ ◄──────────────── │ GitHub Actions │
│  (가격 데이터)    │                    │ (fetch-prices) │
└─────────────────┘                    └──────┬───────┘
                                              │ JSON 파일
                                              ▼
                                    ┌──────────────────┐
                                    │   GitHub Pages    │
                                    │  (gh-pages 브랜치) │
                                    │  /prices/SPY.json │
                                    └──────┬───────────┘
                                           │ HTTP GET
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                          [웹 앱]     [iOS 앱]    [Android 앱]
```

**핵심 원칙:**
- 앱에서 직접 API 호출하지 않음 (API 키 노출 방지)
- GitHub Actions가 매일 데이터 수집 → GitHub Pages로 정적 호스팅
- 앱은 GitHub Pages에서 JSON 파일만 HTTP GET

---

## 2. 설정 방법 (Step by Step)

### Step 1: Twelve Data API 키 발급

1. https://twelvedata.com 가입 (무료)
2. Dashboard → API Keys에서 키 복사

### Step 2: GitHub Secrets 설정

1. GitHub 리포지토리 → Settings → Secrets and variables → Actions
2. **New repository secret** 클릭
3. Name: `TWELVE_DATA_API_KEY`
4. Value: Step 1에서 복사한 API 키
5. **Add secret** 클릭

### Step 3: GitHub Pages 활성화

1. GitHub 리포지토리 → Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: `gh-pages` / `/ (root)`
4. **Save** 클릭

### Step 4: 첫 실행 (수동)

1. GitHub 리포지토리 → Actions 탭
2. 왼쪽에서 **"Update ETF Prices"** 워크플로우 선택
3. **Run workflow** → **Run workflow** 클릭
4. 약 5~10분 후 완료
5. 확인: `https://{username}.github.io/{repo}/prices/manifest.json` 접속

### Step 5: 자동 실행 확인

- 워크플로우는 **매일 UTC 22:00 (한국시간 오전 7시)** 에 자동 실행
- 월~금만 실행 (주말 미국 장 휴장)
- Actions 탭에서 실행 이력 확인 가능

---

## 3. 파일 구조

### GitHub Actions 워크플로우

```
.github/workflows/update-prices.yml
```

- **트리거**: cron (월~금 UTC 22:00) + 수동 (workflow_dispatch)
- **동작**: `scripts/fetch-prices.mjs` 실행 → `gh-pages` 브랜치에 배포

### 데이터 수집 스크립트

```
scripts/fetch-prices.mjs
```

- Twelve Data API에서 52주 주간 종가 데이터 fetch
- US ETF 21종 + KR ETF 31종 = 총 52종
- 6개씩 병렬 처리, 배치 간 12초 대기 (8 req/min 제한)
- 출력: `data/prices/{TICKER}.json` + `data/prices/manifest.json`

### 출력 JSON 형식

```json
// data/prices/SPY.json
{
  "ticker": "SPY",
  "prices": [
    { "date": "2025-04-04", "close": 485.12 },
    { "date": "2025-04-11", "close": 490.35 },
    ...
    { "date": "2026-03-27", "close": 522.50 }
  ],
  "fetchedAt": "2026-03-28T22:05:00.000Z"
}
```

- `prices`: 오래된 순 → 최신순 (oldest first)
- 약 60개 데이터 포인트 (60주)

### 매니페스트

```json
// data/prices/manifest.json
{
  "tickers": ["SPY", "EFA", "EEM", ...],
  "updatedAt": "2026-03-28T22:05:00.000Z",
  "count": 48,
  "failed": [{ "ticker": "XXX", "error": "..." }]
}
```

---

## 4. 앱에서의 데이터 사용

### priceService.ts

```typescript
// GitHub Pages에서 가격 데이터 fetch
const url = 'https://teikyungkim.github.io/Allocate/prices/SPY.json';

// 앱 내 6시간 캐시 (AsyncStorage)
// GitHub Pages 데이터는 매일 갱신되므로 6시간 TTL 충분
```

### 커스텀 URL 설정 (선택)

`.env` 파일에서 데이터 URL 오버라이드 가능:
```
EXPO_PUBLIC_PRICE_DATA_URL=https://custom-domain.com/prices
```

---

## 5. 비용

| 항목 | 비용 |
|---|---|
| Twelve Data API | 무료 (800 req/일) |
| GitHub Actions | 무료 (public 무제한, private 2000분/월) |
| GitHub Pages | 무료 (100GB 대역폭/월) |
| **합계** | **$0** |

---

## 6. 대상 티커 목록

### 미국 ETF (21종)
SPY, VOO, IVV, EFA, EEM, TLT, AGG, BND, IEF, SHY, GLD, IAU, DBC, VNQ, QQQ, VTV, VBR, BIL, SCHD, HYG, LQD

### 한국 ETF (31종, 중복 제거)
360750, 379800, 195930, 195980, 304660, 451540, 308620, 305080, 153130, 214330, 132030, 411060, 261220, 352560, 133690, 429760, 458730, 381180, 161510, 251350, 289040, 453850, 453810, 182490, 272580, 352540, 379810, 459580, 261060, 278530, 069500

---

## 7. 트러블슈팅

### GitHub Actions 실패 시

1. Actions 탭에서 실패한 run 클릭
2. 로그에서 에러 확인
3. 흔한 원인:
   - `TWELVE_DATA_API_KEY` secret 미설정
   - API 키 만료/무효
   - Twelve Data 서버 일시 장애

### 데이터가 앱에 표시되지 않을 때

1. `https://{username}.github.io/{repo}/prices/manifest.json` 접속 확인
2. 404 → GitHub Pages 미활성화 또는 gh-pages 브랜치 없음
3. JSON 정상 → 앱의 캐시 문제 → AsyncStorage 초기화

### 특정 티커 데이터 없음

- Twelve Data에서 해당 티커 미지원 가능
- `manifest.json`의 `failed` 배열 확인
- 한국 ETF는 티커 형식이 숫자만 (예: `069500`, 앞의 0 포함)

---

## 8. 이전 방식과 비교

| 항목 | 이전 (앱 → API 직접) | 현재 (GitHub Pages) |
|---|---|---|
| API 키 위치 | 앱 .env (노출 위험) | GitHub Secrets (안전) |
| CORS | 문제 없음 | 문제 없음 |
| 레이트 리밋 | 사용자별 800/일 | 서버 1회/일 (무제한 사용자) |
| 오프라인 | 캐시 의존 | 캐시 의존 (동일) |
| 비용 | 무료 | 무료 |
| 데이터 신선도 | 실시간 | 매일 갱신 (충분) |
