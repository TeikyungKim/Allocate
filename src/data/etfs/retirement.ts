import { ETFInfo } from './types';

export const retirementETFs: ETFInfo[] = [
  // 미국주식
  { ticker: '379800', name: 'KODEX 미국S&P500', assetClass: '미국주식', price: 16500, currency: 'KRW', aum: 42000 },
  { ticker: '360750', name: 'TIGER 미국S&P500', assetClass: '미국주식', price: 19800, currency: 'KRW', aum: 78000 },
  // 선진국주식
  { ticker: '251350', name: 'ACE 선진국MSCI World', assetClass: '선진국주식', price: 16200, currency: 'KRW', aum: 2800 },
  // 신흥국주식
  { ticker: '289040', name: 'KODEX MSCI EM', assetClass: '신흥국주식', price: 10200, currency: 'KRW', aum: 1500 },
  // 장기채
  { ticker: '453850', name: 'KODEX 미국채울트라30년선물(H)', assetClass: '장기채', price: 5200, currency: 'KRW', aum: 4500 },
  // 미국채권
  { ticker: '453810', name: 'ACE 미국채30년액티브(H)', assetClass: '미국채권', price: 9800, currency: 'KRW', aum: 3200 },
  // 중기채
  { ticker: '308620', name: 'KODEX 미국채10년선물', assetClass: '중기채', price: 11500, currency: 'KRW', aum: 6200 },
  // 단기채
  { ticker: '182490', name: 'TIGER 단기채권액티브', assetClass: '단기채', price: 105200, currency: 'KRW', aum: 7800 },
  { ticker: '272580', name: 'TIGER 단기채권액티브', assetClass: '단기채', price: 104800, currency: 'KRW', aum: 3500 },
  // 금
  { ticker: '411060', name: 'ACE KRX금현물', assetClass: '금', price: 18000, currency: 'KRW', aum: 4200 },
  { ticker: '132030', name: 'KODEX 골드선물(H)', assetClass: '금', price: 18500, currency: 'KRW', aum: 5800 },
  // 리츠
  { ticker: '352540', name: 'KODEX 다우존스리츠(H)', assetClass: '리츠', price: 9200, currency: 'KRW', aum: 2800 },
  // 나스닥
  { ticker: '379810', name: 'KODEX 미국나스닥100TR', assetClass: '나스닥', price: 14800, currency: 'KRW', aum: 18000 },
  // 미국배당
  { ticker: '459580', name: 'KODEX 미국배당다우존스TR', assetClass: '미국배당', price: 12200, currency: 'KRW', aum: 3800 },
  // 소형가치주
  { ticker: '161510', name: 'TIGER 중소형주', assetClass: '소형가치주', price: 14800, currency: 'KRW', aum: 1200 },
  // 원자재
  { ticker: '261220', name: 'KODEX WTI원유선물(H)', assetClass: '원자재', price: 5800, currency: 'KRW', aum: 2100 },
];
