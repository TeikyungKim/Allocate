import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { PortfolioProvider } from './src/contexts/PortfolioContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/ui/navigation/RootNavigator';
import { initAds } from './src/services/adService';

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    initAds();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <PortfolioProvider>
            <AppContent />
          </PortfolioProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
