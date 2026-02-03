import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import Feed from '../components/Feed';

export default function FeedScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Feed />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
