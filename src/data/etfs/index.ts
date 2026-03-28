import { koreaETFs } from './korea';
import { retirementETFs } from './retirement';
import { usETFs } from './us';
import { ETFInfo, ETFUniverse } from './types';

export { type ETFInfo, type ETFUniverse } from './types';

type UniverseKey = 'korea' | 'retirement' | 'us';

function getRawList(universe: UniverseKey): ETFInfo[] {
  switch (universe) {
    case 'korea': return koreaETFs;
    case 'retirement': return retirementETFs;
    case 'us': return usETFs;
  }
}

/**
 * 기본 ETF 맵 (자산군당 AUM 최대 1개)
 */
function toUniverse(etfs: ETFInfo[]): ETFUniverse {
  const map: ETFUniverse = {};
  for (const etf of etfs) {
    const existing = map[etf.assetClass];
    if (!existing || (etf.aum ?? 0) > (existing.aum ?? 0)) {
      map[etf.assetClass] = etf;
    }
  }
  return map;
}

/**
 * 기본 ETF 맵 반환 (자산군별 AUM 최대 ETF)
 */
export function getETFUniverse(universe: UniverseKey): ETFUniverse {
  return toUniverse(getRawList(universe));
}

/**
 * 전체 ETF 목록 반환
 */
export function getETFList(universe: UniverseKey): ETFInfo[] {
  return getRawList(universe);
}

/**
 * 자산군별 선택 가능한 ETF 목록 (AUM 내림차순 정렬)
 */
export function getETFsByAssetClass(universe: UniverseKey): Record<string, ETFInfo[]> {
  const etfs = getRawList(universe);
  const map: Record<string, ETFInfo[]> = {};
  for (const etf of etfs) {
    if (!map[etf.assetClass]) map[etf.assetClass] = [];
    map[etf.assetClass].push(etf);
  }
  // AUM 내림차순 정렬
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => (b.aum ?? 0) - (a.aum ?? 0));
  }
  return map;
}

/**
 * 사용자 ETF 선택을 반영한 유니버스 맵 생성
 * @param universe - 유니버스 키
 * @param overrides - { assetClass: ticker } 사용자가 선택한 ETF 오버라이드
 */
export function getCustomETFUniverse(
  universe: UniverseKey,
  overrides: Record<string, string>,
): ETFUniverse {
  const defaultMap = getETFUniverse(universe);
  const allETFs = getRawList(universe);

  for (const [assetClass, ticker] of Object.entries(overrides)) {
    const etf = allETFs.find((e) => e.ticker === ticker && e.assetClass === assetClass);
    if (etf) {
      defaultMap[assetClass] = etf;
    }
  }
  return defaultMap;
}
