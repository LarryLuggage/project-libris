import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useInteractionStore from './src/store/interactionStore';
import FeedScreen from './src/screens/FeedScreen';
import BookDetailScreen from './src/screens/BookDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const initialize = useInteractionStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Feed" component={FeedScreen} />
        <Stack.Screen
          name="BookDetail"
          component={BookDetailScreen}
          options={({ route }) => ({
            headerShown: true,
            headerTitle: route.params?.bookTitle || 'Book Details',
            headerStyle: {
              backgroundColor: '#FFF',
            },
            headerTintColor: '#8B4513',
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerBackTitle: 'Back',
          })}
        />
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}
