/**
 * Authentication Store with AWS Cognito Integration
 * Amplify v6 Auth API + Zustand
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  signUp,
  signIn,
  signOut,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchUserAttributes,
  updateUserAttributes,
  type SignUpInput,
} from 'aws-amplify/auth';

// =====================================================
// Types
// =====================================================

export interface User {
  userId: string; // Cognito sub
  username: string; // Cognito username
  email: string;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneNumberVerified: boolean;
  handle?: string; // custom:handle
  accountType?: string; // custom:accountType
  accountId?: string; // custom:accountId (DynamoDB ACCOUNT.account_id)
  name?: string; // given_name
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
   * サインアップ（Cognito User Pool）
   */
  signUp: async (params: SignUpParams) => {
    // Web環境ではモック実装
    if (Platform.OS === 'web') {
      console.warn('⚠️ Web platform: Using mock signUp');
      set({ error: 'Web環境ではサインアップできません。iOS/Androidアプリをご使用ください' });
      return { success: false, username: '' };
    }

    try {
      set({ isLoading: true, error: null });

      const { username, email, password, phoneNumber, handle, name, birthday } = params;

      const signUpInput: SignUpInput = {
        username,
        password,
        options: {
          userAttributes: {
            email,
            phone_number: phoneNumber, // E.164形式（例: +81901234567）
            'custom:handle': handle,
            ...(name && { given_name: name }),
            ...(birthday && { birthdate: birthday }),
          },
        },
      };

      const { userId, nextStep } = await signUp(signUpInput);

      console.log('✅ SignUp successful:', { userId, nextStep });

      set({ isLoading: false });
      return { success: true, username };
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      console.error('❌ SignUp failed:', error);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  /**
   * メール確認コード送信
   */
  confirmSignUp: async (username: string, code: string) => {
    if (Platform.OS === 'web') {
      console.warn('⚠️ Web platform: Using mock confirmSignUp');
      set({ error: 'Web環境では確認できません' });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username,
        confirmationCode: code,
      });

      console.log('✅ Confirm SignUp successful:', { isSignUpComplete, nextStep });

      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      console.error('❌ Confirm SignUp failed:', error);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  /**
   * 確認コード再送信
   */
  resendConfirmationCode: async (username: string) => {
    if (Platform.OS === 'web') {
      console.warn('⚠️ Web platform: Using mock resendConfirmationCode');
      return;
    }

    try {
      set({ isLoading: true, error: null });

      await resendSignUpCode({ username });

      console.log('✅ Confirmation code resent');
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      console.error('❌ Resend confirmation code failed:', error);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  /**
   * サインイン
   */
  signIn: async (username: string, password: string) => {
    if (Platform.OS === 'web') {
      console.warn('⚠️ Web platform: Using mock signIn');
      // Webでのモック実装
      const mockUser: User = {
        userId: `web_mock_${Date.now()}`,
        username,
        email: `${username}@example.com`,
        emailVerified: true,
        phoneNumberVerified: false,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mockUser));
      set({ isAuthenticated: true, user: mockUser, isLoading: false });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      const { isSignedIn, nextStep } = await signIn({ username, password });

      console.log('✅ SignIn successful:', { isSignedIn, nextStep });

      // ユーザー情報を取得
      await get().refreshUser();

      set({ isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      console.error('❌ SignIn failed:', error);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  /**
   * サインアウト
   */
  signOut: async () => {
    try {
      set({ isLoading: true, error: null });

      if (Platform.OS !== 'web') {
        await signOut();
      }

      // ローカルストレージをクリア
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        STORAGE_KEYS.ONBOARDING_STEP,
        STORAGE_KEYS.ONBOARDING_DATA,
      ]);

      console.log('✅ SignOut successful');

      set({
        isAuthenticated: false,
        hasCompletedOnboarding: false,
        user: null,
        onboardingStep: 0,
        onboardingData: {},
        isLoading: false,
      });
    } catch (error: any) {
      console.error('❌ SignOut failed:', error);
      set({ isLoading: false });
    }
  },

  /**
   * 現在のユーザー情報を更新
   */
  refreshUser: async () => {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      const user: User = {
        userId: currentUser.userId,
        username: currentUser.username,
        email: attributes.email || '',
        emailVerified: attributes.email_verified === 'true',
        phoneNumber: attributes.phone_number,
        phoneNumberVerified: attributes.phone_number_verified === 'true',
        handle: attributes['custom:handle'],
        accountType: attributes['custom:accountType'],
        accountId: attributes['custom:accountId'],
        name: attributes.given_name,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      set({ user });

      console.log('✅ User refreshed:', user);
    } catch (error: any) {
      console.error('❌ Refresh user failed:', error);
    }
  },

  /**
   * パスワードリセット開始
   */
  forgotPassword: async (username: string) => {
    if (Platform.OS === 'web') {
      console.warn('⚠️ Web platform: forgotPassword not supported');
      return;
    }

    try {
      set({ isLoading: true, error: null });

      await resetPassword({ username });

      console.log('✅ Password reset code sent');
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      console.error('❌ Forgot password failed:', error);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  /**
   * パスワードリセット確定
   */
  confirmResetPassword: async (username: string, code: string, newPassword: string) => {
    if (Platform.OS === 'web') {
      console.warn('⚠️ Web platform: confirmResetPassword not supported');
      return;
    }

    try {
      set({ isLoading: true, error: null });

      await confirmResetPassword({
        username,
        confirmationCode: code,
        newPassword,
      });

      console.log('✅ Password reset successful');
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      console.error('❌ Confirm reset password failed:', error);
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

      if (Platform.OS === 'web') {
        // Web環境: ローカルストレージから読み込み
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        const user = userData ? JSON.parse(userData) : null;
        const onboardingCompleted = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);

        set({
          isAuthenticated: !!user,
          user,
          hasCompletedOnboarding: onboardingCompleted === 'true',
          isLoading: false,
        });
        return;
      }

      // ネイティブ環境: Cognitoから取得
      try {
        await get().refreshUser();

        const onboardingCompleted = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
        const onboardingStep = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP);

        set({
          isAuthenticated: true,
          hasCompletedOnboarding: onboardingCompleted === 'true',
          onboardingStep: onboardingStep ? parseInt(onboardingStep, 10) : 0,
          isLoading: false,
        });
      } catch (error) {
        // Cognitoセッションなし
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
