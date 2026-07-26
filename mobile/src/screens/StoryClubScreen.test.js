import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import StoryClubScreen from './StoryClubScreen';
import useStoryClubStore from '../store/storyClubStore';

jest.mock('../store/storyClubStore');

const mockStoryClubStore = {
  joinWaitlist: jest.fn(),
  submitting: false,
  submitError: null,
  submitSuccess: false,
  resetStoryClubState: jest.fn(),
};

describe('StoryClubScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStoryClubStore.mockReturnValue(mockStoryClubStore);
  });

  it('renders the waitlist form', () => {
    const { getByText, getByTestId } = render(
      <StoryClubScreen navigation={{ goBack: jest.fn() }} />
    );

    expect(getByText('STORY CLUB PILOT')).toBeTruthy();
    expect(getByTestId('story-club-name-input')).toBeTruthy();
    expect(getByTestId('story-club-email-input')).toBeTruthy();
    expect(getByTestId('story-club-submit-button')).toBeTruthy();
  });

  it('shows validation error when name is empty', () => {
    const { getByText, getByTestId } = render(
      <StoryClubScreen navigation={{ goBack: jest.fn() }} />
    );

    fireEvent.press(getByTestId('story-club-submit-button'));

    expect(getByText('Name is required.')).toBeTruthy();
    expect(mockStoryClubStore.joinWaitlist).not.toHaveBeenCalled();
  });

  it('submits the pilot waitlist form', async () => {
    mockStoryClubStore.joinWaitlist.mockResolvedValueOnce(true);

    const { getByTestId } = render(
      <StoryClubScreen navigation={{ goBack: jest.fn() }} />
    );

    fireEvent.changeText(getByTestId('story-club-name-input'), 'Ada Reader');
    fireEvent.changeText(getByTestId('story-club-email-input'), 'ada@example.com');
    fireEvent.press(getByTestId('story-club-role-both'));
    fireEvent.changeText(getByTestId('story-club-genres-input'), 'Literary, Mystery');
    fireEvent.press(getByTestId('story-club-wtp-checkbox'));
    fireEvent.press(getByTestId('story-club-submit-button'));

    expect(mockStoryClubStore.joinWaitlist).toHaveBeenCalledWith({
      name: 'Ada Reader',
      email: 'ada@example.com',
      role: 'both',
      genrePreferences: ['Literary', 'Mystery'],
      willingToPay5: true,
    });
  });
});
