import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = "http://192.168.1.14:5001/api" // Update with your production URL

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add token
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (username: string, email: string, password: string, isManager: boolean) => {
    const response = await api.post('/auth/register', {
      username,
      email,
      password,
      is_manager: isManager,
      client_type:"mobile"
    });
    return response.data;
  },

  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', {
      username,
      password,
      client_type:"mobile"
    });
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  saveToken: async (token: string) => {
    await AsyncStorage.setItem('token', token);
  },

  saveUser: async (user: any) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  },

  getToken: async () => {
    return await AsyncStorage.getItem('token');
  },

  getUser: async () => {
    const userString = await AsyncStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  },
};

// Attendance API
export const attendanceAPI = {
  checkIn: async (imageUri: string, latitude?: number, longitude?: number) => {
    const formData = new FormData();
    
    // Create file object for FormData
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    // Add location if provided
    if (latitude !== undefined && longitude !== undefined) {
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
    }

    const response = await api.post('/attendance/check-in', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  checkOut: async (imageUri: string, latitude: number, longitude: number) => {
    const formData = new FormData();
    
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());

    const response = await api.post('/attendance/check-out', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getRecords: async (page: number = 1, perPage: number = 10) => {
    const response = await api.get('/attendance/records', {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/attendance/stats');
    return response.data;
  },
};

export default api;

