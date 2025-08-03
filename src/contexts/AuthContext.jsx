import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken')); // Initialize from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken')); // Check if token exists
  const [isLoading, setIsLoading] = useState(true); // Start with loading true to check localStorage
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      // Optional: Verify token with backend here and fetch fresh user data
      // For now, we trust localStorage. If token is invalid, backend will reject API calls.
    }
    setIsLoading(false); // Finished initial check
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/auth/login', credentials);
      console.log("Qaisar User" , response);
      
      setUser(response.user);
      setAuthToken(response.token);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('authToken', response.data.token);
      return response;
    } catch (err) {
      console.error('Login failed:', err);
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      setAuthToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      throw new Error(errorMessage); // Re-throw custom error message
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/auth/signup', userData);
      // Does not auto-login as per requirements
      return response;
    } catch (err) {
      console.error('Signup failed:', err);
      const errorMessage = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    setIsAuthenticated(false);
    setError(null); // Clear any previous auth errors
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    navigate('/login'); // Navigate to login page
  };

  const changePassword = async (passwordData) => {
    // This function could also be called directly from Settings page using api.post
    // If part of context, it needs to handle loading/error states specific to this action
    // For now, let's assume it will be called directly via api.post in Settings.jsx
    // as the subtask description for Settings.jsx implies.
    // If it were here:
    // setIsLoading(true); // Or a specific loading state like isChangingPassword
    // setError(null);
    try {
      const response = await api.post('/auth/change-password', passwordData);
      return response;
    } catch (err) {
      console.error('Change password failed:', err);
      const errorMessage = err.response?.data?.message || 'Password change failed.';
      // setError(errorMessage); // Or a specific error state
      throw new Error(errorMessage);
    } finally {
      // setIsLoading(false); // Or a specific loading state
    }
  };

  // Add refreshUser function
  const refreshUser = async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/api/auth/user/${user._id}`);
      if (res && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      authToken, 
      isAuthenticated, 
      isLoading, 
      error, 
      login, 
      signup, 
      logout, 
      changePassword, // Added changePassword
      setError, // Expose setError to allow clearing errors from components
      setUser, // Expose setUser for manual updates
      refreshUser // Expose refreshUser for forced updates
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
