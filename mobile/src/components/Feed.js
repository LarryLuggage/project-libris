import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native';
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
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#666" />
      </View>
    );
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
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text onPress={refresh} style={styles.retryText}>
          Retry
        </Text>
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
  errorText: {
    color: 'white',
    marginBottom: 10,
  },
  retryText: {
    color: '#007AFF',
    fontSize: 16,
  },
  footer: {
    paddingVertical: 20,
  },
});
