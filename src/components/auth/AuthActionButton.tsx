import { Pressable, StyleSheet, Text } from 'react-native';

import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export function AuthActionButton({ title, onPress, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Color.primary500,
    borderRadius: BorderRadius.md,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    ...Shadow.primaryButton,
  },
  text: {
    color: Color.white500,
    fontSize: Typography.body,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});

