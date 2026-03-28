import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, ThemeColors } from '../theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  theme: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem('themeMode').then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setThemeModeState(v);
    });
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem('themeMode', mode);
  };

  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, theme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
