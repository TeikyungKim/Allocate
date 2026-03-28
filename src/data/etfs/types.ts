export interface ETFInfo {
  ticker: string;
  name: string;
  assetClass: string;
  price: number;           // 대략적 기준가
  currency: 'KRW' | 'USD';
  aum?: number;            // 운용규모 (억원 or $M) — 기본 ETF 선택 기준
}

export type ETFUniverse = Record<string, ETFInfo>; // key = assetClass (기본 ETF만)
