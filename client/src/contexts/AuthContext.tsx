/**
 * AuthContext: session, sign-up flow and the signed-in user's profile.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, ProfileSetupData, VehicleRegistrationData } from '../types';
import api, { STORAGE_KEY, UNAUTHORIZED_EVENT, errorMessage } from '../services/api';

type Result = { success: boolean; message?: string };

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  handleLogin: (phone: string, password: string) => Promise<Result>;
  /** Step 1 of sign-up: keeps the credentials in memory and moves on to profile setup. */
  handleSignup: (phone: string, password: string) => Result;
  handleLogout: () => void;
  /** Saves name and vehicles to the server and updates the local copy. */
  saveProfile: (draft: Pick<UserProfile, 'name' | 'twoWheelers' | 'fourWheelers'>) => Promise<Result>;
  /** True between sign-up step 1 and account creation. */
  hasPendingSignup: boolean;
  profileSetupData: ProfileSetupData | null;
  startProfileSetup: (data: ProfileSetupData) => void;
  completeProfileSetup: (data: VehicleRegistrationData) => Promise<Result>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2)}`;
  return phone;
};

// Everything the app caches for a signed-in user. Cleared on logout.
const CACHE_KEYS = [STORAGE_KEY, 'tripsync-savedRoutes', 'tripsync-trips'];

const toVehicle = (v: any) => ({ id: String(v.id ?? v._id), regNumber: v.regNumber });

const toProfile = (data: any): UserProfile => ({
  name: data.name,
  phone: data.phone,
  twoWheelers: (data.twoWheelers || []).map(toVehicle),
  fourWheelers: (data.fourWheelers || []).map(toVehicle),
  token: data.token,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [profileSetupData, setProfileSetupData] = useState<ProfileSetupData | null>(null);

  // The password only lives in memory between the two sign-up steps.
  const pendingCredentials = useRef<{ phone: string; password: string } | null>(null);
  const [hasPendingSignup, setHasPendingSignup] = useState(false);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable (private mode); the session just won't survive a reload
    }
  }, [user]);

  const clearSession = useCallback(() => {
    CACHE_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    });
    pendingCredentials.current = null;
    setHasPendingSignup(false);
    setProfileSetupData(null);
    setUser(null);
  }, []);

  const handleLogout = useCallback(() => {
    clearSession();
    navigate('/login');
  }, [clearSession, navigate]);

  // The API client fires this when the server rejects our token.
  useEffect(() => {
    const onUnauthorized = () => {
      clearSession();
      navigate('/login', { replace: true });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearSession, navigate]);

  const handleLogin = useCallback(
    async (phone: string, password: string): Promise<Result> => {
      setIsLoading(true);
      try {
        const { data } = await api.post('/auth/login', { phone: normalizePhone(phone), password });
        setUser(toProfile(data));
        navigate('/');
        return { success: true };
      } catch (error) {
        return { success: false, message: errorMessage(error, 'Login failed. Please try again.') };
      } finally {
        setIsLoading(false);
      }
    },
    [navigate],
  );

  const handleSignup = useCallback(
    (phone: string, password: string): Result => {
      pendingCredentials.current = { phone, password };
      setHasPendingSignup(true);
      navigate('/profile/setup-1');
      return { success: true };
    },
    [navigate],
  );

  const startProfileSetup = useCallback(
    (data: ProfileSetupData) => {
      setProfileSetupData(data);
      navigate('/profile/setup-2');
    },
    [navigate],
  );

  const completeProfileSetup = useCallback(
    async (vehicles: VehicleRegistrationData): Promise<Result> => {
      const credentials = pendingCredentials.current;
      if (!credentials || !profileSetupData) {
        navigate('/signup', { replace: true });
        return { success: false, message: 'Your sign-up session expired. Start again from the beginning.' };
      }

      const stamp = Date.now();
      const twoWheelers = vehicles.twoWheelers.map((reg, i) => ({ id: `tw-${stamp}-${i}`, regNumber: reg.trim().toUpperCase() }));
      const fourWheelers = vehicles.fourWheelers.map((reg, i) => ({ id: `fw-${stamp}-${i}`, regNumber: reg.trim().toUpperCase() }));

      setIsLoading(true);
      try {
        const { data } = await api.post('/auth/signup', {
          name: profileSetupData.name.trim(),
          phone: normalizePhone(credentials.phone),
          password: credentials.password,
          twoWheelers,
          fourWheelers,
        });
        pendingCredentials.current = null;
        setHasPendingSignup(false);
        setProfileSetupData(null);
        setUser(toProfile(data));
        navigate('/');
        return { success: true };
      } catch (error) {
        return { success: false, message: errorMessage(error, 'Could not create your account. Please try again.') };
      } finally {
        setIsLoading(false);
      }
    },
    [profileSetupData, navigate],
  );

  const saveProfile = useCallback(
    async (draft: Pick<UserProfile, 'name' | 'twoWheelers' | 'fourWheelers'>): Promise<Result> => {
      try {
        const { data } = await api.patch('/auth/profile', {
          name: draft.name.trim(),
          twoWheelers: draft.twoWheelers.map(({ id, regNumber }) => ({ id, regNumber: regNumber.trim() })),
          fourWheelers: draft.fourWheelers.map(({ id, regNumber }) => ({ id, regNumber: regNumber.trim() })),
        });
        setUser((prev) => (prev ? { ...toProfile(data), token: prev.token } : prev));
        return { success: true };
      } catch (error) {
        return { success: false, message: errorMessage(error, 'Could not save your changes.') };
      }
    },
    [],
  );

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    handleLogin,
    handleSignup,
    handleLogout,
    saveProfile,
    hasPendingSignup,
    profileSetupData,
    startProfileSetup,
    completeProfileSetup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
