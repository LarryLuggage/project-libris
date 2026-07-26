import React from 'react';
import { fireEvent, render, act } from '@testing-library/react-native';
import OnboardingScreen from './OnboardingScreen';
import useOnboardingStore from '../store/onboardingStore';

jest.mock('../store/onboardingStore');

const mockStore = {
  selectedTheme: 'cream',
  favoriteGenres: [],
  preferredVibes: [],
  setTheme: jest.fn(),
  toggleGenre: jest.fn(),
  toggleVibe: jest.fn(),
  completeOnboarding: jest.fn(),
};

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingStore.mockReturnValue(mockStore);
  });

  it('renders step 0 (Theme selection) first', () => {
    const { getByText, getByTestId } = render(<OnboardingScreen />);

    expect(getByText('Choose Your Aesthetic')).toBeTruthy();
    expect(getByText('Customize the look and feel of your reading experience.')).toBeTruthy();
    expect(getByTestId('theme-option-cream')).toBeTruthy();
    expect(getByTestId('theme-option-obsidian')).toBeTruthy();
  });

  it('allows changing theme in step 0', () => {
    const { getByTestId } = render(<OnboardingScreen />);

    fireEvent.press(getByTestId('theme-option-obsidian'));
    expect(mockStore.setTheme).toHaveBeenCalledWith('obsidian');
  });

  it('proceeds through steps and completes onboarding', () => {
    jest.useFakeTimers();
    const { getByTestId, getByText } = render(<OnboardingScreen />);

    // Step 0 -> Step 1
    fireEvent.press(getByTestId('next-button'));
    
    // Advance timers so Animated.timing callback fires (wrapped in act)
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(getByText('Favorite Genres')).toBeTruthy();

    // Select a genre
    fireEvent.press(getByTestId('genre-option-Fiction'));
    expect(mockStore.toggleGenre).toHaveBeenCalledWith('Fiction');

    // Step 1 -> Step 2
    fireEvent.press(getByTestId('next-button'));
    act(() => {
      jest.runOnlyPendingTimers();
    });
    
    expect(getByText('Choose Your Mood')).toBeTruthy();

    // Select a vibe
    fireEvent.press(getByTestId('vibe-option-Thoughtful'));
    expect(mockStore.toggleVibe).toHaveBeenCalledWith('Thoughtful');

    // Step 2 -> Complete
    fireEvent.press(getByTestId('next-button'));
    expect(mockStore.completeOnboarding).toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  it('allows skipping onboarding directly', () => {
    const { getByTestId } = render(<OnboardingScreen />);

    fireEvent.press(getByTestId('skip-button'));
    expect(mockStore.completeOnboarding).toHaveBeenCalled();
  });
});
