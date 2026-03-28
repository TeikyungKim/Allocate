/**
 * Strategy executor - dispatches to the correct strategy logic.
 *
 * For dynamic strategies, since we don't have real-time price data,
 * we use the default allocations as the "current recommendation".
 * In a production app, this would fetch historical data and run
 * the actual momentum/SMA calculations.
 */

import { Strategy, StrategyAllocation } from '../../data/strategies';
import { ETFUniverse } from '../../data/etfs';
import { AllocationResult, calculateAllocation } from './allocationEngine';

export interface StrategySignal {
  strategyId: string;
  allocations: StrategyAllocation[];
  reasoning: string;
  timestamp: string;
}

/**
 * Execute a strategy and get current recommended allocations.
 * For static strategies, returns default allocations directly.
 * For dynamic strategies, returns simulated signal based on strategy rules.
 */
export function executeStrategy(strategy: Strategy): StrategySignal {
  if (strategy.type === 'static') {
    return {
      strategyId: strategy.id,
      allocations: strategy.defaultAllocations,
      reasoning: '정적 전략: 고정 비중 배분',
      timestamp: new Date().toISOString(),
    };
  }

  // Dynamic strategy execution
  const config = strategy.dynamicConfig;
  if (!config) {
    return {
      strategyId: strategy.id,
      allocations: strategy.defaultAllocations,
      reasoning: '동적 전략 설정 없음, 기본 배분 사용',
      timestamp: new Date().toISOString(),
    };
  }

  // Since we don't have real price data, return a simulated recommendation
  // based on the strategy's method
  const signal = getSimulatedSignal(strategy);
  return signal;
}

function getSimulatedSignal(strategy: Strategy): StrategySignal {
  const config = strategy.dynamicConfig!;

  switch (config.method) {
    case 'dual-momentum':
    case 'adm':
    case 'cam':
    case 'edm':
      return {
        strategyId: strategy.id,
        allocations: strategy.defaultAllocations,
        reasoning: `${strategy.name}: 모멘텀 계산에는 실시간 가격 데이터가 필요합니다. 현재는 기본 배분(공격자산)을 표시합니다.`,
        timestamp: new Date().toISOString(),
      };

    case 'gtaa':
      return {
        strategyId: strategy.id,
        allocations: strategy.defaultAllocations,
        reasoning: 'GTAA: SMA 필터링에는 실시간 가격 데이터가 필요합니다. 전체 자산 동일비중 배분을 표시합니다.',
        timestamp: new Date().toISOString(),
      };

    case 'vaa':
    case 'vigilant':
      return {
        strategyId: strategy.id,
        allocations: strategy.defaultAllocations,
        reasoning: 'VAA: 13612W 모멘텀 계산에는 실시간 가격 데이터가 필요합니다. 공격자산 기본 배분을 표시합니다.',
        timestamp: new Date().toISOString(),
      };

    case 'daa':
    case 'baa':
      return {
        strategyId: strategy.id,
        allocations: strategy.defaultAllocations,
        reasoning: '카나리아 모멘텀 감지에는 실시간 가격 데이터가 필요합니다. 기본 배분을 표시합니다.',
        timestamp: new Date().toISOString(),
      };

    case 'laa':
      return {
        strategyId: strategy.id,
        allocations: strategy.defaultAllocations,
        reasoning: 'LAA: 실업률 데이터가 필요합니다. 기본 25% 균등 배분을 표시합니다.',
        timestamp: new Date().toISOString(),
      };

    case 'paa':
    case 'pdm':
    case 'gpm':
      return {
        strategyId: strategy.id,
        allocations: strategy.defaultAllocations,
        reasoning: '브레드스/보호 모멘텀 계산에는 실시간 가격 데이터가 필요합니다. 기본 배분을 표시합니다.',
        timestamp: new Date().toISOString(),
      };

    case 'aaa':
      return {
        strategyId: strategy.id,
        allocations: strategy.defaultAllocations,
        reasoning: 'AAA: 모멘텀 + 최소분산 최적화에는 실시간 가격 데이터가 필요합니다. 동일비중 배분을 표시합니다.',
        timestamp: new Date().toISOString(),
      };

    case 'papa-dm':
      return {
        strategyId: strategy.id,
        allocations: strategy.defaultAllocations,
        reasoning: 'Papa DM: 다중 레그별 모멘텀 계산에는 실시간 가격 데이터가 필요합니다. 기본 배분을 표시합니다.',
        timestamp: new Date().toISOString(),
      };

    default:
      return {
        strategyId: strategy.id,
        allocations: strategy.defaultAllocations,
        reasoning: '기본 배분을 표시합니다.',
        timestamp: new Date().toISOString(),
      };
  }
}

/**
 * Execute strategy and calculate final allocation with share counts
 */
export function executeAndCalculate(
  strategy: Strategy,
  universe: ETFUniverse,
  totalAmount: number,
  universeType: 'korea' | 'retirement' | 'us',
): { signal: StrategySignal; result: AllocationResult } {
  const signal = executeStrategy(strategy);

  // Create a temporary strategy with the signal's allocations
  const effectiveStrategy: Strategy = {
    ...strategy,
    defaultAllocations: signal.allocations,
  };

  const result = calculateAllocation(effectiveStrategy, universe, totalAmount, universeType);
  return { signal, result };
}
