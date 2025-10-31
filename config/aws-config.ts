/**
 * AWS Amplify Configuration
 * Piece App - Development Environment
 */

import { Amplify } from 'aws-amplify';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 環境変数から取得（.env.development）
const API_URL = Constants.expoConfig?.extra?.API_URL || 'https://b6om6sz99f.execute-api.ap-northeast-1.amazonaws.com/dev/';
const COGNITO_USER_POOL_ID = Constants.expoConfig?.extra?.COGNITO_USER_POOL_ID || 'ap-northeast-1_LKhwTdez4';
const COGNITO_CLIENT_ID = Constants.expoConfig?.extra?.COGNITO_CLIENT_ID || '4dvma3506cs34sfs1c59he8i2l';
const COGNITO_REGION = Constants.expoConfig?.extra?.COGNITO_REGION || 'ap-northeast-1';

/**
 * Amplify設定を初期化
 */
export const configureAmplify = () => {
  // Web環境では一時的に無効化（OAuth listener エラー回避）
  if (Platform.OS === 'web') {
    console.log('⚠️ Amplify configuration skipped on web platform');
    console.log('📱 Please test on iOS/Android with Expo Go app');
    return;
  }

  try {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: COGNITO_USER_POOL_ID,
          userPoolClientId: COGNITO_CLIENT_ID,
        },
      },
    }, {
      ssr: false, // React Native環境でSSRを無効化
    });

    console.log('✅ AWS Amplify configured successfully');
    console.log('📍 API Endpoint:', API_URL);
    console.log('🔐 User Pool:', COGNITO_USER_POOL_ID);
  } catch (error) {
    console.error('❌ AWS Amplify configuration failed:', error);
  }
};

/**
 * 設定値のエクスポート（デバッグ用）
 */
export const awsConfig = {
  apiUrl: API_URL,
  userPoolId: COGNITO_USER_POOL_ID,
  clientId: COGNITO_CLIENT_ID,
  region: COGNITO_REGION,
};
