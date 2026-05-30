import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';
import { ElectronicStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<ElectronicStackParamList, 'ElectronicAppeal'>;

export default function ElectronicAppealScreen({ navigation }: Props) {
  const [appealType, setAppealType] = useState<'Təklif' | 'Ərizə' | 'Şikayət'>('Təklif');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const submit = () => {
    if (!fullName || !email || !phone || !subject || !message) {
      Alert.alert('Xəta', 'Zəhmət olmasa bütün sahələri doldurun.');
      return;
    }
    Alert.alert('Uğurlu', 'Elektron müraciətiniz qəbul olundu.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Color.white500} />
        </Pressable>
        <Text style={styles.topTitle}>Elektron müraciət</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Müraciətinizi aşağıdakı formada göndərin. Məlumatlar düzgün daxil edildikdə müraciətiniz
          qeydiyyata alınacaq.
        </Text>

        <Text style={styles.label}>Ad, soyad*</Text>
        <TextInput value={fullName} onChangeText={setFullName} placeholder="Ad, soyad*" placeholderTextColor={Color.neutral500} style={styles.input} />

        <Text style={styles.label}>E-mail*</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="E-mail*" placeholderTextColor={Color.neutral500} style={styles.input} keyboardType="email-address" />

        <Text style={styles.label}>Telefon*</Text>
        <TextInput value={phone} onChangeText={setPhone} placeholder="Telefon*" placeholderTextColor={Color.neutral500} style={styles.input} keyboardType="phone-pad" />

        <Text style={styles.label}>Müraciətin növü*</Text>
        <View style={styles.typeRow}>
          {(['Təklif', 'Ərizə', 'Şikayət'] as const).map((item) => {
            const active = appealType === item;
            return (
              <Pressable key={item} onPress={() => setAppealType(item)} style={styles.typeItem}>
                <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                  {active ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={styles.typeText}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Mövzu*</Text>
        <TextInput value={subject} onChangeText={setSubject} placeholder="Mövzu*" placeholderTextColor={Color.neutral500} style={styles.input} />

        <Text style={styles.label}>Müraciət mətni*</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Müraciət mətni*"
          placeholderTextColor={Color.neutral500}
          style={[styles.input, styles.textarea]}
          multiline
          textAlignVertical="top"
        />

        <Pressable onPress={submit} style={({ pressed }) => [styles.submit, pressed && styles.pressed]}>
          <Text style={styles.submitText}>Göndər</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Color.white500, flex: 1 },
  topBar: {
    alignItems: 'center',
    backgroundColor: '#1F4D8F',
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  backButton: { height: 34, justifyContent: 'center', width: 34 },
  topTitle: { color: Color.white500, fontSize: 24, fontWeight: '800', marginLeft: 6 },
  content: { backgroundColor: '#EFF1F4', padding: Spacing.lg, paddingBottom: 30 },
  description: { color: Color.neutral800, fontSize: 16, lineHeight: 24, marginBottom: Spacing.md },
  label: { color: Color.neutral900, fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: Spacing.sm },
  typeRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: 6 },
  typeItem: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  typeText: { color: Color.neutral900, fontSize: 16, fontWeight: '500' },
  radioOuter: {
    alignItems: 'center',
    borderColor: Color.neutral500,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  radioOuterActive: { borderColor: Color.primary500 },
  radioInner: { backgroundColor: Color.primary500, borderRadius: 5, height: 10, width: 10 },
  input: {
    backgroundColor: Color.white500,
    borderColor: '#CFD8E6',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    color: Color.neutral900,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  textarea: { height: 220 },
  submit: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#1F4D8F',
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
    minWidth: 130,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    ...Shadow.surface,
  },
  submitText: { color: Color.white500, fontSize: 18, fontWeight: '800' },
  pressed: { opacity: 0.85 },
});
