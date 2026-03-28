import { SavedPortfolio, CustomStrategy } from '../contexts/PortfolioContext';

/** Web stub — no Firestore on web */
export async function uploadToCloud(
  _uid: string,
  _portfolios: SavedPortfolio[],
  _customStrategies: CustomStrategy[],
): Promise<void> {
  // no-op
}

export async function downloadFromCloud(
  _uid: string,
): Promise<{ portfolios: SavedPortfolio[]; customStrategies: CustomStrategy[] } | null> {
  return null;
}

export function mergeData<T extends { id: string; createdAt: string; updatedAt?: string }>(
  local: T[],
  _cloud: T[],
): T[] {
  return local;
}
