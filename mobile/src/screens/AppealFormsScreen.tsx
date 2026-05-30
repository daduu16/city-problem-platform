import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Color, Spacing } from '@/GlobalStyles';
import { ElectronicStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<ElectronicStackParamList, 'AppealForms'>;

const forms = [
  'Yaşayış sahəsinə ehtiyac olan qismində vətəndaşların uçota alınması',
  'Uşağın adının və soyadının dəyişdirilməsinə icazə verilməsi',
  'Fiziki şəxsin üzərində patronaj təyin edilməsi',
  'Baba, nənə, qardaş, bacı və digər qohumların uşaqlarla ünsiyyət hüququnun yaradılması',
  'Yetkinlik yaşına çatmayan şəxsin mülkiyyətində olan daşınar və daşınmaz əmlakın üzərində notariat hərəkətlərinin aparılmasına dair razılığın verilməsi',
  'On dörd yaşı tamam olmamış yetkinlik yaşına çatmayanlar, habelə psixi pozuntuya görə məhkəmə tərəfindən fəaliyyət qabiliyyəti olmayan sayılmış fiziki şəxslər üzərində qəyyumluq təyin edilməsi',
];

export default function AppealFormsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Color.white500} />
        </Pressable>
        <Text style={styles.topTitle}>Müraciət formaları</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Müraciət formaları</Text>
        <Text style={styles.subtitle}>Müraciət formaları və tələb olunan sənədlərin siyahısı:</Text>

        {forms.map((item, index) => (
          <Text key={item} style={styles.item}>
            {index + 1}. {item}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#EFF1F4', flex: 1 },
  topBar: {
    alignItems: 'center',
    backgroundColor: '#1F4D8F',
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  backButton: { height: 34, justifyContent: 'center', width: 34 },
  topTitle: { color: Color.white500, fontSize: 22, fontWeight: '800', marginLeft: 6 },
  content: {
    backgroundColor: '#EFF1F4',
    padding: Spacing.xl,
    paddingBottom: 30,
  },
  title: {
    color: '#112E5C',
    fontSize: 34,
    fontWeight: '900',
    marginBottom: Spacing.lg,
  },
  subtitle: {
    color: '#112E5C',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: Spacing.md,
  },
  item: {
    color: '#0D55F4',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 28,
    marginBottom: Spacing.sm,
  },
});
