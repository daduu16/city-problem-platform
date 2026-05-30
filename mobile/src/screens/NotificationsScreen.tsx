import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';
import { HomeStackParamList } from '@/navigation/AppNavigator';
import { useAppData } from '@/state/AppDataContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'Notifications'>;

export default function NotificationsScreen({ navigation }: Props) {
  const { notifications, markNotificationAsRead, problems, resolveProblemAsExecutor, currentUser } = useAppData();

  const openProblemFromNotification = (problemId?: string, notificationId?: string) => {
    if (!problemId || !notificationId) return;
    markNotificationAsRead(notificationId);
    const target = problems.find((p) => p.id === problemId);
    if (!target) {
      Alert.alert('Tapılmadı', 'Problem tapılmadı və ya artıq mövcud deyil.');
      return;
    }

    const tabNav = navigation.getParent() as any;
    if (tabNav?.navigate) {
      tabNav.navigate('ProblemsTab', {
        screen: 'ProblemDetail',
        params: { problem: target },
      });
      return;
    }

    // Fallback: open problems tab first, then push detail.
    navigation.navigate('HomeMain');
    setTimeout(() => {
      const fallbackTabNav = navigation.getParent() as any;
      fallbackTabNav?.navigate?.('ProblemsTab');
    }, 0);
  };

  const resolveFromNotification = async (problemId?: string, notificationId?: string) => {
    if (!problemId || !notificationId) return;
    const problem = problems.find((p) => p.id === problemId);
    if (!problem) {
      Alert.alert('Tapılmadı', 'Problem tapılmadı və ya artıq mövcud deyil.');
      return;
    }
    if (problem.status === 'Həll edildi') {
      markNotificationAsRead(notificationId);
      Alert.alert('Məlumat', 'Bu problem artıq həll edilib.');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İcazə tələb olunur', 'Həll sübutu üçün kamera icazəsi verin.');
      return;
    }

    const captured = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ['images'],
    });
    if (captured.canceled || captured.assets.length === 0) return;

    resolveProblemAsExecutor(problemId, captured.assets[0].uri);
    markNotificationAsRead(notificationId);
    Alert.alert('Tamamlandı', 'Problem həll olundu və şəkil əlavə edildi.');
  };

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
            <View
              style={[
                styles.card,
                item.isRead ? styles.cardRead : styles.cardUnread,
              ]}
            >
              {!item.isRead ? <View style={styles.unreadDot} /> : null}
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
              {item.type === 'executor_task' && item.problemId ? (
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => openProblemFromNotification(item.problemId, item.id)}
                    style={({ pressed }) => [styles.taskActionButton, styles.openActionButton, pressed && styles.pressed]}
                  >
                    <Ionicons name="open-outline" size={14} color={Color.white500} />
                    <Text style={styles.actionButtonText}>Problemə keç</Text>
                  </Pressable>
                  {currentUser?.role === 'executor' && (
                    (() => {
                      const target = problems.find((p) => p.id === item.problemId);
                      const isResolved = target?.status === 'Həll edildi';
                      if (isResolved) {
                        return (
                          <View style={styles.resolvedChip}>
                            <Ionicons name="checkmark-done-outline" size={14} color={Color.success500} />
                            <Text style={styles.resolvedChipText}>Həll olunub</Text>
                          </View>
                        );
                      }
                      return (
                        <Pressable
                          onPress={() => resolveFromNotification(item.problemId, item.id)}
                          style={({ pressed }) => [styles.taskActionButton, styles.resolveActionButton, pressed && styles.pressed]}
                        >
                          <Ionicons name="camera-outline" size={14} color={Color.white500} />
                          <Text style={styles.actionButtonText}>Buradan həll et</Text>
                        </Pressable>
                      );
                    })()
                  )}
                </View>
              ) : null}
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString('az-AZ', {
                  year: 'numeric',
                  month: 'long',
                  day: '2-digit',
                })}
              </Text>
            </View>
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
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.sm,
  },
  taskActionButton: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  openActionButton: {
    flex: 1,
    backgroundColor: Color.primary600,
  },
  resolveActionButton: {
    flex: 1,
    backgroundColor: Color.success500,
  },
  resolvedChip: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  resolvedChipText: {
    color: Color.success500,
    fontSize: 11,
    fontWeight: '900',
  },
  actionButtonText: {
    color: Color.white500,
    fontSize: 11,
    fontWeight: '900',
  },
  date: { color: Color.primary600, fontSize: 12, fontWeight: '800', marginTop: Spacing.md },
  pressed: { opacity: 0.88 },
});
