import useOnboardingStore from './onboardingStore';

const resetOnboardingStore = () => {
  useOnboardingStore.setState({
    onboardingCompleted: false,
    selectedTheme: 'cream',
    favoriteGenres: [],
    preferredVibes: [],
  });
};

describe('onboardingStore', () => {
  beforeEach(() => {
    resetOnboardingStore();
  });

  it('initializes with default values', () => {
    const state = useOnboardingStore.getState();
    expect(state.onboardingCompleted).toBe(false);
    expect(state.selectedTheme).toBe('cream');
    expect(state.favoriteGenres).toEqual([]);
    expect(state.preferredVibes).toEqual([]);
  });

  it('completes onboarding', () => {
    useOnboardingStore.getState().completeOnboarding();
    expect(useOnboardingStore.getState().onboardingCompleted).toBe(true);
  });

  it('sets the active theme', () => {
    useOnboardingStore.getState().setTheme('obsidian');
    expect(useOnboardingStore.getState().selectedTheme).toBe('obsidian');
  });

  it('toggles favorite genres', () => {
    const store = useOnboardingStore.getState();
    
    // Add genre
    store.toggleGenre('Fiction');
    expect(useOnboardingStore.getState().favoriteGenres).toEqual(['Fiction']);
    
    // Add another genre
    useOnboardingStore.getState().toggleGenre('Poetry');
    expect(useOnboardingStore.getState().favoriteGenres).toEqual(['Fiction', 'Poetry']);
    
    // Remove first genre
    useOnboardingStore.getState().toggleGenre('Fiction');
    expect(useOnboardingStore.getState().favoriteGenres).toEqual(['Poetry']);
  });

  it('toggles preferred vibes', () => {
    const store = useOnboardingStore.getState();
    
    // Add vibe
    store.toggleVibe('Thoughtful');
    expect(useOnboardingStore.getState().preferredVibes).toEqual(['Thoughtful']);
    
    // Remove vibe
    useOnboardingStore.getState().toggleVibe('Thoughtful');
    expect(useOnboardingStore.getState().preferredVibes).toEqual([]);
  });

  it('resets onboarding state', () => {
    useOnboardingStore.setState({
      onboardingCompleted: true,
      selectedTheme: 'emerald',
      favoriteGenres: ['Philosophy'],
      preferredVibes: ['Adventurous'],
    });

    useOnboardingStore.getState().resetOnboarding();
    
    const state = useOnboardingStore.getState();
    expect(state.onboardingCompleted).toBe(false);
    expect(state.selectedTheme).toBe('cream');
    expect(state.favoriteGenres).toEqual([]);
    expect(state.preferredVibes).toEqual([]);
  });
});
