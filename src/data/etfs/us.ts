import { ETFInfo } from './types';

export const usETFs: ETFInfo[] = [
  { ticker: 'SPY', name: 'SPDR S&P 500', assetClass: '미국주식', price: 520, currency: 'USD' },
  { ticker: 'EFA', name: 'iShares MSCI EAFE', assetClass: '선진국주식', price: 82, currency: 'USD' },
  { ticker: 'EEM', name: 'iShares MSCI EM', assetClass: '신흥국주식', price: 44, currency: 'USD' },
  { ticker: 'TLT', name: 'iShares 20+ Year Treasury', assetClass: '장기채', price: 92, currency: 'USD' },
  { ticker: 'AGG', name: 'iShares Core US Aggregate', assetClass: '미국채권', price: 100, currency: 'USD' },
  { ticker: 'IEF', name: 'iShares 7-10 Year Treasury', assetClass: '중기채', price: 97, currency: 'USD' },
  { ticker: 'SHY', name: 'iShares 1-3 Year Treasury', assetClass: '단기채', price: 82, currency: 'USD' },
  { ticker: 'GLD', name: 'SPDR Gold Shares', assetClass: '금', price: 225, currency: 'USD' },
  { ticker: 'DBC', name: 'Invesco DB Commodity', assetClass: '원자재', price: 22, currency: 'USD' },
  { ticker: 'VNQ', name: 'Vanguard Real Estate', assetClass: '리츠', price: 88, currency: 'USD' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', assetClass: '나스닥', price: 450, currency: 'USD' },
  { ticker: 'VTV', name: 'Vanguard Value', assetClass: '미국가치', price: 165, currency: 'USD' },
  { ticker: 'VBR', name: 'Vanguard Small-Cap Value', assetClass: '소형가치주', price: 185, currency: 'USD' },
  { ticker: 'BIL', name: 'SPDR 1-3 Month T-Bill', assetClass: '현금', price: 91, currency: 'USD' },
  { ticker: 'SCHD', name: 'Schwab US Dividend', assetClass: '미국배당', price: 82, currency: 'USD' },
];
