import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper, Card, Badge, Button, AdBanner } from '../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../theme';
import { strategies, Strategy } from '../../../data/strategies';
import { usePortfolio } from '../../../contexts/PortfolioContext';
import { StrategyStackParamList } from '../../navigation/types';
import { usePriceData } from '../../../hooks/usePriceData';

type Nav = NativeStackNavigationProp<StrategyStackParamList, 'StrategyList'>;

export function StrategyListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const { customStrategies, favoriteStrategyIds, toggleFavorite } = usePortfolio();
  const [filter, setFilter] = useState<'all' | 'static' | 'dynamic' | 'custom'>('all');

  // 시장 현황: 주요 자산 모멘텀 요약
  const marketTickers = ['SPY', 'EFA', 'EEM', 'AGG', 'GLD'];
  const TICKER_LABELS: Record<string, string> = {
    SPY: 'S&P500',
    EFA: '선진국',
    EEM: '신흥국',
    AGG: '미국채권',
    GLD: '금',
  };
  const marketData = usePriceData(marketTickers);
  const marketStatus = useMemo(() => {
    const m = marketData.momentum;
    if (Object.keys(m).length === 0) return null;
    const aboveSMA = marketTickers.filter((t) => m[t]?.aboveSMA10m === true).length;
    const total = marketTickers.filter((t) => m[t]?.aboveSMA10m != null).length;
    if (total === 0) return null;
    const ratio = aboveSMA / total;
    const label = ratio >= 0.8 ? '강세' : ratio >= 0.5 ? '보통' : ratio >= 0.2 ? '약세' : '위험';
    const color = ratio >= 0.8 ? theme.success : ratio >= 0.5 ? theme.primary : ratio >= 0.2 ? theme.warning : theme.danger;
    return { aboveSMA, total, ratio, label, color, tickers: m };
  }, [marketData.momentum]);

  // 커스텀 전략을 Strategy 형태로 변환
  const customItems: Strategy[] = useMemo(
    () =>
      customStrategies.map((cs) => ({
        id: `custom-${cs.id}`,
        name: cs.name,
        type: 'static' as const,
        description: `커스텀 정적 전략 · ${cs.allocations.length}개 자산군`,
        defaultAllocations: cs.allocations,
        riskLevel: undefined,
      })),
    [customStrategies],
  );

  const allItems = useMemo(() => {
    let items: Strategy[];
    if (filter === 'custom') {
      items = customItems;
    } else {
      const base = strategies.filter((s) => {
        if (filter === 'all') return true;
        return s.type === filter;
      });
      items = (filter === 'all' || filter === 'static') ? [...base, ...customItems] : base;
    }
    // 즐겨찾기를 상단에 고정
    const favSet = new Set(favoriteStrategyIds);
    const favs = items.filter((s) => favSet.has(s.id));
    const rest = items.filter((s) => !favSet.has(s.id));
    return [...favs, ...rest];
  }, [filter, customItems, favoriteStrategyIds]);

  return (
    <ScreenWrapper scroll={false} padding={false}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.titleRow}>
          <Text style={[typography.h2, { color: theme.text, flex: 1 }]}>전략</Text>
          <Button
            title="+ 커스텀"
            onPress={() => navigation.navigate('CustomStrategy')}
            variant="outline"
            size="small"
          />
        </View>
        <View style={styles.filters}>
          {(['all', 'static', 'dynamic', 'custom'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                { backgroundColor: filter === f ? theme.primary : theme.surfaceVariant },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  { color: filter === f ? '#FFF' : theme.textSecondary },
                ]}
              >
                {f === 'all' ? '전체' : f === 'static' ? '정적' : f === 'dynamic' ? '동적' : '커스텀'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {/* 시장 현황 카드 */}
      {marketStatus && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: marketStatus.color }} />
              <Text style={[typography.bodyBold, { color: theme.text }]}>시장 현황</Text>
              <View style={{ backgroundColor: marketStatus.color + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: marketStatus.color, fontSize: 11, fontWeight: '700' }}>
                  {marketStatus.label}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {marketTickers.map((t) => {
                const m = marketStatus.tickers[t];
                if (!m) return null;
                const up = m.aboveSMA10m;
                return (
                  <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[typography.small, { color: theme.textSecondary }]}>{TICKER_LABELS[t] ?? t}</Text>
                    <Text style={[typography.small, { color: up ? theme.success : theme.danger, fontWeight: '700' }]}>
                      {m.r12m != null ? `${(m.r12m * 100).toFixed(1)}%` : '-'}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={[typography.small, { color: theme.textTertiary, marginTop: 6 }]}>
              SMA 상위: {marketStatus.aboveSMA}/{marketStatus.total} · 12개월 수익률 기준
            </Text>
          </Card>
        </View>
      )}
      <AdBanner />
      <FlatList
        data={allItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isCustom = item.id.startsWith('custom-');
          const isFav = favoriteStrategyIds.includes(item.id);
          return (
            <Card
              onPress={() => {
                const realId = isCustom ? item.id.replace('custom-', '') : item.id;
                navigation.navigate('StrategyDetail', { strategyId: realId });
              }}
              style={{ marginHorizontal: 16 }}
            >
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Badge
                    label={isCustom ? '커스텀' : item.type === 'static' ? '정적' : '동적'}
                    color={isCustom ? theme.warning : item.type === 'static' ? theme.success : theme.primary}
                    bgColor={isCustom ? theme.warningLight ?? theme.surfaceVariant : item.type === 'static' ? theme.successLight : theme.primaryLight}
                  />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {item.riskLevel && (
                    <Text style={[typography.small, { color: theme.textTertiary }]}>
                      위험도: {item.riskLevel}
                    </Text>
                  )}
                  <Pressable
                    onPress={() => toggleFavorite(item.id)}
                    hitSlop={8}
                    style={{ padding: 4 }}
                  >
                    <Text style={{ fontSize: 16 }}>{isFav ? '⭐' : '☆'}</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={[typography.h3, { color: theme.text, marginTop: 8 }]}>{item.name}</Text>
              <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4 }]} numberOfLines={2}>
                {item.description}
              </Text>
              <Pressable
                onPress={() => {
                  // 커스텀 전략은 'custom-' 접두사 제거하여 원래 ID로 전달
                  const realId = isCustom ? item.id.replace('custom-', '') : item.id;
                  navigation.getParent()?.navigate('CalculatorTab', {
                    screen: 'Calculator',
                    params: { strategyId: realId },
                  });
                }}
                style={[styles.calcBtn, { borderColor: theme.primary }]}
              >
                <Text style={[typography.captionBold, { color: theme.primary }]}>계산하기</Text>
              </Pressable>
            </Card>
          );
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, paddingHorizontal: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  filters: { flexDirection: 'row', gap: 8, marginTop: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  list: { paddingTop: 16, paddingBottom: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calcBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 8 },
});
