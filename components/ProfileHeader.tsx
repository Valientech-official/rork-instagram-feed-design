import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Menu, QrCode, UserPlus, UserCircle, Edit3 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

interface ProfileHeaderProps {
  name: string;
  username: string;
  bio: string;
  profileImageUrl: string;
  onMenuPress: () => void;
  postsCount: number;
  wavesCount: number;
  followersCount: number;
  followingCount: number;
}

export default function ProfileHeader({
  name,
  username,
  bio,
  profileImageUrl,
  onMenuPress,
  postsCount,
  wavesCount,
  followersCount,
  followingCount,
}: ProfileHeaderProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  const handleQRCodePress = () => {
    router.push('/qrcode');
  };

  const handleFindFriendsPress = () => {
    router.push('/find-friends');
  };

  const handleWavesPress = () => {
    router.push('/(tabs)/live-tab');
  };

  const handleFollowersPress = () => {
    router.push('/followers');
  };

  const handleFollowingPress = () => {
    router.push('/following');
  };

  const handleEditProfilePress = () => {
    router.push('/settings/account');
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    leftActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    accountId: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconButton: {
      padding: 4,
    },
    profileContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    profileImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginRight: 12,
    },
    profileImagePlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginRight: 12,
      backgroundColor: colors.shopBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    userInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    name: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    username: {
      fontSize: 16,
      color: colors.secondaryText,
      marginBottom: 6,
    },
    bio: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    editButton: {
      padding: 8,
      backgroundColor: colors.shopBackground,
      borderRadius: 20,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    statsRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 12,
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
      {/* ヘッダーバー */}
      <View style={styles.headerBar}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
            <Menu size={24} color={colors.icon} />
          </TouchableOpacity>
          <Text style={styles.accountId}>@{username}</Text>
        </View>
        <View style={styles.rightActions}>
          <TouchableOpacity onPress={handleQRCodePress} style={styles.iconButton}>
            <QrCode size={24} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFindFriendsPress} style={styles.iconButton}>
            <UserPlus size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* プロフィール情報 */}
      <View style={styles.profileContent}>
        <View style={styles.profileRow}>
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <UserCircle size={60} color={colors.icon} />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.username}>@{username}</Text>
            {bio ? <Text style={styles.bio}>{bio}</Text> : null}
          </View>
          <TouchableOpacity onPress={handleEditProfilePress} style={styles.editButton}>
            <Edit3 size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 統計情報 */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{postsCount}</Text>
          <Text style={styles.statLabel}>投稿</Text>
        </View>

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
    </View>
  );
}
