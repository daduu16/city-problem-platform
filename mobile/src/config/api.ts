import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** NestJS backend port (see backend/.env PORT). */
export const API_PORT = 3001;

function resolveDevHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  return hostUri.split(':')[0] ?? null;
}

/**
 * Base URL for the municipal Nest API (`MobileApiController` at /api/*).
 * Override with EXPO_PUBLIC_API_URL or app.json expo.extra.apiUrl.
 */
export function getApiBaseUrl(): string {
  const configured =
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.trim();

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const host = resolveDevHost();
  if (host) {
    return `http://${host}:${API_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}
