import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PortfolioAllocation {
  ticker: string;
  name: string;
  assetClass: string;
  weight: number;
  shares: number;
  amount: number;
}

export interface HoldingEntry {
  ticker: string;
  shares: number;
}

export interface SavedPortfolio {
  id: string;
  name: string;
  strategyId: string;
  universe: 'korea' | 'retirement' | 'us';
  investmentAmount: number;
  allocations: PortfolioAllocation[];
  holdings?: HoldingEntry[];         // 보유 주식 수량
  tolerancePercent?: number;         // 허용 괴리율 (%)
  etfOverrides?: Record<string, string>; // { assetClass: ticker } ETF 선택 오버라이드
  createdAt: string;
  updatedAt?: string;
}

export interface CustomStrategy {
  id: string;
  name: string;
  allocations: { assetClass: string; weight: number }[];
  createdAt: string;
}

interface PortfolioContextType {
  portfolios: SavedPortfolio[];
  customStrategies: CustomStrategy[];
  savePortfolio: (p: SavedPortfolio) => Promise<void>;
  updatePortfolio: (p: SavedPortfolio) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  saveCustomStrategy: (s: CustomStrategy) => Promise<void>;
  deleteCustomStrategy: (id: string) => Promise<void>;
  loading: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

const PORTFOLIOS_KEY = 'portfolios';
const CUSTOM_STRATEGIES_KEY = 'customStrategies';

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([]);
  const [customStrategies, setCustomStrategies] = useState<CustomStrategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(PORTFOLIOS_KEY),
      AsyncStorage.getItem(CUSTOM_STRATEGIES_KEY),
    ]).then(([p, c]) => {
      if (p) setPortfolios(JSON.parse(p));
      if (c) setCustomStrategies(JSON.parse(c));
      setLoading(false);
    });
  }, []);

  const savePortfolio = useCallback(async (p: SavedPortfolio) => {
    const updated = [...portfolios.filter((x) => x.id !== p.id), p];
    setPortfolios(updated);
    await AsyncStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(updated));
  }, [portfolios]);

  const updatePortfolio = useCallback(async (p: SavedPortfolio) => {
    const updated = portfolios.map((x) => (x.id === p.id ? { ...p, updatedAt: new Date().toISOString() } : x));
    setPortfolios(updated);
    await AsyncStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(updated));
  }, [portfolios]);

  const deletePortfolio = useCallback(async (id: string) => {
    const updated = portfolios.filter((x) => x.id !== id);
    setPortfolios(updated);
    await AsyncStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(updated));
  }, [portfolios]);

  const saveCustomStrategy = useCallback(async (s: CustomStrategy) => {
    const updated = [...customStrategies.filter((x) => x.id !== s.id), s];
    setCustomStrategies(updated);
    await AsyncStorage.setItem(CUSTOM_STRATEGIES_KEY, JSON.stringify(updated));
  }, [customStrategies]);

  const deleteCustomStrategy = useCallback(async (id: string) => {
    const updated = customStrategies.filter((x) => x.id !== id);
    setCustomStrategies(updated);
    await AsyncStorage.setItem(CUSTOM_STRATEGIES_KEY, JSON.stringify(updated));
  }, [customStrategies]);

  return (
    <PortfolioContext.Provider
      value={{ portfolios, customStrategies, savePortfolio, updatePortfolio, deletePortfolio, saveCustomStrategy, deleteCustomStrategy, loading }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
