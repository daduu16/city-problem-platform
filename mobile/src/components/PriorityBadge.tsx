import { StyleSheet, Text, View } from 'react-native';

import { Color } from '@/GlobalStyles';
import { ProblemPriority } from '@/types';

const priorityColors: Record<ProblemPriority, { bg: string; text: string }> = {
  Aşağı: { bg: '#ECFDF5', text: '#065F46' },
  Orta: { bg: '#EFF6FF', text: '#1D4ED8' },
  Yüksək: { bg: '#FFFBEB', text: '#B45309' },
  Təcili: { bg: '#FEF2F2', text: '#B91C1C' },
};

export default function PriorityBadge({ priority }: { priority: ProblemPriority }) {
  const palette = priorityColors[priority] ?? { bg: Color.neutral100, text: Color.neutral800 };
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{priority}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
  },
});

