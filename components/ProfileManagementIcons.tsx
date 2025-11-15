import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus, QrCode, Search } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

export default function ProfileManagementIcons() {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const handleCreateProfile = () => {
    console.log('Create profile');
  };

  const handleShowQRCode = () => {
    console.log('Show QR code');
  };

  const handleFindFriends = () => {
    console.log('Find friends');
  };

  const styles = StyleSheet.create({
    container: {
      paddingVertical: 6,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'center',
    },
    iconsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: '60%',
    },
    iconButton: {
      alignItems: 'center',
      marginHorizontal: 8,
    },
    iconText: {
      fontSize: 10,
      color: colors.text,
      marginTop: 2,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconsContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={handleCreateProfile}>
          <UserPlus size={20} color={colors.text} />
          <Text style={styles.iconText}>プロフィール作成</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={handleShowQRCode}>
          <QrCode size={20} color={colors.text} />
          <Text style={styles.iconText}>QRコード</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={handleFindFriends}>
          <Search size={20} color={colors.text} />
          <Text style={styles.iconText}>友達を探す</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}