import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthActionButton } from '@/components/auth/AuthActionButton';
import { AuthTextInput } from '@/components/auth/AuthTextInput';
import { Color, Spacing, Typography } from '@/GlobalStyles';
import { RootStackParamList } from '@/navigation/types';
import { signup } from '@/services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

type SignupForm = {
  fullName: string;
  email: string;
  phone: string;
  finCode: string;
  password: string;
  confirmPassword: string;
};

const initialForm: SignupForm = {
  fullName: '',
  email: '',
  phone: '',
  finCode: '',
  password: '',
  confirmPassword: '',
};

export default function SignupScreen({ navigation }: Props) {
  const [form, setForm] = useState<SignupForm>(initialForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [logoError, setLogoError] = useState({ innovasiya: false, nerimanov: false });

  const update = (field: keyof SignupForm) => (value: string) => {
    setErrorMessage('');
    setForm((s) => ({ ...s, [field]: value }));
  };

  const handleSignup = async () => {
    try {
      const signupResult = await signup(form);
      navigation.navigate('VerifyEmail', {
        email: signupResult.user.email,
        verificationCode: signupResult.verificationCode,
      });
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
              <Text style={styles.title}>Yeni hesab yaradın</Text>
              <Text style={styles.subtitle}>E-poçt, telefon və FİN kod ilə qeydiyyat.</Text>
            </View>

            <View style={styles.form}>
              <AuthTextInput autoCapitalize="words" icon="person-outline" onChangeText={update('fullName')} placeholder="Ad və soyad" value={form.fullName} />
              <AuthTextInput icon="mail-outline" keyboardType="email-address" onChangeText={update('email')} placeholder="E-poçt ünvanı" value={form.email} />
              <AuthTextInput icon="call-outline" keyboardType="phone-pad" onChangeText={update('phone')} placeholder="Telefon nömrəsi" value={form.phone} />
              <AuthTextInput autoCapitalize="characters" icon="card-outline" onChangeText={update('finCode')} placeholder="Şəxsiyyət vəsiqəsi FİN kodu" value={form.finCode} />
              <AuthTextInput icon="lock-closed-outline" onChangeText={update('password')} placeholder="Şifrə" secureTextEntry value={form.password} />
              <AuthTextInput icon="lock-closed-outline" onChangeText={update('confirmPassword')} placeholder="Şifrəni təsdiqlə" secureTextEntry value={form.confirmPassword} />
            </View>

            <View style={styles.primaryAction}>
              <AuthActionButton title="Qeydiyyatdan keç" onPress={handleSignup} />
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <Pressable onPress={() => navigation.navigate('Login')} style={styles.loginButton}>
              <Text style={styles.loginText}>
                Hesabınız var? <Text style={styles.loginLink}>Daxil olun</Text>
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
  form: { gap: Spacing.lg },
  primaryAction: { marginTop: Spacing.xl },
  loginButton: { marginBottom: Spacing.xxl, marginTop: Spacing.xl },
  errorText: { color: Color.danger500, fontSize: Typography.caption, fontWeight: '600', marginTop: Spacing.md, textAlign: 'center' },
  loginText: { color: Color.neutral800, fontSize: Typography.caption, fontWeight: '500', textAlign: 'center' },
  loginLink: { color: Color.primary600, fontWeight: '700' },
  partnerSection: { marginTop: Spacing.xl },
  partnerRow: { flexDirection: 'row', gap: Spacing.md },
  partnerCard: { alignItems: 'center', backgroundColor: Color.white500, borderColor: Color.neutral200, borderRadius: 12, borderWidth: 1, flex: 1, height: 84, justifyContent: 'center' },
  partnerLogo: { height: 56, width: '82%' },
  logoFallback: { color: Color.primary600, fontSize: 11, fontWeight: '700' },
});
