import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import AuthScreen from './AuthScreen';
import useAuthStore from '../store/authStore';
import useOnboardingStore from '../store/onboardingStore';

// Mock the stores
jest.mock('../store/authStore');
jest.mock('../store/onboardingStore');

const mockAuthStore = {
  token: null,
  user: null,
  loading: false,
  error: null,
  signup: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  clearError: jest.fn(),
};

const mockOnboardingStore = {
  selectedTheme: 'cream',
};

describe('AuthScreen', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.mockReturnValue(mockAuthStore);
    useOnboardingStore.mockReturnValue(mockOnboardingStore.selectedTheme);
    
    // Set default auth store values
    mockAuthStore.loading = false;
    mockAuthStore.error = null;
  });

  it('renders login form by default', () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <AuthScreen navigation={mockNavigation} />
    );

    expect(getByText('LIBRIS')).toBeTruthy();
    expect(getByText('Welcome back to atomic reading')).toBeTruthy();
    expect(getByTestId('username-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(queryByTestId('email-input')).toBeNull();
    expect(queryByTestId('confirm-password-input')).toBeNull();
  });

  it('toggles to register mode and back', () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <AuthScreen navigation={mockNavigation} />
    );

    // Switch to Register (Signup)
    fireEvent.press(getByTestId('signup-tab-button'));

    expect(getByText('Start your literary journey')).toBeTruthy();
    expect(getByTestId('username-input')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('confirm-password-input')).toBeTruthy();

    // Switch back to Sign In
    fireEvent.press(getByTestId('login-tab-button'));

    expect(getByText('Welcome back to atomic reading')).toBeTruthy();
    expect(queryByTestId('email-input')).toBeNull();
    expect(queryByTestId('confirm-password-input')).toBeNull();
  });

  it('shows validation error if fields are empty during login submission', () => {
    const { getByTestId, getByText } = render(
      <AuthScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByTestId('submit-auth-button'));

    expect(getByText('Please fill in all fields')).toBeTruthy();
    expect(mockAuthStore.login).not.toHaveBeenCalled();
  });

  it('submits login successfully and calls goBack', async () => {
    mockAuthStore.login.mockResolvedValueOnce({ token: 'abc' });

    const { getByTestId } = render(
      <AuthScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByTestId('username-input'), 'myuser');
    fireEvent.changeText(getByTestId('password-input'), 'mypassword');
    fireEvent.press(getByTestId('submit-auth-button'));

    await waitFor(() => {
      expect(mockAuthStore.login).toHaveBeenCalledWith('myuser', 'mypassword');
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('shows validation error if email is invalid in registration', () => {
    const { getByTestId, getByText } = render(
      <AuthScreen navigation={mockNavigation} />
    );

    // Switch to Register
    fireEvent.press(getByTestId('signup-tab-button'));

    fireEvent.changeText(getByTestId('username-input'), 'newuser');
    fireEvent.changeText(getByTestId('email-input'), 'bad-email');
    fireEvent.changeText(getByTestId('password-input'), 'secret123');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'secret123');
    fireEvent.press(getByTestId('submit-auth-button'));

    expect(getByText('Please enter a valid email address')).toBeTruthy();
    expect(mockAuthStore.signup).not.toHaveBeenCalled();
  });

  it('shows validation error if passwords do not match during registration', () => {
    const { getByTestId, getByText } = render(
      <AuthScreen navigation={mockNavigation} />
    );

    // Switch to Register
    fireEvent.press(getByTestId('signup-tab-button'));

    fireEvent.changeText(getByTestId('username-input'), 'newuser');
    fireEvent.changeText(getByTestId('email-input'), 'new@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'secret123');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'different123');
    fireEvent.press(getByTestId('submit-auth-button'));

    expect(getByText('Passwords do not match')).toBeTruthy();
    expect(mockAuthStore.signup).not.toHaveBeenCalled();
  });

  it('submits signup successfully and calls goBack', async () => {
    mockAuthStore.signup.mockResolvedValueOnce({ token: 'xyz' });

    const { getByTestId } = render(
      <AuthScreen navigation={mockNavigation} />
    );

    // Switch to Register
    fireEvent.press(getByTestId('signup-tab-button'));

    fireEvent.changeText(getByTestId('username-input'), 'newuser');
    fireEvent.changeText(getByTestId('email-input'), 'new@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'secret123');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'secret123');
    fireEvent.press(getByTestId('submit-auth-button'));

    await waitFor(() => {
      expect(mockAuthStore.signup).toHaveBeenCalledWith('newuser', 'new@example.com', 'secret123');
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('displays store error banner when API returns error', () => {
    // Inject store error
    mockAuthStore.error = 'API error occurred';
    
    const { getByText } = render(
      <AuthScreen navigation={mockNavigation} />
    );

    expect(getByText('API error occurred')).toBeTruthy();
  });
});
