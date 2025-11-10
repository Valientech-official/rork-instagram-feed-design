/**
 * Authentication Store - Mock Implementation for Expo Go
 * No AWS Cognito (for development with Expo Go)
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// =====================================================
// Types
// =====================================================

export interface User {
  userId: string;
  username: string;
  email: string;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneNumberVerified: boolean;
  handle?: string;
  accountType?: string;
  accountId?: string;
  name?: string;
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

export interface SignUpParams {
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  handle: string;
  name?: string;
  birthday?: string;
}

interface AuthStore {
  // State
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  user: User | null;
  onboardingStep: number;
  onboardingData: Partial<OnboardingData>;
  isLoading: boolean;
  error: string | null;

  // Cognito Auth Actions
  signUp: (params: SignUpParams) => Promise<{ success: boolean; username: string }>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  resendConfirmationCode: (username: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  forgotPassword: (username: string) => Promise<void>;
  confirmResetPassword: (username: string, code: string, newPassword: string) => Promise<void>;

  // Onboarding Actions
  updateOnboardingStep: (step: number) => void;
  saveOnboardingData: (data: Partial<OnboardingData>) => void;
  completeOnboarding: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  skipOnboardingStep: () => void;

  // Utility Actions
  clearError: () => void;
}

// =====================================================
// Storage Keys
// =====================================================

const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  ONBOARDING_COMPLETED: '@onboarding_completed',
  ONBOARDING_STEP: '@onboarding_step',
  ONBOARDING_DATA: '@onboarding_data',
};

// =====================================================
// Error Messages (Japanese)
// =====================================================

const ERROR_MESSAGES: Record<string, string> = {
  UserNotFoundException: 'ユーザーが見つかりません',
  NotAuthorizedException: 'ユーザー名またはパスワードが間違っています',
  UsernameExistsException: 'このユーザー名は既に使用されています',
  InvalidPasswordException: 'パスワードが要件を満たしていません',
  InvalidParameterException: '入力内容が正しくありません',
  CodeMismatchException: '確認コードが間違っています',
  ExpiredCodeException: '確認コードの有効期限が切れています',
  LimitExceededException: '試行回数が上限に達しました。しばらく待ってから再試行してください',
  UserNotConfirmedException: 'メールアドレスの確認が完了していません',
};

function getErrorMessage(error: any): string {
  if (error?.name && ERROR_MESSAGES[error.name]) {
    return ERROR_MESSAGES[error.name];
  }
  return error?.message || '予期しないエラーが発生しました';
}

// =====================================================
// Zustand Store
// =====================================================

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial State
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  user: null,
  onboardingStep: 0,
  onboardingData: {},
  isLoading: true,
  error: null,

  // =====================================================
  // Cognito Auth Actions
  // =====================================================

  /**
   * サインアップ（モック実装 - Expo Go用）
   */
  signUp: async (params: SignUpParams) => {
    try {
      set({ isLoading: true, error: null });

      const { username, email, password, phoneNumber, handle, name, birthday } = params;

      console.log('📝 Mock SignUp params:', {
        username,
        email,
        phoneNumber,
        handle,
        name,
        birthday,
      });

      // モックユーザーを作成
      const mockUser: User = {
        userId: `mock_${Date.now()}`,
        username,
        email,
        emailVerified: true, // モックでは検証済みとして扱う
        phoneNumber,
        phoneNumberVerified: true,
        handle,
        name,
      };

      // ローカルストレージに保存
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mockUser));
      await AsyncStorage.setItem(`@user_credentials_${username}`, JSON.stringify({ username, password }));

      console.log('✅ Mock SignUp successful:', mockUser);

      set({ isLoading: false });
      return { success: true, username };
    } catch (error: any) {
      console.error('❌ Mock SignUp failed:', error);
      const errorMessage = error?.message || '予期しないエラーが発生しました';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  /**
   * メール確認コード送信（モック実装）
   */
  confirmSignUp: async (username: string, code: string) => {
    try {
      set({ isLoading: true, error: null });

      console.log('✅ Mock Confirm SignUp successful (any code accepted)');

      set({ isLoading: false });
    } catch (error: any) {
      console.error('❌ Mock Confirm SignUp failed:', error);
      const errorMessage = error?.message || '予期しないエラーが発生しました';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  /**
   * 確認コード再送信（モック実装）
   */
  resendConfirmationCode: async (username: string) => {
    try {
      set({ isLoading: true, error: null });

      console.log('✅ Mock confirmation code resent');
      set({ isLoading: false });
    } catch (error: any) {
      console.error('❌ Mock resend confirmation code failed:', error);
      const errorMessage = error?.message || '予期しないエラーが発生しました';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  /**
   * サインイン（モック実装）
   */
  signIn: async (username: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      // 保存された認証情報を確認
      const credentialsJson = await AsyncStorage.getItem(`@user_credentials_${username}`);
      const credentials = credentialsJson ? JSON.parse(credentialsJson) : null;

      // パスワードチェック（認証情報がある場合のみ）
      if (credentials && credentials.password !== password) {
        set({ error: 'ユーザー名またはパスワードが間違っています', isLoading: false });
        throw new Error('ユーザー名またはパスワードが間違っています');
      }

      // ユーザーデータを取得または作成
      let userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      let user: User;

      if (userJson) {
        user = JSON.parse(userJson);
      } else {
        // 新規ユーザーの場合はモックユーザーを作成
        user = {
          userId: `mock_${Date.now()}`,
          username,
          email: credentials?.email || `${username}@example.com`,
          emailVerified: true,
          phoneNumberVerified: false,
        };
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      }

      console.log('✅ Mock SignIn successful:', user);

      // オンボーディング状態を取得
      const onboardingCompleted = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      const onboardingStep = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP);

      set({
        isAuthenticated: true,
        user,
        hasCompletedOnboarding: onboardingCompleted === 'true',
        onboardingStep: onboardingStep ? parseInt(onboardingStep, 10) : 0,
        isLoading: false
      });
    } catch (error: any) {
      console.error('❌ Mock SignIn failed:', error);
      const errorMessage = error?.message || 'ログインに失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  /**
   * サインアウト（モック実装）
   */
  signOut: async () => {
    try {
      set({ isLoading: true, error: null });

      // ローカルストレージをクリア
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        STORAGE_KEYS.ONBOARDING_STEP,
        STORAGE_KEYS.ONBOARDING_DATA,
      ]);

      console.log('✅ Mock SignOut successful');

      set({
        isAuthenticated: false,
        hasCompletedOnboarding: false,
        user: null,
        onboardingStep: 0,
        onboardingData: {},
        isLoading: false,
      });
    } catch (error: any) {
      console.error('❌ Mock SignOut failed:', error);
      set({ isLoading: false });
    }
  },

  /**
   * 現在のユーザー情報を更新（モック実装）
   */
  refreshUser: async () => {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

      if (!userJson) {
        throw new Error('No user data found');
      }

      const user: User = JSON.parse(userJson);
      set({ user });

      console.log('✅ Mock User refreshed:', user);
    } catch (error: any) {
      throw error; // checkAuthStatus()のtry-catchで処理
    }
  },

  /**
   * パスワードリセット開始（モック実装）
   */
  forgotPassword: async (username: string) => {
    try {
      set({ isLoading: true, error: null });

      console.log('✅ Mock password reset code sent');
      set({ isLoading: false });
    } catch (error: any) {
      console.error('❌ Mock forgot password failed:', error);
      const errorMessage = error?.message || '予期しないエラーが発生しました';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  /**
   * パスワードリセット確定（モック実装）
   */
  confirmResetPassword: async (username: string, code: string, newPassword: string) => {
    try {
      set({ isLoading: true, error: null });

      // パスワードを更新
      const credentialsJson = await AsyncStorage.getItem(`@user_credentials_${username}`);
      if (credentialsJson) {
        const credentials = JSON.parse(credentialsJson);
        credentials.password = newPassword;
        await AsyncStorage.setItem(`@user_credentials_${username}`, JSON.stringify(credentials));
      }

      console.log('✅ Mock password reset successful');
      set({ isLoading: false });
    } catch (error: any) {
      console.error('❌ Mock confirm reset password failed:', error);
      const errorMessage = error?.message || '予期しないエラーが発生しました';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  // =====================================================
  // Onboarding Actions (既存機能の維持)
  // =====================================================

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
      name: onboardingData.profile?.name || user!.name,
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
      set({ isLoading: true });

      // ローカルストレージから読み込み
      try {
        await get().refreshUser();

        const onboardingCompleted = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
        const onboardingStep = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP);

        console.log('📊 Mock checkAuthStatus - AsyncStorage values:', {
          onboardingCompleted,
          onboardingStep,
          parsedStep: onboardingStep ? parseInt(onboardingStep, 10) : 0,
        });

        // メール確認済みユーザーのステップを修正
        let finalStep = onboardingStep ? parseInt(onboardingStep, 10) : 0;

        // ステップ1でメール確認済みの場合、ステップ3に更新
        if (finalStep === 1 && !onboardingCompleted) {
          console.log('🔧 Migrating step 1 → 3 (profile already completed during signup)');
          finalStep = 3;
          await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_STEP, '3');
        }

        set({
          isAuthenticated: true,
          hasCompletedOnboarding: onboardingCompleted === 'true',
          onboardingStep: finalStep,
          isLoading: false,
        });
      } catch (error) {
        // セッションなし
        set({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      set({ isLoading: false });
    }
  },

  skipOnboardingStep: () => {
    const currentStep = get().onboardingStep;
    get().updateOnboardingStep(currentStep + 1);
  },

  // =====================================================
  // Utility Actions
  // =====================================================

  clearError: () => {
    set({ error: null });
  },
}));
