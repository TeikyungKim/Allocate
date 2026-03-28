import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
}: Props) {
  const { theme } = useTheme();

  const bgColor = {
    primary: theme.primary,
    secondary: theme.secondary,
    outline: 'transparent',
    ghost: 'transparent',
  }[variant];

  const textColor = {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    outline: theme.primary,
    ghost: theme.primary,
  }[variant];

  const height = { small: 36, medium: 44, large: 52 }[size];
  const textStyle = size === 'small' ? typography.captionBold : typography.bodyBold;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bgColor,
          height,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: theme.primary,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[textStyle, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});
