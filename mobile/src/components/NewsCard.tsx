import { Pressable, StyleSheet, Text, View, Image } from 'react-native';

import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';
import { News } from '@/types';

type Props = {
  item: News;
  onPress: () => void;
};

export default function NewsCard({ item, onPress }: Props) {
  const dateText = new Date(item.publishedAt).toLocaleDateString('az-AZ', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.title}>
          {item.title}
        </Text>
        <Text numberOfLines={2} style={styles.summary}>
          {item.summary}
        </Text>
        <Text style={styles.date}>{dateText}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadow.surface,
  },
  image: {
    height: 160,
    width: '100%',
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    color: Color.neutral900,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  summary: {
    color: Color.neutral500,
    fontSize: Typography.caption,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: Spacing.sm,
  },
  date: {
    color: Color.primary600,
    fontSize: 12,
    fontWeight: '800',
    marginTop: Spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
});

