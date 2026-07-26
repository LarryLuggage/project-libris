import { create } from 'zustand';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import useInteractionStore from './interactionStore';

const useCommentStore = create((set, get) => ({
  commentsByPage: {},
  loading: false,
  error: null,

  fetchComments: async (pageId) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}`,
        { params: { page_id: pageId } }
      );
      set((state) => ({
        commentsByPage: {
          ...state.commentsByPage,
          [pageId]: response.data || [],
        },
        loading: false,
      }));
    } catch (err) {
      if (__DEV__) {
        console.error('Fetch comments failed:', err.message);
      }
      set({
        error: 'Could not load comments.',
        loading: false,
      });
    }
  },

  addComment: async (pageId, commentText) => {
    if (!commentText || !commentText.trim()) return;

    const deviceId = useInteractionStore.getState().deviceId;
    const optimisticComment = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      page_id: pageId,
      comment_text: commentText,
      username: 'You',
      created_at: new Date().toISOString(),
    };

    const previousComments = get().commentsByPage[pageId] || [];

    // Optimistic update
    set((state) => ({
      commentsByPage: {
        ...state.commentsByPage,
        [pageId]: [optimisticComment, ...previousComments],
      },
    }));

    try {
      const response = await axios.post(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}`,
        { page_id: pageId, comment_text: commentText },
        { headers: { 'X-Device-ID': deviceId } }
      );

      if (response.data) {
        set((state) => ({
          commentsByPage: {
            ...state.commentsByPage,
            [pageId]: state.commentsByPage[pageId].map((c) =>
              c.id === optimisticComment.id ? response.data : c
            ),
          },
        }));
      }
    } catch (err) {
      if (__DEV__) {
        console.error('Post comment failed:', err.message);
      }
      // Revert on failure
      set((state) => ({
        commentsByPage: {
          ...state.commentsByPage,
          [pageId]: previousComments,
        },
        error: err.code === 'ERR_NETWORK'
          ? 'No connection. Comment not saved.'
          : 'Could not save comment.',
      }));
    }
  },

  clearError: () => set({ error: null }),
}));

export default useCommentStore;
