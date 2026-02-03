import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

const { width } = Dimensions.get('window');

export default function BookDetailScreen({ route, navigation }) {
  const { bookId, bookTitle } = route.params;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookDetail();
  }, [bookId]);

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  if (error || !book) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Book not found'}</Text>
        <TouchableOpacity onPress={fetchBookDetail} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with cover */}
      <View style={styles.header}>
        {book.cover_url ? (
          <Image
            source={{ uri: book.cover_url }}
            style={styles.coverImage}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.coverImage, styles.placeholderCover]}>
            <Ionicons name="book" size={60} color="#8B4513" />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>by {book.author}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{book.page_count}</Text>
              <Text style={styles.statLabel}>Excerpts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{book.high_vibe_count}</Text>
              <Text style={styles.statLabel}>Top Picks</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {(book.avg_vibe_score * 100).toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>Vibe</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => openLink(book.gutenberg_url)}
        >
          <Ionicons name="book-outline" size={20} color="#FFF" />
          <Text style={styles.primaryButtonText}>Read Free</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openLink(book.amazon_search_url)}
        >
          <Ionicons name="cart-outline" size={20} color="#8B4513" />
          <Text style={styles.actionButtonText}>Amazon</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openLink(book.goodreads_search_url)}
        >
          <Ionicons name="star-outline" size={20} color="#8B4513" />
          <Text style={styles.actionButtonText}>Goodreads</Text>
        </TouchableOpacity>
      </View>

      {/* Top excerpts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Excerpts</Text>
        {book.top_excerpts.map((excerpt, index) => (
          <View key={excerpt.id} style={styles.excerptCard}>
            <View style={styles.excerptHeader}>
              <Text style={styles.excerptNumber}>#{index + 1}</Text>
              <View style={styles.vibeTag}>
                <Ionicons name="sparkles" size={12} color="#FFD700" />
                <Text style={styles.vibeText}>
                  {(excerpt.vibe_score * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
            <Text style={styles.excerptText}>{excerpt.content_preview}</Text>
            <Text style={styles.pageNumber}>Page {excerpt.page_number}</Text>
          </View>
        ))}
      </View>

      {/* Spacer at bottom */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
  },
  errorText: {
    color: '#8B4513',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#8B4513',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  coverImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#F5F5DC',
  },
  placeholderCover: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 4,
  },
  author: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#8B4513',
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  actionButtonText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 16,
  },
  excerptCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  excerptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  excerptNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  vibeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  vibeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B4513',
  },
  excerptText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    fontStyle: 'italic',
  },
  pageNumber: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  bottomSpacer: {
    height: 40,
  },
});
