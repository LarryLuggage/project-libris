import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useOnboardingStore = create(
  persist(
    (set) => ({
      // State
      onboardingCompleted: false,
      selectedTheme: 'cream',
      favoriteGenres: [],
      preferredVibes: [],

      // Actions
      completeOnboarding: () => set({ onboardingCompleted: true }),
      
      setTheme: (themeName) => set({ selectedTheme: themeName }),
      
      toggleGenre: (genre) => set((state) => {
        const favoriteGenres = state.favoriteGenres.includes(genre)
          ? state.favoriteGenres.filter((g) => g !== genre)
          : [...state.favoriteGenres, genre];
        return { favoriteGenres };
      }),
      
      toggleVibe: (vibe) => set((state) => {
        const preferredVibes = state.preferredVibes.includes(vibe)
          ? state.preferredVibes.filter((v) => v !== vibe)
          : [...state.preferredVibes, vibe];
        return { preferredVibes };
      }),
      
      resetOnboarding: () => set({
        onboardingCompleted: false,
        selectedTheme: 'cream',
        favoriteGenres: [],
        preferredVibes: [],
      }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useOnboardingStore;
