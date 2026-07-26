import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CustomUploadScreen from './CustomUploadScreen';
import useCustomUploadStore from '../store/customUploadStore';
import useFeedStore from '../store/feedStore';

jest.mock('../store/customUploadStore');
jest.mock('../store/feedStore');

const mockStore = {
  uploadCustomBook: jest.fn(),
  uploading: false,
  uploadError: null,
  uploadSuccess: false,
  resetUploadState: jest.fn(),
};

const mockFeedStore = {
  refresh: jest.fn(),
};

describe('CustomUploadScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCustomUploadStore.mockReturnValue(mockStore);
    useFeedStore.mockReturnValue(mockFeedStore.refresh);
  });

  it('renders input fields correctly', () => {
    const { getByTestId, getByText } = render(
      <CustomUploadScreen navigation={{ goBack: jest.fn() }} />
    );

    expect(getByText('Upload Custom Page')).toBeTruthy();
    expect(getByTestId('input-title')).toBeTruthy();
    expect(getByTestId('input-author')).toBeTruthy();
    expect(getByTestId('input-content')).toBeTruthy();
  });

  it('shows validation error when fields are empty on submit', async () => {
    const { getByTestId, getByText } = render(
      <CustomUploadScreen navigation={{ goBack: jest.fn() }} />
    );

    fireEvent.press(getByTestId('submit-button'));

    expect(getByText('Book title is required.')).toBeTruthy();
    expect(mockStore.uploadCustomBook).not.toHaveBeenCalled();
  });

  it('submits form successfully when values are provided', async () => {
    mockStore.uploadCustomBook.mockResolvedValueOnce(true);

    const { getByTestId } = render(
      <CustomUploadScreen navigation={{ goBack: jest.fn() }} />
    );

    fireEvent.changeText(getByTestId('input-title'), 'Moby Dick');
    fireEvent.changeText(getByTestId('input-author'), 'Herman Melville');
    fireEvent.changeText(getByTestId('input-content'), 'Call me Ishmael.');

    fireEvent.press(getByTestId('submit-button'));

    expect(mockStore.uploadCustomBook).toHaveBeenCalledWith({
      title: 'Moby Dick',
      author: 'Herman Melville',
      contentText: 'Call me Ishmael.',
    });
  });
});
