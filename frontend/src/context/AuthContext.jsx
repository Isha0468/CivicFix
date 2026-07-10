import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

// Configure backend base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Sync token to Axios header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token]);

  // Load user details on startup
  useEffect(() => {
    const checkUserSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Fetch fresh profile from API to ensure sync
        const response = await axios.get(`${API_URL}/auth/profile`);
        if (response.data.success) {
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.error('Session validation failed:', error);
        // Token has expired or failed, log out
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (response.data.success) {
        const { token: userToken, user: userData } = response.data;
        setToken(userToken);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true, user: userData };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Register handler
  const register = async (name, email, password, phone) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, password, phone });
      if (response.data.success) {
        const { token: userToken, user: userData } = response.data;
        setToken(userToken);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success(`Account registered! Welcome to CivicFix, ${name}.`);
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'Registration failed.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Update profile details
  const updateProfile = async (name, phone, password) => {
    try {
      const body = { name, phone };
      if (password) body.password = password;

      const response = await axios.put(`${API_URL}/auth/profile`, body);
      if (response.data.success) {
        const updated = response.data.user;
        // Merge avatar from active state since endpoint doesn't change it
        updated.avatar = user.avatar;
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        toast.success('Profile updated successfully.');
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update profile.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Upload profile photo
  const updateAvatar = async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post(`${API_URL}/auth/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        const newAvatarUrl = response.data.avatar;
        const updatedUser = { ...user, avatar: newAvatarUrl };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Avatar uploaded successfully!');
        return { success: true, avatar: newAvatarUrl };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Avatar upload failed.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Logout handler
  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully.');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
