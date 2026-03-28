import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { ScreenWrapper, Card } from '../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../theme';

export function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();

  const themeOptions = [
    { key: 'system' as const, label: '시스템 설정' },
    { key: 'light' as const, label: '라이트' },
    { key: 'dark' as const, label: '다크' },
  ];

  return (
    <ScreenWrapper>
      <Text style={[typography.h2, { color: theme.text, marginTop: 16 }]}>설정</Text>

      <Card style={{ marginTop: 20 }}>
        <Text style={[typography.bodyBold, { color: theme.text }]}>테마</Text>
        <View style={styles.themeRow}>
          {themeOptions.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setThemeMode(opt.key)}
              style={[
                styles.themeChip,
                {
                  backgroundColor: themeMode === opt.key ? theme.primary : theme.surfaceVariant,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  { color: themeMode === opt.key ? '#FFF' : theme.textSecondary },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={[typography.bodyBold, { color: theme.text }]}>정보</Text>
        <View style={styles.infoRow}>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>버전</Text>
          <Text style={[typography.caption, { color: theme.text }]}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>ETF 가격 기준</Text>
          <Text style={[typography.caption, { color: theme.text }]}>내장 데이터</Text>
        </View>
      </Card>

      <Card>
        <Text style={[typography.bodyBold, { color: theme.text }]}>면책조항</Text>
        <Text style={[typography.small, { color: theme.textSecondary, marginTop: 8, lineHeight: 18 }]}>
          본 앱에서 제공하는 정보는 투자 권유 목적이 아니며, 특정 금융 상품의 매수·매도를 추천하지 않습니다.
          {'\n\n'}투자 결정에 따른 책임은 전적으로 투자자 본인에게 있으며, 과거의 수익률이 미래의 수익을 보장하지 않습니다.
          {'\n\n'}ETF 가격 데이터는 실시간이 아닐 수 있으며, 실제 매매 시 가격 차이가 발생할 수 있습니다.
        </Text>
      </Card>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  themeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  themeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
});
