import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Switch, Platform } from 'react-native';
import { ScreenWrapper, Card, Button } from '../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { usePortfolio } from '../../../contexts/PortfolioContext';
import { typography } from '../../../theme';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  NotificationSettings,
} from '../../../services/notificationService';
import { isSoundEnabled, setSoundEnabled, initSoundSettings } from '../../../services/soundService';

export function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth();
  const { syncWithCloud, syncing, lastSyncedAt } = usePortfolio();
  const [authBusy, setAuthBusy] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  useEffect(() => {
    if (Platform.OS !== 'web') {
      getNotificationSettings().then(setNotifSettings);
    }
    initSoundSettings().then(() => setSoundOn(isSoundEnabled()));
  }, []);

  const handleToggleRebalance = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('권한 필요', '알림을 받으려면 설정에서 알림 권한을 허용해주세요.');
        return;
      }
    }
    const updated = { ...notifSettings!, rebalanceEnabled: enabled };
    setNotifSettings(updated);
    await saveNotificationSettings(updated);
  };

  const handleChangeDay = async (day: number) => {
    const updated = { ...notifSettings!, rebalanceDay: day };
    setNotifSettings(updated);
    await saveNotificationSettings(updated);
  };

  const themeOptions = [
    { key: 'system' as const, label: '시스템 설정' },
    { key: 'light' as const, label: '라이트' },
    { key: 'dark' as const, label: '다크' },
  ];

  const handleGoogleLogin = async () => {
    setAuthBusy(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      if (e?.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('로그인 실패', e?.message ?? '알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '로그아웃 하시겠습니까? 로컬 데이터는 유지됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            setAuthBusy(true);
            try { await signOut(); } catch { /* ignore */ }
            setAuthBusy(false);
          },
        },
      ],
    );
  };

  const handleSync = async () => {
    if (!user) return;
    try {
      await syncWithCloud(user.uid);
      Alert.alert('동기화 완료', '포트폴리오 데이터가 클라우드와 동기화되었습니다.');
    } catch (e: any) {
      Alert.alert('동기화 실패', e?.message ?? '네트워크를 확인해주세요.');
    }
  };

  return (
    <ScreenWrapper>
      <Text style={[typography.h2, { color: theme.text, marginTop: 16 }]}>설정</Text>

      {/* 계정 */}
      <Card style={{ marginTop: 20 }}>
        <Text style={[typography.bodyBold, { color: theme.text }]}>계정</Text>
        {authLoading || authBusy ? (
          <ActivityIndicator style={{ marginTop: 12 }} color={theme.primary} />
        ) : user ? (
          <View style={{ marginTop: 12 }}>
            <View style={styles.accountRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.body, { color: theme.text }]}>{user.displayName ?? '사용자'}</Text>
                <Text style={[typography.small, { color: theme.textSecondary }]}>{user.email}</Text>
              </View>
              <Pressable onPress={handleLogout} style={[styles.smallBtn, { backgroundColor: theme.dangerLight }]}>
                <Text style={[typography.captionBold, { color: theme.danger }]}>로그아웃</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={handleGoogleLogin}
            style={[styles.googleBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Text style={[typography.bodyBold, { color: theme.text }]}>Google 계정으로 로그인</Text>
            <Text style={[typography.small, { color: theme.textSecondary, marginTop: 2 }]}>
              로그인하면 포트폴리오를 클라우드에 백업할 수 있습니다
            </Text>
          </Pressable>
        )}
      </Card>

      {/* 클라우드 동기화 */}
      {user && (
        <Card>
          <View style={styles.syncHeader}>
            <Text style={[typography.bodyBold, { color: theme.text }]}>클라우드 동기화</Text>
            {syncing && <ActivityIndicator size="small" color={theme.primary} />}
          </View>
          {lastSyncedAt && (
            <Text style={[typography.small, { color: theme.textSecondary, marginTop: 4 }]}>
              마지막 동기화: {new Date(lastSyncedAt).toLocaleString('ko-KR')}
            </Text>
          )}
          <Button
            title={syncing ? '동기화 중...' : '지금 동기화'}
            onPress={handleSync}
            disabled={syncing}
            size="small"
            style={{ marginTop: 12 }}
          />
          <Text style={[typography.small, { color: theme.textSecondary, marginTop: 8 }]}>
            포트폴리오와 커스텀 전략을 Google 계정에 백업합니다.{'\n'}다른 기기에서 같은 계정으로 로그인하면 데이터를 복원할 수 있습니다.
          </Text>
        </Card>
      )}

      {/* 리밸런싱 알림 */}
      {Platform.OS !== 'web' && notifSettings && (
        <Card>
          <View style={styles.syncHeader}>
            <Text style={[typography.bodyBold, { color: theme.text }]}>리밸런싱 알림</Text>
            <Switch
              value={notifSettings.rebalanceEnabled}
              onValueChange={handleToggleRebalance}
              trackColor={{ true: theme.primary }}
            />
          </View>
          <Text style={[typography.small, { color: theme.textSecondary, marginTop: 4 }]}>
            매월 리밸런싱 시점을 알려줍니다
          </Text>
          {notifSettings.rebalanceEnabled && (
            <View style={{ marginTop: 12 }}>
              <Text style={[typography.captionBold, { color: theme.textSecondary }]}>알림 날짜 (매월)</Text>
              <View style={styles.dayChips}>
                {[1, 5, 10, 15, 20, 25].map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => handleChangeDay(d)}
                    style={[
                      styles.themeChip,
                      { backgroundColor: notifSettings.rebalanceDay === d ? theme.primary : theme.surfaceVariant },
                    ]}
                  >
                    <Text style={[typography.captionBold, { color: notifSettings.rebalanceDay === d ? '#FFF' : theme.textSecondary }]}>
                      {d}일
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </Card>
      )}

      {/* 테마 */}
      <Card>
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

      {/* 사운드 */}
      <Card>
        <View style={styles.syncHeader}>
          <Text style={[typography.bodyBold, { color: theme.text }]}>효과음</Text>
          <Switch
            value={soundOn}
            onValueChange={async (v) => {
              setSoundOn(v);
              await setSoundEnabled(v);
            }}
            trackColor={{ true: theme.primary }}
          />
        </View>
        <Text style={[typography.small, { color: theme.textSecondary, marginTop: 4 }]}>
          계산, 저장 시 효과음을 재생합니다
        </Text>
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
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  googleBtn: { borderWidth: 1, borderRadius: 10, padding: 16, marginTop: 12 },
  syncHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
