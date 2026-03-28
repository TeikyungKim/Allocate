import { Strategy, StrategyAllocation } from '../../data/strategies';
import { ETFUniverse, ETFInfo } from '../../data/etfs';

export interface AllocationResult {
  allocations: {
    ticker: string;
    name: string;
    assetClass: string;
    weight: number;
    targetAmount: number;
    shares: number;
    amount: number;
  }[];
  totalInvested: number;
  remainder: number;
}

/**
 * Find the best matching ETF for an asset class.
 * Tries exact match first, then falls back to related mappings.
 */
function findETF(universe: ETFUniverse, assetClass: string): ETFInfo | null {
  if (universe[assetClass]) return universe[assetClass];

  // Fallback mappings for asset classes that may not have exact matches
  const fallbacks: Record<string, string[]> = {
    '현금': ['단기채', '미국채권'],
    '미국주식H': ['미국주식'],
    '미국주식TR': ['미국주식'],
    '나스닥': ['미국주식'],
    '미국배당': ['미국주식'],
    '미국가치': ['미국주식'],
    '원자재': ['금'],
    '중기채': ['미국채권', '단기채'],
  };

  const candidates = fallbacks[assetClass] || [];
  for (const candidate of candidates) {
    if (universe[candidate]) return universe[candidate];
  }

  return null;
}

/**
 * Convert strategy allocations (weights) to actual share counts.
 *
 * @param strategy - The strategy definition
 * @param universe - ETF universe to use
 * @param totalAmount - Total investment amount
 * @param universeType - 'korea' | 'retirement' | 'us'
 */
export function calculateAllocation(
  strategy: Strategy,
  universe: ETFUniverse,
  totalAmount: number,
  universeType: 'korea' | 'retirement' | 'us',
): AllocationResult {
  const allocations: AllocationResult['allocations'] = [];

  // Normalize weights to ensure they sum to 100
  const totalWeight = strategy.defaultAllocations.reduce((sum, a) => sum + a.weight, 0);

  for (const alloc of strategy.defaultAllocations) {
    const normalizedWeight = (alloc.weight / totalWeight) * 100;
    const etf = findETF(universe, alloc.assetClass);
    if (!etf) continue;

    const targetAmount = (totalAmount * normalizedWeight) / 100;
    const shares = Math.floor(targetAmount / etf.price);
    const actualAmount = shares * etf.price;

    allocations.push({
      ticker: etf.ticker,
      name: etf.name,
      assetClass: alloc.assetClass,
      weight: normalizedWeight,
      targetAmount,
      shares,
      amount: actualAmount,
    });
  }

  const totalInvested = allocations.reduce((sum, a) => sum + a.amount, 0);
  const remainder = totalAmount - totalInvested;

  return { allocations, totalInvested, remainder };
}

/**
 * Calculate allocation from custom weights (for custom strategies)
 */
export function calculateCustomAllocation(
  customAllocations: StrategyAllocation[],
  universe: ETFUniverse,
  totalAmount: number,
  universeType: 'korea' | 'retirement' | 'us',
): AllocationResult {
  const fakeStrategy: Strategy = {
    id: 'custom',
    name: 'Custom',
    type: 'static',
    description: '',
    defaultAllocations: customAllocations,
  };
  return calculateAllocation(fakeStrategy, universe, totalAmount, universeType);
}
