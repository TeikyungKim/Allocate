import firestore from '@react-native-firebase/firestore';
import { SavedPortfolio, CustomStrategy } from '../contexts/PortfolioContext';

function userDoc(uid: string) {
  return firestore().collection('users').doc(uid);
}

/** Upload all local data to Firestore (overwrite) */
export async function uploadToCloud(
  uid: string,
  portfolios: SavedPortfolio[],
  customStrategies: CustomStrategy[],
): Promise<void> {
  await userDoc(uid).set({
    portfolios: JSON.stringify(portfolios),
    customStrategies: JSON.stringify(customStrategies),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
}

/** Download data from Firestore */
export async function downloadFromCloud(
  uid: string,
): Promise<{ portfolios: SavedPortfolio[]; customStrategies: CustomStrategy[] } | null> {
  const doc = await userDoc(uid).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;
  return {
    portfolios: data.portfolios ? JSON.parse(data.portfolios) : [],
    customStrategies: data.customStrategies ? JSON.parse(data.customStrategies) : [],
  };
}

/** Merge cloud data with local data (union by id, prefer newer) */
export function mergeData<T extends { id: string; createdAt: string; updatedAt?: string }>(
  local: T[],
  cloud: T[],
): T[] {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of cloud) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else {
      const localTime = existing.updatedAt ?? existing.createdAt;
      const cloudTime = item.updatedAt ?? item.createdAt;
      if (cloudTime > localTime) map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}
