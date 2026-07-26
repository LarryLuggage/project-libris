import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import useInteractionStore from './interactionStore';
import useOnboardingStore from './onboardingStore';


const MAX_SEEN_IDS = 1000;

const useFeedStore = create(
  persist(
    (set, get) => ({
      // State
      items: [],
      seenIds: new Set(),
      cursor: null,
      hasMore: true,
      loading: false,
      error: null,

      // Actions
      fetchFeed: async () => {
        const { loading, cursor, hasMore, seenIds } = get();

        // Don't fetch if already loading or no more items
        if (loading || !hasMore) return;

        set({ loading: true, error: null });

        try {
          // Build URL with cursor and exclude params
          const params = new URLSearchParams();
          if (cursor) {
            params.append('cursor', cursor);
          }

          // Send recently seen IDs to exclude (last 100 for efficiency)
          const seenArray = Array.from(seenIds).slice(-100);
          seenArray.forEach((id) => params.append('exclude', id));

          // Fetch preferences and append to query parameters
          const onboardingState = useOnboardingStore.getState();
          const { favoriteGenres, preferredVibes } = onboardingState;
          if (favoriteGenres && favoriteGenres.length > 0) {
            favoriteGenres.forEach((genre) => params.append('genres', genre));
          }
          if (preferredVibes && preferredVibes.length > 0) {
            preferredVibes.forEach((vibe) => params.append('vibes', vibe));
          }

          const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.feed}?${params}`;
          if (__DEV__) {
            console.log('Fetching feed from:', url);
          }

          const deviceId = useInteractionStore.getState().deviceId;
          const headers = deviceId ? { 'X-Device-ID': deviceId } : {};
          const response = await axios.get(url, { headers });
          const { items: newItems, next_cursor, has_more } = response.data;

          // Filter any duplicates client-side (belt and suspenders)
          const uniqueItems = newItems.filter((item) => !seenIds.has(item.id));

          // Update seen IDs, capped to prevent unbounded growth
          const newSeenIds = new Set(seenIds);
          uniqueItems.forEach((item) => newSeenIds.add(item.id));
          const cappedSeenIds = newSeenIds.size > MAX_SEEN_IDS
            ? new Set(Array.from(newSeenIds).slice(-MAX_SEEN_IDS))
            : newSeenIds;

          set((state) => ({
            items: [...state.items, ...uniqueItems],
            seenIds: cappedSeenIds,
            cursor: next_cursor,
            hasMore: has_more,
            loading: false,
          }));
        } catch (err) {
          if (__DEV__) {
            console.error('Feed fetch error:', err);
          }
          let errorMessage = 'Something went wrong. Pull down to retry.';
          if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
            errorMessage = 'No internet connection. Pull down to retry.';
          }
          set({
            error: errorMessage,
            loading: false,
          });
        }
      },

      refresh: () => {
        // Keep seenIds for dedup across sessions, reset everything else
        set({
          items: [],
          cursor: null,
          hasMore: true,
          error: null,
        });
        // Fetch after state reset
        setTimeout(() => get().fetchFeed(), 0);
      },

      clearHistory: () => {
        // Full reset including seen history
        set({
          items: [],
          seenIds: new Set(),
          cursor: null,
          hasMore: true,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'feed-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist seenIds (as array for JSON serialization)
        seenIds: Array.from(state.seenIds).slice(-MAX_SEEN_IDS),
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted || {}),
        // Convert persisted array back to Set on rehydration
        seenIds: new Set(persisted?.seenIds || []),
      }),
    }
  )
);

export default useFeedStore;
