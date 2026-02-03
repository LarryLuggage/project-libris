import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

const getDeviceId = async () => {
  try {
    const id = await Application.getInstallationIdAsync();
    return id;
  } catch (error) {
    // Fallback to a random ID if installation ID fails
    console.warn('Could not get installation ID, using fallback');
    return `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

const useInteractionStore = create(
  persist(
    (set, get) => ({
      // State
      bookmarkedIds: [],
      likedIds: [],
      deviceId: null,
      initialized: false,

      // Initialize store with device ID and sync from server
      initialize: async () => {
        if (get().initialized) return;

        const deviceId = await getDeviceId();
        set({ deviceId });

        // Sync bookmarks from server
        try {
          const response = await axios.get(
            `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.bookmarks}`,
            { headers: { 'X-Device-ID': deviceId } }
          );
          set({
            bookmarkedIds: response.data.page_ids || [],
            initialized: true,
          });
        } catch (err) {
          console.warn('Failed to sync bookmarks from server:', err.message);
          set({ initialized: true });
        }
      },

      // Toggle bookmark with optimistic update
      toggleBookmark: async (pageId) => {
        const { deviceId, bookmarkedIds } = get();
        if (!deviceId) return;

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
          console.error('Bookmark toggle failed:', err.message);
          set({ bookmarkedIds });
        }
      },

      // Toggle like with optimistic update
      toggleLike: async (pageId) => {
        const { deviceId, likedIds } = get();
        if (!deviceId) return;

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
          console.error('Like toggle failed:', err.message);
          set({ likedIds });
        }
      },

      // Check if a page is bookmarked
      isBookmarked: (pageId) => get().bookmarkedIds.includes(pageId),

      // Check if a page is liked
      isLiked: (pageId) => get().likedIds.includes(pageId),
    }),
    {
      name: 'interaction-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookmarkedIds: state.bookmarkedIds,
        likedIds: state.likedIds,
      }),
    }
  )
);

export default useInteractionStore;
