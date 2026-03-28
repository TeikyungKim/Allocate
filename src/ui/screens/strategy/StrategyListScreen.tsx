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

type Nav = NativeStackNavigationProp<StrategyStackParamList, 'StrategyList'>;

export function StrategyListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const { customStrategies } = usePortfolio();
  const [filter, setFilter] = useState<'all' | 'static' | 'dynamic' | 'custom'>('all');

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
    if (filter === 'custom') return customItems;
    const base = strategies.filter((s) => {
      if (filter === 'all') return true;
      return s.type === filter;
    });
    if (filter === 'all' || filter === 'static') return [...base, ...customItems];
    return base;
  }, [filter, customItems]);

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
      <AdBanner />
      <FlatList
        data={allItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isCustom = item.id.startsWith('custom-');
          return (
            <Card
              onPress={() => {
                // 커스텀 전략은 'custom-' 접두사 제거하여 원래 ID로 상세 화면 이동
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
                {item.riskLevel && (
                  <Text style={[typography.small, { color: theme.textTertiary }]}>
                    위험도: {item.riskLevel}
                  </Text>
                )}
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
