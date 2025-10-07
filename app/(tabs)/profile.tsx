import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Menu } from 'lucide-react-native';
import Colors from '@/constants/colors';
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80" }}
            style={styles.profileImage}
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>username</Text>
            <Text style={styles.bio}>This is a sample bio. Edit your profile to change this text.</Text>
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setIsMenuOpen(true)}
          >
            <Menu size={24} color={Colors.light.icon} />
          </TouchableOpacity>
        </View>
        
        <ProfileIconRow />
        
        <ProfileStylesSection />
        
        <ProfileFavoritesSection />
        
        <ProfileSocialAccountsSection />
        
        <ProfileManagementIcons />
        
        {/* Room Icons Section */}
        <ProfileRoomsSection />
        
        {/* Posts Grid Section */}
        <ProfilePostsGrid posts={profilePosts} />
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
  header: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  bio: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    lineHeight: 18,
  },
  content: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  menuButton: {
    padding: 8,
    position: 'absolute',
    right: 12,
    top: 12,
  },
});