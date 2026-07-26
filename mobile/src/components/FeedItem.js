import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import useInteractionStore from '../store/interactionStore';
import useOnboardingStore from '../store/onboardingStore';
import useCommentStore from '../store/commentStore';
import useAuthStore from '../store/authStore';
import { getTheme } from '../config/theme';

const { width, height } = Dimensions.get('window');

export default function FeedItem({ item, navigation }) {
  const selectedTheme = useOnboardingStore((state) => state.selectedTheme);
  const theme = getTheme(selectedTheme);
  const [coverError, setCoverError] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [commentText, setCommentText] = useState('');

  const {
    commentsByPage,
    fetchComments,
    addComment,
    loading: commentsLoading,
    error: commentsError,
  } = useCommentStore();

  const token = useAuthStore((state) => state.token);

  const comments = commentsByPage[item.id] || [];

  const openCommentsDrawer = () => {
    setDrawerOpen(true);
    fetchComments(item.id);
    Animated.spring(slideAnim, {
      toValue: height * 0.35,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  };

  const closeCommentsDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setDrawerOpen(false));
  };

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    addComment(item.id, commentText);
    setCommentText('');
  };

  const {
    initialized,
    toggleBookmark,
    toggleLike,
    recordEvent,
    isBookmarked,
    isLiked,
    lastError,
    clearLastError,
  } = useInteractionStore();

  useEffect(() => {
    if (initialized) {
      recordEvent(item.id, 'seen');
    }
  }, [initialized, item.id, recordEvent]);

  useEffect(() => {
    if (lastError) {
      const timer = setTimeout(clearLastError, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastError]);

  const bookmarked = isBookmarked(item.id);
  const liked = isLiked(item.id);

  // Double tap to like setup
  const lastTap = useRef(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      // Like if not already liked
      if (!liked && initialized) {
        toggleLike(item.id);
      }
      
      // Animate heart popup
      heartScale.setValue(0.3);
      heartOpacity.setValue(0.9);
      Animated.parallel([
        Animated.spring(heartScale, {
          toValue: 1.2,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      lastTap.current = now;
    }
  };

  const handleBookPress = () => {
    navigation.navigate('BookDetail', {
      bookId: item.book_id,
      bookTitle: item.title,
    });
  };

  // Estimate reading time (e.g., 200 WPM)
  const wordCount = item.content_text?.split(/\s+/).length || 0;
  const readTime = Math.max(1, Math.round(wordCount / 3.3)); // in seconds roughly, or WPM
  const timeLabel = readTime >= 60 
    ? `${Math.round(readTime / 60)} min read` 
    : `${readTime}s read`;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableWithoutFeedback onPress={handleDoubleTap}>
        <View style={[styles.pageContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          
          {/* Card Top Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBookPress} style={styles.headerInfoRow} activeOpacity={0.7}>
              {item.cover_url && !coverError ? (
                <Image
                  source={{ uri: item.cover_url }}
                  style={[styles.coverThumbnail, { backgroundColor: theme.border }]}
                  contentFit="cover"
                  onError={() => setCoverError(true)}
                />
              ) : (
                <View style={[styles.coverThumbnail, styles.placeholderThumbnail, { backgroundColor: theme.border }]}>
                  <Ionicons name="book" size={16} color={theme.primary} />
                </View>
              )}
              <View style={styles.headerText}>
                <View style={styles.bookTitleRow}>
                  <Text numberOfLines={1} style={[styles.bookTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
                    {item.title}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.primary} />
                </View>
                <Text numberOfLines={1} style={[styles.bookAuthor, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                  {item.author}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.readTimeBadge, { backgroundColor: theme.border }]}>
              <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
              <Text style={[styles.readTimeText, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
                {timeLabel}
              </Text>
            </View>
          </View>

          {/* Excerpt Body */}
          <View style={styles.scrollWrapper}>
            <ScrollView 
              contentContainerStyle={styles.textContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.content, { color: theme.text, fontFamily: 'PlayfairDisplay_400Regular_Italic' }]}>
                {item.content_text}
              </Text>
            </ScrollView>
          </View>

          {/* Double tap heart overlay */}
          <Animated.View
            style={[
              styles.heartOverlay,
              {
                opacity: heartOpacity,
                transform: [{ scale: heartScale }],
              },
            ]}
            pointerEvents="none"
          >
            <Ionicons name="heart" size={100} color="#E91E63" />
          </Animated.View>

          {/* Bottom Actions Row */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Text style={[styles.pageNumber, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              Page {item.page_number}
            </Text>

            {lastError && (
              <Text style={[styles.errorBanner, { color: theme.error, fontFamily: 'Inter_400Regular' }]}>
                {lastError}
              </Text>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={openCommentsDrawer}
                style={[styles.actionButton, !initialized && styles.disabledAction]}
                activeOpacity={0.7}
                disabled={!initialized}
                testID="comment-button"
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={26}
                  color={theme.iconInactive}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleLike(item.id)}
                style={[styles.actionButton, !initialized && styles.disabledAction]}
                activeOpacity={0.7}
                disabled={!initialized}
                testID="like-button"
              >
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={26}
                  color={liked ? theme.iconActive : theme.iconInactive}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleBookmark(item.id)}
                style={[styles.actionButton, !initialized && styles.disabledAction]}
                activeOpacity={0.7}
                disabled={!initialized}
                testID="bookmark-button"
              >
                <Ionicons
                  name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={26}
                  color={bookmarked ? theme.iconBookmark : theme.iconInactive}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Comments Drawer Overlay */}
      {drawerOpen && (
        <TouchableWithoutFeedback onPress={closeCommentsDrawer} testID="drawer-backdrop">
          <View style={[StyleSheet.absoluteFillObject, styles.backdrop, { backgroundColor: '#00000080' }]} />
        </TouchableWithoutFeedback>
      )}
      {drawerOpen && (
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          testID="comments-drawer"
        >
          <View style={[styles.drawerHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.drawerTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
              Comments ({comments.length})
            </Text>
            <TouchableOpacity onPress={closeCommentsDrawer} style={styles.closeButton} testID="close-drawer-button">
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {commentsLoading && comments.length === 0 ? (
            <View style={styles.drawerLoading} testID="drawer-loading">
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.commentsList}
              contentContainerStyle={styles.commentsListContent}
              showsVerticalScrollIndicator={false}
              testID="comments-scroll-view"
            >
              {comments.length === 0 ? (
                <View style={styles.emptyComments} testID="empty-comments">
                  <Ionicons name="chatbubbles-outline" size={40} color={theme.iconInactive} style={{ marginBottom: 8 }} />
                  <Text style={[styles.emptyCommentsText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                    No comments yet. Be the first to share your thoughts!
                  </Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={[styles.commentItem, { borderBottomColor: theme.border }]} testID={`comment-item-${comment.id}`}>
                    <View style={styles.commentHeader}>
                      <Text style={[styles.commentUser, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
                        {comment.username}
                      </Text>
                      <Text style={[styles.commentTime, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[styles.commentText, { color: theme.text, fontFamily: 'Inter_400Regular' }]}>
                      {comment.comment_text}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {commentsError && (
            <Text style={[styles.drawerError, { color: theme.error, fontFamily: 'Inter_400Regular' }]}>
              {commentsError}
            </Text>
          )}

          {token ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
              <View style={[styles.inputContainer, { borderTopColor: theme.border, backgroundColor: theme.cardBg }]}>
                <TextInput
                  style={[
                    styles.commentInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                      fontFamily: 'Inter_400Regular',
                    },
                  ]}
                  placeholder="Add a comment..."
                  placeholderTextColor={theme.iconInactive}
                  value={commentText}
                  onChangeText={setCommentText}
                  testID="comment-input"
                />
                <TouchableOpacity
                  onPress={handlePostComment}
                  style={[styles.postButton, { backgroundColor: theme.primary }]}
                  testID="post-comment-button"
                >
                  <Text style={[styles.postButtonText, { color: theme.background, fontFamily: 'Inter_600SemiBold' }]}>
                    Post
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <View style={[styles.loginCtaContainer, { borderTopColor: theme.border, backgroundColor: theme.cardBg }]} testID="login-cta-container">
              <Text style={[styles.loginCtaText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Log in to join the conversation and share your thoughts.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  closeCommentsDrawer();
                  navigation.navigate('Auth');
                }}
                style={[styles.loginCtaButton, { backgroundColor: theme.primary }]}
                testID="login-cta-button"
              >
                <Text style={[styles.loginCtaButtonText, { color: theme.background, fontFamily: 'Inter_600SemiBold' }]}>
                  Log In / Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContent: {
    width: width * 0.92,
    height: height * 0.82,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    justifyContent: 'space-between',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  coverThumbnail: {
    width: 36,
    height: 50,
    borderRadius: 4,
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  bookTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookTitle: {
    fontSize: 15,
    maxWidth: '90%',
  },
  bookAuthor: {
    fontSize: 13,
    marginTop: 2,
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  readTimeText: {
    fontSize: 11,
  },
  scrollWrapper: {
    flex: 1,
    marginVertical: 16,
  },
  textContainer: {
    paddingVertical: 8,
  },
  content: {
    fontSize: 18,
    lineHeight: 29,
    textAlign: 'left',
  },
  heartOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageNumber: {
    fontSize: 13,
  },
  errorBanner: {
    fontSize: 11,
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 12,
  },
  disabledAction: {
    opacity: 0.5,
  },
  backdrop: {
    zIndex: 90,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 100,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: 16,
  },
  closeButton: {
    padding: 4,
  },
  drawerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyComments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyCommentsText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 13,
  },
  commentTime: {
    fontSize: 11,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 12,
    fontSize: 14,
  },
  postButton: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonText: {
    fontSize: 13,
  },
  drawerError: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 4,
    marginHorizontal: 16,
  },
  loginCtaContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loginCtaText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  loginCtaButton: {
    paddingHorizontal: 24,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loginCtaButtonText: {
    fontSize: 14,
  },
});
