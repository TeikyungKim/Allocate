import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper, Card, Badge, AdBanner } from '../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../theme';
import { strategies } from '../../../data/strategies';
import { StrategyStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<StrategyStackParamList, 'StrategyList'>;

export function StrategyListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<'all' | 'static' | 'dynamic'>('all');

  const filtered = strategies.filter((s) => {
    if (filter === 'all') return true;
    return s.type === filter;
  });

  return (
    <ScreenWrapper scroll={false} padding={false}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[typography.h2, { color: theme.text, paddingHorizontal: 16 }]}>전략</Text>
        <View style={styles.filters}>
          {(['all', 'static', 'dynamic'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f ? theme.primary : theme.surfaceVariant,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  { color: filter === f ? '#FFF' : theme.textSecondary },
                ]}
              >
                {f === 'all' ? '전체' : f === 'static' ? '정적' : '동적'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <AdBanner />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card
            onPress={() => navigation.navigate('StrategyDetail', { strategyId: item.id })}
            style={{ marginHorizontal: 16 }}
          >
            <View style={styles.cardHeader}>
              <Badge
                label={item.type === 'static' ? '정적' : '동적'}
                color={item.type === 'static' ? theme.success : theme.primary}
                bgColor={item.type === 'static' ? theme.successLight : theme.primaryLight}
              />
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
          </Card>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1 },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  list: { paddingTop: 16, paddingBottom: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
