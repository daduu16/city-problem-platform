import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';
import { HomeStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'ElectronicReception'>;

const receptionOptions = [
  'İcra Hakimiyyətinin başçısı',
  'Rayon İcra Hakimiyyəti başçısının birinci müavini',
  'Rayon İcra Hakimiyyəti başçısının müavini',
  'Ərazi idarəetmə və yerli özünü idarəetmə orqanları ilə iş şöbəsi',
  'Hüquq şöbəsinin müdiri',
  'İctimai-siyasi və humanitar məsələlər şöbəsinin müdiri',
  'Sosial-iqtisadi inkişafın təhlili və proqnozlaşdırılması şöbəsinin müdiri',
  'Rayon təsərrüfatı şöbəsinin müdiri',
  'Sənədlərlə və vətəndaşların müraciətləri ilə iş şöbəsinin müdiri',
];

export default function ElectronicReceptionScreen({ navigation }: Props) {
  const [target, setTarget] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [addressWork, setAddressWork] = useState('');
  const [idCard, setIdCard] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [appeal, setAppeal] = useState('');

  const openTargetPicker = () => {
    Alert.alert(
      'Kimin qəbuluna yazılmaq istəyirsiniz?',
      '',
      receptionOptions.map((item) => ({ text: item, onPress: () => setTarget(item) })),
    );
  };

  const submit = () => {
    if (!target || !name || !surname || !fatherName || !addressWork || !idCard || !phone || !email || !appeal) {
      Alert.alert('Xəta', 'Zəhmət olmasa bütün vacib sahələri doldurun.');
      return;
    }
    Alert.alert('Uğurlu', 'Elektron qəbul müraciətiniz qeydə alındı.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Color.white500} />
        </Pressable>
        <Text style={styles.topTitle}>Elektron qəbul</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.introTitle}>Hörmətli istifadəçi!</Text>
        <Text style={styles.introText}>
          Nərimanov Rayon İcra Hakimiyyətinin başçısı və rəhbər vəzifəli şəxslərin qəbuluna
          yazılmazdan öncə qəbul günlərinin qrafiki ilə tanış olun.
        </Text>
        <Text style={styles.introText}>
          Qəbula yazılmaq üçün aşağıdakı xanaları diqqətlə doldurmağınız xahiş olunur. Xanalar
          boş saxlanılmamalı və məlumatlar düzgün olmalıdır.
        </Text>

        <Text style={styles.label}>Kimin qəbuluna yazılmaq istəyirsiniz?*</Text>
        <Pressable onPress={openTargetPicker} style={({ pressed }) => [styles.select, pressed && styles.pressed]}>
          <Text style={[styles.selectText, !target && styles.placeholder]} numberOfLines={1}>
            {target || 'Kimin qəbuluna yazılmaq istəyirsiniz?*'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={Color.neutral500} />
        </Pressable>

        <Text style={styles.label}>Adınız*</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Adınız*" placeholderTextColor={Color.neutral500} style={styles.input} />

        <Text style={styles.label}>Soyadınız*</Text>
        <TextInput value={surname} onChangeText={setSurname} placeholder="Soyadınız*" placeholderTextColor={Color.neutral500} style={styles.input} />

        <Text style={styles.label}>Ata adınız*</Text>
        <TextInput value={fatherName} onChangeText={setFatherName} placeholder="Ata adınız*" placeholderTextColor={Color.neutral500} style={styles.input} />

        <Text style={styles.label}>Ünvan və iş yeri*</Text>
        <TextInput value={addressWork} onChangeText={setAddressWork} placeholder="Ünvan və iş yeri*" placeholderTextColor={Color.neutral500} style={styles.input} />

        <Text style={styles.label}>Şəxsiyyət vəsiqəsi*</Text>
        <TextInput value={idCard} onChangeText={setIdCard} placeholder="Şəxsiyyət vəsiqəsi*" placeholderTextColor={Color.neutral500} style={styles.input} />

        <Text style={styles.label}>Telefon*</Text>
        <TextInput value={phone} onChangeText={setPhone} placeholder="Telefon*" placeholderTextColor={Color.neutral500} style={styles.input} keyboardType="phone-pad" />

        <Text style={styles.label}>E-mail*</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="E-mail*" placeholderTextColor={Color.neutral500} style={styles.input} keyboardType="email-address" />

        <Text style={styles.label}>Müraciət*</Text>
        <TextInput
          value={appeal}
          onChangeText={setAppeal}
          placeholder="Müraciət*"
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
  topTitle: { color: Color.white500, fontSize: 32, fontWeight: '800', marginLeft: 6 },
  content: { backgroundColor: '#EFF1F4', padding: Spacing.lg, paddingBottom: 30 },
  introTitle: { color: Color.neutral900, fontSize: 28, fontWeight: '800', marginBottom: Spacing.sm },
  introText: { color: Color.neutral800, fontSize: 16, lineHeight: 24, marginBottom: Spacing.md },
  label: { color: Color.neutral900, fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: Spacing.sm },
  select: {
    alignItems: 'center',
    backgroundColor: Color.white500,
    borderColor: '#BFD0E7',
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: Spacing.md,
  },
  selectText: { color: Color.neutral900, flex: 1, fontSize: 16, fontWeight: '500', paddingVertical: 12 },
  placeholder: { color: Color.neutral500 },
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
