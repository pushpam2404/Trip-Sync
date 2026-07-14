/**
 * AuthContext — Handles authentication state and user profile management.
 * Split from the original monolithic AppContext for better separation of concerns.
 */
import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Vehicle, ProfileSetupData, VehicleRegistrationData } from '../types';
import api from '../services/api';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  handleLogin: (phone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  handleSignup: (phone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  handleLogout: () => void;
  setUser: (user: UserProfile | null) => void;
  updateVehicle: (params: { type: 'twoWheelers' | 'fourWheelers'; vehicle: Vehicle }) => void;
  profileSetupData: ProfileSetupData | null;
  startProfileSetup: (data: ProfileSetupData) => void;
  completeProfileSetup: (data: VehicleRegistrationData) => void;
  skipProfileSetup: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  // Hydrate from localStorage
  const [user, setUserState] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('tripsync-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [profileSetupData, setProfileSetupData] = useState<ProfileSetupData | null>(null);

  // Persist user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('tripsync-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tripsync-user');
    }
  }, [user]);

  const setUser = useCallback((newUser: UserProfile | null) => {
    setUserState(newUser);
  }, []);

  const handleLogin = useCallback(async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { phone, password });
      const userData = response.data;
      setUserState({
        name: userData.name,
        phone: userData.phone,
        twoWheelers: userData.twoWheelers || [],
        fourWheelers: userData.fourWheelers || [],
        token: userData.token,
      });
      navigate('/');
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const handleSignup = useCallback(async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      // Store credentials temporarily — profile setup comes next
      const tempData = { phone, password };
      localStorage.setItem('tripsync-signup-temp', JSON.stringify(tempData));
      navigate('/profile/setup-1');
      return { success: true };
    } catch (error: any) {
      return { success: false, message: 'Signup failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const startProfileSetup = useCallback((data: ProfileSetupData) => {
    setProfileSetupData(data);
    navigate('/profile/setup-2');
  }, [navigate]);

  const completeProfileSetup = useCallback(async (vehicleData: VehicleRegistrationData) => {
    setIsLoading(true);
    try {
      const tempData = JSON.parse(localStorage.getItem('tripsync-signup-temp') || '{}');
      if (!tempData.phone || !tempData.password || !profileSetupData) {
        return;
      }

      const twoWheelers = vehicleData.twoWheelers.map((reg, i) => ({
        id: `tw-${Date.now()}-${i}`,
        regNumber: reg.toUpperCase(),
      }));

      const fourWheelers = vehicleData.fourWheelers.map((reg, i) => ({
        id: `fw-${Date.now()}-${i}`,
        regNumber: reg.toUpperCase(),
      }));

      const response = await api.post('/auth/signup', {
        name: profileSetupData.name,
        phone: tempData.phone,
        password: tempData.password,
        twoWheelers,
        fourWheelers,
      });

      const userData = response.data;
      localStorage.removeItem('tripsync-signup-temp');
      setProfileSetupData(null);

      setUserState({
        name: userData.name,
        phone: userData.phone,
        twoWheelers: userData.twoWheelers || [],
        fourWheelers: userData.fourWheelers || [],
        token: userData.token,
      });

      navigate('/');
    } catch (error: any) {
      console.error('Profile setup failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profileSetupData, navigate]);

  const skipProfileSetup = useCallback(() => {
    // Complete with no vehicles
    completeProfileSetup({ twoWheelers: [], fourWheelers: [] });
  }, [completeProfileSetup]);

  const handleLogout = useCallback(() => {
    // Clear all persisted data
    const keysToRemove = [
      'tripsync-user',
      'tripsync-savedRoutes',
      'tripsync-trips',
      'tripsync-activeTab',
      'tripsync-signup-temp',
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    setUserState(null);
    navigate('/login');
  }, [navigate]);

  const updateVehicle = useCallback(({ type, vehicle }: { type: 'twoWheelers' | 'fourWheelers'; vehicle: Vehicle }) => {
    setUserState(prev => {
      if (!prev) return null;
      const updatedList = prev[type].map(v =>
        v.id === vehicle.id ? { ...v, regNumber: vehicle.regNumber } : v
      );
      return { ...prev, [type]: updatedList };
    });
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    handleLogin,
    handleSignup,
    handleLogout,
    setUser,
    updateVehicle,
    profileSetupData,
    startProfileSetup,
    completeProfileSetup,
    skipProfileSetup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
