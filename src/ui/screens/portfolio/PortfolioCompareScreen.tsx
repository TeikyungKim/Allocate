import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, ScrollView } from 'react-native';
import { ScreenWrapper, Card, Button, Badge } from '../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../theme';
import { usePortfolio } from '../../../contexts/PortfolioContext';
import { formatCurrency, formatWeight } from '../../../utils/format';

export function PortfolioCompareScreen() {
  const { theme } = useTheme();
  const { portfolios } = usePortfolio();
  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);
  const [pickerSide, setPickerSide] = useState<'left' | 'right' | null>(null);

  const left = portfolios.find((p) => p.id === leftId);
  const right = portfolios.find((p) => p.id === rightId);

  // Merge all unique asset classes from both portfolios
  const allAssetClasses = useMemo(() => {
    const set = new Set<string>();
    left?.allocations.forEach((a) => set.add(a.assetClass));
    right?.allocations.forEach((a) => set.add(a.assetClass));
    return Array.from(set);
  }, [left, right]);

  const openPicker = (side: 'left' | 'right') => setPickerSide(side);

  const selectPortfolio = (id: string) => {
    if (pickerSide === 'left') setLeftId(id);
    else setRightId(id);
    setPickerSide(null);
  };

  const getWeight = (portfolio: typeof left, ac: string) => {
    const alloc = portfolio?.allocations.find((a) => a.assetClass === ac);
    return alloc?.weight ?? 0;
  };

  const getShares = (portfolio: typeof left, ac: string) => {
    const alloc = portfolio?.allocations.find((a) => a.assetClass === ac);
    return alloc?.shares ?? 0;
  };

  const getName = (portfolio: typeof left, ac: string) => {
    const alloc = portfolio?.allocations.find((a) => a.assetClass === ac);
    return alloc?.name ?? '-';
  };

  return (
    <ScreenWrapper>
      <Text style={[typography.h2, { color: theme.text, marginTop: 8 }]}>포트폴리오 비교</Text>

      {portfolios.length < 2 ? (
        <Card style={{ marginTop: 20 }}>
          <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center' }]}>
            비교하려면 최소 2개의 저장된 포트폴리오가 필요합니다.{'\n'}계산기에서 전략을 실행하고 저장해보세요.
          </Text>
        </Card>
      ) : (
        <>
          {/* Selector buttons */}
          <View style={styles.selectorRow}>
            <Pressable
              style={[styles.selector, { backgroundColor: left ? theme.primaryLight : theme.surfaceVariant, borderColor: theme.border }]}
              onPress={() => openPicker('left')}
            >
              <Text style={[typography.captionBold, { color: theme.textSecondary }]}>포트폴리오 A</Text>
              <Text style={[typography.bodyBold, { color: theme.text }]} numberOfLines={1}>
                {left?.name ?? '선택하세요'}
              </Text>
            </Pressable>

            <Text style={[typography.h3, { color: theme.textTertiary }]}>VS</Text>

            <Pressable
              style={[styles.selector, { backgroundColor: right ? theme.primaryLight : theme.surfaceVariant, borderColor: theme.border }]}
              onPress={() => openPicker('right')}
            >
              <Text style={[typography.captionBold, { color: theme.textSecondary }]}>포트폴리오 B</Text>
              <Text style={[typography.bodyBold, { color: theme.text }]} numberOfLines={1}>
                {right?.name ?? '선택하세요'}
              </Text>
            </Pressable>
          </View>

          {/* Comparison table */}
          {left && right && (
            <ScrollView style={{ marginTop: 16 }}>
              {/* Summary */}
              <Card>
                <View style={styles.summaryRow}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={[typography.small, { color: theme.textSecondary }]}>투자금액</Text>
                    <Text style={[typography.bodyBold, { color: theme.text }]}>
                      {formatCurrency(left.investmentAmount, left.universe)}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={[typography.small, { color: theme.textSecondary }]}>투자금액</Text>
                    <Text style={[typography.bodyBold, { color: theme.text }]}>
                      {formatCurrency(right.investmentAmount, right.universe)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.summaryRow, { marginTop: 8 }]}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={[typography.small, { color: theme.textSecondary }]}>종목 수</Text>
                    <Text style={[typography.bodyBold, { color: theme.text }]}>{left.allocations.length}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={[typography.small, { color: theme.textSecondary }]}>종목 수</Text>
                    <Text style={[typography.bodyBold, { color: theme.text }]}>{right.allocations.length}</Text>
                  </View>
                </View>
              </Card>

              {/* Asset class comparison */}
              <Text style={[typography.bodyBold, { color: theme.text, marginTop: 16, marginBottom: 8 }]}>
                자산군별 비교
              </Text>
              {allAssetClasses.map((ac) => {
                const lw = getWeight(left, ac);
                const rw = getWeight(right, ac);
                const diff = rw - lw;
                return (
                  <Card key={ac}>
                    <Text style={[typography.captionBold, { color: theme.primary, marginBottom: 6 }]}>{ac}</Text>
                    <View style={styles.compareRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.small, { color: theme.textSecondary }]}>{getName(left, ac)}</Text>
                        <Text style={[typography.bodyBold, { color: lw > 0 ? theme.text : theme.textTertiary }]}>
                          {lw > 0 ? `${formatWeight(lw)} · ${getShares(left, ac)}주` : '-'}
                        </Text>
                      </View>
                      <View style={[styles.diffBadge, { backgroundColor: diff === 0 ? theme.surfaceVariant : diff > 0 ? theme.successLight : theme.dangerLight }]}>
                        <Text style={[typography.small, {
                          color: diff === 0 ? theme.textTertiary : diff > 0 ? theme.success : theme.danger,
                          fontWeight: '700',
                        }]}>
                          {diff === 0 ? '=' : diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                        </Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={[typography.small, { color: theme.textSecondary }]}>{getName(right, ac)}</Text>
                        <Text style={[typography.bodyBold, { color: rw > 0 ? theme.text : theme.textTertiary }]}>
                          {rw > 0 ? `${getShares(right, ac)}주 · ${formatWeight(rw)}` : '-'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </ScrollView>
          )}
        </>
      )}

      {/* Portfolio picker modal */}
      <Modal visible={pickerSide !== null} transparent animationType="fade" onRequestClose={() => setPickerSide(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPickerSide(null)}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[typography.bodyBold, { color: theme.text, marginBottom: 12 }]}>
              포트폴리오 {pickerSide === 'left' ? 'A' : 'B'} 선택
            </Text>
            <FlatList
              data={portfolios}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = (pickerSide === 'left' ? leftId : rightId) === item.id;
                const isOtherSide = (pickerSide === 'left' ? rightId : leftId) === item.id;
                return (
                  <Pressable
                    style={[styles.pickerItem, isSelected && { backgroundColor: theme.primaryLight }]}
                    onPress={() => selectPortfolio(item.id)}
                    disabled={isOtherSide}
                  >
                    <Text style={[typography.body, {
                      color: isOtherSide ? theme.textTertiary : isSelected ? theme.primary : theme.text,
                    }]}>
                      {item.name}
                    </Text>
                    <Text style={[typography.small, { color: theme.textSecondary }]}>
                      {formatCurrency(item.investmentAmount, item.universe)}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  selector: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  divider: { width: 1, height: 30, backgroundColor: '#E5E7EB', marginHorizontal: 8 },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, minWidth: 50, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', maxHeight: '60%', borderRadius: 16, padding: 20, elevation: 5 },
  pickerItem: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
