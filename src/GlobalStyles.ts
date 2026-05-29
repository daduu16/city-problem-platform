export const Color = {
  white500: '#FFFFFF',
  neutral50: '#F6F8FC',
  neutral100: '#EEF2F8',
  neutral200: '#D8E0EE',
  neutral500: '#6B7280',
  neutral800: '#1F2937',
  neutral900: '#111827',
  primary500: '#1F6FEB',
  primary600: '#1859C5',
  success500: '#16A34A',
  warning500: '#F59E0B',
  danger500: '#DC2626',
  facebook: '#1877F2',
  google: '#DB4437',
  accent100: '#E6F0FF',
} as const;

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const BorderRadius = {
  sm: 10,
  md: 16,
  lg: 22,
} as const;

export const Typography = {
  title: 26,
  body: 15,
  caption: 13,
  small: 12,
} as const;

export const Shadow = {
  surface: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  primaryButton: {
    shadowColor: '#1F6FEB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
} as const;

