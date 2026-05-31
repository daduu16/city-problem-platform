import { useCallback, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BorderRadius, Color, Spacing } from '@/GlobalStyles';

type Props = {
  uris: string[];
  height?: number;
  /** card = flush in list row, rounded top only; detail = standalone rounded block */
  variant?: 'card' | 'detail';
};

export default function ProblemMediaCarousel({
  uris,
  height = 220,
  variant = 'detail',
}: Props) {
  const isCard = variant === 'card';
  const scrollRef = useRef<ScrollView>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pageWidth <= 0) return;
      const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
      setActiveIndex(Math.min(Math.max(next, 0), uris.length - 1));
    },
    [uris.length, pageWidth],
  );

  const goTo = useCallback(
    (index: number) => {
      if (pageWidth <= 0) return;
      const clamped = Math.min(Math.max(index, 0), uris.length - 1);
      scrollRef.current?.scrollTo({ x: clamped * pageWidth, animated: true });
      setActiveIndex(clamped);
    },
    [pageWidth, uris.length],
  );

  if (uris.length === 0) return null;

  const slideWidth = pageWidth > 0 ? pageWidth : undefined;
  const canGoBack = activeIndex > 0;
  const canGoForward = activeIndex < uris.length - 1;
  const showNav = uris.length > 1;

  return (
    <View
      style={[styles.wrap, isCard ? styles.wrapCard : styles.wrapDetail, { height }]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && w !== pageWidth) setPageWidth(w);
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        nestedScrollEnabled
        onMomentumScrollEnd={onScrollEnd}
        style={styles.scroll}
        contentContainerStyle={slideWidth ? undefined : styles.scrollGrow}
      >
        {uris.map((uri, index) => (
          <View
            key={`${uri}-${index}`}
            style={[styles.slide, slideWidth ? { width: slideWidth, height } : { height }]}
          >
            <Image source={{ uri }} style={styles.media} resizeMode="cover" />
          </View>
        ))}
      </ScrollView>

      {showNav && (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Əvvəlki şəkil"
            disabled={!canGoBack}
            onPress={() => goTo(activeIndex - 1)}
            style={({ pressed }) => [
              styles.arrow,
              styles.arrowLeft,
              !canGoBack && styles.arrowDisabled,
              pressed && canGoBack && styles.arrowPressed,
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={canGoBack ? Color.white500 : 'rgba(255,255,255,0.45)'}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Növbəti şəkil"
            disabled={!canGoForward}
            onPress={() => goTo(activeIndex + 1)}
            style={({ pressed }) => [
              styles.arrow,
              styles.arrowRight,
              !canGoForward && styles.arrowDisabled,
              pressed && canGoForward && styles.arrowPressed,
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={canGoForward ? Color.white500 : 'rgba(255,255,255,0.45)'}
            />
          </Pressable>
        </>
      )}

      {showNav && (
        <>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {activeIndex + 1} / {uris.length}
            </Text>
          </View>
          <View style={styles.dots}>
            {uris.map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[styles.dot, index === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Color.neutral100,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  wrapCard: {
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  wrapDetail: {
    borderRadius: BorderRadius.lg,
  },
  scroll: {
    flex: 1,
  },
  scrollGrow: {
    flexGrow: 1,
  },
  slide: {
    overflow: 'hidden',
  },
  media: {
    height: '100%',
    width: '100%',
  },
  arrow: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    zIndex: 2,
  },
  arrowLeft: {
    left: Spacing.sm,
  },
  arrowRight: {
    right: Spacing.sm,
  },
  arrowDisabled: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  arrowPressed: {
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  counter: {
    position: 'absolute',
    right: Spacing.sm,
    top: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 2,
  },
  counterText: {
    color: Color.white500,
    fontSize: 11,
    fontWeight: '800',
  },
  dots: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 2,
  },
  dot: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: Color.white500,
    width: 18,
  },
});
