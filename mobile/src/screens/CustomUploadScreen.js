import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useOnboardingStore from '../store/onboardingStore';
import useCustomUploadStore from '../store/customUploadStore';
import useFeedStore from '../store/feedStore';
import { getTheme } from '../config/theme';

export default function CustomUploadScreen({ navigation }) {
  const selectedTheme = useOnboardingStore((state) => state.selectedTheme);
  const theme = getTheme(selectedTheme);

  const { uploadCustomBook, uploading, uploadError, uploadSuccess, resetUploadState } = useCustomUploadStore();
  const refreshFeed = useFeedStore((state) => state.refresh);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [contentText, setContentText] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    resetUploadState();
    return () => resetUploadState();
  }, []);

  useEffect(() => {
    if (uploadSuccess) {
      Alert.alert('Success', 'Your book page has been successfully uploaded!', [
        {
          text: 'OK',
          onPress: () => {
            refreshFeed();
            navigation.goBack();
          },
        },
      ]);
    }
  }, [uploadSuccess]);

  const handleSubmit = async () => {
    setValidationError('');

    if (!title.trim()) {
      setValidationError('Book title is required.');
      return;
    }
    if (!author.trim()) {
      setValidationError('Author is required.');
      return;
    }
    if (!contentText.trim()) {
      setValidationError('Content text is required.');
      return;
    }

    const success = await uploadCustomBook({
      title,
      author,
      contentText,
    });
  };

  const displayedError = validationError || uploadError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.text, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Upload Custom Page
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          Contribute an excerpt of classic literature or custom text.
        </Text>

        {displayedError ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.border }]}>
            <Ionicons name="alert-circle" size={18} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.error, fontFamily: 'Inter_600SemiBold' }]}>
              {displayedError}
            </Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Book Title</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.cardBg,
                color: theme.text,
                borderColor: theme.border,
                fontFamily: 'Inter_400Regular',
              },
            ]}
            placeholder="e.g. Pride and Prejudice"
            placeholderTextColor={theme.iconInactive}
            value={title}
            onChangeText={(txt) => {
              setTitle(txt);
              setValidationError('');
            }}
            testID="input-title"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Author</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.cardBg,
                color: theme.text,
                borderColor: theme.border,
                fontFamily: 'Inter_400Regular',
              },
            ]}
            placeholder="e.g. Jane Austen"
            placeholderTextColor={theme.iconInactive}
            value={author}
            onChangeText={(txt) => {
              setAuthor(txt);
              setValidationError('');
            }}
            testID="input-author"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Excerpt Content</Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.cardBg,
                color: theme.text,
                borderColor: theme.border,
                fontFamily: 'PlayfairDisplay_400Regular_Italic',
              },
            ]}
            placeholder="Write or paste your excerpt here..."
            placeholderTextColor={theme.iconInactive}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            value={contentText}
            onChangeText={(txt) => {
              setContentText(txt);
              setValidationError('');
            }}
            testID="input-content"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }, uploading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={uploading}
          activeOpacity={0.8}
          testID="submit-button"
        >
          {uploading ? (
            <ActivityIndicator size="small" color={theme.background} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color={theme.background} />
              <Text style={[styles.submitButtonText, { color: theme.background, fontFamily: 'Inter_600SemiBold' }]}>
                Publish Excerpt
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  textArea: {
    height: 180,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  submitButton: {
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
  },
});
