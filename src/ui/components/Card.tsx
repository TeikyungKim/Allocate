import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: Props) {
  const { theme } = useTheme();

  const cardStyle = [
    styles.card,
    { backgroundColor: theme.surface, borderColor: theme.border },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && { opacity: 0.7 }]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
});
