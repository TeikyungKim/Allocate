import React, { useRef } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ScreenWrapper, Card, Button } from '../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../theme';
import { usePortfolio } from '../../../contexts/PortfolioContext';
import { formatCurrency, formatWeight } from '../../../utils/format';
import { PortfolioStackParamList } from '../../navigation/types';

type Route = RouteProp<PortfolioStackParamList, 'PortfolioDetail'>;

export function PortfolioDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { portfolios, deletePortfolio } = usePortfolio();
  const viewShotRef = useRef<ViewShot>(null);

  const portfolio = portfolios.find((p) => p.id === route.params.portfolioId);

  if (!portfolio) {
    return (
      <ScreenWrapper>
        <Text style={[typography.body, { color: theme.text }]}>포트폴리오를 찾을 수 없습니다.</Text>
      </ScreenWrapper>
    );
  }

  const pieData = portfolio.allocations.map((a, i) => ({
    name: a.name,
    weight: a.weight,
    color: theme.chart[i % theme.chart.length],
    legendFontColor: theme.textSecondary,
    legendFontSize: 11,
  }));

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
        <Text style={[typography.h2, { color: theme.text, marginTop: 8 }]}>{portfolio.name}</Text>
        <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4 }]}>
          {new Date(portfolio.createdAt).toLocaleDateString('ko-KR')} · 투자금: {formatCurrency(portfolio.investmentAmount, portfolio.universe)}
        </Text>

        <Card style={{ marginTop: 16 }}>
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

        {portfolio.allocations.map((a) => (
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
          </Card>
        ))}
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
});
