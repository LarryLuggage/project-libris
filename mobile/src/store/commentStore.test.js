import axios from 'axios';
import useCommentStore from './commentStore';
import useInteractionStore from './interactionStore';

jest.mock('axios');
jest.mock('./interactionStore', () => ({
  getState: jest.fn(() => ({
    deviceId: 'test-device-id',
  })),
}));

const resetStore = () => {
  useCommentStore.setState({
    commentsByPage: {},
    loading: false,
    error: null,
  });
};

describe('commentStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it('fetches comments for a page and updates state', async () => {
    const mockComments = [
      { id: 1, page_id: 10, comment_text: 'First comment', username: 'User1', created_at: '2026-06-06T18:00:00Z' },
    ];
    axios.get.mockResolvedValueOnce({ data: mockComments });

    await useCommentStore.getState().fetchComments(10);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/comments'),
      expect.objectContaining({ params: { page_id: 10 } })
    );
    expect(useCommentStore.getState().commentsByPage[10]).toEqual(mockComments);
    expect(useCommentStore.getState().loading).toBe(false);
  });

  it('sets error on comments fetch failure', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    await useCommentStore.getState().fetchComments(10);

    expect(useCommentStore.getState().error).toBe('Could not load comments.');
    expect(useCommentStore.getState().loading).toBe(false);
  });

  it('adds comment optimistically and updates on success', async () => {
    const initialComments = [
      { id: 1, page_id: 10, comment_text: 'Old comment', username: 'User1', created_at: '2026-06-06T18:00:00Z' },
    ];
    useCommentStore.setState({
      commentsByPage: { 10: initialComments },
    });

    const newCommentResponse = {
      id: 2,
      page_id: 10,
      comment_text: 'New comment text',
      username: 'You',
      created_at: '2026-06-06T18:10:00Z',
    };
    axios.post.mockResolvedValueOnce({ data: newCommentResponse });

    await useCommentStore.getState().addComment(10, 'New comment text');

    // Verification of optimistic comment presence
    expect(useCommentStore.getState().commentsByPage[10].length).toBe(2);
    expect(useCommentStore.getState().commentsByPage[10][0].comment_text).toBe('New comment text');

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/comments'),
      { page_id: 10, comment_text: 'New comment text' },
      { headers: { 'X-Device-ID': 'test-device-id' } }
    );

    // After success, optimistic comment should be replaced by backend comment
    expect(useCommentStore.getState().commentsByPage[10][0]).toEqual(newCommentResponse);
  });

  it('rolls back optimistic comment update on failure', async () => {
    const initialComments = [
      { id: 1, page_id: 10, comment_text: 'Old comment', username: 'User1', created_at: '2026-06-06T18:00:00Z' },
    ];
    useCommentStore.setState({
      commentsByPage: { 10: initialComments },
    });

    axios.post.mockRejectedValueOnce({ code: 'ERR_NETWORK', message: 'Network Error' });

    await useCommentStore.getState().addComment(10, 'Failed comment');

    // Check rollback
    expect(useCommentStore.getState().commentsByPage[10]).toEqual(initialComments);
    expect(useCommentStore.getState().error).toBe('No connection. Comment not saved.');
  });
});
