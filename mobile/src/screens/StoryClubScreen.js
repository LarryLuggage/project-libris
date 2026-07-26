import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useOnboardingStore from '../store/onboardingStore';
import useStoryClubStore from '../store/storyClubStore';
import { getTheme } from '../config/theme';

const ROLES = [
  { label: 'Reader', value: 'reader' },
  { label: 'Writer', value: 'writer' },
  { label: 'Both', value: 'both' },
];

export default function StoryClubScreen({ navigation }) {
  const selectedTheme = useOnboardingStore((state) => state.selectedTheme);
  const theme = getTheme(selectedTheme);
  const {
    joinWaitlist,
    submitting,
    submitError,
    submitSuccess,
    resetStoryClubState,
  } = useStoryClubStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('reader');
  const [genres, setGenres] = useState('');
  const [willingToPay5, setWillingToPay5] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    resetStoryClubState();
    return () => resetStoryClubState();
  }, []);

  useEffect(() => {
    if (submitSuccess) {
      Alert.alert('Joined', 'You are on the Story Club pilot list.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  }, [submitSuccess]);

  const handleSubmit = async () => {
    setValidationError('');
    if (!name.trim()) {
      setValidationError('Name is required.');
      return;
    }
    if (!email.trim()) {
      setValidationError('Email is required.');
      return;
    }

    const genrePreferences = genres
      .split(',')
      .map((genre) => genre.trim())
      .filter(Boolean);

    await joinWaitlist({
      name,
      email,
      role,
      genrePreferences,
      willingToPay5,
    });
  };

  const displayedError = validationError || submitError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.eyebrow, { color: theme.primary, fontFamily: 'Inter_700Bold' }]}>
          STORY CLUB PILOT
        </Text>
        <Text style={[styles.title, { color: theme.text, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Read, vote, and help choose weekly short-story finalists.
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          Join the invite list for a four-week literary club with anonymous finalist voting and a fixed company-sponsored weekly prize.
        </Text>

        <View style={[styles.statRow, { borderColor: theme.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>4</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>weeks</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>100</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>members</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>$100</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>weekly prize</Text>
          </View>
        </View>

        {displayedError ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.error + '1A' }]}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.error, fontFamily: 'Inter_600SemiBold' }]}>
              {displayedError}
            </Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text, fontFamily: 'Inter_400Regular' }]}
            placeholder="Your name"
            placeholderTextColor={theme.iconInactive}
            value={name}
            onChangeText={(value) => {
              setName(value);
              setValidationError('');
            }}
            testID="story-club-name-input"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text, fontFamily: 'Inter_400Regular' }]}
            placeholder="you@example.com"
            placeholderTextColor={theme.iconInactive}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setValidationError('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            testID="story-club-email-input"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>I want to join as</Text>
          <View style={[styles.segmentedControl, { borderColor: theme.border }]}>
            {ROLES.map((option) => {
              const selected = role === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setRole(option.value)}
                  style={[styles.segment, selected && { backgroundColor: theme.primary }]}
                  testID={`story-club-role-${option.value}`}
                >
                  <Text style={[
                    styles.segmentText,
                    {
                      color: selected ? theme.background : theme.text,
                      fontFamily: selected ? 'Inter_700Bold' : 'Inter_400Regular',
                    },
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>Genre Preferences</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text, fontFamily: 'Inter_400Regular' }]}
            placeholder="Literary, mystery, speculative"
            placeholderTextColor={theme.iconInactive}
            value={genres}
            onChangeText={setGenres}
            testID="story-club-genres-input"
          />
        </View>

        <TouchableOpacity
          onPress={() => setWillingToPay5((value) => !value)}
          style={styles.checkboxRow}
          testID="story-club-wtp-checkbox"
        >
          <View style={[
            styles.checkbox,
            {
              borderColor: theme.primary,
              backgroundColor: willingToPay5 ? theme.primary : 'transparent',
            },
          ]}>
            {willingToPay5 ? (
              <Ionicons name="checkmark" size={16} color={theme.background} />
            ) : null}
          </View>
          <Text style={[styles.checkboxText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            I would consider paying $5/month after the pilot.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }, submitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
          testID="story-club-submit-button"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={theme.background} />
          ) : (
            <>
              <Ionicons name="mail-outline" size={20} color={theme.background} />
              <Text style={[styles.submitButtonText, { color: theme.background, fontFamily: 'Inter_700Bold' }]}>
                Join Pilot List
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
    paddingTop: 36,
    paddingBottom: 60,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 10,
  },
  title: {
    fontSize: 27,
    lineHeight: 34,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  statRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 16,
    marginBottom: 22,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 18,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    minHeight: 52,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
  },
});
