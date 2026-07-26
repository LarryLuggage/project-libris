import axios from 'axios';
import useAuthStore from './authStore';

jest.mock('axios');

// Capture the interceptor function when the module is first required
const interceptorFn = axios.interceptors.request.use.mock.calls[0]?.[0];

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      token: null,
      user: null,
      loading: false,
      error: null,
    });
  });

  it('starts with default empty state', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('performs successful signup', async () => {
    const mockResponse = {
      data: {
        access_token: 'test-jwt-token',
        username: 'testuser',
        user_id: 1,
      },
    };
    axios.post.mockResolvedValueOnce(mockResponse);

    const result = await useAuthStore.getState().signup('testuser', 'test@example.com', 'password123');

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/signup'),
      {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }
    );
    expect(result).toEqual(mockResponse.data);
    expect(useAuthStore.getState().token).toBe('test-jwt-token');
    expect(useAuthStore.getState().user).toEqual({ username: 'testuser', user_id: 1 });
    expect(useAuthStore.getState().loading).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('handles signup failure', async () => {
    const mockError = {
      response: {
        data: {
          detail: 'Username already exists',
        },
      },
    };
    axios.post.mockRejectedValueOnce(mockError);

    await expect(
      useAuthStore.getState().signup('testuser', 'test@example.com', 'password123')
    ).rejects.toThrow('Username already exists');

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().loading).toBe(false);
    expect(useAuthStore.getState().error).toBe('Username already exists');
  });

  it('performs successful login', async () => {
    const mockResponse = {
      data: {
        access_token: 'login-jwt-token',
        username: 'loginuser',
        user_id: 2,
      },
    };
    axios.post.mockResolvedValueOnce(mockResponse);

    const result = await useAuthStore.getState().login('loginuser', 'password123');

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/login'),
      {
        username: 'loginuser',
        password: 'password123',
      }
    );
    expect(result).toEqual(mockResponse.data);
    expect(useAuthStore.getState().token).toBe('login-jwt-token');
    expect(useAuthStore.getState().user).toEqual({ username: 'loginuser', user_id: 2 });
    expect(useAuthStore.getState().loading).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('handles login failure', async () => {
    const mockError = {
      response: {
        data: {
          detail: 'Invalid credentials',
        },
      },
    };
    axios.post.mockRejectedValueOnce(mockError);

    await expect(
      useAuthStore.getState().login('loginuser', 'wrongpassword')
    ).rejects.toThrow('Invalid credentials');

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().loading).toBe(false);
    expect(useAuthStore.getState().error).toBe('Invalid credentials');
  });

  it('resets token and user state on logout', () => {
    useAuthStore.setState({
      token: 'some-token',
      user: { username: 'test' },
      error: 'some-error',
    });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('intercepts request to add auth headers when token is set', () => {
    expect(interceptorFn).toBeDefined();

    // Case 1: No token
    useAuthStore.setState({ token: null });
    const configWithoutToken = { headers: {} };
    const resultConfig1 = interceptorFn(configWithoutToken);
    expect(resultConfig1.headers.Authorization).toBeUndefined();

    // Case 2: Token is present
    useAuthStore.setState({ token: 'jwt-auth-header-token' });
    const configWithToken = { headers: {} };
    const resultConfig2 = interceptorFn(configWithToken);
    expect(resultConfig2.headers.Authorization).toBe('Bearer jwt-auth-header-token');
  });
});
