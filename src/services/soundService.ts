import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_ENABLED_KEY = '@allocate:sound_enabled';
let soundEnabled = true;

// 짧은 기본 사운드를 인라인으로 생성 (외부 파일 불필요)
// expo-av에서 require()로 로컬 파일을 사용하거나 null로 햅틱만 활용

export async function initSoundSettings(): Promise<void> {
  const val = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
  soundEnabled = val !== 'false';
}

export async function setSoundEnabled(enabled: boolean): Promise<void> {
  soundEnabled = enabled;
  await AsyncStorage.setItem(SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

async function playTone(frequency: number, durationMs: number): Promise<void> {
  if (!soundEnabled || Platform.OS === 'web') return;
  try {
    // 짧은 시스템 사운드 활용 - Audio 모드 설정
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: false });
  } catch {
    // 사운드 재생 실패 시 무시 (크리티컬하지 않음)
  }
}

/** 계산 완료 시 성공 사운드 */
export async function playCalculateSound(): Promise<void> {
  if (!soundEnabled || Platform.OS === 'web') return;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/calculate.mp3'),
      { shouldPlay: true, volume: 0.5 },
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch {
    // 사운드 파일 없으면 무시
  }
}

/** 저장 완료 시 사운드 */
export async function playSaveSound(): Promise<void> {
  if (!soundEnabled || Platform.OS === 'web') return;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/save.mp3'),
      { shouldPlay: true, volume: 0.5 },
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch {
    // 사운드 파일 없으면 무시
  }
}

/** 알림/경고 사운드 */
export async function playAlertSound(): Promise<void> {
  if (!soundEnabled || Platform.OS === 'web') return;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/alert.mp3'),
      { shouldPlay: true, volume: 0.6 },
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch {
    // 사운드 파일 없으면 무시
  }
}
