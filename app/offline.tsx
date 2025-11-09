import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff, RefreshCw, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

export default function OfflineScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  const [isChecking, setIsChecking] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Auto-retry every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkConnection();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Initial connection check
  useEffect(() => {
    checkConnection();
  }, []);

  // Auto-navigate back when connected
  useEffect(() => {
    if (isConnected) {
      setTimeout(() => {
        router.back();
      }, 1000);
    }
  }, [isConnected]);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected ?? false);
      setRetryCount(prev => prev + 1);
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetry = () => {
    checkConnection();
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <ArrowLeft size={24} color={colors.icon} />
      </TouchableOpacity>

      {/* Connection status badge */}
      <View style={[
        styles.statusBadge,
        { backgroundColor: isConnected ? colors.success : colors.error }
      ]}>
        <Text style={styles.statusText}>
          {isConnected === null ? 'Checking...' : isConnected ? 'Connected' : 'Offline'}
        </Text>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <WifiOff size={80} color={colors.secondaryText} strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>No internet connection</Text>
        <Text style={styles.subtitle}>
          Check your connection and try again
        </Text>

        {retryCount > 0 && (
          <Text style={styles.retryCount}>
            Auto-retry attempt: {retryCount}
          </Text>
        )}

        {/* Retry button */}
        <TouchableOpacity
          style={[styles.retryButton, isChecking && styles.retryButtonDisabled]}
          onPress={handleRetry}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <>
              <RefreshCw size={20} color={colors.background} />
              <Text style={styles.retryButtonText}>Retry Connection</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Connected state */}
        {isConnected && (
          <View style={styles.connectedContainer}>
            <Text style={styles.connectedText}>
              Connection restored! Redirecting...
            </Text>
          </View>
        )}
      </View>

      {/* Helper text */}
      <Text style={styles.helperText}>
        Make sure WiFi or mobile data is turned on
      </Text>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 60,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  retryCount: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  connectedContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
  },
  connectedText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 13,
    color: colors.secondaryText,
    textAlign: 'center',
    paddingBottom: 40,
    paddingHorizontal: 32,
  },
});
