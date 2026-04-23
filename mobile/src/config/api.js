import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  // Allow override from environment/config
  const envUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (envUrl) return envUrl;

  // Platform-specific defaults for development
  if (Platform.OS === 'ios' && !Constants.isDevice) {
    // iOS Simulator can use localhost directly
    return 'http://127.0.0.1:8000';
  }
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'http://10.0.2.2:8000';
  }

  // Physical device - try to detect Expo host
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const localhost = debuggerHost.split(':')[0];
    return `http://${localhost}:8000`;
  }

  // Fallback — set apiBaseUrl in app.json extra config for physical devices
  console.warn('API: Could not auto-detect host. Set apiBaseUrl in app.json extra config.');
  return 'http://localhost:8000';
};

export const API_CONFIG = {
  baseUrl: getApiBaseUrl(),
  endpoints: {
    feed: '/api/v1/feed',
    books: '/api/v1/books',
    bookmarks: '/api/v1/interactions/bookmarks',
    events: '/api/v1/interactions/events',
    likes: '/api/v1/interactions/likes',
  },
};

export default API_CONFIG;
