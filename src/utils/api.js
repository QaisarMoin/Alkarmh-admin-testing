import axios from 'axios';

const apiClient = axios.create({

//baseURL: 'http://localhost:4000', // Make sure this matches your backend URL
baseURL: 'https://server.alkaramh.com', // Make sure this matches your backend URL

});

// Add a request interceptor to include the token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Do something with request error
    console.error('Request error interceptor:', error); // Log the request error
    return Promise.reject(error);
  }
);

// Optional: Add a response interceptor for global error handling (e.g., 401 redirects)
apiClient.interceptors.response.use(
  (response) => response, // Simply return the response if it's successful
  (error) => {
    if (error.response.status === 401){
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    // Handle global errors here
    console.error('Response error interceptor:', error.response || error.message || error);
    // Example: if (error.response && error.response.status === 401) { /* redirect to login */ }
    return Promise.reject(error); // Important to re-throw the error so it can be caught by the calling function
  }
);


export const get = async (path, params = {}) => {
  try {
    const response = await apiClient.get(path, { params });
    return response.data;
  } catch (error) {
    // Error is already logged by the interceptor, but can add more specific logging here if needed
    // console.error(`GET request to ${path} failed:`, error.response?.data || error.message);
    throw error; // Re-throw to be caught by the calling function
  }
};

export const post = async (path, data = {}) => {
  try {
    const response = await apiClient.post(path, data);
    return response.data;
  } catch (error) {
    // console.error(`POST request to ${path} failed:`, error.response?.data || error.message);
    throw error;
  }
};

export const put = async (path, data = {}) => {
  try {
    const response = await apiClient.put(path, data);
    return response.data;
  } catch (error) {
    // console.error(`PUT request to ${path} failed:`, error.response?.data || error.message);
    throw error;
  }
};

// Using 'del' as 'delete' is a reserved keyword
export const del = async (path) => {
  try {
    const response = await apiClient.delete(path);
    return response.data;
  } catch (error) {
    // console.error(`DELETE request to ${path} failed:`, error.response?.data || error.message);
    throw error;
  }
};

// OTP Email APIs
export const sendOtpByEmail = async (email) => {
  return post('/api/auth/send-otp-email', { email });
};

export const verifyOtpByEmail = async (email, otp) => {
  return post('/api/auth/verify-otp-email', { email, otp });
};

export const forgotPasswordRequest = async (email) => {
  return post('/api/auth/forgot-password-request', { email });
};

export const forgotPasswordVerifyOtp = async (email, otp) => {
  return post('/api/auth/forgot-password-verify-otp', { email, otp });
};

export const resetPassword = async (email, newPassword) => {
  return post('/api/auth/reset-password', { email, newPassword });
};
