import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
};

export function SocialAuthButton({ icon, iconColor, label }: Props) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    ...Shadow.surface,
  },
  text: {
    color: Color.neutral800,
    fontSize: Typography.caption,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
});

