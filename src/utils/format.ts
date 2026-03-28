export function formatKRW(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCurrency(amount: number, universe: 'korea' | 'retirement' | 'us'): string {
  return universe === 'us' ? formatUSD(amount) : formatKRW(amount);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatWeight(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
