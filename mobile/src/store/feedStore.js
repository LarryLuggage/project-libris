import { create } from 'zustand';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

const useFeedStore = create((set, get) => ({
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

      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.feed}?${params}`;
      console.log('Fetching feed from:', url);

      const response = await axios.get(url);
      const { items: newItems, next_cursor, has_more } = response.data;

      // Filter any duplicates client-side (belt and suspenders)
      const uniqueItems = newItems.filter((item) => !seenIds.has(item.id));

      // Update seen IDs
      const newSeenIds = new Set(seenIds);
      uniqueItems.forEach((item) => newSeenIds.add(item.id));

      set((state) => ({
        items: [...state.items, ...uniqueItems],
        seenIds: newSeenIds,
        cursor: next_cursor,
        hasMore: has_more,
        loading: false,
      }));
    } catch (err) {
      console.error('Feed fetch error:', err);
      set({
        error: err.message || 'Failed to load feed',
        loading: false,
      });
    }
  },

  refresh: () => {
    // Reset state and refetch
    set({
      items: [],
      seenIds: new Set(),
      cursor: null,
      hasMore: true,
      error: null,
    });
    // Fetch after state reset
    setTimeout(() => get().fetchFeed(), 0);
  },

  clearError: () => set({ error: null }),
}));

export default useFeedStore;
