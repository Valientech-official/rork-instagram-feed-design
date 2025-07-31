import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus, QrCode, Search } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function ProfileManagementIcons() {
  const handleCreateProfile = () => {
    console.log('Create profile');
  };

  const handleShowQRCode = () => {
    console.log('Show QR code');
  };

  const handleFindFriends = () => {
    console.log('Find friends');
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconsContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={handleCreateProfile}>
          <UserPlus size={20} color={Colors.light.text} />
          <Text style={styles.iconText}>プロフィール作成</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton} onPress={handleShowQRCode}>
          <QrCode size={20} color={Colors.light.text} />
          <Text style={styles.iconText}>QRコード</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton} onPress={handleFindFriends}>
          <Search size={20} color={Colors.light.text} />
          <Text style={styles.iconText}>友達を探す</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
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
    color: Colors.light.text,
    marginTop: 2,
  },
});