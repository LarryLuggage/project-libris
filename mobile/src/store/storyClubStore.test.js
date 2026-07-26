import axios from 'axios';
import useStoryClubStore from './storyClubStore';

jest.mock('axios');
jest.mock('./interactionStore', () => ({
  getState: jest.fn(() => ({
    deviceId: 'test-device-id',
  })),
}));

const resetStore = () => {
  useStoryClubStore.setState({
    submitting: false,
    submitError: null,
    submitSuccess: false,
    lead: null,
  });
};

describe('storyClubStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it('validates required name and email before posting', async () => {
    const success = await useStoryClubStore.getState().joinWaitlist({
      name: '',
      email: '',
      role: 'reader',
      genrePreferences: [],
      willingToPay5: false,
    });

    expect(success).toBe(false);
    expect(useStoryClubStore.getState().submitError).toBe('Name and email are required.');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('posts normalized waitlist payload on success', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        id: 1,
        email: 'ada@example.com',
      },
    });

    const success = await useStoryClubStore.getState().joinWaitlist({
      name: ' Ada ',
      email: 'ADA@example.com',
      role: 'both',
      genrePreferences: ['Literary', 'Mystery'],
      willingToPay5: true,
    });

    expect(success).toBe(true);
    expect(useStoryClubStore.getState().submitSuccess).toBe(true);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/story-club/waitlist'),
      {
        name: 'Ada',
        email: 'ada@example.com',
        role: 'both',
        genre_preferences: ['Literary', 'Mystery'],
        willing_to_pay_5: true,
      },
      { headers: { 'X-Device-ID': 'test-device-id' } }
    );
  });

  it('sets submitError on network failure', async () => {
    axios.post.mockRejectedValueOnce({ code: 'ERR_NETWORK', message: 'Network Error' });

    const success = await useStoryClubStore.getState().joinWaitlist({
      name: 'Ada',
      email: 'ada@example.com',
      role: 'reader',
      genrePreferences: [],
      willingToPay5: false,
    });

    expect(success).toBe(false);
    expect(useStoryClubStore.getState().submitSuccess).toBe(false);
    expect(useStoryClubStore.getState().submitError).toBe('No connection. Try again later.');
  });
});
