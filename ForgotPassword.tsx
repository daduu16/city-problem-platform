import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthActionButton } from '@/components/auth/AuthActionButton';
import { AuthLogo } from '@/components/auth/AuthLogo';
import { AuthTextInput } from '@/components/auth/AuthTextInput';
import { Color, Spacing, Typography } from '@/GlobalStyles';
import { RootStackParamList } from '@/navigation/types';
import { forgotPassword } from '@/services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      setError('');
      setMessage('');
      const result = await forgotPassword(identifier, newPassword, confirmPassword);
      setMessage(result.message);
    } catch (err: any) {
      setError(err.message);
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
              <Text style={styles.title}>Şifrəni unutdum</Text>
              <Text style={styles.subtitle}>E-poçt və ya telefonla yeni şifrə təyin edin.</Text>
            </View>

            <View style={styles.form}>
              <AuthTextInput icon="mail-outline" placeholder="E-poçt və ya telefon" value={identifier} onChangeText={setIdentifier} />
              <AuthTextInput icon="lock-closed-outline" placeholder="Yeni şifrə" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
              <AuthTextInput icon="lock-closed-outline" placeholder="Yeni şifrə (təsdiq)" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            </View>

            <View style={styles.primaryAction}>
              <AuthActionButton title="Şifrəni yenilə" onPress={handleSubmit} />
            </View>
            {message ? <Text style={styles.successText}>{message}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  successText: { color: Color.success500, fontSize: Typography.caption, fontWeight: '700', marginTop: Spacing.md, textAlign: 'center' },
  errorText: { color: Color.danger500, fontSize: Typography.caption, fontWeight: '600', marginTop: Spacing.md, textAlign: 'center' },
});

