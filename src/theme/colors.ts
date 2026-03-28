export const colors = {
  light: {
    primary: '#2563EB',
    primaryLight: '#DBEAFE',
    secondary: '#7C3AED',
    secondaryLight: '#EDE9FE',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    border: '#E2E8F0',
    success: '#16A34A',
    successLight: '#DCFCE7',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    chart: ['#2563EB', '#7C3AED', '#EC4899', '#F59E0B', '#16A34A', '#06B6D4', '#F97316', '#8B5CF6'],
  },
  dark: {
    primary: '#60A5FA',
    primaryLight: '#1E3A5F',
    secondary: '#A78BFA',
    secondaryLight: '#2E1065',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    border: '#334155',
    success: '#4ADE80',
    successLight: '#14532D',
    warning: '#FBBF24',
    warningLight: '#78350F',
    danger: '#F87171',
    dangerLight: '#7F1D1D',
    chart: ['#60A5FA', '#A78BFA', '#F472B6', '#FBBF24', '#4ADE80', '#22D3EE', '#FB923C', '#C084FC'],
  },
} as const;

export type ThemeColors = {
  primary: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  chart: readonly string[];
};
