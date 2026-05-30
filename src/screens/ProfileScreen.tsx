import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ReactNode, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SectionKey = 'personal' | 'notifications' | 'support' | 'other';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function ToggleSection({
  icon,
  title,
  open,
  onPress,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  open: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.sectionHead, pressed && styles.pressed]}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={18} color={Color.primary600} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons
          name={open ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={18}
          color={Color.neutral500}
        />
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const [openSection, setOpenSection] = useState<SectionKey | null>('personal');

  const toggle = (key: SectionKey) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  const handleLogout = () => {
    Alert.alert('Çıxış', 'Hesabdan çıxılsın?', [
      { text: 'Ləğv et', style: 'cancel' },
      { text: 'Çıx', style: 'destructive', onPress: () => navigation.replace('Login') },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView bounces={false} contentContainerStyle={styles.screen}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>BG</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Bəkir Qəhrəmanov</Text>
            <Text style={styles.email}>bakir.gahramanov@city.az</Text>
            <Text style={styles.role}>Nərimanov rayon sakini</Text>
          </View>
        </View>

        <ToggleSection
          icon="person-outline"
          title="Şəxsi məlumatlar"
          open={openSection === 'personal'}
          onPress={() => toggle('personal')}>
          <DetailRow label="Ad soyad" value="Bəkir Qəhrəmanov" />
          <DetailRow label="Telefon" value="+994 50 123 45 67" />
          <DetailRow label="Ünvan" value="Nərimanov rayonu, Bakı şəhəri" />
          <DetailRow label="Qeydiyyat tarixi" value="04 May 2026" />
        </ToggleSection>

        <ToggleSection
          icon="notifications-outline"
          title="Bildirişlər"
          open={openSection === 'notifications'}
          onPress={() => toggle('notifications')}>
          <DetailRow label="Yeni status dəyişiklikləri" value="Aktiv" />
          <DetailRow label="Rayon elanları" value="Aktiv" />
          <DetailRow label="E-poçt bildirişləri" value="Aktiv" />
          <DetailRow label="Səsli bildiriş" value="Söndürülüb" />
        </ToggleSection>

        <ToggleSection
          icon="help-circle-outline"
          title="Dəstək"
          open={openSection === 'support'}
          onPress={() => toggle('support')}>
          <DetailRow label="Qaynar xətt" value="1542" />
          <DetailRow label="E-poçt" value="destek@city.az" />
          <DetailRow label="İş saatları" value="Həftəiçi 09:00 - 18:00" />
          <DetailRow label="Cavab müddəti" value="24 saat" />
        </ToggleSection>

        <ToggleSection
          icon="information-circle-outline"
          title="Digər"
          open={openSection === 'other'}
          onPress={() => toggle('other')}>
          <DetailRow label="Tətbiq versiyası" value="1.0.0" />
          <DetailRow label="Məxfilik siyasəti" value="Aktivdir" />
          <DetailRow label="İstifadə şərtləri" value="Aktivdir" />
        </ToggleSection>

        <Pressable
          accessibilityRole="button"
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
          <Ionicons name="log-out-outline" size={18} color={Color.white500} />
          <Text style={styles.logoutText}>Hesabdan çıxış</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Color.neutral50, flex: 1 },
  screen: { backgroundColor: Color.neutral50, padding: Spacing.lg, paddingBottom: 40 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: Color.primary500,
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    width: 68,
    ...Shadow.primaryButton,
  },
  avatarText: { color: Color.white500, fontSize: 18, fontWeight: '900' },
  name: { color: Color.neutral900, fontSize: 18, fontWeight: '900' },
  email: { color: Color.neutral500, fontSize: Typography.caption, fontWeight: '700', marginTop: 3 },
  role: { color: Color.primary600, fontSize: 12, fontWeight: '800', marginTop: 4 },
  sectionCard: {
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    overflow: 'hidden',
    ...Shadow.surface,
  },
  sectionHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: Color.accent100,
    borderRadius: 11,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  sectionTitle: { color: Color.neutral900, flex: 1, fontSize: Typography.body, fontWeight: '900' },
  sectionBody: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  detailRow: {
    borderTopColor: 'transparent',
    borderTopWidth: 0,
    paddingVertical: 10,
  },
  detailLabel: { color: Color.neutral500, fontSize: 12, fontWeight: '700' },
  detailValue: { color: Color.neutral900, fontSize: Typography.caption, fontWeight: '800', marginTop: 4 },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: Color.primary600,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingVertical: 14,
  },
  logoutText: { color: Color.white500, fontSize: Typography.body, fontWeight: '900' },
  pressed: { opacity: 0.9 },
});
