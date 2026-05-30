import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Color, Shadow } from '@/GlobalStyles';
import NotificationsScreen from '@/screens/NotificationsScreen';
import HomeScreen from '@/screens/HomeScreen';
import NewsDetailScreen from '@/screens/NewsDetailScreen';
import ProblemDetailScreen from '@/screens/ProblemDetailScreen';
import ProblemsScreen from '@/screens/ProblemsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import ReportProblemScreen from '@/screens/ReportProblemScreen';
import ElectronicAppealScreen from '@/screens/ElectronicAppealScreen';
import ElectronicReceptionScreen from '@/screens/ElectronicReceptionScreen';
import AppealFormsScreen from '@/screens/AppealFormsScreen';
import { News, Problem } from '@/types';

export type HomeStackParamList = {
  HomeMain: undefined;
  NewsDetail: { news: News };
  Notifications: undefined;
};

export type ProblemsStackParamList = {
  ProblemsMain: undefined;
  ProblemDetail: { problem: Problem };
};

export type ElectronicStackParamList = {
  ElectronicMain: undefined;
  ElectronicReception: undefined;
  ElectronicAppeal: undefined;
  AppealForms: undefined;
};

type TabParamList = {
  HomeTab: undefined;
  ElectronicTab: undefined;
  ReportTab: undefined;
  ProblemsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProblemsStack = createNativeStackNavigator<ProblemsStackParamList>();
const ElectronicStack = createNativeStackNavigator<ElectronicStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
    </HomeStack.Navigator>
  );
}

function ProblemsStackNavigator() {
  return (
    <ProblemsStack.Navigator>
      <ProblemsStack.Screen name="ProblemsMain" component={ProblemsScreen} options={{ headerShown: false }} />
      <ProblemsStack.Screen name="ProblemDetail" component={ProblemDetailScreen} options={{ headerShown: false }} />
    </ProblemsStack.Navigator>
  );
}

function ElectronicMainScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Color.neutral50 }}>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 }}>
        <Text style={{ color: Color.neutral900, fontSize: 24, fontWeight: '900', marginBottom: 14 }}>
          Elektron xidmətlər
        </Text>
        <Pressable
          onPress={() => navigation.navigate('ElectronicReception')}
          style={({ pressed }) => [{ backgroundColor: '#E9EDF2', borderRadius: 14, padding: 18, minHeight: 120, justifyContent: 'center', marginBottom: 12 }, pressed && { opacity: 0.86 }]}
        >
          <Ionicons name="hand-left-outline" size={36} color={Color.primary600} />
          <View style={{ height: 8 }} />
          <Text style={{ color: Color.neutral900, fontSize: 15, fontWeight: '700' }}>
            Vətəndaşların qəbulunun elektron qeydiyyatı
          </Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('ElectronicAppeal')}
          style={({ pressed }) => [{ backgroundColor: '#E9EDF2', borderRadius: 14, padding: 18, minHeight: 120, justifyContent: 'center' }, pressed && { opacity: 0.86 }]}
        >
          <Ionicons name="globe-outline" size={36} color={Color.primary600} />
          <View style={{ height: 8 }} />
          <Text style={{ color: Color.neutral900, fontSize: 15, fontWeight: '700' }}>
            Elektron müraciət
          </Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('AppealForms')}
          style={({ pressed }) => [{ backgroundColor: '#E9EDF2', borderRadius: 14, padding: 18, minHeight: 120, justifyContent: 'center', marginTop: 12 }, pressed && { opacity: 0.86 }]}
        >
          <Ionicons name="id-card-outline" size={36} color={Color.primary600} />
          <View style={{ height: 8 }} />
          <Text style={{ color: Color.neutral900, fontSize: 15, fontWeight: '700' }}>
            Müraciət formaları
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ElectronicStackNavigator() {
  return (
    <ElectronicStack.Navigator>
      <ElectronicStack.Screen name="ElectronicMain" component={ElectronicMainScreen} options={{ headerShown: false }} />
      <ElectronicStack.Screen name="ElectronicReception" component={ElectronicReceptionScreen} options={{ headerShown: false }} />
      <ElectronicStack.Screen name="ElectronicAppeal" component={ElectronicAppealScreen} options={{ headerShown: false }} />
      <ElectronicStack.Screen name="AppealForms" component={AppealFormsScreen} options={{ headerShown: false }} />
    </ElectronicStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Color.primary600,
        tabBarInactiveTintColor: Color.neutral500,
        tabBarStyle: {
          backgroundColor: Color.neutral50,
          borderTopColor: Color.neutral50,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: 'transparent',
          shadowOpacity: 0,
          height: 74,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 12 },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'ReportTab') return null;

          const iconName = (() => {
            switch (route.name) {
              case 'HomeTab':
                return 'home-outline';
              case 'ElectronicTab':
                return 'document-text-outline';
              case 'ProblemsTab':
                return 'list-outline';
              case 'ProfileTab':
                return 'person-outline';
              default:
                return 'ellipse-outline';
            }
          })();

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Əsas' }} />
      <Tab.Screen name="ElectronicTab" component={ElectronicStackNavigator} options={{ title: 'E.Xidmətlər' }} />
      <Tab.Screen
        name="ReportTab"
        component={ReportProblemScreen}
        options={{
          title: '',
          tabBarLabel: '',
          tabBarButton: (props) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Problem gonder"
              onPress={props.onPress}
              style={({ pressed }) => [styles.centerButton, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.centerButtonInner}>
                <Ionicons name="add" size={30} color={Color.white500} />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tab.Screen name="ProblemsTab" component={ProblemsStackNavigator} options={{ title: 'Problemlər' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  centerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -18,
  },
  centerButtonInner: {
    alignItems: 'center',
    backgroundColor: Color.primary500,
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    width: 68,
    ...Shadow.primaryButton,
  },
});
