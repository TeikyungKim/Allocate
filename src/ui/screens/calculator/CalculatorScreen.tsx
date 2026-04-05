import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Modal, FlatList, ScrollView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper, Card, Button, Badge } from '../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../theme';
import { strategies, Strategy } from '../../../data/strategies';
import { getETFUniverse, getETFsByAssetClass, getCustomETFUniverse } from '../../../data/etfs';
import { calculateAllocation } from '../../../core/engine/allocationEngine';
import { formatCurrency, formatWeight, generateId } from '../../../utils/format';
import { usePortfolio, SavedPortfolio, CustomStrategy } from '../../../contexts/PortfolioContext';
import { showInterstitialAd } from '../../../services/adService';
import { CalculatorStackParamList } from '../../navigation/types';
import { useDynamicStrategy } from '../../../hooks/useDynamicStrategy';
import { exportAllocationCSV } from '../../../services/csvExportService';
import * as Haptics from 'expo-haptics';
import { playCalculateSound, playSaveSound } from '../../../services/soundService';

type Universe = 'korea' | 'retirement' | 'us';
type Route = RouteProp<CalculatorStackParamList, 'Calculator'>;

/** Convert CustomStrategy to Strategy shape for calculation */
function customToStrategy(cs: CustomStrategy): Strategy {
  return {
    id: cs.id,
    name: cs.name,
    type: 'static',
    description: '커스텀 전략',
    defaultAllocations: cs.allocations.map((a) => ({ assetClass: a.assetClass, weight: a.weight })),
  };
}

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
  const { savePortfolio, customStrategies } = usePortfolio();

  // Merge built-in + custom strategies
  const allStrategies = useMemo(() => {
    const customs: Strategy[] = customStrategies.map(customToStrategy);
    return [...strategies, ...customs];
  }, [customStrategies]);

  const [selectedStrategyId, setSelectedStrategyId] = useState(strategies[0].id);
  const [universe, setUniverse] = useState<Universe>('korea');
  const [amountText, setAmountText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showETFModal, setShowETFModal] = useState(false);
  const [selectedETFAssetClass, setSelectedETFAssetClass] = useState<string | null>(null);
  const [etfOverrides, setEtfOverrides] = useState<Record<string, string>>({});

  // strategyId 파라미터 동기화 — 전략 상세에서 넘어올 때
  useEffect(() => {
    const paramId = route.params?.strategyId;
    if (paramId && allStrategies.some((s) => s.id === paramId)) {
      setSelectedStrategyId(paramId);
      setShowResult(false);
    }
  }, [route.params?.strategyId, allStrategies]);

  const baseStrategy = allStrategies.find((s) => s.id === selectedStrategyId) ?? allStrategies[0];
  const { effectiveStrategy: strategy, isDynamic, loading: dynamicLoading } = useDynamicStrategy(baseStrategy);
  const amount = parseFloat(amountText.replace(/,/g, '')) || 0;
  const presets = universe === 'us' ? PRESET_AMOUNTS_US : PRESET_AMOUNTS_KR;

  const etfOptions = useMemo(() => getETFsByAssetClass(universe), [universe]);

  const result = useMemo(() => {
    if (!showResult || amount <= 0) return null;
    const etfMap = Object.keys(etfOverrides).length > 0
      ? getCustomETFUniverse(universe, etfOverrides)
      : getETFUniverse(universe);
    return calculateAllocation(strategy, etfMap, amount, universe);
  }, [showResult, amount, strategy, universe, etfOverrides]);

  // 전략에서 사용하는 모든 자산군
  const strategyAssetClasses = useMemo(() => {
    return strategy.defaultAllocations.map((a) => a.assetClass);
  }, [strategy]);

  // 대체 ETF가 있는 자산군
  const assetClassesWithOptions = useMemo(() => {
    return strategyAssetClasses.filter((ac) => (etfOptions[ac]?.length ?? 0) > 1);
  }, [strategyAssetClasses, etfOptions]);

  const handleCalculate = () => {
    if (amount <= 0) return;
    setShowResult(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    playCalculateSound();
    showInterstitialAd();
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
      etfOverrides: Object.keys(etfOverrides).length > 0 ? etfOverrides : undefined,
      createdAt: new Date().toISOString(),
    };
    await savePortfolio(portfolio);
    playSaveSound();
    navigation.getParent()?.navigate('PortfolioTab');
  };

  const handleETFSelect = (assetClass: string, ticker: string) => {
    const defaultMap = getETFUniverse(universe);
    const defaultTicker = defaultMap[assetClass]?.ticker;
    if (ticker === defaultTicker) {
      const next = { ...etfOverrides };
      delete next[assetClass];
      setEtfOverrides(next);
    } else {
      setEtfOverrides({ ...etfOverrides, [assetClass]: ticker });
    }
    setShowResult(false);
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
              onPress={() => { setUniverse(u); setShowResult(false); setEtfOverrides({}); }}
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

      {/* Strategy selector — 모달 방식 */}
      <View style={styles.section}>
        <Text style={[typography.captionBold, { color: theme.textSecondary }]}>전략 선택</Text>
        <Pressable
          onPress={() => setShowStrategyModal(true)}
          style={[styles.selectorButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyBold, { color: theme.text }]}>{strategy.name}</Text>
            <Text style={[typography.small, { color: theme.textSecondary }]} numberOfLines={1}>
              {customStrategies.some((cs) => cs.id === strategy.id) ? '커스텀' : strategy.type === 'static' ? '정적' : '동적'}{strategy.riskLevel ? ` · ${strategy.riskLevel}` : ''}{isDynamic ? ' · 실시간 적용' : ''}
            </Text>
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: 18 }}>{'▾'}</Text>
        </Pressable>
      </View>

      {/* ETF 선택 — 자산군별 ETF 직접 선택 */}
      {strategyAssetClasses.length > 0 && (
        <View style={styles.section}>
          <Text style={[typography.captionBold, { color: theme.textSecondary }]}>ETF 선택</Text>
          <View style={{ gap: 6, marginTop: 8 }}>
            {strategyAssetClasses.map((ac) => {
              const options = etfOptions[ac] ?? [];
              const defaultMap = getETFUniverse(universe);
              const defaultTicker = defaultMap[ac]?.ticker;
              const overrideTicker = etfOverrides[ac];
              const selectedETF = overrideTicker
                ? options.find((e) => e.ticker === overrideTicker) ?? options[0]
                : options[0] ?? defaultMap[ac];
              const hasMultiple = options.length > 1;
              return (
                <Pressable
                  key={ac}
                  onPress={() => {
                    if (hasMultiple) {
                      setSelectedETFAssetClass(ac);
                      setShowETFModal(true);
                    }
                  }}
                  style={[
                    styles.etfRow,
                    {
                      backgroundColor: theme.surface,
                      borderColor: hasMultiple ? theme.border : theme.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.small, { color: theme.textSecondary }]}>{ac}</Text>
                    <Text style={[typography.body, { color: theme.text }]}>
                      {selectedETF?.name ?? '-'}
                      <Text style={[typography.small, { color: theme.textSecondary }]}>
                        {' '}{selectedETF?.ticker ?? ''}
                      </Text>
                    </Text>
                  </View>
                  {hasMultiple && (
                    <Text style={{ color: theme.primary, fontSize: 12 }}>{'변경 ▸'}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Amount input */}
      <View style={styles.section}>
        <Text style={[typography.captionBold, { color: theme.textSecondary }]}>
          투자 금액 ({universe === 'us' ? 'USD' : 'KRW'})
        </Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
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

          {result.allocations.map((a) => (
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

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
            <Button title="포트폴리오 저장" onPress={handleSave} variant="secondary" size="large" style={{ flex: 1 }} />
            <Button
              title="CSV 내보내기"
              onPress={() => {
                if (!result) return;
                exportAllocationCSV(
                  result.allocations,
                  amount,
                  result.remainder,
                  strategy.name,
                  UNIVERSE_LABELS[universe],
                );
              }}
              variant="outline"
              size="large"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      {/* Strategy Modal — built-in + custom */}
      <Modal visible={showStrategyModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, { color: theme.text }]}>전략 선택</Text>
              <Pressable onPress={() => setShowStrategyModal(false)} style={styles.closeBtn}>
                <Text style={[typography.bodyBold, { color: theme.textSecondary }]}>닫기</Text>
              </Pressable>
            </View>
            <FlatList
              data={allStrategies}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => {
                const isCustom = customStrategies.some((cs) => cs.id === item.id);
                return (
                  <Pressable
                    onPress={() => {
                      setSelectedStrategyId(item.id);
                      setShowResult(false);
                      setShowStrategyModal(false);
                    }}
                    style={[
                      styles.modalItem,
                      {
                        backgroundColor: selectedStrategyId === item.id ? theme.primaryLight : theme.surface,
                        borderColor: selectedStrategyId === item.id ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <View style={styles.modalItemHeader}>
                      <Badge
                        label={isCustom ? '커스텀' : item.type === 'static' ? '정적' : '동적'}
                        color={isCustom ? theme.warning : item.type === 'static' ? theme.success : theme.primary}
                        bgColor={isCustom ? theme.warningLight : item.type === 'static' ? theme.successLight : theme.primaryLight}
                      />
                      {item.riskLevel && (
                        <Text style={[typography.small, { color: theme.textTertiary, marginLeft: 8 }]}>
                          위험: {item.riskLevel}
                        </Text>
                      )}
                    </View>
                    <Text style={[typography.bodyBold, { color: theme.text, marginTop: 4 }]}>{item.name}</Text>
                    <Text style={[typography.small, { color: theme.textSecondary, marginTop: 2 }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ETF Selection Modal — 특정 자산군의 ETF 선택 */}
      <Modal visible={showETFModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, { color: theme.text }]}>
                {selectedETFAssetClass ? `${selectedETFAssetClass} ETF 선택` : 'ETF 선택'}
              </Text>
              <Pressable onPress={() => { setShowETFModal(false); setSelectedETFAssetClass(null); }} style={styles.closeBtn}>
                <Text style={[typography.bodyBold, { color: theme.textSecondary }]}>닫기</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              {(selectedETFAssetClass ? [selectedETFAssetClass] : assetClassesWithOptions).map((ac) => {
                const options = etfOptions[ac] ?? [];
                const defaultMap = getETFUniverse(universe);
                const defaultTicker = defaultMap[ac]?.ticker;
                const selectedTicker = etfOverrides[ac] ?? defaultTicker;
                return (
                  <View key={ac} style={styles.etfSection}>
                    {!selectedETFAssetClass && (
                      <Text style={[typography.bodyBold, { color: theme.text, marginBottom: 8 }]}>{ac}</Text>
                    )}
                    {options.map((etf) => (
                      <Pressable
                        key={etf.ticker}
                        onPress={() => {
                          handleETFSelect(ac, etf.ticker);
                          if (selectedETFAssetClass) {
                            setShowETFModal(false);
                            setSelectedETFAssetClass(null);
                          }
                        }}
                        style={[
                          styles.etfOption,
                          {
                            backgroundColor: selectedTicker === etf.ticker ? theme.primaryLight : theme.surface,
                            borderColor: selectedTicker === etf.ticker ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.body, { color: theme.text }]}>{etf.name}</Text>
                          <Text style={[typography.small, { color: theme.textSecondary }]}>
                            {etf.ticker} · {etf.currency === 'KRW' ? `${etf.price.toLocaleString()}원` : `$${etf.price}`}
                            {etf.aum ? ` · 규모 ${etf.aum.toLocaleString()}억` : ''}
                          </Text>
                        </View>
                        {selectedTicker === etf.ticker && (
                          <Text style={{ color: theme.primary, fontSize: 16 }}>{'✓'}</Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chips: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
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
  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { maxHeight: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 },
  closeBtn: { padding: 8 },
  modalItem: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  modalItemHeader: { flexDirection: 'row', alignItems: 'center' },
  etfRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  etfSection: { marginBottom: 16 },
  etfOption: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 6, flexDirection: 'row', alignItems: 'center' },
});
