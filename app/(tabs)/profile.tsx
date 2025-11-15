import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Colors from '@/constants/colors';
import ProfileHeader from '@/components/ProfileHeader';
import ProfileDetailsSection from '@/components/ProfileDetailsSection';
import ProfileContentTabs from '@/components/ProfileContentTabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MenuDrawer from '@/components/MenuDrawer';
import { useAuthStore } from '@/store/authStore';
import { useUsersStore } from '@/store/usersStore';
import { useThemeStore } from '@/store/themeStore';

export default function ProfileScreen() {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ストアからデータ取得
  const { user } = useAuthStore();
  const { myProfile, fetchMyProfile, myProfileLoading } = useUsersStore();

  // プロフィール情報を取得
  useEffect(() => {
    fetchMyProfile();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  // ローディング表示
  if (myProfileLoading && !myProfile) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ProfileHeader
        name={myProfile?.name || user?.name || 'ユーザー'}
        username={myProfile?.handle || user?.handle || user?.username || ''}
        bio={myProfile?.bio || ''}
        profileImageUrl={myProfile?.profile_image || user?.avatar || ''}
        onMenuPress={() => setIsMenuOpen(true)}
        postsCount={myProfile?.posts_count || 0}
        wavesCount={myProfile?.waves_count || 0}
        followersCount={myProfile?.followers_count || 0}
        followingCount={myProfile?.following_count || 0}
      />

      <ProfileDetailsSection />

      <ProfileContentTabs />

      <MenuDrawer
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </View>
  );
}