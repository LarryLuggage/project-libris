import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Dimensions,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import useOnboardingStore from '../store/onboardingStore';
import useReviewStore from '../store/reviewStore';
import useAuthStore from '../store/authStore';
import { getTheme } from '../config/theme';

const { width } = Dimensions.get('window');

export default function BookDetailScreen({ route, navigation }) {
  const { bookId } = route.params;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coverError, setCoverError] = useState(false);

  const selectedTheme = useOnboardingStore((state) => state.selectedTheme);
  const theme = getTheme(selectedTheme);

  useEffect(() => {
    fetchBookDetail();
  }, [bookId]);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const {
    reviewsByBook,
    fetchReviews,
    addReview,
    loading: reviewsLoading,
    error: reviewsError,
  } = useReviewStore();

  const token = useAuthStore((state) => state.token);

  const reviews = reviewsByBook[bookId] || [];

  useEffect(() => {
    fetchReviews(bookId);
  }, [bookId]);

  const handleSubmitReview = () => {
    if (rating === 0) {
      return;
    }
    addReview(bookId, rating, reviewText);
    setRating(0);
    setReviewText('');
  };

  const fetchBookDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.books}/${bookId}`
      );
      setBook(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load book details');
      console.error('Error fetching book:', err);
    } finally {
      setLoading(false);
    }
  };

  const openLink = (url) => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error || !book) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
          {error || 'Book not found'}
        </Text>
        <TouchableOpacity 
          onPress={fetchBookDetail} 
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
        >
          <Text style={[styles.retryText, { color: theme.background, fontFamily: 'Inter_600SemiBold' }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      showsVerticalScrollIndicator={false}
    >
      {/* Decorative blurred background effect */}
      <View style={[styles.backdrop, { backgroundColor: theme.primary, opacity: 0.05 }]} />

      {/* Header with cover */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <View style={styles.coverWrapper}>
          {book.cover_url && !coverError ? (
            <Image
              source={{ uri: book.cover_url }}
              style={styles.coverImage}
              contentFit="cover"
              onError={() => setCoverError(true)}
            />
          ) : (
            <View style={[styles.coverImage, styles.placeholderCover, { backgroundColor: theme.border }]}>
              <Ionicons name="book" size={60} color={theme.primary} />
            </View>
          )}
        </View>

        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: theme.text, fontFamily: 'PlayfairDisplay_700Bold' }]}>
            {book.title}
          </Text>
          <Text style={[styles.author, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            by {book.author}
          </Text>
          
          <View style={styles.statsRow}>
            <View style={[styles.stat, { backgroundColor: theme.border }]}>
              <Text style={[styles.statValue, { color: theme.primary, fontFamily: 'Inter_700Bold' }]}>
                {book.page_count}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
                Excerpts
              </Text>
            </View>
            <View style={[styles.stat, { backgroundColor: theme.border }]}>
              <Text style={[styles.statValue, { color: theme.primary, fontFamily: 'Inter_700Bold' }]}>
                {book.high_vibe_count}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
                Top Picks
              </Text>
            </View>
            <View style={[styles.stat, { backgroundColor: theme.border }]}>
              <Text style={[styles.statValue, { color: theme.primary, fontFamily: 'Inter_700Bold' }]}>
                {(book.avg_vibe_score * 100).toFixed(0)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
                Vibe
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
          onPress={() => openLink(book.gutenberg_url)}
        >
          <Ionicons name="book-outline" size={18} color={theme.background} />
          <Text style={[styles.primaryButtonText, { color: theme.background, fontFamily: 'Inter_600SemiBold' }]}>
            Read Free
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => openLink(book.amazon_search_url)}
        >
          <Ionicons name="cart-outline" size={18} color={theme.primary} />
          <Text style={[styles.actionButtonText, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
            Amazon
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => openLink(book.goodreads_search_url)}
        >
          <Ionicons name="star-outline" size={18} color={theme.primary} />
          <Text style={[styles.actionButtonText, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
            Reviews
          </Text>
        </TouchableOpacity>
      </View>

      {/* Top excerpts Horizontal Slider */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
          Top Excerpts
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
          decelerationRate="fast"
          snapToInterval={width * 0.82 + 16}
          snapToAlignment="start"
        >
          {book.top_excerpts.map((excerpt, index) => (
            <View 
              key={excerpt.id} 
              style={[styles.excerptCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            >
              <View style={styles.excerptHeader}>
                <Text style={[styles.excerptNumber, { color: theme.primary, fontFamily: 'Inter_700Bold' }]}>
                  EXCERPT #{index + 1}
                </Text>
                <View style={[styles.vibeTag, { backgroundColor: theme.border }]}>
                  <Ionicons name="sparkles" size={12} color="#FFD700" />
                  <Text style={[styles.vibeText, { color: theme.primary, fontFamily: 'Inter_600SemiBold' }]}>
                    {(excerpt.vibe_score * 100).toFixed(0)}% Vibe
                  </Text>
                </View>
              </View>
              
              <Text 
                numberOfLines={6} 
                style={[styles.excerptText, { color: theme.text, fontFamily: 'PlayfairDisplay_400Regular_Italic' }]}
              >
                "{excerpt.content_preview}..."
              </Text>
              
              <Text style={[styles.pageNumber, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Page {excerpt.page_number}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Reviews & Ratings Section */}
      <View style={styles.section} testID="reviews-section">
        <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
          Reviews & Ratings
        </Text>

        {/* Rating summary */}
        {reviews.length > 0 ? (
          <View style={[styles.ratingSummary, { backgroundColor: theme.cardBg, borderColor: theme.border }]} testID="rating-summary">
            <View style={styles.summaryValueBlock}>
              <Text style={[styles.averageRatingText, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
                {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
              </Text>
              <Text style={[styles.starScaleLabel, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                out of 5
              </Text>
            </View>
            <View style={styles.summaryDetails}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
                  const name = star <= Math.round(avg) ? 'star' : 'star-outline';
                  return <Ionicons key={star} name={name} size={18} color="#FFD700" />;
                })}
              </View>
              <Text style={[styles.reviewCountText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.emptySummary, { backgroundColor: theme.cardBg, borderColor: theme.border }]} testID="empty-reviews-summary">
            <Text style={[styles.emptySummaryText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              No reviews yet. Be the first to rate this book!
            </Text>
          </View>
        )}

        {/* Write a review form */}
        {token ? (
          <View style={[styles.writeReviewCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]} testID="review-form">
            <Text style={[styles.cardSubTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
              Write a Review
            </Text>

            <View style={styles.interactiveStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starTouch}
                  testID={`star-rating-button-${star}`}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= rating ? '#FFD700' : theme.iconInactive}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[
                styles.reviewInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                  fontFamily: 'Inter_400Regular',
                },
              ]}
              placeholder="Write your thoughts about this book..."
              placeholderTextColor={theme.iconInactive}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={reviewText}
              onChangeText={setReviewText}
              testID="review-input"
            />

            <TouchableOpacity
              style={[
                styles.submitReviewButton,
                { backgroundColor: theme.primary },
                rating === 0 && styles.disabledSubmitReviewButton,
              ]}
              onPress={handleSubmitReview}
              disabled={rating === 0}
              testID="submit-review-button"
            >
              <Text style={[styles.submitReviewText, { color: theme.background, fontFamily: 'Inter_600SemiBold' }]}>
                Submit Review
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.writeReviewCard, { backgroundColor: theme.cardBg, borderColor: theme.border, alignItems: 'center' }]} testID="login-cta-card">
            <Text style={[styles.cardSubTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold', textAlign: 'center' }]}>
              Want to review this book?
            </Text>
            <Text style={{ color: theme.textSecondary, fontFamily: 'Inter_400Regular', textAlign: 'center', marginBottom: 16, fontSize: 13, lineHeight: 18 }}>
              Log in to share your thoughts and rate your favorite reads.
            </Text>
            <TouchableOpacity
              style={[styles.submitReviewButton, { backgroundColor: theme.primary, width: '100%', alignItems: 'center', justifyContent: 'center' }]}
              onPress={() => navigation.navigate('Auth')}
              testID="login-cta-button"
            >
              <Text style={[styles.submitReviewText, { color: theme.background, fontFamily: 'Inter_600SemiBold' }]}>
                Log In / Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reviews list */}
        {reviews.length > 0 && (
          <View style={styles.reviewsListContainer} testID="reviews-list">
            <Text style={[styles.listTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
              Community Feedback
            </Text>
            {reviews.map((rev) => (
              <View key={rev.id} style={[styles.reviewItem, { borderBottomColor: theme.border }]} testID={`review-item-${rev.id}`}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewUser, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
                    {rev.username}
                  </Text>
                  <Text style={[styles.reviewDate, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                    {new Date(rev.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.starsRowCompact}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= rev.rating ? 'star' : 'star-outline'}
                      size={14}
                      color="#FFD700"
                    />
                  ))}
                </View>
                {rev.review_text ? (
                  <Text style={[styles.reviewContentText, { color: theme.text, fontFamily: 'Inter_400Regular' }]}>
                    {rev.review_text}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Spacer at bottom */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  coverWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  coverImage: {
    width: 110,
    height: 165,
    borderRadius: 8,
  },
  placeholderCover: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 6,
  },
  author: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  statValue: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 9,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 13,
  },
  primaryButtonText: {
    fontSize: 13,
  },
  section: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  excerptCard: {
    width: width * 0.82,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
    height: 220,
  },
  excerptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  excerptNumber: {
    fontSize: 12,
    letterSpacing: 1,
  },
  vibeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  vibeText: {
    fontSize: 11,
  },
  excerptText: {
    fontSize: 15,
    lineHeight: 23,
    flex: 1,
  },
  pageNumber: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 10,
  },
  bottomSpacer: {
    height: 40,
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryValueBlock: {
    alignItems: 'center',
    marginRight: 24,
  },
  averageRatingText: {
    fontSize: 32,
    lineHeight: 38,
  },
  starScaleLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  summaryDetails: {
    justifyContent: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  reviewCountText: {
    fontSize: 12,
  },
  emptySummary: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptySummaryText: {
    fontSize: 14,
    textAlign: 'center',
  },
  writeReviewCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  cardSubTitle: {
    fontSize: 15,
    marginBottom: 12,
  },
  interactiveStars: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  starTouch: {
    padding: 4,
  },
  reviewInput: {
    height: 80,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  submitReviewButton: {
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSubmitReviewButton: {
    opacity: 0.5,
  },
  submitReviewText: {
    fontSize: 14,
  },
  reviewsListContainer: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  listTitle: {
    fontSize: 15,
    marginBottom: 12,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewUser: {
    fontSize: 13,
  },
  reviewDate: {
    fontSize: 11,
  },
  starsRowCompact: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 6,
  },
  reviewContentText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
