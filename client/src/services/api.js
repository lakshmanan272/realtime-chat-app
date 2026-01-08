import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  updateProfile: (id, data) => api.put(`/users/${id}`, data),
};

// Rooms API
export const roomsAPI = {
  getPublic: () => api.get('/rooms/public'),
  getMyRooms: () => api.get('/rooms/my-rooms'),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  join: (id) => api.post(`/rooms/${id}/join`),
  leave: (id) => api.delete(`/rooms/${id}/leave`),
  getMembers: (id) => api.get(`/rooms/${id}/members`),
};

// Messages API
export const messagesAPI = {
  getRoomMessages: (roomId, params) => api.get(`/messages/room/${roomId}`, { params }),
  getPrivateMessages: (userId, params) => api.get(`/messages/private/${userId}`, { params }),
  uploadFile: (formData) => {
    return api.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;
