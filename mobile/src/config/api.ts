import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** NestJS backend port (see backend/.env PORT). */
export const API_PORT = 3001;

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function isLoopbackHost(host: string): boolean {
  return LOOPBACK_HOSTS.has(host.toLowerCase());
}

function hostFromUri(uri: string | undefined | null): string | null {
  if (!uri) return null;
  const withoutScheme = uri.replace(/^https?:\/\//, '');
  const host = withoutScheme.split(':')[0]?.trim();
  return host || null;
}

/**
 * Metro / Expo dev server host (LAN IP when using `expo start --lan`).
 */
function resolveExpoDevHost(): string | null {
  const sources: Array<string | undefined | null> = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    (Constants.manifest2 as { extra?: { expoGo?: { debuggerHost?: string } } } | null)?.extra?.expoGo
      ?.debuggerHost,
    Constants.linkingUri,
  ];

  for (const uri of sources) {
    const host = hostFromUri(uri);
    if (host && !isLoopbackHost(host)) return host;
  }

  for (const uri of sources) {
    const host = hostFromUri(uri);
    if (host) return host;
  }

  return null;
}

function androidEmulatorApiUrl(): string {
  return `http://10.0.2.2:${API_PORT}`;
}

function rewriteLoopbackForDevice(configured: string): string {
  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    return configured.replace(/\/$/, '');
  }

  if (!isLoopbackHost(url.hostname)) {
    return configured.replace(/\/$/, '');
  }

  const devHost = resolveExpoDevHost();
  if (devHost && !isLoopbackHost(devHost)) {
    return `http://${devHost}:${url.port || API_PORT}`;
  }

  if (Platform.OS === 'android') {
    return androidEmulatorApiUrl();
  }

  return configured.replace(/\/$/, '');
}

/**
 * Base URL for the municipal Nest API (`MobileApiController` at /api/*).
 * Set EXPO_PUBLIC_API_URL in mobile/.env (auto-filled with LAN IP by `npm run setup:env`).
 */
export function getApiBaseUrl(): string {
  const configured =
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.trim();

  if (configured) {
    return rewriteLoopbackForDevice(configured);
  }

  const devHost = resolveExpoDevHost();
  if (devHost) {
    return `http://${devHost}:${API_PORT}`;
  }

  if (Platform.OS === 'android') {
    return androidEmulatorApiUrl();
  }

  return `http://localhost:${API_PORT}`;
}

if (__DEV__) {
  console.log('[API] Using backend:', getApiBaseUrl());
}
