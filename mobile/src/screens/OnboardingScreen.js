import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useOnboardingStore from '../store/onboardingStore';
import { THEMES, getTheme } from '../config/theme';

const { width, height } = Dimensions.get('window');

const GENRES = [
  { id: 'Fiction', name: 'Fiction', icon: 'book' },
  { id: 'Poetry', name: 'Poetry', icon: 'color-palette' },
  { id: 'Philosophy', name: 'Philosophy', icon: 'bulb' },
  { id: 'Science', name: 'Science', icon: 'flask' },
  { id: 'History', name: 'History', icon: 'hourglass' },
  { id: 'Drama', name: 'Drama', icon: 'happy' },
];

const VIBES = [
  { id: 'Thoughtful', name: 'Thoughtful', description: 'Deep, reflective, philosophical' },
  { id: 'Romantic', name: 'Romantic', description: 'Passionate, emotional, poetic' },
  { id: 'Gothic', name: 'Gothic / Dark', description: 'Mysterious, intense, eerie' },
  { id: 'Adventurous', name: 'Adventurous', description: 'Action, travel, epic journeys' },
  { id: 'Quiet', name: 'Quiet', description: 'Calm, gentle, slice-of-life' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const {
    selectedTheme,
    favoriteGenres,
    preferredVibes,
    setTheme,
    toggleGenre,
    toggleVibe,
    completeOnboarding,
  } = useOnboardingStore();

  const theme = getTheme(selectedTheme);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (step < 2) {
      Animated.timing(slideAnim, {
        toValue: -(width * (step + 1)),
        duration: 300,
        useNativeDriver: true,
      }).start(() => setStep(step + 1));
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      Animated.timing(slideAnim, {
        toValue: -(width * (step - 1)),
        duration: 300,
        useNativeDriver: true,
      }).start(() => setStep(step - 1));
    }
  };

  const handleSkip = () => {
    // Set defaults if empty
    if (favoriteGenres.length === 0) {
      GENRES.forEach((g) => toggleGenre(g.id));
    }
    if (preferredVibes.length === 0) {
      VIBES.forEach((v) => toggleVibe(v.id));
    }
    completeOnboarding();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        {step > 0 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton} testID="back-button">
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <Text style={[styles.appName, { color: theme.primary }]}>LIBRIS</Text>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton} testID="skip-button">
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.progressBar,
              {
                backgroundColor: i === step ? theme.primary : theme.border,
                width: i === step ? 30 : 10,
              },
            ]}
          />
        ))}
      </View>

      {/* Steps */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 0 && (
          <View style={styles.stepContainer} testID="step-0">
            <Text style={[styles.title, { color: theme.text }]}>Choose Your Aesthetic</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Customize the look and feel of your reading experience.
            </Text>

            <View style={styles.themeGrid}>
              {Object.keys(THEMES).map((key) => {
                const t = THEMES[key];
                const isSelected = selectedTheme === key;
                return (
                  <TouchableOpacity
                    key={key}
                    testID={`theme-option-${key}`}
                    onPress={() => setTheme(key)}
                    style={[
                      styles.themeCard,
                      {
                        backgroundColor: t.background,
                        borderColor: isSelected ? theme.primary : t.border,
                        borderWidth: isSelected ? 3 : 1,
                      },
                    ]}
                  >
                    <View style={styles.themePreviewHeader}>
                      <Text style={[styles.themeLabel, { color: t.text }]}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={t.primary} />
                      )}
                    </View>
                    <View style={[styles.themePreviewTextLine, { backgroundColor: t.textSecondary, opacity: 0.15 }]} />
                    <View style={[styles.themePreviewTextLine, { backgroundColor: t.textSecondary, opacity: 0.15, width: '80%' }]} />
                    <View style={[styles.themePreviewTextLine, { backgroundColor: t.textSecondary, opacity: 0.15, width: '60%' }]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContainer} testID="step-1">
            <Text style={[styles.title, { color: theme.text }]}>Favorite Genres</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              We'll highlight excerpts from your preferred categories.
            </Text>

            <View style={styles.genreGrid}>
              {GENRES.map((g) => {
                const isSelected = favoriteGenres.includes(g.id);
                return (
                  <TouchableOpacity
                    key={g.id}
                    testID={`genre-option-${g.id}`}
                    onPress={() => toggleGenre(g.id)}
                    style={[
                      styles.genreCard,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.cardBg,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={g.icon}
                      size={24}
                      color={isSelected ? theme.background : theme.text}
                    />
                    <Text
                      style={[
                        styles.genreName,
                        { color: isSelected ? theme.background : theme.text },
                      ]}
                    >
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer} testID="step-2">
            <Text style={[styles.title, { color: theme.text }]}>Choose Your Mood</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              What kind of vibes are you looking for today?
            </Text>

            <View style={styles.vibeList}>
              {VIBES.map((v) => {
                const isSelected = preferredVibes.includes(v.id);
                return (
                  <TouchableOpacity
                    key={v.id}
                    testID={`vibe-option-${v.id}`}
                    onPress={() => toggleVibe(v.id)}
                    style={[
                      styles.vibeCard,
                      {
                        backgroundColor: isSelected ? theme.cardBg : 'transparent',
                        borderColor: isSelected ? theme.primary : theme.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <View style={styles.vibeInfo}>
                      <Text style={[styles.vibeName, { color: theme.text }]}>{v.name}</Text>
                      <Text style={[styles.vibeDesc, { color: theme.textSecondary }]}>
                        {v.description}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkbox" size={24} color={theme.primary} />
                    ) : (
                      <Ionicons name="square-outline" size={24} color={theme.border} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          testID="next-button"
        >
          <Text style={[styles.primaryButtonText, { color: theme.background }]}>
            {step === 2 ? 'Start Reading' : 'Continue'}
          </Text>
          <Ionicons
            name={step === 2 ? 'book' : 'arrow-forward'}
            size={20}
            color={theme.background}
            style={styles.btnIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  backButton: {
    padding: 8,
  },
  backButtonPlaceholder: {
    width: 40,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    gap: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  stepContainer: {
    width: width,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 30,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  themeCard: {
    width: (width - 64) / 2,
    height: 120,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  themePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  themePreviewTextLine: {
    height: 6,
    borderRadius: 3,
    width: '100%',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  genreCard: {
    width: (width - 64) / 2,
    paddingVertical: 24,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  genreName: {
    fontSize: 16,
    fontWeight: '600',
  },
  vibeList: {
    gap: 16,
  },
  vibeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  vibeInfo: {
    flex: 1,
    marginRight: 16,
  },
  vibeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vibeDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  btnIcon: {
    marginLeft: 8,
  },
});
