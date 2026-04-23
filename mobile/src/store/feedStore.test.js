import axios from 'axios';
import useFeedStore from './feedStore';
import useInteractionStore from './interactionStore';

jest.mock('axios');
jest.mock('expo-application', () => ({
  getInstallationIdAsync: jest.fn(),
}));

const resetStores = () => {
  useFeedStore.setState({
    items: [],
    seenIds: new Set(),
    cursor: null,
    hasMore: true,
    loading: false,
    error: null,
  });
  useInteractionStore.setState({
    bookmarkedIds: [],
    likedIds: [],
    deviceId: 'test-device-id-1234567890',
    initialized: true,
    lastError: null,
  });
};

describe('feedStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStores();
  });

  it('loads feed items with device header and deduplicates seen IDs', async () => {
    useFeedStore.setState({ seenIds: new Set([1]) });
    axios.get.mockResolvedValueOnce({
      data: {
        items: [
          { id: 1, title: 'Seen' },
          { id: 2, title: 'Fresh' },
        ],
        next_cursor: 'cursor-2',
        has_more: true,
      },
    });

    await useFeedStore.getState().fetchFeed();

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/feed?exclude=1'),
      { headers: { 'X-Device-ID': 'test-device-id-1234567890' } }
    );
    expect(useFeedStore.getState().items).toEqual([{ id: 2, title: 'Fresh' }]);
    expect(useFeedStore.getState().cursor).toBe('cursor-2');
    expect(useFeedStore.getState().seenIds.has(2)).toBe(true);
  });

  it('sets a network-specific error when fetching fails', async () => {
    axios.get.mockRejectedValueOnce({ code: 'ERR_NETWORK' });

    await useFeedStore.getState().fetchFeed();

    expect(useFeedStore.getState().loading).toBe(false);
    expect(useFeedStore.getState().error).toBe(
      'No internet connection. Pull down to retry.'
    );
  });

  it('refreshes items while preserving seen history', async () => {
    jest.useFakeTimers();
    useFeedStore.setState({
      items: [{ id: 10 }],
      seenIds: new Set([10]),
      cursor: 'old-cursor',
      hasMore: false,
    });
    axios.get.mockResolvedValueOnce({
      data: {
        items: [{ id: 11, title: 'New' }],
        next_cursor: null,
        has_more: false,
      },
    });

    useFeedStore.getState().refresh();
    expect(useFeedStore.getState().items).toEqual([]);
    expect(useFeedStore.getState().seenIds.has(10)).toBe(true);

    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();

    expect(useFeedStore.getState().items).toEqual([{ id: 11, title: 'New' }]);
    jest.useRealTimers();
  });
});
