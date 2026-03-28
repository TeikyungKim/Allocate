import { ETFInfo } from './types';

export const koreaETFs: ETFInfo[] = [
  // 미국주식
  { ticker: '360750', name: 'TIGER 미국S&P500', assetClass: '미국주식', price: 19800, currency: 'KRW', aum: 78000 },
  { ticker: '379800', name: 'KODEX 미국S&P500', assetClass: '미국주식', price: 16500, currency: 'KRW', aum: 42000 },
  // 선진국주식
  { ticker: '195930', name: 'TIGER 선진국MSCI World', assetClass: '선진국주식', price: 17500, currency: 'KRW', aum: 3200 },
  // 신흥국주식
  { ticker: '195980', name: 'TIGER 신흥국MSCI', assetClass: '신흥국주식', price: 12000, currency: 'KRW', aum: 1800 },
  // 장기채
  { ticker: '304660', name: 'KODEX 미국채울트라30년선물(H)', assetClass: '장기채', price: 5200, currency: 'KRW', aum: 8500 },
  { ticker: '451540', name: 'TIGER 미국채30년스트립액티브', assetClass: '장기채', price: 7800, currency: 'KRW', aum: 3200 },
  // 미국채권
  { ticker: '308620', name: 'KODEX 미국채10년선물', assetClass: '미국채권', price: 11500, currency: 'KRW', aum: 6200 },
  // 중기채
  { ticker: '305080', name: 'TIGER 미국채10년선물', assetClass: '중기채', price: 10800, currency: 'KRW', aum: 4100 },
  // 단기채
  { ticker: '153130', name: 'KODEX 단기채권', assetClass: '단기채', price: 110500, currency: 'KRW', aum: 15000 },
  { ticker: '214330', name: 'KODEX 단기채권PLUS', assetClass: '단기채', price: 105200, currency: 'KRW', aum: 8500 },
  // 금
  { ticker: '132030', name: 'KODEX 골드선물(H)', assetClass: '금', price: 18500, currency: 'KRW', aum: 5800 },
  { ticker: '411060', name: 'ACE KRX금현물', assetClass: '금', price: 18000, currency: 'KRW', aum: 4200 },
  // 원자재
  { ticker: '261220', name: 'KODEX WTI원유선물(H)', assetClass: '원자재', price: 5800, currency: 'KRW', aum: 2100 },
  // 리츠
  { ticker: '352560', name: 'TIGER 미국MSCI리츠(합성H)', assetClass: '리츠', price: 9800, currency: 'KRW', aum: 3500 },
  // 나스닥
  { ticker: '133690', name: 'TIGER 미국나스닥100', assetClass: '나스닥', price: 15200, currency: 'KRW', aum: 52000 },
  { ticker: '429760', name: 'KODEX 미국나스닥100TR', assetClass: '나스닥', price: 14800, currency: 'KRW', aum: 12000 },
  // 미국배당
  { ticker: '458730', name: 'ACE 미국배당다우존스', assetClass: '미국배당', price: 13000, currency: 'KRW', aum: 5200 },
  // 소형가치주
  { ticker: '381180', name: 'TIGER 미국러셀2000', assetClass: '소형가치주', price: 14800, currency: 'KRW', aum: 2800 },
  { ticker: '161510', name: 'TIGER 중소형주', assetClass: '소형가치주', price: 14500, currency: 'KRW', aum: 1200 },
];
