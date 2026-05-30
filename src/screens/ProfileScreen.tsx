import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
  const { currentUser, setCurrentUser } = useAppData();

  const fullName = currentUser?.fullName || 'İstifadəçi';
  const email = currentUser?.email || 'Qeydiyyat məlumatı yoxdur';
  const phone = currentUser?.phone || '-';
  const finCode = currentUser?.finCode || '-';
  const initials = fullName
    .split(' ')
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || 'U';

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
            <Text style={styles.badgeText}>Rəqəmsal Profil</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Şəxsi məlumatlar</Text>
          <InfoRow icon="person-outline" label="Ad soyad" value={fullName} />
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
