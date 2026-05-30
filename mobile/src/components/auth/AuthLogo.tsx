import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Color } from '@/GlobalStyles';

export function AuthLogo() {
  return (
    <View style={styles.logo}>
      <Ionicons name="business-outline" size={28} color={Color.primary600} />
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: 18,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
});

