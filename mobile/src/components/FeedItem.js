import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useInteractionStore from '../store/interactionStore';

const { width, height } = Dimensions.get('window');

export default function FeedItem({ item, navigation }) {
  const { toggleBookmark, toggleLike, isBookmarked, isLiked } =
    useInteractionStore();

  const bookmarked = isBookmarked(item.id);
  const liked = isLiked(item.id);

  const handleBookPress = () => {
    navigation.navigate('BookDetail', {
      bookId: item.book_id,
      bookTitle: item.title,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.pageContent}>
        <ScrollView contentContainerStyle={styles.textContainer}>
          <Text style={styles.content}>{item.content_text}</Text>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleBookPress} activeOpacity={0.7}>
            <View style={styles.bookInfo}>
              <View style={styles.bookTitleRow}>
                <Text style={styles.title}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={18} color="#8B4513" />
              </View>
              <Text style={styles.author}>
                {item.author} - Page {item.page_number}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => toggleLike(item.id)}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={28}
                color={liked ? '#E91E63' : '#666'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleBookmark(item.id)}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={28}
                color={bookmarked ? '#FFD700' : '#666'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
  },
  pageContent: {
    width: width * 0.9,
    height: height * 0.85,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    justifyContent: 'space-between',
  },
  textContainer: {
    paddingBottom: 20,
  },
  content: {
    fontSize: 18,
    lineHeight: 28,
    color: '#333',
    fontFamily: 'System',
    textAlign: 'left',
  },
  footer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
  },
  bookInfo: {
    marginBottom: 10,
  },
  bookTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    flex: 1,
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginLeft: 16,
  },
});
