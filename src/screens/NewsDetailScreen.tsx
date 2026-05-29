import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';
import { HomeStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'NewsDetail'>;

export default function NewsDetailScreen({ navigation, route }: Props) {
  const { news } = route.params;

  const dateText = new Date(news.publishedAt).toLocaleDateString('az-AZ', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={26} color={Color.neutral900} />
          </Pressable>
          <Text numberOfLines={1} style={styles.topTitle}>
            Xəbər detalları
          </Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView bounces={false} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Image source={{ uri: news.imageUrl }} style={styles.hero} />

          <View style={styles.card}>
            <Text style={styles.title}>{news.title}</Text>
            <Text style={styles.date}>{dateText}</Text>
            <Text style={styles.description}>{news.description}</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Color.white500,
    flex: 1,
  },
  screen: {
    backgroundColor: Color.neutral50,
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: Color.white500,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  topTitle: {
    color: Color.neutral900,
    flex: 1,
    fontSize: Typography.body,
    fontWeight: '900',
    textAlign: 'center',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  hero: {
    borderRadius: BorderRadius.md,
    height: 220,
    width: '100%',
    ...Shadow.surface,
  },
  card: {
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    ...Shadow.surface,
  },
  title: {
    color: Color.neutral900,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
  date: {
    color: Color.primary600,
    fontSize: 12,
    fontWeight: '800',
    marginTop: Spacing.sm,
  },
  description: {
    color: Color.neutral800,
    fontSize: Typography.body,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: Spacing.lg,
  },
});

