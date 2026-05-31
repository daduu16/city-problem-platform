import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Color, Spacing, Typography } from '@/GlobalStyles';
import { formatBakuDate, formatBakuTime } from '@/lib/executorSchedule';
import { ExecutorTasksStackParamList } from '@/navigation/AppNavigator';
import { useAppData } from '@/state/AppDataContext';
import type { MobileScheduleTask } from '@/types';

const TASK_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Planlaşdırılıb',
  IN_PROGRESS: 'İcradadır',
  COMPLETED: 'Tamamlanıb',
  CANCELLED: 'Ləğv edilib',
};

function TaskCard({
  task,
  onPress,
}: {
  task: MobileScheduleTask;
  onPress: () => void;
}) {
  const incident = task.incident;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{formatBakuDate(task.date)}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{TASK_STATUS_LABELS[task.status] ?? task.status}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{task.title}</Text>
      {incident?.title && incident.title !== task.title ? (
        <Text style={styles.cardIncident}>{incident.title}</Text>
      ) : null}
      <Text style={styles.cardTime}>
        {formatBakuTime(task.startsAt)} — {formatBakuTime(task.endsAt)}
      </Text>
      {incident?.address ? (
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color={Color.neutral500} />
          <Text style={styles.cardAddress} numberOfLines={2}>
            {incident.address}
          </Text>
        </View>
      ) : null}
      <View style={styles.cardFooter}>
        <Text style={styles.cardHint}>Detallara bax</Text>
        <Ionicons name="chevron-forward" size={16} color={Color.primary600} />
      </View>
    </Pressable>
  );
}

export default function ExecutorTasksScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ExecutorTasksStackParamList, 'ExecutorTasksMain'>>();
  const {
    currentUser,
    executorTasks,
    executorLoading,
    executorError,
    refreshExecutorTasks,
  } = useAppData();
  const [refreshing, setRefreshing] = useState(false);

  const sortedTasks = useMemo(
    () =>
      [...executorTasks].sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    [executorTasks],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshExecutorTasks();
    } finally {
      setRefreshing(false);
    }
  }, [refreshExecutorTasks]);

  const assigneeName = currentUser?.assigneeName ?? 'İcraçı';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <FlatList
          data={sortedTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Mənim tapşırıqlarım</Text>
              <Text style={styles.subtitle}>{assigneeName} — növbəti 14 gün</Text>
              {executorError ? <Text style={styles.errorText}>{executorError}</Text> : null}
            </View>
          }
          ListEmptyComponent={
            executorLoading ? (
              <View style={styles.emptyWrap}>
                <ActivityIndicator color={Color.primary600} />
                <Text style={styles.emptyText}>Tapşırıqlar yüklənir…</Text>
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <Ionicons name="calendar-outline" size={40} color={Color.neutral500} />
                <Text style={styles.emptyText}>Bu dövrdə tapşırıq yoxdur.</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => navigation.navigate('ExecutorTaskDetail', { task: item })}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Color.neutral50, flex: 1 },
  screen: { flex: 1 },
  listContent: { gap: 12, padding: Spacing.lg, paddingBottom: 120 },
  header: { gap: 6, marginBottom: Spacing.sm },
  title: { color: Color.neutral900, fontSize: Typography.title, fontWeight: '900' },
  subtitle: { color: Color.neutral500, fontSize: Typography.caption, fontWeight: '600' },
  errorText: { color: Color.danger500, fontSize: Typography.caption, fontWeight: '600', marginTop: 4 },
  emptyWrap: { alignItems: 'center', gap: 12, paddingTop: 48 },
  emptyText: { color: Color.neutral500, fontSize: Typography.body, fontWeight: '600', textAlign: 'center' },
  card: {
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: Spacing.md,
  },
  cardPressed: { opacity: 0.92 },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardDate: { color: Color.neutral500, fontSize: 12, fontWeight: '700' },
  statusPill: {
    backgroundColor: Color.neutral100,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: { color: Color.neutral800, fontSize: 11, fontWeight: '700' },
  cardTitle: { color: Color.neutral900, fontSize: 16, fontWeight: '800' },
  cardIncident: { color: Color.neutral500, fontSize: 13, fontWeight: '600' },
  cardTime: { color: Color.primary600, fontSize: 13, fontWeight: '700' },
  addressRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 6 },
  cardAddress: { color: Color.neutral500, flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  cardFooter: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 4 },
  cardHint: { color: Color.primary600, fontSize: 12, fontWeight: '700' },
});
