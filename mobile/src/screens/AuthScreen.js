import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import useOnboardingStore from '../store/onboardingStore';
import { getTheme } from '../config/theme';

const { width } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
  const selectedTheme = useOnboardingStore((state) => state.selectedTheme);
  const theme = getTheme(selectedTheme);

  const { signup, login, loading, error, clearError } = useAuthStore();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setValidationError('');
    clearError();
  };

  const validateEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  const handleSubmit = async () => {
    setValidationError('');
    clearError();

    if (isLoginMode) {
      if (!username.trim() || !password) {
        setValidationError('Please fill in all fields');
        return;
      }
      try {
        await login(username.trim(), password);
        navigation.goBack();
      } catch (err) {
        // Error is handled by store and displayed via state
      }
    } else {
      if (!username.trim() || !email.trim() || !password || !confirmPassword) {
        setValidationError('Please fill in all fields');
        return;
      }
      if (username.trim().length < 3) {
        setValidationError('Username must be at least 3 characters');
        return;
      }
      if (!validateEmail(email.trim())) {
        setValidationError('Please enter a valid email address');
        return;
      }
      if (password.length < 6) {
        setValidationError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match');
        return;
      }

      try {
        await signup(username.trim(), email.trim(), password);
        navigation.goBack();
      } catch (err) {
        // Error is handled by store and displayed via state
      }
    }
  };

  const activeError = validationError || error;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          testID="auth-back-button"
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        {/* Logo / Branding */}
        <View style={styles.branding}>
          <Text style={[styles.logoText, { color: theme.primary, fontFamily: 'Inter_700Bold' }]}>
            LIBRIS
          </Text>
          <Text style={[styles.tagline, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            {isLoginMode ? 'Welcome back to atomic reading' : 'Start your literary journey'}
          </Text>
        </View>

        {/* Tabs for Login / Signup */}
        <View style={[styles.tabs, { borderColor: theme.border }]} testID="auth-mode-tabs">
          <TouchableOpacity
            onPress={() => {
              if (!isLoginMode) toggleMode();
            }}
            style={[
              styles.tab,
              isLoginMode && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
            ]}
            testID="login-tab-button"
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: isLoginMode ? theme.text : theme.iconInactive,
                  fontFamily: isLoginMode ? 'Inter_600SemiBold' : 'Inter_400Regular',
                },
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (isLoginMode) toggleMode();
            }}
            style={[
              styles.tab,
              !isLoginMode && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
            ]}
            testID="signup-tab-button"
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: !isLoginMode ? theme.text : theme.iconInactive,
                  fontFamily: !isLoginMode ? 'Inter_600SemiBold' : 'Inter_400Regular',
                },
              ]}
            >
              Register
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {activeError ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.error + '1A', borderColor: theme.error }]} testID="auth-error-banner">
            <Ionicons name="alert-circle-outline" size={20} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.error, fontFamily: 'Inter_600SemiBold' }]}>
              {activeError}
            </Text>
          </View>
        ) : null}

        {/* Input Form Fields */}
        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
            Username {!isLoginMode && 'or Identifier'}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                color: theme.text,
                fontFamily: 'Inter_400Regular',
              },
            ]}
            placeholder={isLoginMode ? "Enter username or email" : "Choose username"}
            placeholderTextColor={theme.iconInactive}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            testID="username-input"
          />

          {!isLoginMode && (
            <>
              <Text style={[styles.label, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
                Email Address
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                    color: theme.text,
                    fontFamily: 'Inter_400Regular',
                  },
                ]}
                placeholder="Enter your email"
                placeholderTextColor={theme.iconInactive}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                testID="email-input"
              />
            </>
          )}

          <Text style={[styles.label, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
            Password
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                color: theme.text,
                fontFamily: 'Inter_400Regular',
              },
            ]}
            placeholder="Enter password"
            placeholderTextColor={theme.iconInactive}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            testID="password-input"
          />

          {!isLoginMode && (
            <>
              <Text style={[styles.label, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
                Confirm Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                    color: theme.text,
                    fontFamily: 'Inter_400Regular',
                  },
                ]}
                placeholder="Re-enter password"
                placeholderTextColor={theme.iconInactive}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                testID="confirm-password-input"
              />
            </>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: theme.primary },
              loading && styles.disabledSubmitBtn,
            ]}
            onPress={handleSubmit}
            disabled={loading}
            testID="submit-auth-button"
          >
            {loading ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <Text style={[styles.submitText, { color: theme.background, fontFamily: 'Inter_600SemiBold' }]}>
                {isLoginMode ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle helper links */}
          <TouchableOpacity onPress={toggleMode} style={styles.toggleLink} testID="toggle-mode-button">
            <Text style={[styles.toggleLinkText, { color: theme.primary, fontFamily: 'Inter_400Regular' }]}>
              {isLoginMode
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 40,
  },
  backBtn: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  branding: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 20,
  },
  submitBtn: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledSubmitBtn: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
  },
  toggleLink: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  toggleLinkText: {
    fontSize: 14,
  },
});
