import { create } from 'zustand';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import useInteractionStore from './interactionStore';

const useReviewStore = create((set, get) => ({
  reviewsByBook: {},
  loading: false,
  error: null,

  fetchReviews: async (bookId) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.reviews}`,
        { params: { book_id: bookId } }
      );
      set((state) => ({
        reviewsByBook: {
          ...state.reviewsByBook,
          [bookId]: response.data || [],
        },
        loading: false,
      }));
    } catch (err) {
      if (__DEV__) {
        console.error('Fetch reviews failed:', err.message);
      }
      set({
        error: 'Could not load reviews.',
        loading: false,
      });
    }
  },

  addReview: async (bookId, rating, reviewText) => {
    if (rating < 1 || rating > 5) return;

    const deviceId = useInteractionStore.getState().deviceId;
    const optimisticReview = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      book_id: bookId,
      rating,
      review_text: reviewText || '',
      username: 'You',
      created_at: new Date().toISOString(),
    };

    const previousReviews = get().reviewsByBook[bookId] || [];

    // Optimistic update
    set((state) => ({
      reviewsByBook: {
        ...state.reviewsByBook,
        [bookId]: [optimisticReview, ...previousReviews],
      },
    }));

    try {
      const response = await axios.post(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.reviews}`,
        { book_id: bookId, rating, review_text: reviewText },
        { headers: { 'X-Device-ID': deviceId } }
      );

      if (response.data) {
        set((state) => ({
          reviewsByBook: {
            ...state.reviewsByBook,
            [bookId]: state.reviewsByBook[bookId].map((r) =>
              r.id === optimisticReview.id ? response.data : r
            ),
          },
        }));
      }
    } catch (err) {
      if (__DEV__) {
        console.error('Post review failed:', err.message);
      }
      // Revert on failure
      set((state) => ({
        reviewsByBook: {
          ...state.reviewsByBook,
          [bookId]: previousReviews,
        },
        error: err.code === 'ERR_NETWORK'
          ? 'No connection. Review not saved.'
          : 'Could not save review.',
      }));
    }
  },

  clearError: () => set({ error: null }),
}));

export default useReviewStore;
