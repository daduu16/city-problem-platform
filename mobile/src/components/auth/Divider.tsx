import { StyleSheet, Text, View } from 'react-native';

import { Color, Spacing, Typography } from '@/GlobalStyles';

export function Divider({ label }: { label: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  line: {
    backgroundColor: Color.neutral200,
    flex: 1,
    height: 1,
  },
  label: {
    color: Color.neutral500,
    fontSize: Typography.caption,
    fontWeight: '700',
  },
});

