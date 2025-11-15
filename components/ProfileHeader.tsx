import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Menu, QrCode, UserPlus, UserCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

interface ProfileHeaderProps {
  name: string;
  username: string;
  bio: string;
  profileImageUrl: string;
  onMenuPress: () => void;
}

export default function ProfileHeader({
  name,
  username,
  bio,
  profileImageUrl,
  onMenuPress,
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

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    menuButton: {
      padding: 8,
      marginRight: 4,
    },
    mainContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    profileImage: {
      width: 70,
      height: 70,
      borderRadius: 35,
      marginRight: 12,
    },
    profileImagePlaceholder: {
      width: 70,
      height: 70,
      borderRadius: 35,
      marginRight: 12,
      backgroundColor: colors.shopBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    userInfo: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      flexWrap: 'wrap',
      marginBottom: 4,
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginRight: 6,
    },
    username: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    bio: {
      fontSize: 13,
      color: colors.secondaryText,
      lineHeight: 18,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.shopBackground,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    actionText: {
      fontSize: 13,
      color: colors.text,
      marginLeft: 6,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
          <Menu size={24} color={colors.icon} />
        </TouchableOpacity>

        <View style={styles.mainContent}>
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
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.username}>@{username}</Text>
            </View>
            <Text style={styles.bio}>{bio}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity onPress={handleQRCodePress} style={styles.actionButton}>
          <QrCode size={20} color={colors.icon} />
          <Text style={styles.actionText}>QRコード</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleFindFriendsPress} style={styles.actionButton}>
          <UserPlus size={20} color={colors.icon} />
          <Text style={styles.actionText}>友達を探す</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
