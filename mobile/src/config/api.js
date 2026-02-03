import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  // Allow override from environment/config
  const envUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (envUrl) return envUrl;

  // For tunnel mode or physical devices, use your Mac's local IP
  // TODO: Update this IP if your network changes
  const LOCAL_DEV_IP = '192.168.1.10';

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

  return `http://${LOCAL_DEV_IP}:8000`;
};

export const API_CONFIG = {
  baseUrl: getApiBaseUrl(),
  endpoints: {
    feed: '/api/v1/feed',
    books: '/api/v1/books',
    bookmarks: '/api/v1/interactions/bookmarks',
    likes: '/api/v1/interactions/likes',
  },
};

export default API_CONFIG;
