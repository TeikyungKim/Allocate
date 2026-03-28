import { koreaETFs } from './korea';
import { retirementETFs } from './retirement';
import { usETFs } from './us';
import { ETFInfo, ETFUniverse } from './types';

export { type ETFInfo, type ETFUniverse } from './types';

function toUniverse(etfs: ETFInfo[]): ETFUniverse {
  const map: ETFUniverse = {};
  for (const etf of etfs) {
    map[etf.assetClass] = etf;
  }
  return map;
}

export function getETFUniverse(universe: 'korea' | 'retirement' | 'us'): ETFUniverse {
  switch (universe) {
    case 'korea': return toUniverse(koreaETFs);
    case 'retirement': return toUniverse(retirementETFs);
    case 'us': return toUniverse(usETFs);
  }
}

export function getETFList(universe: 'korea' | 'retirement' | 'us'): ETFInfo[] {
  switch (universe) {
    case 'korea': return koreaETFs;
    case 'retirement': return retirementETFs;
    case 'us': return usETFs;
  }
}
