import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = '@allocate:notification_settings';

export interface NotificationSettings {
  rebalanceEnabled: boolean;
  rebalanceDay: number; // 1~28 (매월 N일)
  rebalanceHour: number; // 0~23
  marketAlertEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  rebalanceEnabled: true,
  rebalanceDay: 1,
  rebalanceHour: 9,
  marketAlertEnabled: false,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const json = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  return json ? { ...DEFAULT_SETTINGS, ...JSON.parse(json) } : DEFAULT_SETTINGS;
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  await scheduleRebalanceReminder(settings);
}

export async function scheduleRebalanceReminder(settings: NotificationSettings): Promise<void> {
  // 기존 리밸런싱 알림 모두 취소
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.rebalanceEnabled) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // 매월 N일 리밸런싱 알림 스케줄
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '리밸런싱 알림',
      body: '이번 달 포트폴리오 리밸런싱 시간입니다. 배분 비율을 확인하세요.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day: settings.rebalanceDay,
      hour: settings.rebalanceHour,
      minute: 0,
    },
  });
}

export async function initNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  const settings = await getNotificationSettings();
  if (settings.rebalanceEnabled) {
    await scheduleRebalanceReminder(settings);
  }
}
