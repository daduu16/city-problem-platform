import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';
import { RootStackParamList } from '@/navigation/types';
import { useAppData } from '@/state/AppDataContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={Color.primary600} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { currentUser, setCurrentUser, gamification } = useAppData();
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'weekly' | 'monthly'>('weekly');

  const isExecutor = currentUser?.role === 'executor';
  const fullName = currentUser?.fullName || 'İstifadəçi';
  const email = currentUser?.email || 'Qeydiyyat məlumatı yoxdur';
  const phone = currentUser?.phone || '-';
  const finCode = currentUser?.finCode || '-';
  const assigneeName = currentUser?.assigneeName;
  const initials = fullName
    .split(' ')
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || 'U';
  const leaderboardRows = useMemo(
    () =>
      leaderboardPeriod === 'weekly'
        ? gamification.leaderboard.weekly
        : gamification.leaderboard.monthly,
    [gamification.leaderboard.monthly, gamification.leaderboard.weekly, leaderboardPeriod],
  );

  const medalForIndex = (index: number) => {
    if (index === 0) return { color: '#f59e0b' as const, icon: 'medal' as const };
    if (index === 1) return { color: '#94a3b8' as const, icon: 'medal' as const };
    if (index === 2) return { color: '#b45309' as const, icon: 'medal' as const };
    return { color: Color.neutral500, icon: 'ellipse' as const };
  };

  const handleLogout = () => {
    Alert.alert('Çıxış', 'Hesabdan çıxmaq istəyirsiniz?', [
      { text: 'Ləğv et', style: 'cancel' },
      {
        text: 'Çıxış et',
        style: 'destructive',
        onPress: () => {
          setCurrentUser(null);
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView bounces={false} contentContainerStyle={styles.screen}>
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.badgeText}>{isExecutor ? 'İcraçı' : 'Rəqəmsal Profil'}</Text>
          </View>
        </View>

        <View style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <View style={styles.pointsTitleWrap}>
              <Ionicons name="ribbon-outline" size={18} color={Color.white500} />
              <Text style={styles.pointsTitle}>Xal balansı</Text>
            </View>
            <Text style={styles.pointsLevel}>Səviyyə {gamification.level}</Text>
          </View>
          <Text style={styles.pointsValue}>{gamification.points} xal</Text>
          <Text style={styles.pointsFormula}>
            {gamification.createdProblems} yaradılan × 5 + {gamification.resolvedProblems} həll olunan × 10
          </Text>
          <View style={styles.pointsProgressTrack}>
            <View style={[styles.pointsProgressFill, { width: `${gamification.progressPct}%` }]} />
          </View>
          <Text style={styles.pointsHint}>
            Növbəti səviyyə: {Math.max(0, gamification.nextLevelAt - gamification.points)} xal qalıb
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Son xal aktivlikləri</Text>
          {gamification.recentActivities.map((item) => (
            <View key={item.id} style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <Ionicons
                  name={item.points >= 10 ? 'checkmark-done-outline' : 'add-outline'}
                  size={16}
                  color={Color.primary600}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activityDate}>
                  {new Date(item.createdAt).toLocaleDateString('az-AZ', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={styles.activityPoints}>+{item.points}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Nəticələr cədvəli</Text>
          <View style={styles.periodSwitchRow}>
            <Pressable
              onPress={() => setLeaderboardPeriod('weekly')}
              style={[
                styles.periodChip,
                leaderboardPeriod === 'weekly' && styles.periodChipActive,
              ]}
            >
              <Text
                style={[
                  styles.periodChipText,
                  leaderboardPeriod === 'weekly' && styles.periodChipTextActive,
                ]}
              >
                Həftəlik
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setLeaderboardPeriod('monthly')}
              style={[
                styles.periodChip,
                leaderboardPeriod === 'monthly' && styles.periodChipActive,
              ]}
            >
              <Text
                style={[
                  styles.periodChipText,
                  leaderboardPeriod === 'monthly' && styles.periodChipTextActive,
                ]}
              >
                Aylıq
              </Text>
            </Pressable>
          </View>

          {leaderboardRows.map((row, index) => {
            const medal = medalForIndex(index);
            return (
              <View key={row.id} style={styles.rankRow}>
                <View style={styles.rankLeft}>
                  <Text style={styles.rankIndex}>{index + 1}</Text>
                  <Ionicons name={medal.icon} size={16} color={medal.color} />
                  <Text style={styles.rankName}>{row.fullName}</Text>
                </View>
                <View style={styles.rankRight}>
                  <Text style={styles.rankMeta}>
                    {row.createdProblems} yaradılan · {row.resolvedProblems} həll olunan
                  </Text>
                  <Text style={styles.rankPoints}>{row.points} xal</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Şəxsi məlumatlar</Text>
          <InfoRow icon="person-outline" label="Ad soyad" value={fullName} />
          {isExecutor && assigneeName ? (
            <InfoRow icon="briefcase-outline" label="İcraçı profili" value={assigneeName} />
          ) : null}
          <InfoRow icon="mail-outline" label="E-poçt" value={email} />
          <InfoRow icon="call-outline" label="Telefon" value={phone} />
          <InfoRow icon="card-outline" label="FIN kod" value={finCode} />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Dəstək</Text>
          <InfoRow icon="call-outline" label="Qaynar xətt" value="1542" />
          <InfoRow icon="mail-outline" label="E-poçt" value="destek@city.az" />
          <InfoRow icon="time-outline" label="İş saatları" value="Həftəiçi 09:00 - 18:00" />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('ChangePassword')}
          style={({ pressed }) => [styles.passwordButton, pressed && styles.pressed]}
        >
          <Ionicons name="key-outline" size={18} color={Color.primary600} />
          <Text style={styles.passwordButtonText}>Şifrəni dəyiş</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        >
          <Ionicons name="log-out-outline" size={18} color={Color.white500} />
          <Text style={styles.logoutText}>Hesabdan çıxış</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Color.neutral50, flex: 1 },
  screen: { backgroundColor: Color.neutral50, padding: Spacing.lg, paddingBottom: 44, gap: Spacing.md },

  heroCard: {
    alignItems: 'center',
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    ...Shadow.surface,
  },
  pointsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: Spacing.lg,
    ...Shadow.surface,
  },
  pointsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pointsTitleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  pointsTitle: { color: Color.white500, fontSize: 14, fontWeight: '900' },
  pointsLevel: { color: '#bae6fd', fontSize: 12, fontWeight: '800' },
  pointsValue: { color: Color.white500, fontSize: 30, fontWeight: '900', marginTop: 10 },
  pointsFormula: { color: '#cbd5e1', fontSize: 12, fontWeight: '700', marginTop: 2 },
  pointsProgressTrack: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    height: 8,
    marginTop: 10,
    overflow: 'hidden',
  },
  pointsProgressFill: {
    backgroundColor: '#38bdf8',
    borderRadius: 999,
    height: '100%',
  },
  pointsHint: { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginTop: 8 },
  avatar: {
    alignItems: 'center',
    backgroundColor: Color.primary500,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
    ...Shadow.primaryButton,
  },
  avatarText: { color: Color.white500, fontSize: 17, fontWeight: '900' },
  name: { color: Color.neutral900, fontSize: 18, fontWeight: '900' },
  email: { color: Color.neutral500, fontSize: Typography.caption, fontWeight: '700', marginTop: 2 },
  badgeText: {
    alignSelf: 'flex-start',
    color: Color.primary600,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 8,
    backgroundColor: Color.accent100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  sectionCard: {
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    ...Shadow.surface,
  },
  sectionTitle: { color: Color.neutral900, fontSize: Typography.body, fontWeight: '900', marginBottom: Spacing.sm },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: 8,
  },
  infoIcon: {
    alignItems: 'center',
    backgroundColor: Color.accent100,
    borderRadius: 10,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  infoLabel: { color: Color.neutral500, fontSize: 12, fontWeight: '700' },
  infoValue: { color: Color.neutral900, fontSize: Typography.caption, fontWeight: '800', marginTop: 2 },
  activityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: 8,
  },
  activityIcon: {
    alignItems: 'center',
    backgroundColor: Color.accent100,
    borderRadius: 10,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  activityTitle: { color: Color.neutral900, fontSize: 13, fontWeight: '800' },
  activityDate: { color: Color.neutral500, fontSize: 11, fontWeight: '700', marginTop: 2 },
  activityPoints: { color: Color.primary600, fontSize: 13, fontWeight: '900' },
  periodSwitchRow: {
    backgroundColor: Color.neutral100,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    padding: 4,
  },
  periodChip: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 8,
  },
  periodChipActive: {
    backgroundColor: Color.primary600,
  },
  periodChipText: {
    color: Color.neutral500,
    fontSize: 12,
    fontWeight: '800',
  },
  periodChipTextActive: {
    color: Color.white500,
  },
  rankRow: {
    alignItems: 'center',
    borderBottomColor: Color.neutral200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rankLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  rankIndex: {
    color: Color.neutral900,
    fontSize: 12,
    fontWeight: '900',
    width: 12,
  },
  rankName: {
    color: Color.neutral900,
    fontSize: 12,
    fontWeight: '800',
  },
  rankRight: {
    alignItems: 'flex-end',
  },
  rankMeta: {
    color: Color.neutral500,
    fontSize: 10,
    fontWeight: '700',
  },
  rankPoints: {
    color: Color.primary600,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  passwordButton: {
    alignItems: 'center',
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 13,
    ...Shadow.surface,
  },
  passwordButtonText: {
    color: Color.primary600,
    fontSize: Typography.body,
    fontWeight: '900',
  },

  logoutButton: {
    alignItems: 'center',
    backgroundColor: Color.primary600,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: Spacing.sm,
    paddingVertical: 14,
  },
  logoutText: { color: Color.white500, fontSize: Typography.body, fontWeight: '900' },
  pressed: { opacity: 0.88 },
});
