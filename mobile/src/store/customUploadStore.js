import { create } from 'zustand';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import useInteractionStore from './interactionStore';

const useCustomUploadStore = create((set) => ({
  uploading: false,
  uploadError: null,
  uploadSuccess: false,

  uploadCustomBook: async ({ title, author, contentText }) => {
    if (!title || !title.trim() || !author || !author.trim() || !contentText || !contentText.trim()) {
      set({ uploadError: 'All fields are required.' });
      return false;
    }

    set({ uploading: true, uploadError: null, uploadSuccess: false });
    const deviceId = useInteractionStore.getState().deviceId;

    try {
      await axios.post(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.upload}`,
        {
          title: title.trim(),
          author: author.trim(),
          content_text: contentText.trim(),
        },
        {
          headers: { 'X-Device-ID': deviceId },
        }
      );

      set({ uploading: false, uploadSuccess: true });
      return true;
    } catch (err) {
      if (__DEV__) {
        console.error('Custom book upload failed:', err.message);
      }
      set({
        uploading: false,
        uploadSuccess: false,
        uploadError: err.code === 'ERR_NETWORK'
          ? 'No connection. Upload failed.'
          : 'Could not upload book. Please try again.',
      });
      return false;
    }
  },

  resetUploadState: () => set({ uploading: false, uploadError: null, uploadSuccess: false }),
}));

export default useCustomUploadStore;
