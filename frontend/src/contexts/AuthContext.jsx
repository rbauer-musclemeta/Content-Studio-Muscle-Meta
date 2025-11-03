import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const AUTH_API = `${BACKEND_URL}/api/auth`;

const AuthContext = createContext(null);

/**
 * AuthProvider component to wrap the app and provide authentication state
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));

  /**
   * Load user data from token on mount
   */
  useEffect(() => {
    if (token) {
      // Verify token and load user data
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  /**
   * Verify the current token and load user data
   */
  const verifyToken = async () => {
    try {
      const response = await axios.get(`${AUTH_API}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Token verification failed:', error);
      // Clear invalid token
      logout();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new user
   * @param {Object} userData - User registration data (email, password, full_name)
   * @returns {Promise<Object>} - User data and token
   */
  const register = async (userData) => {
    try {
      const response = await axios.post(`${AUTH_API}/register`, userData);
      const { access_token, user: newUser } = response.data;

      // Store token and user data
      setToken(access_token);
      setUser(newUser);
      localStorage.setItem('auth_token', access_token);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration failed:', error);
      const message = error.response?.data?.detail || 'Registration failed';
      return { success: false, error: message };
    }
  };

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User data and token
   */
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${AUTH_API}/login`, {
        email,
        password
      });
      const { access_token, user: loggedInUser } = response.data;

      // Store token and user data
      setToken(access_token);
      setUser(loggedInUser);
      localStorage.setItem('auth_token', access_token);

      return { success: true, user: loggedInUser };
    } catch (error) {
      console.error('Login failed:', error);
      const message = error.response?.data?.detail || 'Login failed';
      return { success: false, error: message };
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  /**
   * Update user profile
   * @param {Object} updateData - Data to update (full_name, email, password)
   * @returns {Promise<Object>} - Updated user data
   */
  const updateProfile = async (updateData) => {
    try {
      const response = await axios.put(`${AUTH_API}/me`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUser(response.data);
      return { success: true, user: response.data };
    } catch (error) {
      console.error('Profile update failed:', error);
      const message = error.response?.data?.detail || 'Profile update failed';
      return { success: false, error: message };
    }
  };

  /**
   * Get authorization header for API requests
   * @returns {Object} - Headers object with Authorization
   */
  const getAuthHeaders = () => {
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`
    };
  };

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  const isAdmin = () => {
    return user?.is_admin === true;
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    updateProfile,
    getAuthHeaders,
    isAuthenticated,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 * @returns {Object} - Authentication context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
