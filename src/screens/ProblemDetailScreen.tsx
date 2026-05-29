import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';
import { MyReportsStackParamList, ProblemsStackParamList } from '@/navigation/AppNavigator';

type ProblemRoute = RouteProp<ProblemsStackParamList, 'ProblemDetail'> | RouteProp<MyReportsStackParamList, 'ProblemDetail'>;

const statusColors = {
  Yeni: '#DBEAFE',
  Baxılır: '#DCFCE7',
  İcradadır: '#FEF3C7',
  'Həll edildi': '#E5E7EB',
} as const;

export default function ProblemDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<ProblemRoute>();
  const { problem } = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={26} color={Color.neutral900} />
          </Pressable>
          <Text style={styles.topTitle}>Müraciət detalları</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView bounces={false} contentContainerStyle={styles.content}>
          {problem.imageUrl ? <Image source={{ uri: problem.imageUrl }} style={styles.image} /> : null}

          <View style={styles.card}>
            <Text style={styles.title}>{problem.title}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Text style={styles.metaLabel}>Kateqoriya:</Text>
                <Text style={styles.metaValue}>{problem.category}</Text>
              </View>
              <View style={styles.metaPill}>
                <Text style={styles.metaLabel}>Prioritet:</Text>
                <Text style={styles.metaValue}>{problem.priority}</Text>
              </View>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusColors[problem.status] }]}>
              <Text style={styles.statusText}>Status: {problem.status}</Text>
            </View>

            <Text style={styles.sectionTitle}>Təsvir</Text>
            <Text style={styles.sectionText}>{problem.description}</Text>

            <Text style={styles.sectionTitle}>Ünvan</Text>
            <Text style={styles.sectionText}>{problem.address}</Text>

            <Text style={styles.date}>
              Tarix:{' '}
              {new Date(problem.createdAt).toLocaleDateString('az-AZ', {
                year: 'numeric',
                month: 'long',
                day: '2-digit',
              })}
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Color.white500, flex: 1 },
  screen: { backgroundColor: Color.neutral50, flex: 1 },
  topBar: {
    alignItems: 'center',
    backgroundColor: Color.white500,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  topTitle: { color: Color.neutral900, flex: 1, fontSize: Typography.body, fontWeight: '900', textAlign: 'center' },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  image: { borderRadius: BorderRadius.md, height: 220, width: '100%', ...Shadow.surface },
  card: {
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    ...Shadow.surface,
  },
  title: { color: Color.neutral900, fontSize: 21, fontWeight: '900', lineHeight: 28 },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  metaPill: {
    alignItems: 'center',
    backgroundColor: Color.neutral100,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaLabel: { color: Color.neutral500, fontSize: 12, fontWeight: '700' },
  metaValue: { color: Color.neutral900, fontSize: 12, fontWeight: '800' },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: Spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusText: { color: Color.neutral900, fontSize: 12, fontWeight: '900' },
  sectionTitle: { color: Color.neutral900, fontSize: Typography.caption, fontWeight: '900', marginTop: Spacing.lg },
  sectionText: { color: Color.neutral800, fontSize: Typography.body, fontWeight: '600', lineHeight: 22, marginTop: 6 },
  date: { color: Color.primary600, fontSize: Typography.caption, fontWeight: '800', marginTop: Spacing.xl },
});

