import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';
import { HomeStackParamList } from '@/navigation/AppNavigator';
import { useAppData } from '@/state/AppDataContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'Notifications'>;

export default function NotificationsScreen({ navigation }: Props) {
  const { notifications, markNotificationAsRead } = useAppData();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={26} color={Color.neutral900} />
          </Pressable>
          <Text style={styles.topTitle}>Bildirişlər</Text>
          <View style={styles.backButton} />
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => markNotificationAsRead(item.id)}
              style={({ pressed }) => [
                styles.card,
                item.isRead ? styles.cardRead : styles.cardUnread,
                pressed && styles.pressed,
              ]}
            >
              {!item.isRead ? <View style={styles.unreadDot} /> : null}
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString('az-AZ', {
                  year: 'numeric',
                  month: 'long',
                  day: '2-digit',
                })}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Color.white500, flex: 1 },
  screen: { backgroundColor: Color.neutral50, flex: 1 },
  topBar: {
    alignItems: 'center',
    backgroundColor: Color.white500,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  topTitle: {
    color: Color.neutral900,
    flex: 1,
    fontSize: Typography.body,
    fontWeight: '900',
    textAlign: 'center',
  },
  content: { padding: Spacing.lg, paddingBottom: 30 },
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    position: 'relative',
    ...Shadow.surface,
  },
  cardUnread: {
    backgroundColor: '#EEF6FF',
    borderColor: '#BFDBFE',
  },
  cardRead: {
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    opacity: 0.88,
  },
  unreadDot: {
    backgroundColor: Color.primary600,
    borderRadius: 4,
    height: 8,
    position: 'absolute',
    right: 10,
    top: 10,
    width: 8,
  },
  title: { color: Color.neutral900, fontSize: Typography.body, fontWeight: '900' },
  message: {
    color: Color.neutral800,
    fontSize: Typography.caption,
    fontWeight: '600',
    lineHeight: 21,
    marginTop: Spacing.sm,
  },
  date: { color: Color.primary600, fontSize: 12, fontWeight: '800', marginTop: Spacing.md },
  pressed: { opacity: 0.88 },
});

