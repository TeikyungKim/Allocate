export interface ETFInfo {
  ticker: string;
  name: string;
  assetClass: string;
  price: number;           // 대략적 기준가
  currency: 'KRW' | 'USD';
}

export type ETFUniverse = Record<string, ETFInfo>; // key = assetClass
