import axios from 'axios';
import useReviewStore from './reviewStore';
import useInteractionStore from './interactionStore';

jest.mock('axios');
jest.mock('./interactionStore', () => ({
  getState: jest.fn(() => ({
    deviceId: 'test-device-id',
  })),
}));

const resetStore = () => {
  useReviewStore.setState({
    reviewsByBook: {},
    loading: false,
    error: null,
  });
};

describe('reviewStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it('fetches reviews for a book and updates state', async () => {
    const mockReviews = [
      { id: 1, book_id: 5, rating: 4, review_text: 'Good book', username: 'User1', created_at: '2026-06-06T18:00:00Z' },
    ];
    axios.get.mockResolvedValueOnce({ data: mockReviews });

    await useReviewStore.getState().fetchReviews(5);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/reviews'),
      expect.objectContaining({ params: { book_id: 5 } })
    );
    expect(useReviewStore.getState().reviewsByBook[5]).toEqual(mockReviews);
    expect(useReviewStore.getState().loading).toBe(false);
  });

  it('sets error on reviews fetch failure', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    await useReviewStore.getState().fetchReviews(5);

    expect(useReviewStore.getState().error).toBe('Could not load reviews.');
    expect(useReviewStore.getState().loading).toBe(false);
  });

  it('adds review optimistically and updates on success', async () => {
    const initialReviews = [
      { id: 1, book_id: 5, rating: 4, review_text: 'Good book', username: 'User1', created_at: '2026-06-06T18:00:00Z' },
    ];
    useReviewStore.setState({
      reviewsByBook: { 5: initialReviews },
    });

    const newReviewResponse = {
      id: 2,
      book_id: 5,
      rating: 5,
      review_text: 'Fantastic review',
      username: 'You',
      created_at: '2026-06-06T18:10:00Z',
    };
    axios.post.mockResolvedValueOnce({ data: newReviewResponse });

    await useReviewStore.getState().addReview(5, 5, 'Fantastic review');

    // Verification of optimistic review presence
    expect(useReviewStore.getState().reviewsByBook[5].length).toBe(2);
    expect(useReviewStore.getState().reviewsByBook[5][0].rating).toBe(5);
    expect(useReviewStore.getState().reviewsByBook[5][0].review_text).toBe('Fantastic review');

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/reviews'),
      { book_id: 5, rating: 5, review_text: 'Fantastic review' },
      { headers: { 'X-Device-ID': 'test-device-id' } }
    );

    // After success, optimistic review should be replaced by backend review
    expect(useReviewStore.getState().reviewsByBook[5][0]).toEqual(newReviewResponse);
  });

  it('rolls back optimistic review update on failure', async () => {
    const initialReviews = [
      { id: 1, book_id: 5, rating: 4, review_text: 'Good book', username: 'User1', created_at: '2026-06-06T18:00:00Z' },
    ];
    useReviewStore.setState({
      reviewsByBook: { 5: initialReviews },
    });

    axios.post.mockRejectedValueOnce({ code: 'ERR_NETWORK', message: 'Network Error' });

    await useReviewStore.getState().addReview(5, 3, 'Average book');

    // Check rollback
    expect(useReviewStore.getState().reviewsByBook[5]).toEqual(initialReviews);
    expect(useReviewStore.getState().error).toBe('No connection. Review not saved.');
  });
});
