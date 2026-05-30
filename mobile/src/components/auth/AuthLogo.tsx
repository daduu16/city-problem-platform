import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Color } from '@/GlobalStyles';

export function AuthLogo() {
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <View style={styles.logoFrame}>
      {hasImageError ? (
        <View style={styles.logoFallback}>
          <Ionicons name="business-outline" size={28} color={Color.primary600} />
        </View>
      ) : (
        <Image
          source={require('../../../assets/images/heydar_aliyev_center.jpg')}
          style={styles.logoImage}
          resizeMode="cover"
          onError={() => setHasImageError(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoFrame: {
    alignItems: 'center',
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: 16,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 124,
  },
  logoImage: {
    height: '100%',
    width: '100%',
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
});
