import React from 'react';
import { StyleSheet, Text, View, Dimensions, ScrollView } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function FeedItem({ item }) {
    return (
        <View style={styles.container}>
            <View style={styles.pageContent}>
                <ScrollView contentContainerStyle={styles.textContainer}>
                    <Text style={styles.content}>{item.content_text}</Text>
                </ScrollView>
                <View style={styles.footer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.author}>{item.author} • Page {item.page_number}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width,
        height: height, // Full screen height for paging
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5DC', // Beige/Paper color
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
        fontFamily: 'System', // Ideally custom serif font
        textAlign: 'left',
    },
    footer: {
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    author: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
});
