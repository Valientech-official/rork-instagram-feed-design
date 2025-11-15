import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AnimatedLogo from '../../components/onboarding/AnimatedLogo';
import { useAuthStore } from '../../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, hasCompletedOnboarding, onboardingStep, checkAuthStatus } = useAuthStore();
  const [hasPendingVerification, setHasPendingVerification] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      // 未確認状態をチェック
      const pendingVerification = await AsyncStorage.getItem('@pending_verification');
      if (pendingVerification) {
        const { username } = JSON.parse(pendingVerification);
        setHasPendingVerification(true);

        // 未確認ユーザーがいる場合、確認画面へ遷移
        setTimeout(() => {
          router.replace(`/(auth)/verify-email?username=${username}`);
        }, 2500);
        return;
      }

      // 通常の認証状態チェック
      checkAuthStatus();
    };

    initializeApp();
  }, []);

  useEffect(() => {
    // 未確認状態がある場合は通常の遷移をスキップ
    if (hasPendingVerification) return;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        if (hasCompletedOnboarding) {
          router.replace('/(tabs)');
        } else {
          // オンボーディング未完了の場合、現在のステップに応じて遷移
          const onboardingRoutes = [
            '/(onboarding)/welcome',    // step 0
            '/(onboarding)/avatar',     // step 1 (サインアップ完了後: profileスキップ済み)
            '/(onboarding)/profile',    // step 2
            '/(onboarding)/avatar',     // step 3
            '/(onboarding)/styles',     // step 4
            '/(onboarding)/genres',     // step 5
            '/(onboarding)/brands',     // step 6
            '/(onboarding)/social',     // step 7
          ];

          const targetRoute = onboardingRoutes[onboardingStep] || '/(onboarding)/welcome';
          console.log(`📍 Redirecting to onboarding step ${onboardingStep}: ${targetRoute}`);
          router.replace(targetRoute as any);
        }
      } else {
        router.replace('/(auth)/login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, hasCompletedOnboarding, onboardingStep, hasPendingVerification]);

  return (
    <View style={styles.container}>
      <AnimatedLogo />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
