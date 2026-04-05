import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadToCloud, downloadFromCloud, mergeData } from '../services/firestoreSync';

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
  updatedAt?: string;
}

interface PortfolioContextType {
  portfolios: SavedPortfolio[];
  customStrategies: CustomStrategy[];
  savePortfolio: (p: SavedPortfolio) => Promise<void>;
  updatePortfolio: (p: SavedPortfolio) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  saveCustomStrategy: (s: CustomStrategy) => Promise<void>;
  deleteCustomStrategy: (id: string) => Promise<void>;
  favoriteStrategyIds: string[];
  toggleFavorite: (strategyId: string) => Promise<void>;
  loading: boolean;
  syncWithCloud: (uid: string) => Promise<void>;
  syncing: boolean;
  lastSyncedAt: string | null;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

const PORTFOLIOS_KEY = 'portfolios';
const CUSTOM_STRATEGIES_KEY = 'customStrategies';
const FAVORITES_KEY = 'favoriteStrategies';
const LAST_SYNCED_KEY = 'lastSyncedAt';

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([]);
  const [customStrategies, setCustomStrategies] = useState<CustomStrategy[]>([]);
  const [favoriteStrategyIds, setFavoriteStrategyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(PORTFOLIOS_KEY),
      AsyncStorage.getItem(CUSTOM_STRATEGIES_KEY),
      AsyncStorage.getItem(FAVORITES_KEY),
      AsyncStorage.getItem(LAST_SYNCED_KEY),
    ]).then(([p, c, f, ls]) => {
      if (p) setPortfolios(JSON.parse(p));
      if (c) setCustomStrategies(JSON.parse(c));
      if (f) setFavoriteStrategyIds(JSON.parse(f));
      if (ls) setLastSyncedAt(ls);
      setLoading(false);
    });
  }, []);

  const persistPortfolios = useCallback(async (data: SavedPortfolio[]) => {
    setPortfolios(data);
    await AsyncStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(data));
  }, []);

  const persistCustomStrategies = useCallback(async (data: CustomStrategy[]) => {
    setCustomStrategies(data);
    await AsyncStorage.setItem(CUSTOM_STRATEGIES_KEY, JSON.stringify(data));
  }, []);

  const savePortfolio = useCallback(async (p: SavedPortfolio) => {
    const updated = [...portfolios.filter((x) => x.id !== p.id), p];
    await persistPortfolios(updated);
  }, [portfolios, persistPortfolios]);

  const updatePortfolio = useCallback(async (p: SavedPortfolio) => {
    const updated = portfolios.map((x) => (x.id === p.id ? { ...p, updatedAt: new Date().toISOString() } : x));
    await persistPortfolios(updated);
  }, [portfolios, persistPortfolios]);

  const deletePortfolio = useCallback(async (id: string) => {
    const updated = portfolios.filter((x) => x.id !== id);
    await persistPortfolios(updated);
  }, [portfolios, persistPortfolios]);

  const saveCustomStrategy = useCallback(async (s: CustomStrategy) => {
    const updated = [...customStrategies.filter((x) => x.id !== s.id), s];
    await persistCustomStrategies(updated);
  }, [customStrategies, persistCustomStrategies]);

  const deleteCustomStrategy = useCallback(async (id: string) => {
    const updated = customStrategies.filter((x) => x.id !== id);
    await persistCustomStrategies(updated);
  }, [customStrategies, persistCustomStrategies]);

  const toggleFavorite = useCallback(async (strategyId: string) => {
    const updated = favoriteStrategyIds.includes(strategyId)
      ? favoriteStrategyIds.filter((id) => id !== strategyId)
      : [...favoriteStrategyIds, strategyId];
    setFavoriteStrategyIds(updated);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  }, [favoriteStrategyIds]);

  const syncWithCloud = useCallback(async (uid: string) => {
    setSyncing(true);
    try {
      // Download from cloud
      const cloudData = await downloadFromCloud(uid);

      let mergedPortfolios: SavedPortfolio[];
      let mergedStrategies: CustomStrategy[];

      if (cloudData) {
        // Merge local + cloud
        mergedPortfolios = mergeData(portfolios, cloudData.portfolios);
        mergedStrategies = mergeData(customStrategies, cloudData.customStrategies);
      } else {
        mergedPortfolios = portfolios;
        mergedStrategies = customStrategies;
      }

      // Upload merged data to cloud
      await uploadToCloud(uid, mergedPortfolios, mergedStrategies);

      // Save merged data locally
      await persistPortfolios(mergedPortfolios);
      await persistCustomStrategies(mergedStrategies);

      const now = new Date().toISOString();
      setLastSyncedAt(now);
      await AsyncStorage.setItem(LAST_SYNCED_KEY, now);
    } finally {
      setSyncing(false);
    }
  }, [portfolios, customStrategies, persistPortfolios, persistCustomStrategies]);

  return (
    <PortfolioContext.Provider
      value={{
        portfolios, customStrategies,
        savePortfolio, updatePortfolio, deletePortfolio,
        saveCustomStrategy, deleteCustomStrategy,
        favoriteStrategyIds, toggleFavorite,
        loading, syncWithCloud, syncing, lastSyncedAt,
      }}
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
