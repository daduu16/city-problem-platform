import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import ProblemMediaCarousel from '@/components/ProblemMediaCarousel';
import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';
import { getProblemImageUris } from '@/lib/problemMedia';
import { ProblemsStackParamList } from '@/navigation/AppNavigator';
import { useAppData } from '@/state/AppDataContext';

type ProblemRoute = RouteProp<ProblemsStackParamList, 'ProblemDetail'>;

const statusColors: Record<string, string> = {
  Yeni: '#DBEAFE',
  'Baxılır': '#DCFCE7',
  'İcradadır': '#FEF3C7',
  'Həll edildi': '#E5E7EB',
};

function getUpvoteColor(votes: number) {
  const scale = ['#2563EB', '#1D4ED8', '#EA580C', '#DC2626', '#B91C1C', '#991B1B'];
  const step = Math.min(scale.length - 1, Math.floor((votes || 0) / 20));
  return scale[step];
}

export default function ProblemDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<ProblemRoute>();
  const { problems, toggleProblemUpvote, currentUser, resolveProblemAsExecutor } = useAppData();
  const routeProblem = route.params.problem;
  const problem = problems.find((item) => item.id === routeProblem.id) ?? routeProblem;
  const voteColor = getUpvoteColor(problem.upvotes);
  const isExecutor = currentUser?.role === 'executor';
  const canResolveAsExecutor =
    isExecutor &&
    problem.assignedToRole === 'executor' &&
    problem.status !== 'Həll edildi';
  const imageUris = getProblemImageUris(problem);

  const handleResolveWithPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İcazə tələb olunur', 'Həll sübutu üçün kamera icazəsi verin.');
      return;
    }

    const photo = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ['images'],
    });
    if (photo.canceled || photo.assets.length === 0) return;

    resolveProblemAsExecutor(problem.id, photo.assets[0].uri);
    Alert.alert('Tamamlandı', 'Problem həll olundu və foto əlavə edildi.');
  };

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
          {imageUris.length > 0 ? (
            <ProblemMediaCarousel uris={imageUris} height={260} variant="detail" />
          ) : null}

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
            <View style={[styles.statusPill, { backgroundColor: statusColors[problem.status] || '#E5E7EB' }]}>
              <Text style={styles.statusText}>Status: {problem.status}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => toggleProblemUpvote(problem.id)}
              style={({ pressed }) => [
                styles.upvoteButton,
                { borderColor: voteColor },
                problem.hasUpvoted && { backgroundColor: voteColor },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={problem.hasUpvoted ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
                size={16}
                color={problem.hasUpvoted ? Color.white500 : voteColor}
              />
              <Text style={[styles.upvoteText, { color: problem.hasUpvoted ? Color.white500 : voteColor }]}>
                Dəstək ver ({problem.upvotes})
              </Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Təsvir</Text>
            <Text style={styles.sectionText}>{problem.description}</Text>

            <Text style={styles.sectionTitle}>Ünvan</Text>
            <Text style={styles.sectionText}>{problem.address}</Text>

            {problem.assignedByOperator && (
              <View style={styles.assignmentBadge}>
                <Ionicons name="send-outline" size={14} color={Color.primary600} />
                <Text style={styles.assignmentText}>
                  Operator tərəfindən icraçıya yönləndirilib
                </Text>
              </View>
            )}

            {canResolveAsExecutor && (
              <Pressable
                accessibilityRole="button"
                onPress={handleResolveWithPhoto}
                style={({ pressed }) => [styles.resolveButton, pressed && styles.pressed]}
              >
                <Ionicons name="camera-outline" size={16} color={Color.white500} />
                <Text style={styles.resolveButtonText}>Həll et və şəkil əlavə et</Text>
              </Pressable>
            )}

            {problem.status === 'Həll edildi' && problem.resolvedPhotoUrl && (
              <>
                <Text style={styles.sectionTitle}>Həll sübutu</Text>
                <Image source={{ uri: problem.resolvedPhotoUrl }} style={styles.resolvedImage} />
              </>
            )}

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
  upvoteButton: {
    alignItems: 'center',
    backgroundColor: Color.accent100,
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignSelf: 'flex-start',
  },
  upvoteText: { fontSize: 12, fontWeight: '900' },
  sectionTitle: { color: Color.neutral900, fontSize: Typography.caption, fontWeight: '900', marginTop: Spacing.lg },
  sectionText: { color: Color.neutral800, fontSize: Typography.body, fontWeight: '600', lineHeight: 22, marginTop: 6 },
  assignmentBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Color.accent100,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  assignmentText: { color: Color.primary600, fontSize: 11, fontWeight: '800' },
  resolveButton: {
    alignItems: 'center',
    backgroundColor: Color.success500,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  resolveButtonText: { color: Color.white500, fontSize: 12, fontWeight: '900' },
  resolvedImage: {
    borderRadius: BorderRadius.md,
    height: 180,
    marginTop: Spacing.sm,
    width: '100%',
  },
  date: { color: Color.primary600, fontSize: Typography.caption, fontWeight: '800', marginTop: Spacing.xl },
  pressed: { opacity: 0.88 },
});
