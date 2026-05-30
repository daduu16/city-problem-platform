import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Color, Spacing, Typography } from '@/GlobalStyles';
import ProblemCard from '@/components/ProblemCard';
import { ProblemsStackParamList } from '@/navigation/AppNavigator';
import { useAppData } from '@/state/AppDataContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  onlyMine?: boolean;
};

type ScopeFilterKey = 'all' | 'mine';
type StatusFilterKey = 'all' | 'resolved' | 'unresolved';

function normalizeStatus(value: string) {
  return value
    .toLocaleLowerCase('az')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isResolvedStatus(status: string) {
  const normalized = normalizeStatus(status);
  return normalized.includes('hell edildi');
}

export default function ProblemsScreen({ onlyMine }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<ProblemsStackParamList, 'ProblemDetail'>>();
  const { problems } = useAppData();

  const [scopeFilter, setScopeFilter] = useState<ScopeFilterKey>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all');
  const [showFilters, setShowFilters] = useState(false);

  const scopeData = useMemo(() => {
    if (scopeFilter === 'mine') return problems.filter((item) => item.createdByMe);
    return problems;
  }, [scopeFilter, problems]);

  const data = useMemo(() => {
    if (statusFilter === 'all') return scopeData;
    if (statusFilter === 'resolved') return scopeData.filter((item) => isResolvedStatus(item.status));
    return scopeData.filter((item) => !isResolvedStatus(item.status));
  }, [scopeData, statusFilter]);

  const title = onlyMine ? 'Mənim müraciətlərim' : 'Problemlər';
  const subtitle =
    scopeFilter === 'mine'
      ? 'Sizin göndərdiyiniz problemlərin siyahısı'
      : 'Bütün göndərilən müraciətlərin siyahısı';

  const allCount = problems.length;
  const mineCount = problems.filter((item) => item.createdByMe).length;
  const resolvedCount = scopeData.filter((item) => isResolvedStatus(item.status)).length;
  const unresolvedCount = scopeData.length - resolvedCount;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.lg }} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>

              <Pressable
                onPress={() => setShowFilters((prev) => !prev)}
                style={({ pressed }) => [styles.filterToggleButton, pressed && { opacity: 0.9 }]}
              >
                <View style={styles.filterToggleLeft}>
                  <Ionicons name="options-outline" size={18} color={Color.primary600} />
                  <Text style={styles.filterToggleText}>Filtrlər</Text>
                </View>
                <Ionicons
                  name={showFilters ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={18}
                  color={Color.neutral500}
                />
              </Pressable>

              {showFilters ? <View style={styles.filtersCard}>
                <Text style={styles.groupTitle}>Baxış</Text>
                <View style={styles.scopeRow}>
                  <Pressable
                    onPress={() => setScopeFilter('all')}
                    style={[styles.scopeChip, scopeFilter === 'all' && styles.scopeChipActive]}
                  >
                    <View style={styles.scopeTopRow}>
                      <Ionicons
                        name="globe-outline"
                        size={16}
                        color={scopeFilter === 'all' ? Color.white500 : Color.primary600}
                      />
                      <View style={[styles.countBadge, scopeFilter === 'all' && styles.countBadgeActive]}>
                        <Text style={[styles.countText, scopeFilter === 'all' && styles.countTextActive]}>
                          {allCount}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.scopeText, scopeFilter === 'all' && styles.scopeTextActive]}>
                      Ümumi problemlər
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setScopeFilter('mine')}
                    style={[styles.scopeChip, scopeFilter === 'mine' && styles.scopeChipActive]}
                  >
                    <View style={styles.scopeTopRow}>
                      <Ionicons
                        name="person-outline"
                        size={16}
                        color={scopeFilter === 'mine' ? Color.white500 : Color.primary600}
                      />
                      <View style={[styles.countBadge, scopeFilter === 'mine' && styles.countBadgeActive]}>
                        <Text style={[styles.countText, scopeFilter === 'mine' && styles.countTextActive]}>
                          {mineCount}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.scopeText, scopeFilter === 'mine' && styles.scopeTextActive]}>
                      Mənim problemlərim
                    </Text>
                  </Pressable>
                </View>

                <Text style={[styles.groupTitle, { marginTop: Spacing.md }]}>Status</Text>
                <View style={styles.statusRow}>
                  <Pressable
                    onPress={() => setStatusFilter('all')}
                    style={[styles.statusChip, statusFilter === 'all' && styles.statusChipAll]}
                  >
                    <Ionicons
                      name="layers-outline"
                      size={14}
                      color={statusFilter === 'all' ? Color.white500 : Color.primary600}
                    />
                    <Text style={[styles.statusText, statusFilter === 'all' && styles.statusTextActive]}>
                      Hamısı
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setStatusFilter('resolved')}
                    style={[styles.statusChip, statusFilter === 'resolved' && styles.statusChipResolved]}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={14}
                      color={statusFilter === 'resolved' ? Color.white500 : Color.success500}
                    />
                    <Text style={[styles.statusText, statusFilter === 'resolved' && styles.statusTextActive]}>
                      Həll olunmuş ({resolvedCount})
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setStatusFilter('unresolved')}
                    style={[styles.statusChip, statusFilter === 'unresolved' && styles.statusChipUnresolved]}
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={14}
                      color={statusFilter === 'unresolved' ? Color.white500 : '#d97706'}
                    />
                    <Text style={[styles.statusText, statusFilter === 'unresolved' && styles.statusTextActive]}>
                      Həll olunmamış ({unresolvedCount})
                    </Text>
                  </Pressable>
                </View>
              </View> : null}
            </View>
          }
          renderItem={({ item }) => (
            <ProblemCard item={item} onPress={() => navigation.navigate('ProblemDetail', { problem: item })} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Bu filtr üçün problem tapılmadı.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Color.neutral50, flex: 1 },
  screen: { backgroundColor: Color.neutral50, flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  header: { marginBottom: Spacing.lg },
  title: { color: Color.neutral900, fontSize: 24, fontWeight: '900' },
  subtitle: { color: Color.neutral500, fontSize: Typography.body, fontWeight: '600', marginTop: 6 },
  filterToggleButton: {
    alignItems: 'center',
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  filterToggleLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  filterToggleText: {
    color: Color.neutral900,
    fontSize: Typography.body,
    fontWeight: '800',
  },

  filtersCard: {
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: Spacing.lg,
    padding: 10,
  },
  groupTitle: {
    color: Color.neutral500,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },

  scopeRow: { flexDirection: 'row', gap: Spacing.sm },
  scopeChip: {
    backgroundColor: Color.neutral50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    flex: 1,
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  scopeChipActive: { backgroundColor: Color.primary600, borderColor: Color.primary600 },
  scopeTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  scopeText: { color: Color.neutral800, fontSize: 12, fontWeight: '800' },
  scopeTextActive: { color: Color.white500 },

  countBadge: {
    backgroundColor: Color.accent100,
    borderRadius: 999,
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  countText: { color: Color.primary600, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  countTextActive: { color: Color.white500 },

  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statusChip: {
    alignItems: 'center',
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  statusChipAll: { backgroundColor: Color.primary600, borderColor: Color.primary600 },
  statusChipResolved: { backgroundColor: Color.success500, borderColor: Color.success500 },
  statusChipUnresolved: { backgroundColor: '#d97706', borderColor: '#d97706' },
  statusText: { color: Color.neutral800, fontSize: 12, fontWeight: '800' },
  statusTextActive: { color: Color.white500 },

  emptyWrap: { alignItems: 'center', paddingTop: Spacing.xl },
  emptyText: { color: Color.neutral500, fontSize: Typography.body, fontWeight: '600' },
});
