import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import Colors from '@/constants/colors';
import ProfileHeader from '@/components/ProfileHeader';
import ProfileStatsRow from '@/components/ProfileStatsRow';
import ProfileIconRow from '@/components/ProfileIconRow';
import ProfileStylesSection from '@/components/ProfileStylesSection';
import ProfileFavoritesSection from '@/components/ProfileFavoritesSection';
import ProfileSocialAccountsSection from '@/components/ProfileSocialAccountsSection';
import ProfileManagementIcons from '@/components/ProfileManagementIcons';
import ProfileRoomsSection from '@/components/ProfileRoomsSection';
import ProfilePostsGrid from '@/components/ProfilePostsGrid';
import { profilePosts } from '@/mocks/profilePosts';
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
  const scrollViewRef = useRef<ScrollView>(null);
  const postsLayoutY = useRef(0);

  // ストアからデータ取得
  const { user } = useAuthStore();
  const { myProfile, fetchMyProfile, myProfileLoading } = useUsersStore();

  // プロフィール情報を取得
  useEffect(() => {
    fetchMyProfile();
  }, []);

  const handlePostsPress = () => {
    scrollViewRef.current?.scrollTo({
      y: postsLayoutY.current,
      animated: true,
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
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
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          name={myProfile?.name || user?.name || 'ユーザー'}
          username={myProfile?.handle || user?.handle || user?.username || ''}
          bio={myProfile?.bio || ''}
          profileImageUrl={myProfile?.profile_image || user?.avatar || ''}
          onMenuPress={() => setIsMenuOpen(true)}
        />

        <ProfileStatsRow
          postsCount={myProfile?.posts_count || 0}
          wavesCount={myProfile?.waves_count || 0}
          followersCount={myProfile?.followers_count || 0}
          followingCount={myProfile?.following_count || 0}
          onPostsPress={handlePostsPress}
        />

        <ProfileIconRow />

        <ProfileStylesSection />

        <ProfileFavoritesSection />

        <ProfileSocialAccountsSection />

        <ProfileManagementIcons />

        <ProfileRoomsSection />

        <View
          onLayout={(event) => {
            postsLayoutY.current = event.nativeEvent.layout.y;
          }}
        >
          <ProfilePostsGrid posts={profilePosts} />
        </View>
      </ScrollView>

      <MenuDrawer
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </View>
  );
}