import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import PriorityBadge from '@/components/PriorityBadge';
import ProblemMediaCarousel from '@/components/ProblemMediaCarousel';
import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';
import { getProblemImageUris } from '@/lib/problemMedia';
import { Problem } from '@/types';

type Props = {
  item: Problem;
  onPress?: () => void;
  onToggleUpvote?: () => void;
};

function getUpvoteColor(votes: number) {
  const scale = ['#2563EB', '#1D4ED8', '#EA580C', '#DC2626', '#B91C1C', '#991B1B'];
  const step = Math.min(scale.length - 1, Math.floor((votes || 0) / 20));
  return scale[step];
}

export default function ProblemCard({ item, onPress, onToggleUpvote }: Props) {
  const dateText = new Date(item.createdAt).toLocaleDateString('az-AZ', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  const voteColor = getUpvoteColor(item.upvotes);
  const imageUris = getProblemImageUris(item);

  return (
    <Pressable accessibilityRole="button" disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.card, pressed && onPress && styles.pressed]}>
      {imageUris.length > 0 ? (
        <ProblemMediaCarousel uris={imageUris} height={140} variant="card" />
      ) : null}
      <View style={styles.body}>
        <View style={styles.row}>
          <Text numberOfLines={2} style={styles.title}>
            {item.title}
          </Text>
          <PriorityBadge priority={item.priority} />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="pricetag-outline" size={14} color={Color.primary600} />
            <Text style={styles.metaText}>{item.category}</Text>
          </View>
          <View style={[styles.statusChip, statusStyles[item.status]]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={Color.neutral500} />
          <Text numberOfLines={2} style={styles.address}>
            {item.address}
          </Text>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.date}>{dateText}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onToggleUpvote}
            style={({ pressed }) => [
              styles.voteButton,
              { borderColor: voteColor },
              item.hasUpvoted && { backgroundColor: voteColor },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={item.hasUpvoted ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
              size={14}
              color={item.hasUpvoted ? Color.white500 : voteColor}
            />
            <Text style={[styles.voteText, { color: item.hasUpvoted ? Color.white500 : voteColor }]}>
              {item.upvotes}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const statusStyles: Record<Problem['status'], { backgroundColor: string }> = {
  Yeni: { backgroundColor: '#EEF2FF' },
  Baxılır: { backgroundColor: '#ECFDF5' },
  İcradadır: { backgroundColor: '#FFFBEB' },
  'Həll edildi': { backgroundColor: '#F3F4F6' },
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadow.surface,
  },
  body: {
    padding: Spacing.lg,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  title: {
    color: Color.neutral900,
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  metaChip: {
    alignItems: 'center',
    backgroundColor: Color.accent100,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaText: {
    color: Color.primary600,
    fontSize: 12,
    fontWeight: '800',
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: Color.neutral800,
    fontSize: 12,
    fontWeight: '800',
  },
  addressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.md,
  },
  address: {
    color: Color.neutral500,
    flex: 1,
    fontSize: Typography.caption,
    fontWeight: '600',
    lineHeight: 18,
  },
  date: {
    color: Color.neutral500,
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  voteButton: {
    alignItems: 'center',
    backgroundColor: Color.accent100,
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  voteText: {
    fontSize: 12,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.85,
  },
});
