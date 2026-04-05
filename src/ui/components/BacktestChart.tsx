import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../theme';
import { Strategy } from '../../data/strategies';
import { getETFUniverse } from '../../data/etfs';
import { getMultipleTickerPrices, TickerPriceData } from '../../services/priceService';
import { runBacktest, BacktestResult } from '../../core/engine/backtestEngine';
import { Card } from './Card';

interface Props {
  strategy: Strategy;
}

export function BacktestChart({ strategy }: Props) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // US ETF universe 사용 (가장 데이터가 풍부)
        const etfMap = getETFUniverse('us');
        const allocations = strategy.defaultAllocations
          .filter((a) => a.weight > 0 && etfMap[a.assetClass])
          .map((a) => ({
            ticker: etfMap[a.assetClass].ticker,
            weight: a.weight,
          }));

        if (allocations.length === 0) {
          if (!cancelled) setError('매핑 가능한 ETF가 없습니다.');
          return;
        }

        const tickers = allocations.map((a) => a.ticker);
        const priceDataMap = await getMultipleTickerPrices(tickers);

        // Convert to PricePoint[] map
        const priceMap: Record<string, TickerPriceData['prices']> = {};
        for (const [ticker, data] of Object.entries(priceDataMap)) {
          priceMap[ticker] = data.prices;
        }

        const bt = runBacktest(allocations, priceMap);
        if (!cancelled) {
          setResult(bt);
          if (!bt) setError('데이터 부족으로 백테스트를 실행할 수 없습니다.');
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? '백테스트 실행 중 오류');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [strategy.id]);

  const chartData = useMemo(() => {
    if (!result) return null;
    // Downsample for chart performance (max ~50 points)
    const step = Math.max(1, Math.floor(result.dates.length / 50));
    const labels: string[] = [];
    const data: number[] = [];
    for (let i = 0; i < result.dates.length; i += step) {
      labels.push(result.dates[i].slice(2, 7)); // YY-MM
      data.push(Math.round((result.cumulativeReturns[i] - 1) * 1000) / 10); // percentage
    }
    // Always include last point
    if (labels[labels.length - 1] !== result.dates[result.dates.length - 1].slice(2, 7)) {
      labels.push(result.dates[result.dates.length - 1].slice(2, 7));
      data.push(Math.round((result.cumulativeReturns[result.cumulativeReturns.length - 1] - 1) * 1000) / 10);
    }
    return { labels, data };
  }, [result]);

  if (loading) {
    return (
      <Card style={{ marginTop: 4 }}>
        <Text style={[typography.h3, { color: theme.text, marginBottom: 12 }]}>과거 성과 (백테스트)</Text>
        <ActivityIndicator color={theme.primary} style={{ paddingVertical: 40 }} />
      </Card>
    );
  }

  if (error || !result || !chartData) {
    return (
      <Card style={{ marginTop: 4 }}>
        <Text style={[typography.h3, { color: theme.text, marginBottom: 8 }]}>과거 성과 (백테스트)</Text>
        <Text style={[typography.small, { color: theme.textSecondary }]}>
          {error ?? '데이터 부족'}
        </Text>
      </Card>
    );
  }

  const screenWidth = Dimensions.get('window').width - 64;

  return (
    <Card style={{ marginTop: 4 }}>
      <Text style={[typography.h3, { color: theme.text, marginBottom: 4 }]}>과거 성과 (백테스트)</Text>
      <Text style={[typography.small, { color: theme.textSecondary, marginBottom: 12 }]}>
        미국 ETF 기준 · 월간 리밸런싱 · 과거 수익률은 미래 수익을 보장하지 않습니다
      </Text>

      <LineChart
        data={{
          labels: chartData.labels.filter((_, i) => i % Math.max(1, Math.floor(chartData.labels.length / 6)) === 0),
          datasets: [{ data: chartData.data }],
        }}
        width={screenWidth}
        height={180}
        yAxisSuffix="%"
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: theme.surface,
          backgroundGradientTo: theme.surface,
          decimalPlaces: 0,
          color: () => theme.primary,
          labelColor: () => theme.textSecondary,
          propsForDots: { r: '0' },
          propsForBackgroundLines: { strokeDasharray: '4', stroke: theme.border },
        }}
        bezier
        withDots={false}
        style={{ borderRadius: 8, marginLeft: -16 }}
      />

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatBox label="총 수익률" value={`${(result.totalReturn * 100).toFixed(1)}%`} color={result.totalReturn >= 0 ? theme.success : theme.danger} theme={theme} />
        <StatBox label="연평균(CAGR)" value={`${(result.cagr * 100).toFixed(1)}%`} color={result.cagr >= 0 ? theme.success : theme.danger} theme={theme} />
        <StatBox label="MDD" value={`${(result.maxDrawdown * 100).toFixed(1)}%`} color={theme.danger} theme={theme} />
        <StatBox label="샤프 비율" value={result.sharpe.toFixed(2)} color={theme.text} theme={theme} />
        <StatBox label="변동성" value={`${(result.volatility * 100).toFixed(1)}%`} color={theme.warning} theme={theme} />
        <StatBox label="기간" value={`${Math.round(result.monthlyReturns.length / 12)}년`} color={theme.textSecondary} theme={theme} />
      </View>
    </Card>
  );
}

function StatBox({ label, value, color, theme }: { label: string; value: string; color: string; theme: any }) {
  return (
    <View style={styles.statBox}>
      <Text style={[typography.small, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[typography.bodyBold, { color, marginTop: 2 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 4,
  },
  statBox: {
    width: '30%',
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
});
