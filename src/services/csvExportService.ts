import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';

interface CSVRow {
  ticker: string;
  name: string;
  assetClass: string;
  weight: number;
  shares: number;
  amount: number;
}

export async function exportAllocationCSV(
  rows: CSVRow[],
  totalAmount: number,
  remainder: number,
  strategyName: string,
  universe: string,
): Promise<void> {
  const header = '티커,이름,자산군,비중(%),매수수량(주),투자금액\n';
  const body = rows
    .map((r) => `${r.ticker},${r.name},${r.assetClass},${r.weight.toFixed(1)},${r.shares},${r.amount}`)
    .join('\n');
  const footer = `\n\n전략,${strategyName}\n유니버스,${universe}\n총 투자금,${totalAmount}\n잔여 현금,${remainder}`;
  const csv = '\uFEFF' + header + body + footer; // BOM for Excel Korean support

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `allocate_${strategyName.replace(/\s/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const fileName = `allocate_${Date.now()}.csv`;
  const file = new File(Paths.cache, fileName);
  file.write(csv);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
}
