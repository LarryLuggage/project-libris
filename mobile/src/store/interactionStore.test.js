import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import axios from 'axios';
import useInteractionStore from './interactionStore';

jest.mock('axios');
jest.mock('expo-application', () => ({
  getInstallationIdAsync: jest.fn(),
}));

const resetStore = () => {
  useInteractionStore.setState({
    bookmarkedIds: [],
    likedIds: [],
    deviceId: null,
    initialized: false,
    lastError: null,
  });
};

describe('interactionStore', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    resetStore();
  });

  it('initializes device identity and syncs server state', async () => {
    Application.getInstallationIdAsync.mockResolvedValueOnce(
      'install-device-id-1234567890'
    );
    axios.get
      .mockResolvedValueOnce({ data: { page_ids: [1, 2] } })
      .mockResolvedValueOnce({ data: { page_ids: [3] } });

    await useInteractionStore.getState().initialize();

    expect(useInteractionStore.getState().deviceId).toBe(
      'install-device-id-1234567890'
    );
    expect(useInteractionStore.getState().bookmarkedIds).toEqual([1, 2]);
    expect(useInteractionStore.getState().likedIds).toEqual([3]);
    expect(useInteractionStore.getState().initialized).toBe(true);
  });

  it('persists fallback device IDs when installation ID is unavailable', async () => {
    Application.getInstallationIdAsync.mockRejectedValue(new Error('unavailable'));
    axios.get.mockResolvedValue({ data: { page_ids: [] } });

    await useInteractionStore.getState().initialize();
    const firstId = useInteractionStore.getState().deviceId;

    resetStore();
    await useInteractionStore.getState().initialize();

    expect(firstId).toMatch(/^fallback-/);
    expect(useInteractionStore.getState().deviceId).toBe(firstId);
  });

  it('applies optimistic bookmark updates and keeps them on success', async () => {
    useInteractionStore.setState({
      deviceId: 'test-device-id-1234567890',
      initialized: true,
    });
    axios.mockResolvedValueOnce({});

    await useInteractionStore.getState().toggleBookmark(42);

    expect(useInteractionStore.getState().bookmarkedIds).toEqual([42]);
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        headers: { 'X-Device-ID': 'test-device-id-1234567890' },
      })
    );
  });

  it('rolls back optimistic like updates on failure', async () => {
    useInteractionStore.setState({
      deviceId: 'test-device-id-1234567890',
      initialized: true,
      likedIds: [7],
    });
    axios.post.mockRejectedValueOnce({ code: 'ERR_NETWORK', message: 'Network Error' });

    await useInteractionStore.getState().toggleLike(7);

    expect(useInteractionStore.getState().likedIds).toEqual([7]);
    expect(useInteractionStore.getState().lastError).toBe(
      'No connection. Your like was not saved.'
    );
  });

  it('does not silently ignore interaction actions before initialization', async () => {
    await useInteractionStore.getState().toggleLike(99);

    expect(useInteractionStore.getState().lastError).toBe(
      'Still preparing your device. Please try again.'
    );
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('records feed events when initialized', async () => {
    useInteractionStore.setState({
      deviceId: 'test-device-id-1234567890',
      initialized: true,
    });
    axios.post.mockResolvedValueOnce({});

    await useInteractionStore.getState().recordEvent(5, 'seen');

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/interactions/events'),
      { page_id: 5, event_type: 'seen' },
      { headers: { 'X-Device-ID': 'test-device-id-1234567890' } }
    );
  });
});
