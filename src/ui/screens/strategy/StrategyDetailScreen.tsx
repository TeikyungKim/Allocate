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

  const dc = strategy.dynamicConfig;

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

      {/* 동적 전략: 공식 */}
      {strategy.formula && (
        <Card style={{ marginTop: 4 }}>
          <Text style={[typography.h3, { color: theme.text, marginBottom: 8 }]}>공식</Text>
          <View style={[styles.formulaBox, { backgroundColor: theme.surfaceVariant }]}>
            <Text style={[styles.formulaText, { color: theme.text }]}>
              {strategy.formula}
            </Text>
          </View>
        </Card>
      )}

      {/* 동적 전략: 자산 구성 */}
      {dc && (
        <Card style={{ marginTop: 4 }}>
          <Text style={[typography.h3, { color: theme.text, marginBottom: 8 }]}>자산 구성</Text>
          {dc.offensiveAssets && dc.offensiveAssets.length > 0 && (
            <View style={styles.assetGroup}>
              <Text style={[typography.captionBold, { color: theme.primary }]}>공격 자산</Text>
              <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                {dc.offensiveAssets.join(', ')}
              </Text>
            </View>
          )}
          {dc.defensiveAssets && dc.defensiveAssets.length > 0 && (
            <View style={styles.assetGroup}>
              <Text style={[typography.captionBold, { color: theme.success }]}>방어 자산</Text>
              <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                {dc.defensiveAssets.join(', ')}
              </Text>
            </View>
          )}
          {dc.canaryAssets && dc.canaryAssets.length > 0 && (
            <View style={styles.assetGroup}>
              <Text style={[typography.captionBold, { color: theme.warning }]}>카나리아 자산</Text>
              <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                {dc.canaryAssets.join(', ')}
              </Text>
            </View>
          )}
          {dc.lookbackMonths && (
            <View style={styles.assetGroup}>
              <Text style={[typography.captionBold, { color: theme.textSecondary }]}>룩백 기간</Text>
              <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                {dc.lookbackMonths.map((m) => `${m}개월`).join(', ')}
              </Text>
            </View>
          )}
          {dc.topN !== undefined && (
            <View style={styles.assetGroup}>
              <Text style={[typography.captionBold, { color: theme.textSecondary }]}>선택 종목 수</Text>
              <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                Top-{dc.topN}
              </Text>
            </View>
          )}
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
});
