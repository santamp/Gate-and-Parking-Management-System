import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#dbeafe',
  accent: '#f59e0b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const SIZES = {
  width,
  height,
  radiusSmall: 8,
  radiusMedium: 16,
  radiusLarge: 24,
  radiusXL: 32,
};

export const SHADOWS = StyleSheet.create({
  small: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
});

export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '900', color: COLORS.gray900 },
  h2: { fontSize: 24, fontWeight: '800', color: COLORS.gray900 },
  h3: { fontSize: 18, fontWeight: '700', color: COLORS.gray900 },
  body: { fontSize: 16, fontWeight: '400', color: COLORS.gray700 },
  caption: { fontSize: 12, fontWeight: '600', color: COLORS.gray400 },
  button: { fontSize: 16, fontWeight: '700', color: COLORS.white },
};
