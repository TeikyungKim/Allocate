import React, { ReactNode } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  padding?: boolean;
}

export function ScreenWrapper({ children, scroll = true, padding = true }: Props) {
  const { theme } = useTheme();

  const content = (
    <View style={[styles.inner, padding && styles.padding]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: { flex: 1 },
  padding: { paddingHorizontal: 16 },
});
