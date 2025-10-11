import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  birthday?: string;
  avatar?: string;
}

export interface OnboardingData {
  profile: {
    username: string;
    name: string;
    password: string;
    birthday: string;
    phone: string;
  };
  selectedStyles: string[];
  selectedGenres: string[];
  selectedBrands: string[];
  socialLinks: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
}

interface AuthStore {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  user: User | null;
  onboardingStep: number;
  onboardingData: Partial<OnboardingData>;
  isLoading: boolean;

  // Actions
  login: (method: 'email' | 'google' | 'line' | 'phone', data?: any) => Promise<void>;
  logout: () => Promise<void>;
  updateOnboardingStep: (step: number) => void;
  saveOnboardingData: (data: Partial<OnboardingData>) => void;
  completeOnboarding: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  skipOnboardingStep: () => void;
}

const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  ONBOARDING_COMPLETED: '@onboarding_completed',
  ONBOARDING_STEP: '@onboarding_step',
  ONBOARDING_DATA: '@onboarding_data',
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  user: null,
  onboardingStep: 0,
  onboardingData: {},
  isLoading: true,

  login: async (method, data) => {
    // Mock login - 実際のAPI呼び出しはなし
    const mockUser: User = {
      id: `user_${Date.now()}`,
      username: data?.username || 'newuser',
      name: data?.name || 'New User',
      email: method === 'email' ? data?.email : undefined,
      phone: method === 'phone' ? data?.phone : undefined,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'mock_token_' + Date.now());
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mockUser));

    set({
      isAuthenticated: true,
      user: mockUser,
      hasCompletedOnboarding: false,
      onboardingStep: 0,
    });
  },

  logout: async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      STORAGE_KEYS.ONBOARDING_STEP,
      STORAGE_KEYS.ONBOARDING_DATA,
    ]);

    set({
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      user: null,
      onboardingStep: 0,
      onboardingData: {},
    });
  },

  updateOnboardingStep: (step) => {
    set({ onboardingStep: step });
    AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_STEP, step.toString());
  },

  saveOnboardingData: (data) => {
    const currentData = get().onboardingData;
    const newData = { ...currentData, ...data };
    set({ onboardingData: newData });
    AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DATA, JSON.stringify(newData));
  },

  completeOnboarding: async () => {
    const { onboardingData, user } = get();

    // プロフィールデータからユーザー情報を更新
    const updatedUser: User = {
      ...user!,
      username: onboardingData.profile?.username || user!.username,
      name: onboardingData.profile?.name || user!.name,
      birthday: onboardingData.profile?.birthday,
      phone: onboardingData.profile?.phone,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

    set({
      hasCompletedOnboarding: true,
      user: updatedUser,
      onboardingStep: 0,
    });
  },

  checkAuthStatus: async () => {
    try {
      const [token, userData, onboardingCompleted, step] = await AsyncStorage.multiGet([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        STORAGE_KEYS.ONBOARDING_STEP,
      ]);

      const isAuthenticated = !!token[1];
      const user = userData[1] ? JSON.parse(userData[1]) : null;
      const hasCompletedOnboarding = onboardingCompleted[1] === 'true';
      const onboardingStep = step[1] ? parseInt(step[1], 10) : 0;

      set({
        isAuthenticated,
        user,
        hasCompletedOnboarding,
        onboardingStep,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to check auth status:', error);
      set({ isLoading: false });
    }
  },

  skipOnboardingStep: () => {
    const currentStep = get().onboardingStep;
    get().updateOnboardingStep(currentStep + 1);
  },
}));
