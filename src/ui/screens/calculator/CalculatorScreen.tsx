import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper, Card, Button, Badge } from '../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../theme';
import { strategies } from '../../../data/strategies';
import { getETFUniverse } from '../../../data/etfs';
import { calculateAllocation } from '../../../core/engine/allocationEngine';
import { formatCurrency, formatWeight, generateId } from '../../../utils/format';
import { usePortfolio, SavedPortfolio } from '../../../contexts/PortfolioContext';
import { showInterstitialAd } from '../../../services/adService';
import { CalculatorStackParamList } from '../../navigation/types';

type Universe = 'korea' | 'retirement' | 'us';
type Route = RouteProp<CalculatorStackParamList, 'Calculator'>;

const UNIVERSE_LABELS: Record<Universe, string> = {
  korea: '한국 ETF',
  retirement: '퇴직연금 ETF',
  us: '미국 ETF',
};

const PRESET_AMOUNTS_KR = [1000000, 5000000, 10000000, 50000000, 100000000];
const PRESET_AMOUNTS_US = [1000, 5000, 10000, 50000, 100000];

export function CalculatorScreen() {
  const { theme } = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<NativeStackNavigationProp<CalculatorStackParamList>>();
  const { savePortfolio } = usePortfolio();

  const initialStrategy = route.params?.strategyId || strategies[0].id;
  const [selectedStrategyId, setSelectedStrategyId] = useState(initialStrategy);
  const [universe, setUniverse] = useState<Universe>('korea');
  const [amountText, setAmountText] = useState('');
  const [showResult, setShowResult] = useState(false);

  const strategy = strategies.find((s) => s.id === selectedStrategyId)!;
  const amount = parseFloat(amountText.replace(/,/g, '')) || 0;
  const presets = universe === 'us' ? PRESET_AMOUNTS_US : PRESET_AMOUNTS_KR;

  const result = useMemo(() => {
    if (!showResult || amount <= 0) return null;
    const etfMap = getETFUniverse(universe);
    return calculateAllocation(strategy, etfMap, amount, universe);
  }, [showResult, amount, strategy, universe]);

  const handleCalculate = () => {
    if (amount <= 0) return;
    setShowResult(true);
    showInterstitialAd(); // 세션당 1회만 노출
  };

  const handleSave = async () => {
    if (!result) return;
    const portfolio: SavedPortfolio = {
      id: generateId(),
      name: `${strategy.name} - ${UNIVERSE_LABELS[universe]}`,
      strategyId: strategy.id,
      universe,
      investmentAmount: amount,
      allocations: result.allocations,
      createdAt: new Date().toISOString(),
    };
    await savePortfolio(portfolio);
    navigation.getParent()?.navigate('PortfolioTab');
  };

  return (
    <ScreenWrapper>
      <Text style={[typography.h2, { color: theme.text, marginTop: 8 }]}>투자 계산기</Text>

      {/* Universe selector */}
      <View style={styles.section}>
        <Text style={[typography.captionBold, { color: theme.textSecondary }]}>ETF 유니버스</Text>
        <View style={styles.chips}>
          {(Object.keys(UNIVERSE_LABELS) as Universe[]).map((u) => (
            <Pressable
              key={u}
              onPress={() => { setUniverse(u); setShowResult(false); }}
              style={[
                styles.chip,
                { backgroundColor: universe === u ? theme.primary : theme.surfaceVariant },
              ]}
            >
              <Text style={[typography.captionBold, { color: universe === u ? '#FFF' : theme.textSecondary }]}>
                {UNIVERSE_LABELS[u]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Strategy selector */}
      <View style={styles.section}>
        <Text style={[typography.captionBold, { color: theme.textSecondary }]}>전략 선택</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={strategies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => { setSelectedStrategyId(item.id); setShowResult(false); }}
              style={[
                styles.strategyChip,
                {
                  backgroundColor: selectedStrategyId === item.id ? theme.primary : theme.surface,
                  borderColor: selectedStrategyId === item.id ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  { color: selectedStrategyId === item.id ? '#FFF' : theme.text },
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Amount input */}
      <View style={styles.section}>
        <Text style={[typography.captionBold, { color: theme.textSecondary }]}>
          투자 금액 ({universe === 'us' ? 'USD' : 'KRW'})
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          value={amountText}
          onChangeText={(t) => { setAmountText(t); setShowResult(false); }}
          keyboardType="numeric"
          placeholder={universe === 'us' ? '10,000' : '10,000,000'}
          placeholderTextColor={theme.textTertiary}
        />
        <View style={styles.presets}>
          {presets.map((p) => (
            <Pressable
              key={p}
              onPress={() => { setAmountText(p.toLocaleString()); setShowResult(false); }}
              style={[styles.presetChip, { backgroundColor: theme.surfaceVariant }]}
            >
              <Text style={[typography.small, { color: theme.textSecondary }]}>
                {universe === 'us' ? `$${p.toLocaleString()}` : `${(p / 10000).toLocaleString()}만`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Button title="계산하기" onPress={handleCalculate} size="large" disabled={amount <= 0} />

      {/* Result */}
      {result && (
        <View style={styles.resultSection}>
          <Card>
            <Text style={[typography.h3, { color: theme.text }]}>매수 계획</Text>
            <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4 }]}>
              총 투자: {formatCurrency(amount, universe)} → 실투자: {formatCurrency(result.totalInvested, universe)}
            </Text>
            <Text style={[typography.caption, { color: theme.textSecondary }]}>
              잔여: {formatCurrency(result.remainder, universe)}
            </Text>
          </Card>

          {result.allocations.map((a, i) => (
            <Card key={a.ticker}>
              <View style={styles.resultRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: theme.text }]}>{a.name}</Text>
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>{a.ticker}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[typography.number, { color: theme.primary }]}>{a.shares}주</Text>
                  <Text style={[typography.small, { color: theme.textSecondary }]}>
                    {formatWeight(a.weight)} · {formatCurrency(a.amount, universe)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}

          <Button title="포트폴리오 저장" onPress={handleSave} variant="secondary" size="large" style={{ marginBottom: 24 }} />
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  strategyChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
    fontSize: 18,
    fontWeight: '600',
  },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  presetChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  resultSection: { marginTop: 24 },
  resultRow: { flexDirection: 'row', alignItems: 'center' },
});
