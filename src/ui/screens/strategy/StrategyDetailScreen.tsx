import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PieChart } from 'react-native-chart-kit';
import { ScreenWrapper, Card, Button, Badge } from '../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../theme';
import { strategies, Strategy } from '../../../data/strategies';
import { usePortfolio } from '../../../contexts/PortfolioContext';
import { getETFUniverse } from '../../../data/etfs';
import { formatWeight } from '../../../utils/format';
import { StrategyStackParamList } from '../../navigation/types';
import { FormulaExplainer } from './FormulaExplainer';

type Route = RouteProp<StrategyStackParamList, 'StrategyDetail'>;
type Universe = 'korea' | 'retirement' | 'us';

const UNIVERSE_LABELS: Record<Universe, string> = {
  korea: '한국 ETF',
  retirement: '퇴직연금',
  us: '미국 ETF',
};

export function StrategyDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<NativeStackNavigationProp<StrategyStackParamList>>();
  const { customStrategies } = usePortfolio();
  const [universe, setUniverse] = useState<Universe>('us');

  // 빌트인 전략 또는 커스텀 전략 검색
  const strategy: Strategy | undefined = useMemo(() => {
    const builtIn = strategies.find((s) => s.id === route.params.strategyId);
    if (builtIn) return builtIn;
    const cs = customStrategies.find((c) => c.id === route.params.strategyId);
    if (cs) {
      return {
        id: cs.id,
        name: cs.name,
        type: 'static' as const,
        description: `커스텀 정적 전략 · ${cs.allocations.length}개 자산군`,
        defaultAllocations: cs.allocations,
      };
    }
    return undefined;
  }, [route.params.strategyId, customStrategies]);

  if (!strategy) {
    return (
      <ScreenWrapper>
        <Text style={[typography.body, { color: theme.text }]}>전략을 찾을 수 없습니다.</Text>
      </ScreenWrapper>
    );
  }

  const chartColors = theme.chart;
  const pieData = strategy.defaultAllocations.map((a, i) => ({
    name: a.assetClass,
    weight: a.weight,
    color: chartColors[i % chartColors.length],
    legendFontColor: theme.textSecondary,
    legendFontSize: 12,
  }));

  const dc = strategy.dynamicConfig;
  const etfMap = getETFUniverse(universe);

  // 전략에서 사용하는 모든 자산군 수집
  const allAssetClasses = useMemo(() => {
    const set = new Set<string>();
    strategy.defaultAllocations.forEach((a) => set.add(a.assetClass));
    if (dc) {
      dc.offensiveAssets?.forEach((a) => set.add(a));
      dc.defensiveAssets?.forEach((a) => set.add(a));
      dc.canaryAssets?.forEach((a) => set.add(a));
    }
    return Array.from(set);
  }, [strategy, dc]);

  // 자산군 → ETF 매핑 정보
  const assetETFData = useMemo(() => {
    return allAssetClasses.map((ac) => {
      const etf = etfMap[ac];
      return {
        assetClass: ac,
        ticker: etf?.ticker ?? '-',
        name: etf?.name ?? '매핑 없음',
        price: etf?.price ?? 0,
        currency: etf?.currency ?? 'USD',
        available: !!etf,
      };
    });
  }, [allAssetClasses, etfMap]);

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return '-';
    return currency === 'KRW' ? `${price.toLocaleString()}원` : `$${price.toLocaleString()}`;
  };

  return (
    <ScreenWrapper>
      <View style={styles.top}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Badge
            label={strategy.type === 'static' ? '정적 전략' : '동적 전략'}
            color={strategy.type === 'static' ? theme.success : theme.primary}
            bgColor={strategy.type === 'static' ? theme.successLight : theme.primaryLight}
          />
          {strategy.riskLevel && (
            <Badge
              label={`위험: ${strategy.riskLevel}`}
              color={strategy.riskLevel === '높음' ? theme.danger : strategy.riskLevel === '중간' ? theme.warning : theme.success}
              bgColor={theme.surfaceVariant}
            />
          )}
        </View>
        <Text style={[typography.h1, { color: theme.text, marginTop: 8 }]}>{strategy.name}</Text>
        <Text style={[typography.body, { color: theme.textSecondary, marginTop: 8 }]}>
          {strategy.description}
        </Text>
      </View>

      {/* 동적 전략: 간단 설명 */}
      {strategy.shortDescription && (
        <Card style={{ marginTop: 16 }}>
          <Text style={[typography.h3, { color: theme.text, marginBottom: 8 }]}>전략 설명</Text>
          <Text style={[typography.body, { color: theme.textSecondary, lineHeight: 22 }]}>
            {strategy.shortDescription}
          </Text>
        </Card>
      )}

      {/* 동적 전략: 공식 요약 */}
      {strategy.formula && (
        <Card style={{ marginTop: 4 }}>
          <Text style={[typography.h3, { color: theme.text, marginBottom: 8 }]}>공식 요약</Text>
          <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant }]}>
            <Text style={[styles.formulaText, { color: theme.text }]}>
              {strategy.formula}
            </Text>
          </View>
        </Card>
      )}

      {/* ETF 유니버스 선택 */}
      {dc && (
        <Card style={{ marginTop: 4 }}>
          <Text style={[typography.h3, { color: theme.text, marginBottom: 8 }]}>ETF 유니버스</Text>
          <View style={styles.universeChips}>
            {(Object.keys(UNIVERSE_LABELS) as Universe[]).map((u) => (
              <Pressable
                key={u}
                onPress={() => setUniverse(u)}
                style={[
                  styles.universeChip,
                  { backgroundColor: universe === u ? theme.primary : theme.surfaceVariant },
                ]}
              >
                <Text style={[typography.small, { color: universe === u ? '#FFF' : theme.textSecondary }]}>
                  {UNIVERSE_LABELS[u]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[typography.small, { color: theme.textSecondary }]}>
            아래 자산별 ETF 매핑과 현재가는 선택한 유니버스 기준입니다.
          </Text>
        </Card>
      )}

      {/* 동적 전략: 공식 상세 (모멘텀 정의 + 자산별 현재값 + 판단 규칙) */}
      <FormulaExplainer strategy={strategy} etfMap={etfMap} />

      {/* 정적 전략: 자산별 ETF 현재가 */}
      {!dc && (
        <Card style={{ marginTop: 4 }}>
          <View style={styles.paramHeader}>
            <Text style={[typography.h3, { color: theme.text }]}>ETF 매핑 현재가</Text>
          </View>
          <View style={styles.universeChips}>
            {(Object.keys(UNIVERSE_LABELS) as Universe[]).map((u) => (
              <Pressable
                key={u}
                onPress={() => setUniverse(u)}
                style={[
                  styles.universeChip,
                  { backgroundColor: universe === u ? theme.primary : theme.surfaceVariant },
                ]}
              >
                <Text style={[typography.small, { color: universe === u ? '#FFF' : theme.textSecondary }]}>
                  {UNIVERSE_LABELS[u]}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={[styles.paramTable, { borderColor: theme.border }]}>
            <View style={[styles.paramTableHeader, { backgroundColor: theme.surfaceVariant }]}>
              <Text style={[typography.small, { color: theme.textSecondary, flex: 1 }]}>자산군</Text>
              <Text style={[typography.small, { color: theme.textSecondary, flex: 1 }]}>ETF</Text>
              <Text style={[typography.small, { color: theme.textSecondary, width: 80, textAlign: 'right' }]}>현재가</Text>
            </View>
            {assetETFData.map((item, i) => (
              <View
                key={item.assetClass}
                style={[
                  styles.paramRow,
                  i < assetETFData.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}
              >
                <Text style={[typography.small, { color: theme.text, flex: 1 }]}>{item.assetClass}</Text>
                <Text style={[typography.small, { color: item.available ? theme.text : theme.textTertiary, flex: 1 }]} numberOfLines={1}>
                  {item.ticker}
                </Text>
                <Text style={[typography.small, { color: item.available ? theme.text : theme.textTertiary, width: 80, textAlign: 'right' }]}>
                  {formatPrice(item.price, item.currency)}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <Card style={{ marginTop: 4 }}>
        <Text style={[typography.h3, { color: theme.text, marginBottom: 12 }]}>기본 자산 배분</Text>
        <PieChart
          data={pieData}
          width={Dimensions.get('window').width - 64}
          height={200}
          chartConfig={{
            color: () => theme.text,
            labelColor: () => theme.textSecondary,
          }}
          accessor="weight"
          backgroundColor="transparent"
          paddingLeft="0"
          absolute={false}
        />
      </Card>

      <Card style={{ marginTop: 4 }}>
        {strategy.defaultAllocations.map((a, i) => (
          <View
            key={a.assetClass}
            style={[
              styles.allocationRow,
              i < strategy.defaultAllocations.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <View style={styles.allocationLeft}>
              <View style={[styles.dot, { backgroundColor: chartColors[i % chartColors.length] }]} />
              <Text style={[typography.body, { color: theme.text }]}>{a.assetClass}</Text>
            </View>
            <Text style={[typography.bodyBold, { color: theme.text }]}>{formatWeight(a.weight)}</Text>
          </View>
        ))}
      </Card>

      {strategy.rebalanceRule && (
        <Card style={{ marginTop: 4 }}>
          <Text style={[typography.h3, { color: theme.text }]}>리밸런싱 규칙</Text>
          <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 8 }]}>
            {strategy.rebalanceRule}
          </Text>
        </Card>
      )}

      <Button
        title="이 전략으로 계산하기"
        onPress={() => {
          navigation.getParent()?.navigate('CalculatorTab', {
            screen: 'Calculator',
            params: { strategyId: strategy.id },
          });
        }}
        style={{ marginTop: 16, marginBottom: 24 }}
        size="large"
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  top: { marginTop: 8 },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  allocationLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  formulaBox: {
    padding: 12,
    borderRadius: 8,
  },
  formulaText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  assetGroup: {
    marginBottom: 10,
  },
  paramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  universeChips: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  universeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  paramTable: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  paramTableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
