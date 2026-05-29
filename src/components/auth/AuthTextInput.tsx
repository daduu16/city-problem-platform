import { Ionicons } from '@expo/vector-icons';
import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';

import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';

type Props = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
};

export function AuthTextInput({ icon, style, ...props }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={20} color={Color.neutral500} />
      <TextInput
        placeholderTextColor={Color.neutral500}
        {...props}
        style={[styles.input, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    height: 52,
    paddingHorizontal: Spacing.md,
    ...Shadow.surface,
  },
  input: {
    color: Color.neutral900,
    flex: 1,
    fontSize: Typography.body,
    fontWeight: '500',
    minWidth: 0,
  },
});

