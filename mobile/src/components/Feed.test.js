import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import Feed from './Feed';
import useFeedStore from '../store/feedStore';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock('../store/feedStore');

describe('Feed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the initial loading state', () => {
    useFeedStore.mockReturnValue({
      items: [],
      loading: true,
      error: null,
      hasMore: true,
      fetchFeed: jest.fn(),
      refresh: jest.fn(),
    });

    const { getByTestId } = render(<Feed />);

    expect(getByTestId('loading-indicator')).toBeTruthy();
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
});
