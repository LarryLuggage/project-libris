import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Text, Platform } from 'react-native';
import axios from 'axios';
import FeedItem from './FeedItem';
import Constants from 'expo-constants';

// Configure API URL based on environment
const getApiUrl = () => {
    // If running on iOS Simulator, localhost (127.0.0.1) refers to the host machine.
    if (Platform.OS === 'ios' && !Constants.isDevice) {
        return 'http://127.0.0.1:8000/feed';
    }

    // If running on Android Emulator, localhost (10.0.2.2) refers to the host machine.
    if (Platform.OS === 'android' && !Constants.isDevice) {
        return 'http://10.0.2.2:8000/feed';
    }

    // If running on a physical device, we try to detect the LAN IP of the bundler.
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

    // Fallback if we can't detect host (e.g. web or simple simulator run)
    if (!debuggerHost) {
        return 'http://localhost:8000/feed';
    }

    return `http://${localhost}:8000/feed`;
};

const API_URL = getApiUrl();

export default function Feed() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchMore = async () => {
        if (loading) return;

        setLoading(true);
        try {
            console.log('Fetching feed from:', API_URL);
            const response = await axios.get(API_URL);
            // Append new items to the list
            // Note: In a real app, we'd ensure unique IDs or handle dupes
            setData(prevData => [...prevData, ...response.data]);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load feed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMore();
    }, []);

    if (data.length === 0 && loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    if (data.length === 0 && error) {
        return (
            <View style={styles.center}>
                <Text style={{ color: 'white', marginBottom: 10 }}>Error: {error}</Text>
                <Text style={{ color: 'gray', textAlign: 'center', marginBottom: 20 }}>
                    Attempted URL: {API_URL}
                </Text>
                <Text onPress={fetchMore} style={{ color: '#007AFF', fontSize: 16 }}>Retry</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={data}
                renderItem={({ item, index }) => <FeedItem item={item} />}
                keyExtractor={(item, index) => index.toString()} // Using index as key for simplicity in MVP
                pagingEnabled
                showsVerticalScrollIndicator={false}
                onEndReached={fetchMore}
                onEndReachedThreshold={2} // Fetch more when 2 screens away from end
                decelerationRate="fast"
                snapToAlignment="start"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Dark background behind the pages
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
