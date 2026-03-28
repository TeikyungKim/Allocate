import React from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper, Card, Button, Badge } from '../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../theme';
import { usePortfolio } from '../../../contexts/PortfolioContext';
import { formatCurrency } from '../../../utils/format';
import { PortfolioStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<PortfolioStackParamList>;

export function PortfolioListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const { portfolios, deletePortfolio, customStrategies } = usePortfolio();

  return (
    <ScreenWrapper scroll={false} padding={false}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[typography.h2, { color: theme.text, paddingHorizontal: 16 }]}>내 포트폴리오</Text>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 }}>
          <Button
            title="커스텀 전략"
            onPress={() => navigation.navigate('CustomStrategy')}
            variant="outline"
            size="small"
          />
        </View>
      </View>

      {portfolios.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[typography.body, { color: theme.textTertiary, textAlign: 'center' }]}>
            저장된 포트폴리오가 없습니다.{'\n'}계산기에서 전략을 실행하고 저장해보세요.
          </Text>
        </View>
      ) : (
        <FlatList
          data={portfolios}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card
              onPress={() => navigation.navigate('PortfolioDetail', { portfolioId: item.id })}
              style={{ marginHorizontal: 16 }}
            >
              <View style={styles.cardTop}>
                <Text style={[typography.bodyBold, { color: theme.text, flex: 1 }]}>{item.name}</Text>
                <Badge label={item.universe === 'us' ? '미국' : item.universe === 'retirement' ? '퇴직연금' : '한국'} />
              </View>
              <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4 }]}>
                투자금: {formatCurrency(item.investmentAmount, item.universe)}
              </Text>
              <Text style={[typography.small, { color: theme.textTertiary, marginTop: 4 }]}>
                {new Date(item.createdAt).toLocaleDateString('ko-KR')} · {item.allocations.length}종목
              </Text>
            </Card>
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  list: { paddingTop: 16, paddingBottom: 24 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
});
