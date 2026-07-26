import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import FeedItem from './FeedItem';
import useInteractionStore from '../store/interactionStore';
import useAuthStore from '../store/authStore';
import useCommentStore from '../store/commentStore';

jest.mock('../store/interactionStore');
jest.mock('../store/authStore');
jest.mock('../store/commentStore');

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

const mockAuthStore = {
  token: null,
};

const mockCommentStore = {
  commentsByPage: {},
  fetchComments: jest.fn(),
  addComment: jest.fn(),
  loading: false,
  error: null,
};

describe('FeedItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.mockImplementation((selector) => {
      const state = { token: mockAuthStore.token };
      return selector ? selector(state) : state;
    });
    useCommentStore.mockImplementation((selector) => {
      return selector ? selector(mockCommentStore) : mockCommentStore;
    });
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

  it('shows comment input when user is authenticated', () => {
    useInteractionStore.mockReturnValue(baseStore);
    mockAuthStore.token = 'valid-token';

    const { getByTestId, queryByTestId } = render(
      <FeedItem item={item} navigation={{ navigate: jest.fn() }} />
    );

    // Open drawer
    fireEvent.press(getByTestId('comment-button'));

    expect(getByTestId('comments-drawer')).toBeTruthy();
    expect(getByTestId('comment-input')).toBeTruthy();
    expect(queryByTestId('login-cta-container')).toBeNull();
  });

  it('shows login CTA and hides comment input when user is unauthenticated', () => {
    useInteractionStore.mockReturnValue(baseStore);
    mockAuthStore.token = null;

    const { getByTestId, queryByTestId } = render(
      <FeedItem item={item} navigation={{ navigate: jest.fn() }} />
    );

    // Open drawer
    fireEvent.press(getByTestId('comment-button'));

    expect(getByTestId('comments-drawer')).toBeTruthy();
    expect(queryByTestId('comment-input')).toBeNull();
    expect(getByTestId('login-cta-container')).toBeTruthy();
  });
});
