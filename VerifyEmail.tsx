import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthActionButton } from '@/components/auth/AuthActionButton';
import { AuthLogo } from '@/components/auth/AuthLogo';
import { AuthTextInput } from '@/components/auth/AuthTextInput';
import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';
import { RootStackParamList } from '@/navigation/types';
import { resendSignupCode, verifySignupCode } from '@/services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

export default function VerifyEmailScreen({ navigation, route }: Props) {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerify = async () => {
    try {
      await verifySignupCode(route.params.email, code);
      navigation.navigate('Login', { verifiedEmail: route.params.email });
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  const handleResend = async () => {
    try {
      await resendSignupCode(route.params.email);
      setCode('');
      setErrorMessage('');
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable hitSlop={12} onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={Color.neutral900} />
          </Pressable>

          <View style={styles.content}>
            <View style={styles.header}>
              <AuthLogo />
              <Text style={styles.title}>E-poçt təsdiqi</Text>
              <Text style={styles.subtitle}>{route.params.email} ünvanına 6 rəqəmli kod göndərildi.</Text>
            </View>

            <View style={styles.form}>
              <AuthTextInput
                icon="keypad-outline"
                keyboardType="number-pad"
                onChangeText={(value) => {
                  setErrorMessage('');
                  setCode(value);
                }}
                placeholder="Təsdiq kodu"
                value={code}
              />
            </View>

            <View style={styles.primaryAction}>
              <AuthActionButton title="Kodu təsdiqlə" onPress={handleVerify} />
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <Pressable onPress={handleResend} style={styles.resendButton}>
              <Text style={styles.resendText}>Kodu yenidən göndər</Text>
            </Pressable>
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
  errorText: { color: Color.danger500, fontSize: Typography.caption, fontWeight: '600', marginTop: Spacing.md, textAlign: 'center' },
  resendButton: { marginTop: Spacing.xl, paddingVertical: Spacing.xs },
  resendText: { color: Color.primary600, fontSize: Typography.caption, fontWeight: '800', textAlign: 'center' },
});
