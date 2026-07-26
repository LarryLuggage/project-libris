import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import Feed from './Feed';
import useFeedStore from '../store/feedStore';
import useOnboardingStore from '../store/onboardingStore';
import useAuthStore from '../store/authStore';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock('../store/feedStore');
jest.mock('../store/onboardingStore');
jest.mock('../store/authStore');

const mockOnboardingStore = {
  selectedTheme: 'cream',
  setTheme: jest.fn(),
  resetOnboarding: jest.fn(),
};

const mockAuthStore = {
  token: null,
  logout: jest.fn(),
};

describe('Feed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingStore.mockReturnValue(mockOnboardingStore);
    useAuthStore.mockReturnValue(mockAuthStore);
    mockAuthStore.token = null;
  });

  it('renders the initial loading state (skeleton)', () => {
    useFeedStore.mockReturnValue({
      items: [],
      loading: true,
      error: null,
      hasMore: true,
      fetchFeed: jest.fn(),
      refresh: jest.fn(),
    });

    const { getByTestId } = render(<Feed />);

    expect(getByTestId('feed-item-skeleton')).toBeTruthy();
  });

  it('renders an error state and retries', () => {
    const refresh = jest.fn();
    useFeedStore.mockReturnValue({
      items: [],
      loading: false,
      error: 'No internet connection. Pull down to retry.',
      hasMore: true,
      fetchFeed: jest.fn(),
      refresh,
    });

    const { getByText, getByTestId } = render(<Feed />);
    fireEvent.press(getByTestId('retry-button'));

    expect(getByText('No internet connection. Pull down to retry.')).toBeTruthy();
    expect(refresh).toHaveBeenCalled();
  });

  it('navigates to AuthScreen when clicking profile icon if not logged in', () => {
    useFeedStore.mockReturnValue({
      items: [{ id: 1, title: 'Item', author: 'Author', content_text: 'Text', page_number: 1 }],
      loading: false,
      error: null,
      hasMore: false,
      fetchFeed: jest.fn(),
      refresh: jest.fn(),
    });

    mockAuthStore.token = null;

    const { getByTestId } = render(<Feed />);
    fireEvent.press(getByTestId('auth-button'));

    expect(mockNavigate).toHaveBeenCalledWith('Auth');
  });

  it('logs out when clicking exit icon if logged in', () => {
    useFeedStore.mockReturnValue({
      items: [{ id: 1, title: 'Item', author: 'Author', content_text: 'Text', page_number: 1 }],
      loading: false,
      error: null,
      hasMore: false,
      fetchFeed: jest.fn(),
      refresh: jest.fn(),
    });

    mockAuthStore.token = 'existing-token';

    const { getByTestId } = render(<Feed />);
    fireEvent.press(getByTestId('auth-button'));

    expect(mockAuthStore.logout).toHaveBeenCalled();
  });

  it('navigates to CustomUpload when clicking upload button if logged in', () => {
    useFeedStore.mockReturnValue({
      items: [{ id: 1, title: 'Item', author: 'Author', content_text: 'Text', page_number: 1 }],
      loading: false,
      error: null,
      hasMore: false,
      fetchFeed: jest.fn(),
      refresh: jest.fn(),
    });
    mockAuthStore.token = 'existing-token';

    const { getByTestId } = render(<Feed />);
    fireEvent.press(getByTestId('upload-button'));

    expect(mockNavigate).toHaveBeenCalledWith('CustomUpload');
  });

  it('navigates to StoryClub when clicking story club button', () => {
    useFeedStore.mockReturnValue({
      items: [{ id: 1, title: 'Item', author: 'Author', content_text: 'Text', page_number: 1 }],
      loading: false,
      error: null,
      hasMore: false,
      fetchFeed: jest.fn(),
      refresh: jest.fn(),
    });

    const { getByTestId } = render(<Feed />);
    fireEvent.press(getByTestId('story-club-button'));

    expect(mockNavigate).toHaveBeenCalledWith('StoryClub');
  });

  it('navigates to AuthScreen when clicking upload button if not logged in', () => {
    useFeedStore.mockReturnValue({
      items: [{ id: 1, title: 'Item', author: 'Author', content_text: 'Text', page_number: 1 }],
      loading: false,
      error: null,
      hasMore: false,
      fetchFeed: jest.fn(),
      refresh: jest.fn(),
    });
    mockAuthStore.token = null;

    const { getByTestId } = render(<Feed />);
    fireEvent.press(getByTestId('upload-button'));

    expect(mockNavigate).toHaveBeenCalledWith('Auth');
  });
});
