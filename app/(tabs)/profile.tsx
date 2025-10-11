import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const postsLayoutY = useRef(0);

  const handlePostsPress = () => {
    scrollViewRef.current?.scrollTo({
      y: postsLayoutY.current,
      animated: true,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          name="山田 太郎"
          username="yamada_taro"
          bio="ファッション好きです。コーディネートを楽しんでいます！"
          profileImageUrl="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80"
          onMenuPress={() => setIsMenuOpen(true)}
        />

        <ProfileStatsRow
          postsCount={profilePosts.length}
          wavesCount={42}
          followersCount={1234}
          followingCount={567}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});