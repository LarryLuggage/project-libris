import axios from 'axios';
import useCustomUploadStore from './customUploadStore';
import useInteractionStore from './interactionStore';

jest.mock('axios');
jest.mock('./interactionStore', () => ({
  getState: jest.fn(() => ({
    deviceId: 'test-device-id',
  })),
}));

const resetStore = () => {
  useCustomUploadStore.setState({
    uploading: false,
    uploadError: null,
    uploadSuccess: false,
  });
};

describe('customUploadStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it('validates empty input immediately', async () => {
    const success = await useCustomUploadStore.getState().uploadCustomBook({
      title: '',
      author: 'Jane',
      contentText: 'Some content',
    });

    expect(success).toBe(false);
    expect(useCustomUploadStore.getState().uploadError).toBe('All fields are required.');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('sets uploadSuccess to true on API success', async () => {
    axios.post.mockResolvedValueOnce({ data: { status: 'success' } });

    const success = await useCustomUploadStore.getState().uploadCustomBook({
      title: 'Title',
      author: 'Author',
      contentText: 'Content text',
    });

    expect(success).toBe(true);
    expect(useCustomUploadStore.getState().uploadSuccess).toBe(true);
    expect(useCustomUploadStore.getState().uploading).toBe(false);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/books/custom'),
      {
        title: 'Title',
        author: 'Author',
        content_text: 'Content text',
      },
      { headers: { 'X-Device-ID': 'test-device-id' } }
    );
  });

  it('sets uploadError on API failure', async () => {
    axios.post.mockRejectedValueOnce({ code: 'ERR_NETWORK', message: 'Network Error' });

    const success = await useCustomUploadStore.getState().uploadCustomBook({
      title: 'Title',
      author: 'Author',
      contentText: 'Content text',
    });

    expect(success).toBe(false);
    expect(useCustomUploadStore.getState().uploadSuccess).toBe(false);
    expect(useCustomUploadStore.getState().uploadError).toBe('No connection. Upload failed.');
  });
});
