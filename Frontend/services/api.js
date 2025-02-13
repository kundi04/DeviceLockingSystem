import axios from 'axios';


const API_URL = 'http://127.0.0.1:5002'; // Ensure this URL is correct



// Create an Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to login admin
export const loginAdmin = async (username, password) => {
  try {
    const response = await api.post('/admin-login', { username, password });
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Function to lock a device
export const lockDevice = async (deviceId) => {
  try {
    const response = await api.post('/lock-device', { deviceId });
    return response.data;
  } catch (error) {
    console.error('Error locking device:', error);
    throw error;
  }
};

// Other API functions can be added here as needed

export default api;
