import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

/**
 * Admin Panel Entry Point
 * Redirects to dashboard if user is authenticated as admin
 */
export default function AdminIndex() {
  const router = useRouter();
  const { isAdmin, loading } = useAdminAuth();
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  useEffect(() => {
    if (!loading && isAdmin) {
      // Redirect to dashboard
      router.replace('/admin/dashboard');
    }
  }, [loading, isAdmin]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
