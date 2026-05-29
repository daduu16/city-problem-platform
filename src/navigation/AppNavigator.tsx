import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';

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
import { News, Problem } from '@/types';

export type HomeStackParamList = {
  HomeMain: undefined;
  NewsDetail: { news: News };
  Notifications: undefined;
  ElectronicReception: undefined;
  ElectronicAppeal: undefined;
};

export type ProblemsStackParamList = {
  ProblemsMain: undefined;
  ProblemDetail: { problem: Problem };
};

export type MyReportsStackParamList = {
  MyReportsMain: undefined;
  ProblemDetail: { problem: Problem };
};

type TabParamList = {
  HomeTab: undefined;
  MyReportTab: undefined;
  ReportTab: undefined;
  ProblemsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProblemsStack = createNativeStackNavigator<ProblemsStackParamList>();
const MyReportsStack = createNativeStackNavigator<MyReportsStackParamList>();

function MyReportsMainScreen() {
  return <ProblemsScreen onlyMine />;
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen
        name="NewsDetail"
        component={NewsDetailScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="ElectronicReception"
        component={ElectronicReceptionScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="ElectronicAppeal"
        component={ElectronicAppealScreen}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
}

function ProblemsStackNavigator() {
  return (
    <ProblemsStack.Navigator>
      <ProblemsStack.Screen
        name="ProblemsMain"
        component={ProblemsScreen}
        options={{ headerShown: false }}
      />
      <ProblemsStack.Screen
        name="ProblemDetail"
        component={ProblemDetailScreen}
        options={{ headerShown: false }}
      />
    </ProblemsStack.Navigator>
  );
}

function MyReportsStackNavigator() {
  return (
    <MyReportsStack.Navigator>
      <MyReportsStack.Screen
        name="MyReportsMain"
        component={MyReportsMainScreen}
        options={{ headerShown: false }}
      />
      <MyReportsStack.Screen
        name="ProblemDetail"
        component={ProblemDetailScreen}
        options={{ headerShown: false }}
      />
    </MyReportsStack.Navigator>
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
          backgroundColor: Color.white500,
          borderTopColor: 'rgba(0,0,0,0.06)',
          height: 74,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 12 },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'ReportTab') {
            return null;
          }

          const iconName = (() => {
            switch (route.name) {
              case 'HomeTab':
                return 'home-outline';
              case 'MyReportTab':
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
      })}>
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Əsas' }} />
      <Tab.Screen
        name="MyReportTab"
        component={MyReportsStackNavigator}
        options={{ title: 'Mənim' }}
      />
      <Tab.Screen
        name="ReportTab"
        component={ReportProblemScreen}
        options={{
          title: '',
          tabBarLabel: '',
          tabBarButton: (props) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Problem göndər"
              onPress={props.onPress}
              style={({ pressed }) => [styles.centerButton, pressed && { opacity: 0.9 }]}>
              <View style={styles.centerButtonInner}>
                <Ionicons name="add" size={30} color={Color.white500} />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tab.Screen
        name="ProblemsTab"
        component={ProblemsStackNavigator}
        options={{ title: 'Problemlər' }}
      />
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
