import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

interface ProfileStatsRowProps {
  postsCount: number;
  wavesCount: number;
  followersCount: number;
  followingCount: number;
  onPostsPress?: () => void;
}

export default function ProfileStatsRow({
  postsCount,
  wavesCount,
  followersCount,
  followingCount,
  onPostsPress,
}: ProfileStatsRowProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  const handleWavesPress = () => {
    // Navigate to waves/short videos page
    router.push('/(tabs)/live-tab');
  };

  const handleFollowersPress = () => {
    // Navigate to followers page
    router.push('/followers');
  };

  const handleFollowingPress = () => {
    // Navigate to following page
    router.push('/following');
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 13,
      color: colors.secondaryText,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.statItem}
        onPress={onPostsPress}
        activeOpacity={0.7}
      >
        <Text style={styles.statNumber}>{postsCount}</Text>
        <Text style={styles.statLabel}>投稿</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.statItem}
        onPress={handleWavesPress}
        activeOpacity={0.7}
      >
        <Text style={styles.statNumber}>{wavesCount}</Text>
        <Text style={styles.statLabel}>ウェーブ</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.statItem}
        onPress={handleFollowersPress}
        activeOpacity={0.7}
      >
        <Text style={styles.statNumber}>{followersCount}</Text>
        <Text style={styles.statLabel}>フォロワー</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.statItem}
        onPress={handleFollowingPress}
        activeOpacity={0.7}
      >
        <Text style={styles.statNumber}>{followingCount}</Text>
        <Text style={styles.statLabel}>フォロー中</Text>
      </TouchableOpacity>
    </View>
  );
}
