import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import FeedItem from './FeedItem';
import useInteractionStore from '../store/interactionStore';

jest.mock('../store/interactionStore');

const item = {
  id: 1,
  book_id: 10,
  title: 'Test Book',
  author: 'Test Author',
  page_number: 2,
  content_text: 'A readable excerpt for testing.',
};

const baseStore = {
  initialized: true,
  toggleBookmark: jest.fn(),
  toggleLike: jest.fn(),
  recordEvent: jest.fn(),
  isBookmarked: jest.fn(() => false),
  isLiked: jest.fn(() => false),
  lastError: null,
  clearLastError: jest.fn(),
};

describe('FeedItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records a seen event and handles like/bookmark presses', () => {
    useInteractionStore.mockReturnValue(baseStore);

    const { getByTestId } = render(
      <FeedItem item={item} navigation={{ navigate: jest.fn() }} />
    );
    fireEvent.press(getByTestId('like-button'));
    fireEvent.press(getByTestId('bookmark-button'));

    expect(baseStore.recordEvent).toHaveBeenCalledWith(1, 'seen');
    expect(baseStore.toggleLike).toHaveBeenCalledWith(1);
    expect(baseStore.toggleBookmark).toHaveBeenCalledWith(1);
  });

  it('disables interaction buttons before initialization', () => {
    const store = {
      ...baseStore,
      initialized: false,
    };
    useInteractionStore.mockReturnValue(store);

    const { getByTestId } = render(
      <FeedItem item={item} navigation={{ navigate: jest.fn() }} />
    );
    fireEvent.press(getByTestId('like-button'));
    fireEvent.press(getByTestId('bookmark-button'));

    expect(store.recordEvent).not.toHaveBeenCalled();
    expect(store.toggleLike).not.toHaveBeenCalled();
    expect(store.toggleBookmark).not.toHaveBeenCalled();
  });
});
