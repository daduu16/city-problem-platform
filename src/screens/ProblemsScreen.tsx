import { useNavigation } from '@react-navigation/native';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Color, Spacing, Typography } from '@/GlobalStyles';
import ProblemCard from '@/components/ProblemCard';
import { MyReportsStackParamList, ProblemsStackParamList } from '@/navigation/AppNavigator';
import { useAppData } from '@/state/AppDataContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  onlyMine?: boolean;
};

export default function ProblemsScreen({ onlyMine }: Props) {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<ProblemsStackParamList & MyReportsStackParamList, 'ProblemDetail'>
    >();
  const { problems } = useAppData();
  const data = onlyMine ? problems.filter((item) => item.createdByMe) : problems;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.lg }} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>{onlyMine ? 'Mənim müraciətlərim' : 'Problemlər'}</Text>
              <Text style={styles.subtitle}>
                {onlyMine ? 'Sizin göndərdiyiniz problemlər' : 'Göndərilən müraciətlərin siyahısı'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProblemCard
              item={item}
              onPress={() => navigation.navigate('ProblemDetail', { problem: item })}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Color.white500,
    flex: 1,
  },
  screen: {
    backgroundColor: Color.neutral50,
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    color: Color.neutral900,
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: Color.neutral500,
    fontSize: Typography.body,
    fontWeight: '600',
    marginTop: 6,
  },
});
