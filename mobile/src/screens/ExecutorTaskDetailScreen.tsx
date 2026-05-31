import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Color, Spacing, Typography } from '@/GlobalStyles';
import { formatBakuDate, formatBakuDateTime } from '@/lib/executorSchedule';
import { openMapsRoute } from '@/lib/mapsRoute';
import { ExecutorTasksStackParamList } from '@/navigation/AppNavigator';
import type { MobileScheduleTask } from '@/types';

type Route = RouteProp<ExecutorTasksStackParamList, 'ExecutorTaskDetail'>;

const TASK_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Planlaşdırılıb',
  IN_PROGRESS: 'İcradadır',
  COMPLETED: 'Tamamlanıb',
  CANCELLED: 'Ləğv edilib',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Aşağı',
  MEDIUM: 'Orta',
  HIGH: 'Yüksək',
  CRITICAL: 'Təcili',
};

function taskStatusLabel(status: string): string {
  return TASK_STATUS_LABELS[status] ?? status;
}

export default function ExecutorTaskDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const task: MobileScheduleTask = route.params.task;
  const incident = task.incident;

  const canOpenMap =
    (incident?.lat != null && incident?.lng != null) || Boolean(incident?.address?.trim());

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={26} color={Color.neutral900} />
          </Pressable>
          <Text style={styles.topTitle}>Tapşırıq detalları</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{task.title}</Text>
          {incident?.title && incident.title !== task.title ? (
            <Text style={styles.subtitle}>{incident.title}</Text>
          ) : null}

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{taskStatusLabel(task.status)}</Text>
            </View>
            {incident?.priority ? (
              <View style={[styles.badge, styles.badgeMuted]}>
                <Text style={styles.badgeText}>{PRIORITY_LABELS[incident.priority] ?? incident.priority}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tarix</Text>
            <Text style={styles.value}>{formatBakuDate(task.date)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Vaxt</Text>
            <Text style={styles.value}>
              {formatBakuDateTime(task.startsAt)} — {formatBakuDateTime(task.endsAt)}
            </Text>
          </View>

          {incident?.address ? (
            <View style={styles.section}>
              <Text style={styles.label}>Ünvan</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={18} color={Color.primary600} />
                <Text style={styles.value}>{incident.address}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.label}>Təsvir</Text>
            <Text style={styles.description}>
              {task.description?.trim() || incident?.description?.trim() || 'Əlavə təsvir daxil edilməyib.'}
            </Text>
          </View>

          {canOpenMap ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                void openMapsRoute({
                  lat: incident?.lat,
                  lng: incident?.lng,
                  address: incident?.address,
                })
              }
              style={({ pressed }) => [styles.routeButton, pressed && styles.pressed]}
            >
              <Ionicons name="navigate-outline" size={18} color={Color.white500} />
              <Text style={styles.routeButtonText}>Marşrut qur (Google Maps)</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Color.neutral50, flex: 1 },
  screen: { flex: 1 },
  topBar: {
    alignItems: 'center',
    borderBottomColor: Color.neutral200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  topTitle: { color: Color.neutral900, fontSize: Typography.body, fontWeight: '800' },
  content: { gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { color: Color.neutral900, fontSize: Typography.title, fontWeight: '800' },
  subtitle: { color: Color.neutral500, fontSize: Typography.body, fontWeight: '500' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    backgroundColor: Color.primary600,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeMuted: { backgroundColor: Color.neutral200 },
  badgeText: { color: Color.neutral900, fontSize: 12, fontWeight: '700' },
  section: { gap: 6 },
  label: {
    color: Color.neutral500,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  value: { color: Color.neutral900, fontSize: Typography.body, fontWeight: '600', lineHeight: 22 },
  addressRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  description: { color: Color.neutral500, fontSize: Typography.body, lineHeight: 22 },
  routeButton: {
    alignItems: 'center',
    backgroundColor: Color.primary600,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: 14,
  },
  routeButtonText: { color: Color.white500, fontSize: Typography.body, fontWeight: '700' },
  pressed: { opacity: 0.88 },
});
