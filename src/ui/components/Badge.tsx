import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../theme';

interface Props {
  label: string;
  color?: string;
  bgColor?: string;
}

export function Badge({ label, color, bgColor }: Props) {
  const { theme } = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: bgColor || theme.primaryLight }]}>
      <Text style={[typography.small, { color: color || theme.primary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
});
