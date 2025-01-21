import { LoginCredentials, LoginResponse, Patient, Prescription } from '../types';

const API_URL = 'https://stage.app.medlucy.com/api';

interface RequestOptions extends RequestInit {
  headers?: HeadersInit;
}

const getToken = async (): Promise<string | null> => {
  try {
    const { token } = await window.electron.getToken();
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const api = {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = await getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}`}),
      ...options.headers,
    };

    const config: RequestOptions = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(response.status, data.message || 'API request failed');
      }
      
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('API request failed');
    }
  },

  auth: {
    login: (credentials: LoginCredentials) => 
      api.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
  },
};

export default api;