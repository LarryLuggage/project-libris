import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, null, name);
  },
}));
