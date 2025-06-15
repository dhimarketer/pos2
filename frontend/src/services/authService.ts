import api from './api';

const register = async (userData: any) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

const login = async (credentials: any) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

const authService = {
  register,
  login,
};

export default authService;
