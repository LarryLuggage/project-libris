import React, { useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Text,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useFeedStore from '../store/feedStore';
import useOnboardingStore from '../store/onboardingStore';
import useAuthStore from '../store/authStore';
import FeedItem from './FeedItem';
import FeedItemSkeleton from './FeedItemSkeleton';
import { getTheme, THEMES } from '../config/theme';

export default function Feed() {
  const navigation = useNavigation();
  const { items, loading, error, hasMore, fetchFeed, refresh } = useFeedStore();
  const { selectedTheme, setTheme, resetOnboarding } = useOnboardingStore();
  const { token, logout } = useAuthStore();
  const [showThemePicker, setShowThemePicker] = useState(false);

  const handleAuthPress = () => {
    if (token) {
      logout();
    } else {
      navigation.navigate('Auth');
    }
  };
  const pickerAnim = React.useRef(new Animated.Value(0)).current;

  const theme = getTheme(selectedTheme);

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleEndReached = useCallback(() => {
    if (!loading && hasMore) {
      fetchFeed();
    }
  }, [loading, hasMore, fetchFeed]);

  const toggleThemePicker = () => {
    const toValue = showThemePicker ? 0 : 1;
    setShowThemePicker(!showThemePicker);
    Animated.spring(pickerAnim, {
      toValue,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const selectTheme = (themeName) => {
    setTheme(themeName);
    toggleThemePicker();
  };

  const pickerTranslateY = pickerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 0],
  });

  const renderTopNav = () => (
    <>
      <View style={[styles.topNav, { borderBottomColor: theme.border }]}>
        <Text style={[styles.logo, { color: theme.primary, fontFamily: 'Inter_700Bold' }]}>LIBRIS</Text>
        
        <View style={styles.topNavActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('StoryClub')}
            style={[styles.navIcon, { backgroundColor: theme.border }]}
            testID="story-club-button"
          >
            <Ionicons name="sparkles-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (token) {
                navigation.navigate('CustomUpload');
              } else {
                navigation.navigate('Auth');
              }
            }}
            style={[styles.navIcon, { backgroundColor: theme.border }]}
            testID="upload-button"
          >
            <Ionicons name="add-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleThemePicker} style={[styles.navIcon, { backgroundColor: theme.border }]} testID="palette-button">
            <Ionicons name="color-palette" size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={resetOnboarding} style={[styles.navIcon, { backgroundColor: theme.border }]} testID="reset-button">
            <Ionicons name="settings-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAuthPress} style={[styles.navIcon, { backgroundColor: theme.border }]} testID="auth-button">
            <Ionicons name={token ? "log-out-outline" : "person-outline"} size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {showThemePicker && (
        <Animated.View 
          style={[
            styles.pickerPanel, 
            { 
              backgroundColor: theme.cardBg, 
              borderColor: theme.border,
              transform: [{ translateY: pickerTranslateY }]
            }
          ]}
        >
          <Text style={[styles.pickerTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Choose Vibe</Text>
          <View style={styles.pickerGrid}>
            {Object.keys(THEMES).map((key) => {
              const t = THEMES[key];
              const isSelected = selectedTheme === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => selectTheme(key)}
                  style={[
                    styles.themeBubble,
                    { 
                      backgroundColor: t.background, 
                      borderColor: isSelected ? theme.primary : t.border,
                      borderWidth: isSelected ? 2 : 1
                    }
                  ]}
                >
                  <Text style={[styles.bubbleLabel, { color: t.text, fontFamily: 'Inter_600SemiBold' }]}>
                    {key.substring(0, 2).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      )}
    </>
  );

  const renderFooter = () => {
    if (loading && items.length > 0) {
      return (
        <View style={styles.footer}>
          <FeedItemSkeleton theme={theme} />
        </View>
      );
    }
    if (!hasMore && items.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={[styles.endOfFeedText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            You've reached the end
          </Text>
        </View>
      );
    }
    return null;
  };

  // Initial loading state
  if (items.length === 0 && loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {renderTopNav()}
        <FeedItemSkeleton theme={theme} />
      </View>
    );
  }

  // Error state with no items
  if (items.length === 0 && error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        {renderTopNav()}
        <Ionicons name="cloud-offline-outline" size={48} color={theme.primary} style={styles.errorIcon} />
        <Text style={[styles.errorText, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>{error}</Text>
        <TouchableOpacity 
          onPress={refresh} 
          style={[styles.retryButton, { backgroundColor: theme.primary }]} 
          testID="retry-button"
        >
          <Text style={[styles.retryButtonText, { color: theme.background, fontFamily: 'Inter_600SemiBold' }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {renderTopNav()}

      {/* Infinite Scroll Excerpt Feed */}
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
            tintColor={theme.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  retryButtonText: {
    fontSize: 15,
  },
  footer: {
    paddingBottom: 40,
  },
  endOfFeedText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 30,
  },
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100,
    backgroundColor: '#00000003',
    borderBottomWidth: 1,
  },
  logo: {
    fontSize: 18,
    letterSpacing: 2,
  },
  topNavActions: {
    flexDirection: 'row',
    gap: 10,
  },
  navIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerPanel: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    padding: 16,
    zIndex: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pickerTitle: {
    fontSize: 13,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pickerGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  themeBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleLabel: {
    fontSize: 11,
  },
});
