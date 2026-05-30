import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './Login';
import SignupScreen from './Signup';
import VerifyEmailScreen from './VerifyEmail';
import ForgotPasswordScreen from './ForgotPassword';
import ChangePasswordScreen from './ChangePassword';
import AppNavigator from '@/navigation/AppNavigator';
import { RootStackParamList } from '@/navigation/types';
import { AppDataProvider } from '@/state/AppDataContext';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AppDataProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Signup" component={SignupScreen} />
          <RootStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <RootStack.Screen name="Home" component={AppNavigator} />
        </RootStack.Navigator>
      </NavigationContainer>
    </AppDataProvider>
  );
}
