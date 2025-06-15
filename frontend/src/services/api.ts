import axios from 'axios';

const baseURL = 'http://localhost:3000'; // Replace with your backend URL

const api = axios.create({
  baseURL: baseURL,
  timeout: 10000, // Optional timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle error globally
    console.error('API Error:', error);
    throw error; // Re-throw to be caught by the component
  }
);

export default api;
