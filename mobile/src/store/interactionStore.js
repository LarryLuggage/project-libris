import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

const FALLBACK_DEVICE_ID_KEY = 'libris-fallback-device-id';

const getDeviceId = async () => {
  try {
    const id = await Application.getInstallationIdAsync();
    if (id) return id;
  } catch (error) {
    if (__DEV__) {
      console.warn('Could not get installation ID, using fallback');
    }
  }

  const existingFallback = await AsyncStorage.getItem(FALLBACK_DEVICE_ID_KEY);
  if (existingFallback) return existingFallback;

  const fallbackId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await AsyncStorage.setItem(FALLBACK_DEVICE_ID_KEY, fallbackId);
  return fallbackId;
};

const useInteractionStore = create(
  persist(
    (set, get) => ({
      // State
      bookmarkedIds: [],
      likedIds: [],
      deviceId: null,
      initialized: false,
      lastError: null,

      // Initialize store with device ID and sync from server
      initialize: async () => {
        if (get().initialized) return;

        const deviceId = get().deviceId || await getDeviceId();
        set({ deviceId });

        // Sync interaction state from server
        try {
          const headers = { 'X-Device-ID': deviceId };
          const [bookmarksResponse, likesResponse] = await Promise.all([
            axios.get(
              `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.bookmarks}`,
              { headers }
            ),
            axios.get(
              `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.likes}`,
              { headers }
            ),
          ]);
          set({
            bookmarkedIds: bookmarksResponse.data.page_ids || [],
            likedIds: likesResponse.data.page_ids || [],
            initialized: true,
          });
        } catch (err) {
          if (__DEV__) {
            console.warn('Failed to sync interactions from server:', err.message);
          }
          set({ initialized: true });
        }
      },

      // Toggle bookmark with optimistic update
      toggleBookmark: async (pageId) => {
        const { deviceId, initialized, bookmarkedIds } = get();
        if (!initialized || !deviceId) {
          set({ lastError: 'Still preparing your device. Please try again.' });
          return;
        }

        const isBookmarked = bookmarkedIds.includes(pageId);

        // Optimistic update
        if (isBookmarked) {
          set({ bookmarkedIds: bookmarkedIds.filter((id) => id !== pageId) });
        } else {
          set({ bookmarkedIds: [...bookmarkedIds, pageId] });
        }

        try {
          const method = isBookmarked ? 'delete' : 'post';
          await axios({
            method,
            url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.bookmarks}/${pageId}`,
            headers: { 'X-Device-ID': deviceId },
          });
        } catch (err) {
          // Revert on failure
          if (__DEV__) {
            console.error('Bookmark toggle failed:', err.message);
          }
          set({
            bookmarkedIds,
            lastError: err.code === 'ERR_NETWORK'
              ? 'No connection. Your bookmark was not saved.'
              : 'Could not save bookmark. Please try again.',
          });
        }
      },

      // Toggle like with optimistic update
      toggleLike: async (pageId) => {
        const { deviceId, initialized, likedIds } = get();
        if (!initialized || !deviceId) {
          set({ lastError: 'Still preparing your device. Please try again.' });
          return;
        }

        const isLiked = likedIds.includes(pageId);

        // Optimistic update
        if (isLiked) {
          set({ likedIds: likedIds.filter((id) => id !== pageId) });
        } else {
          set({ likedIds: [...likedIds, pageId] });
        }

        try {
          await axios.post(
            `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.likes}/${pageId}`,
            {},
            { headers: { 'X-Device-ID': deviceId } }
          );
        } catch (err) {
          // Revert on failure
          if (__DEV__) {
            console.error('Like toggle failed:', err.message);
          }
          set({
            likedIds,
            lastError: err.code === 'ERR_NETWORK'
              ? 'No connection. Your like was not saved.'
              : 'Could not save like. Please try again.',
          });
        }
      },

      recordEvent: async (pageId, eventType) => {
        const { deviceId, initialized } = get();
        if (!initialized || !deviceId) return;

        try {
          await axios.post(
            `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.events}`,
            { page_id: pageId, event_type: eventType },
            { headers: { 'X-Device-ID': deviceId } }
          );
        } catch (err) {
          if (__DEV__) {
            console.warn('Feed event failed:', err.message);
          }
        }
      },

      // Check if a page is bookmarked
      isBookmarked: (pageId) => get().bookmarkedIds.includes(pageId),

      // Check if a page is liked
      isLiked: (pageId) => get().likedIds.includes(pageId),

      clearLastError: () => set({ lastError: null }),
    }),
    {
      name: 'interaction-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookmarkedIds: state.bookmarkedIds,
        deviceId: state.deviceId,
        likedIds: state.likedIds,
      }),
    }
  )
);

export default useInteractionStore;
