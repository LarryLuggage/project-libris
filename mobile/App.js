import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import useInteractionStore from './src/store/interactionStore';
import useOnboardingStore from './src/store/onboardingStore';
import FeedScreen from './src/screens/FeedScreen';
import BookDetailScreen from './src/screens/BookDetailScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import CustomUploadScreen from './src/screens/CustomUploadScreen';
import AuthScreen from './src/screens/AuthScreen';
import StoryClubScreen from './src/screens/StoryClubScreen';
import { getTheme } from './src/config/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const initialize = useInteractionStore((state) => state.initialize);
  const onboardingCompleted = useOnboardingStore((state) => state.onboardingCompleted);
  const selectedTheme = useOnboardingStore((state) => state.selectedTheme);
  
  const theme = getTheme(selectedTheme);

  // Load Google Fonts dynamically
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular_Italic,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!fontsLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {!onboardingCompleted ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : (
            <>
              <Stack.Screen name="Feed" component={FeedScreen} />
              <Stack.Screen name="Auth" component={AuthScreen} />
              <Stack.Screen
                name="StoryClub"
                component={StoryClubScreen}
                options={{
                  headerShown: true,
                  headerTitle: 'Story Club',
                  headerStyle: {
                    backgroundColor: theme.cardBg,
                  },
                  headerTintColor: theme.primary,
                  headerTitleStyle: {
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 16,
                  },
                  headerBackTitle: 'Back',
                  headerBackTitleStyle: {
                    fontFamily: 'Inter_400Regular',
                  },
                }}
              />
              <Stack.Screen
                name="CustomUpload"
                component={CustomUploadScreen}
                options={{
                  headerShown: true,
                  headerTitle: 'Upload Page',
                  headerStyle: {
                    backgroundColor: theme.cardBg,
                  },
                  headerTintColor: theme.primary,
                  headerTitleStyle: {
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 16,
                  },
                  headerBackTitle: 'Back',
                  headerBackTitleStyle: {
                    fontFamily: 'Inter_400Regular',
                  },
                }}
              />
              <Stack.Screen
                name="BookDetail"
                component={BookDetailScreen}
                options={({ route }) => ({
                  headerShown: true,
                  headerTitle: route.params?.bookTitle || 'Book Details',
                  headerStyle: {
                    backgroundColor: theme.cardBg,
                  },
                  headerTintColor: theme.primary,
                  headerTitleStyle: {
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 16,
                  },
                  headerBackTitle: 'Back',
                  headerBackTitleStyle: {
                    fontFamily: 'Inter_400Regular',
                  },
                })}
              />
            </>
          )}
        </Stack.Navigator>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
