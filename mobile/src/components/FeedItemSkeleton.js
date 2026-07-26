import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function FeedItemSkeleton({ theme }) {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  const placeholderBg = theme?.isDark ? '#2D3748' : '#E2E8F0';
  const containerBg = theme?.background || '#F5F5DC';
  const cardBg = theme?.cardBg || '#FFF';

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]} testID="feed-item-skeleton">
      <Animated.View style={[styles.card, { backgroundColor: cardBg, opacity: fadeAnim }]}>
        {/* Top Header Placeholder */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: placeholderBg }]} />
          <View style={styles.headerTextContainer}>
            <View style={[styles.line, { backgroundColor: placeholderBg, width: '60%' }]} />
            <View style={[styles.line, { backgroundColor: placeholderBg, width: '40%', marginTop: 8 }]} />
          </View>
        </View>

        {/* Content Paragraph Placeholders */}
        <View style={styles.content}>
          <View style={[styles.line, { backgroundColor: placeholderBg, width: '100%' }]} />
          <View style={[styles.line, { backgroundColor: placeholderBg, width: '95%', marginTop: 12 }]} />
          <View style={[styles.line, { backgroundColor: placeholderBg, width: '90%', marginTop: 12 }]} />
          <View style={[styles.line, { backgroundColor: placeholderBg, width: '100%', marginTop: 12 }]} />
          <View style={[styles.line, { backgroundColor: placeholderBg, width: '85%', marginTop: 12 }]} />
          <View style={[styles.line, { backgroundColor: placeholderBg, width: '60%', marginTop: 12 }]} />
        </View>

        {/* Bottom Actions Placeholder */}
        <View style={styles.footer}>
          <View style={[styles.line, { backgroundColor: placeholderBg, width: '40%' }]}></View>
          <View style={styles.actions}>
            <View style={[styles.circleButton, { backgroundColor: placeholderBg }]} />
            <View style={[styles.circleButton, { backgroundColor: placeholderBg }]} />
          </View>
        </View>
      </Animated.View>
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
  card: {
    width: width * 0.9,
    height: height * 0.85,
    borderRadius: 16,
    padding: 24,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 20,
  },
  line: {
    height: 16,
    borderRadius: 8,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#0000000a',
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
