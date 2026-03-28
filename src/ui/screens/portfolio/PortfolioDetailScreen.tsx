import React, { useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions, TextInput, Pressable, ScrollView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ScreenWrapper, Card, Button, Badge } from '../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../theme';
import { usePortfolio, HoldingEntry } from '../../../contexts/PortfolioContext';
import { formatCurrency, formatWeight } from '../../../utils/format';
import { strategies, Strategy } from '../../../data/strategies';
import { getETFUniverse, getCustomETFUniverse } from '../../../data/etfs';
import { calculateAllocation } from '../../../core/engine/allocationEngine';
import { PortfolioStackParamList } from '../../navigation/types';
import { useDynamicStrategy } from '../../../hooks/useDynamicStrategy';

type Route = RouteProp<PortfolioStackParamList, 'PortfolioDetail'>;

export function PortfolioDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { portfolios, updatePortfolio, deletePortfolio } = usePortfolio();
  const viewShotRef = useRef<ViewShot>(null);

  const portfolio = portfolios.find((p) => p.id === route.params.portfolioId);

  const [editingAmount, setEditingAmount] = useState(false);
  const [amountText, setAmountText] = useState('');
  const [editingHoldings, setEditingHoldings] = useState(false);
  const [holdingsMap, setHoldingsMap] = useState<Record<string, string>>({});
  const [editingTolerance, setEditingTolerance] = useState(false);
  const [toleranceText, setToleranceText] = useState('');

  // 동적 전략: 실시간 모멘텀 기반 재계산
  const baseStrategy = useMemo(() => {
    return strategies.find((s) => s.id === portfolio?.strategyId) ?? null;
  }, [portfolio?.strategyId]);

  const { effectiveStrategy, isDynamic } = useDynamicStrategy(
    baseStrategy ?? { id: '', name: '', type: 'static', description: '', defaultAllocations: [] },
  );

  // 실시간 동적 배분 적용된 allocations
  const liveAllocations = useMemo(() => {
    if (!portfolio || !isDynamic || !baseStrategy) return null;
    const etfMap = portfolio.etfOverrides
      ? getCustomETFUniverse(portfolio.universe, portfolio.etfOverrides)
      : getETFUniverse(portfolio.universe);
    return calculateAllocation(effectiveStrategy, etfMap, portfolio.investmentAmount, portfolio.universe);
  }, [portfolio, isDynamic, effectiveStrategy, baseStrategy]);

  if (!portfolio) {
    return (
      <ScreenWrapper>
        <Text style={[typography.body, { color: theme.text }]}>포트폴리오를 찾을 수 없습니다.</Text>
      </ScreenWrapper>
    );
  }

  const displayAllocations = liveAllocations?.allocations ?? portfolio.allocations;
  const holdings = portfolio.holdings ?? [];
  const tolerance = portfolio.tolerancePercent ?? 5;

  const pieData = displayAllocations.map((a, i) => ({
    name: a.name,
    weight: a.weight,
    color: theme.chart[i % theme.chart.length],
    legendFontColor: theme.textSecondary,
    legendFontSize: 11,
  }));

  // 보유량 vs 추천량 괴리 계산 (실시간 배분 기준)
  const getDeviation = (ticker: string, recommendedShares: number): number | null => {
    const holding = holdings.find((h) => h.ticker === ticker);
    if (!holding) return null;
    if (recommendedShares === 0) return holding.shares > 0 ? 100 : 0;
    return ((holding.shares - recommendedShares) / recommendedShares) * 100;
  };

  const getHoldingShares = (ticker: string): number | null => {
    const holding = holdings.find((h) => h.ticker === ticker);
    return holding?.shares ?? null;
  };

  // 투자금 변경 후 재계산
  const handleAmountSave = async () => {
    const newAmount = parseFloat(amountText.replace(/,/g, '')) || 0;
    if (newAmount <= 0) { Alert.alert('오류', '올바른 금액을 입력하세요.'); return; }

    const strategy = strategies.find((s) => s.id === portfolio.strategyId);
    if (!strategy) { Alert.alert('오류', '전략을 찾을 수 없습니다.'); return; }

    const etfMap = portfolio.etfOverrides
      ? getCustomETFUniverse(portfolio.universe, portfolio.etfOverrides)
      : getETFUniverse(portfolio.universe);
    const result = calculateAllocation(strategy, etfMap, newAmount, portfolio.universe);

    await updatePortfolio({
      ...portfolio,
      investmentAmount: newAmount,
      allocations: result.allocations,
    });
    setEditingAmount(false);
  };

  // 보유수량 저장
  const handleHoldingsSave = async () => {
    const newHoldings: HoldingEntry[] = displayAllocations
      .map((a) => ({
        ticker: a.ticker,
        shares: parseInt(holdingsMap[a.ticker] ?? '0', 10) || 0,
      }))
      .filter((h) => h.shares > 0);

    await updatePortfolio({ ...portfolio, holdings: newHoldings });
    setEditingHoldings(false);
  };

  // 괴리율 저장
  const handleToleranceSave = async () => {
    const val = parseFloat(toleranceText) || 5;
    await updatePortfolio({ ...portfolio, tolerancePercent: Math.max(0, Math.min(100, val)) });
    setEditingTolerance(false);
  };

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (uri) await Sharing.shareAsync(uri);
    } catch {}
  };

  const handleDelete = () => {
    Alert.alert('삭제', '이 포트폴리오를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deletePortfolio(portfolio.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <Text style={[typography.h2, { color: theme.text }]}>{portfolio.name}</Text>
          {isDynamic && (
            <View style={{ backgroundColor: theme.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '700' }}>실시간</Text>
            </View>
          )}
        </View>
        <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4 }]}>
          {new Date(portfolio.createdAt).toLocaleDateString('ko-KR')}
          {portfolio.updatedAt && ` (수정: ${new Date(portfolio.updatedAt).toLocaleDateString('ko-KR')})`}
        </Text>

        {/* 투자금 조절 */}
        <Card style={{ marginTop: 12 }}>
          <View style={styles.cardHeader}>
            <Text style={[typography.captionBold, { color: theme.textSecondary }]}>투자금</Text>
            <Pressable onPress={() => { setEditingAmount(!editingAmount); setAmountText(portfolio.investmentAmount.toString()); }}>
              <Text style={[typography.captionBold, { color: theme.primary }]}>
                {editingAmount ? '취소' : '변경'}
              </Text>
            </Pressable>
          </View>
          {editingAmount ? (
            <View style={{ marginTop: 8 }}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceVariant, borderColor: theme.border, color: theme.text }]}
                value={amountText}
                onChangeText={setAmountText}
                keyboardType="numeric"
                placeholder="금액 입력"
                placeholderTextColor={theme.textTertiary}
              />
              <Button title="재계산 및 저장" onPress={handleAmountSave} size="small" style={{ marginTop: 8 }} />
            </View>
          ) : (
            <Text style={[typography.h3, { color: theme.text, marginTop: 4 }]}>
              {formatCurrency(portfolio.investmentAmount, portfolio.universe)}
            </Text>
          )}
        </Card>

        <Card style={{ marginTop: 4 }}>
          <PieChart
            data={pieData}
            width={Dimensions.get('window').width - 64}
            height={200}
            chartConfig={{ color: () => theme.text, labelColor: () => theme.textSecondary }}
            accessor="weight"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute={false}
          />
        </Card>

        {/* 허용 괴리율 설정 */}
        <Card style={{ marginTop: 4 }}>
          <View style={styles.cardHeader}>
            <Text style={[typography.captionBold, { color: theme.textSecondary }]}>허용 괴리율</Text>
            <Pressable onPress={() => { setEditingTolerance(!editingTolerance); setToleranceText(tolerance.toString()); }}>
              <Text style={[typography.captionBold, { color: theme.primary }]}>
                {editingTolerance ? '취소' : '변경'}
              </Text>
            </Pressable>
          </View>
          {editingTolerance ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
              <TextInput
                style={[styles.smallInput, { backgroundColor: theme.surfaceVariant, color: theme.text }]}
                value={toleranceText}
                onChangeText={setToleranceText}
                keyboardType="numeric"
              />
              <Text style={[typography.body, { color: theme.textSecondary }]}>%</Text>
              <Button title="저장" onPress={handleToleranceSave} size="small" />
            </View>
          ) : (
            <Text style={[typography.body, { color: theme.text, marginTop: 4 }]}>
              보유 수량과 추천 수량의 차이가 {tolerance}% 이내면 허용
            </Text>
          )}
        </Card>

        {/* 보유수량 관리 */}
        <Card style={{ marginTop: 4 }}>
          <View style={styles.cardHeader}>
            <Text style={[typography.captionBold, { color: theme.textSecondary }]}>보유 수량</Text>
            <Pressable
              onPress={() => {
                if (!editingHoldings) {
                  const map: Record<string, string> = {};
                  for (const a of displayAllocations) {
                    const h = holdings.find((x) => x.ticker === a.ticker);
                    map[a.ticker] = h ? h.shares.toString() : '0';
                  }
                  setHoldingsMap(map);
                }
                setEditingHoldings(!editingHoldings);
              }}
            >
              <Text style={[typography.captionBold, { color: theme.primary }]}>
                {editingHoldings ? '취소' : '입력'}
              </Text>
            </Pressable>
          </View>
          {editingHoldings && (
            <View style={{ marginTop: 8 }}>
              {displayAllocations.map((a) => (
                <View key={a.ticker} style={styles.holdingRow}>
                  <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{a.name}</Text>
                  <TextInput
                    style={[styles.smallInput, { backgroundColor: theme.surfaceVariant, color: theme.text }]}
                    value={holdingsMap[a.ticker] ?? '0'}
                    onChangeText={(t) => setHoldingsMap({ ...holdingsMap, [a.ticker]: t })}
                    keyboardType="numeric"
                  />
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>주</Text>
                </View>
              ))}
              <Button title="보유수량 저장" onPress={handleHoldingsSave} size="small" style={{ marginTop: 8 }} />
            </View>
          )}
        </Card>

        {/* 종목별 상세 */}
        {displayAllocations.map((a) => {
          const holdingShares = getHoldingShares(a.ticker);
          const deviation = getDeviation(a.ticker, a.shares);
          const isOverTolerance = deviation !== null && Math.abs(deviation) > tolerance;

          return (
            <Card key={a.ticker}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: theme.text }]}>{a.name}</Text>
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>{a.ticker}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[typography.number, { color: theme.primary, fontSize: 20 }]}>{a.shares}주</Text>
                  <Text style={[typography.small, { color: theme.textSecondary }]}>
                    {formatWeight(a.weight)} · {formatCurrency(a.amount, portfolio.universe)}
                  </Text>
                </View>
              </View>
              {holdingShares !== null && (
                <View style={[styles.holdingInfo, { borderTopColor: theme.border }]}>
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>
                    보유: {holdingShares}주
                  </Text>
                  {deviation !== null && (
                    <Text
                      style={[
                        typography.captionBold,
                        { color: isOverTolerance ? theme.danger : theme.success },
                      ]}
                    >
                      괴리: {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
                      {isOverTolerance ? ' (초과)' : ' (허용)'}
                    </Text>
                  )}
                  {isOverTolerance && (
                    <Text style={[typography.small, { color: theme.danger, marginTop: 2 }]}>
                      {holdingShares > a.shares
                        ? `${holdingShares - a.shares}주 매도 필요`
                        : `${a.shares - holdingShares}주 매수 필요`}
                    </Text>
                  )}
                </View>
              )}
            </Card>
          );
        })}
      </ViewShot>

      <View style={styles.actions}>
        <Button title="공유하기" onPress={handleShare} variant="outline" size="medium" style={{ flex: 1 }} />
        <Button title="삭제" onPress={handleDelete} variant="ghost" size="medium" style={{ flex: 1 }} />
      </View>

      <Text style={[typography.small, { color: theme.textTertiary, textAlign: 'center', marginTop: 16, marginBottom: 24 }]}>
        본 정보는 투자 권유가 아니며, 투자 결정의 책임은 투자자 본인에게 있습니다.
      </Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  smallInput: {
    width: 72,
    textAlign: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  holdingInfo: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 8,
  },
});
