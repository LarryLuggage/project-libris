import { create } from 'zustand';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import useInteractionStore from './interactionStore';

const useStoryClubStore = create((set) => ({
  submitting: false,
  submitError: null,
  submitSuccess: false,
  lead: null,

  joinWaitlist: async ({
    name,
    email,
    role,
    genrePreferences,
    willingToPay5,
  }) => {
    if (!name?.trim() || !email?.trim()) {
      set({ submitError: 'Name and email are required.' });
      return false;
    }

    if (!email.includes('@')) {
      set({ submitError: 'Enter a valid email address.' });
      return false;
    }

    set({ submitting: true, submitError: null, submitSuccess: false });
    const deviceId = useInteractionStore.getState().deviceId;

    try {
      const response = await axios.post(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.storyClubWaitlist}`,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          genre_preferences: genrePreferences,
          willing_to_pay_5: willingToPay5,
        },
        {
          headers: { 'X-Device-ID': deviceId },
        }
      );

      set({
        submitting: false,
        submitSuccess: true,
        lead: response.data,
      });
      return true;
    } catch (err) {
      if (__DEV__) {
        console.error('Story Club waitlist signup failed:', err.message);
      }
      set({
        submitting: false,
        submitSuccess: false,
        submitError: err.code === 'ERR_NETWORK'
          ? 'No connection. Try again later.'
          : 'Could not join the pilot list. Please try again.',
      });
      return false;
    }
  },

  resetStoryClubState: () => set({
    submitting: false,
    submitError: null,
    submitSuccess: false,
    lead: null,
  }),
}));

export default useStoryClubStore;
