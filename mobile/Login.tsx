import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthActionButton } from '@/components/auth/AuthActionButton';
import { AuthTextInput } from '@/components/auth/AuthTextInput';
import { Color, Spacing, Typography } from '@/GlobalStyles';
import { RootStackParamList } from '@/navigation/types';
import { login } from '@/services/authService';
import { useAppData } from '@/state/AppDataContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation, route }: Props) {
  const { setCurrentUser } = useAppData();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [roleMode, setRoleMode] = useState<'citizen' | 'executor'>('citizen');
  const [logoError, setLogoError] = useState({ innovasiya: false, nerimanov: false });

  const EXECUTOR_EMAIL = 'aqil@gmail.com';
  const EXECUTOR_PASSWORD = '1999Aqil!';

  useEffect(() => {
    if (route.params?.verifiedEmail) setIdentifier(route.params.verifiedEmail);
  }, [route.params?.verifiedEmail]);

  const handleLogin = async () => {
    try {
      setErrorMessage('');

      if (roleMode === 'executor') {
        if (identifier.trim().toLowerCase() !== EXECUTOR_EMAIL || password !== EXECUTOR_PASSWORD) {
          setErrorMessage('İcraçı üçün giriş məlumatları yanlışdır');
          return;
        }

        setCurrentUser({
          id: 'executor-demo-1',
          fullName: 'Aqil İcraçı',
          email: EXECUTOR_EMAIL,
          phone: '0500000001',
          finCode: 'EXE1999',
          role: 'executor',
        });
        navigation.navigate('Home');
        return;
      }

      const auth = await login(identifier, password);
      setCurrentUser({
        id: auth.user.id,
        fullName: auth.user.fullName,
        email: auth.user.email,
        phone: auth.user.phone,
        finCode: auth.user.finCode,
        role: roleMode,
      });
      navigation.navigate('Home');
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable hitSlop={12} onPress={() => navigation.canGoBack() && navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={Color.neutral900} />
          </Pressable>

          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Xoş gəlmisiniz</Text>
              <Text style={styles.subtitle}>E-poçt və ya telefon ilə daxil olun.</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.roleSwitch}>
                <Pressable
                  onPress={() => setRoleMode('citizen')}
                  style={[styles.roleChip, roleMode === 'citizen' && styles.roleChipActive]}
                >
                  <Text style={[styles.roleChipText, roleMode === 'citizen' && styles.roleChipTextActive]}>
                    İstifadəçi
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setRoleMode('executor')}
                  style={[styles.roleChip, roleMode === 'executor' && styles.roleChipActive]}
                >
                  <Text style={[styles.roleChipText, roleMode === 'executor' && styles.roleChipTextActive]}>
                    İcraçı
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.roleHint}>
                {roleMode === 'executor'
                  ? 'İcraçı girişində operatorun yönləndirdiyi problemləri qəbul edib həll edə bilərsiniz.'
                  : 'İstifadəçi girişində yeni problem yarada və statusu izləyə bilərsiniz.'}
              </Text>
              <AuthTextInput icon="person-outline" placeholder="E-poçt və ya telefon" value={identifier} onChangeText={setIdentifier} />
              <AuthTextInput icon="lock-closed-outline" placeholder="Şifrə" value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPasswordButton}>
              <Text style={styles.forgotPasswordText}>Şifrəni unutmusunuz?</Text>
            </Pressable>

            <View style={styles.primaryAction}>
              <AuthActionButton title="Daxil ol" onPress={handleLogin} />
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <Pressable onPress={() => navigation.navigate('Signup')} style={styles.switchAuthButton}>
              <Text style={styles.switchAuthText}>
                Hesabınız yoxdur? <Text style={styles.switchAuthLink}>Qeydiyyatdan keçin</Text>
              </Text>
            </Pressable>

            <View style={styles.partnerSection}>
              <View style={styles.partnerRow}>
                <View style={styles.partnerCard}>
                  {logoError.innovasiya ? (
                    <Text style={styles.logoFallback}>innovasiya_logo</Text>
                  ) : (
                    <Image source={require('./assets/images/innovasiya_log.png')} style={styles.partnerLogo} resizeMode="contain" onError={() => setLogoError((s) => ({ ...s, innovasiya: true }))} />
                  )}
                </View>
                <View style={styles.partnerCard}>
                  {logoError.nerimanov ? (
                    <Text style={styles.logoFallback}>nerimanov_logo</Text>
                  ) : (
                    <Image source={require('./assets/images/narimanov_logo.png')} style={styles.partnerLogo} resizeMode="contain" onError={() => setLogoError((s) => ({ ...s, nerimanov: true }))} />
                  )}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Color.white500, flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  content: { flex: 1, justifyContent: 'center', paddingBottom: 52 },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  title: { color: Color.neutral900, fontSize: Typography.title, fontWeight: '800', marginBottom: Spacing.sm, marginTop: Spacing.md, textAlign: 'center' },
  subtitle: { color: Color.neutral500, fontSize: Typography.body, fontWeight: '500', lineHeight: 21, textAlign: 'center' },
  roleSwitch: {
    backgroundColor: Color.neutral100,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    padding: 4,
  },
  roleChip: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 8,
  },
  roleChipActive: { backgroundColor: Color.primary600 },
  roleChipText: { color: Color.neutral500, fontSize: 12, fontWeight: '800' },
  roleChipTextActive: { color: Color.white500 },
  roleHint: { color: Color.neutral500, fontSize: 12, fontWeight: '600', lineHeight: 18, marginTop: 2 },
  form: { gap: Spacing.lg },
  forgotPasswordButton: { alignSelf: 'flex-end', marginTop: Spacing.md, paddingVertical: Spacing.xs },
  forgotPasswordText: { color: Color.primary600, fontSize: Typography.caption, fontWeight: '700' },
  primaryAction: { marginTop: Spacing.xl },
  errorText: { color: Color.danger500, fontSize: Typography.caption, fontWeight: '600', marginTop: Spacing.md, textAlign: 'center' },
  switchAuthButton: { marginBottom: Spacing.xxl, marginTop: Spacing.xl },
  switchAuthText: { color: Color.neutral800, fontSize: Typography.caption, fontWeight: '500', textAlign: 'center' },
  switchAuthLink: { color: Color.primary600, fontWeight: '700' },
  partnerSection: { marginTop: Spacing.xl },
  partnerRow: { flexDirection: 'row', gap: Spacing.md },
  partnerCard: { alignItems: 'center', backgroundColor: Color.white500, borderColor: Color.neutral200, borderRadius: 12, borderWidth: 1, flex: 1, height: 84, justifyContent: 'center' },
  partnerLogo: { height: 56, width: '82%' },
  logoFallback: { color: Color.primary600, fontSize: 11, fontWeight: '700' },
});
