import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PieChart } from 'react-native-chart-kit';
import { ScreenWrapper, Card, Button, Badge } from '../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../theme';
import { strategies } from '../../../data/strategies';
import { formatWeight } from '../../../utils/format';
import { StrategyStackParamList } from '../../navigation/types';

type Route = RouteProp<StrategyStackParamList, 'StrategyDetail'>;

export function StrategyDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<NativeStackNavigationProp<StrategyStackParamList>>();
  const strategy = strategies.find((s) => s.id === route.params.strategyId);

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

  return (
    <ScreenWrapper>
      <View style={styles.top}>
        <Badge
          label={strategy.type === 'static' ? '정적 전략' : '동적 전략'}
          color={strategy.type === 'static' ? theme.success : theme.primary}
          bgColor={strategy.type === 'static' ? theme.successLight : theme.primaryLight}
        />
        <Text style={[typography.h1, { color: theme.text, marginTop: 8 }]}>{strategy.name}</Text>
        <Text style={[typography.body, { color: theme.textSecondary, marginTop: 8 }]}>
          {strategy.description}
        </Text>
      </View>

      <Card style={{ marginTop: 16 }}>
        <Text style={[typography.h3, { color: theme.text, marginBottom: 12 }]}>자산 배분</Text>
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
});
