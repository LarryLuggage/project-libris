import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useFeedStore from '../store/feedStore';
import FeedItem from './FeedItem';

export default function Feed() {
  const navigation = useNavigation();
  const { items, loading, error, hasMore, fetchFeed, refresh } = useFeedStore();

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleEndReached = useCallback(() => {
    if (!loading && hasMore) {
      fetchFeed();
    }
  }, [loading, hasMore, fetchFeed]);

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      );
    }
    if (!hasMore && items.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.endOfFeedText}>You've reached the end</Text>
        </View>
      );
    }
    return null;
  };

  // Initial loading state
  if (items.length === 0 && loading) {
    return (
      <View style={styles.center} testID="loading-indicator">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Error state with no items
  if (items.length === 0 && error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color="#666" style={styles.errorIcon} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={refresh} style={styles.retryButton} testID="retry-button">
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={({ item }) => <FeedItem item={item} navigation={navigation} />}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={2}
        decelerationRate="fast"
        snapToAlignment="start"
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refresh}
            tintColor="#666"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 20,
  },
  endOfFeedText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});
