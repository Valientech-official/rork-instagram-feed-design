import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PenSquare, ShoppingBag, Users, UserCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

export default function ProfileIconRow() {
  const router = useRouter();
  
  const handlePostPress = () => {
    router.push('/create');
  };
  
  const handleCMPress = () => {
    router.push('/shop');
  };
  
  const handleFollowersPress = () => {
    router.push('/followers');
  };
  
  const handleFollowingPress = () => {
    router.push('/following');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconContainer} onPress={handlePostPress}>
        <PenSquare size={16} color={Colors.light.icon} />
        <Text style={styles.iconText}>投稿</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.iconContainer} onPress={handleCMPress}>
        <ShoppingBag size={16} color={Colors.light.icon} />
        <Text style={styles.iconText}>ウェーブ</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.iconContainer} onPress={handleFollowersPress}>
        <Users size={16} color={Colors.light.icon} />
        <Text style={styles.iconText}>フォロワー</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.iconContainer} onPress={handleFollowingPress}>
        <UserCheck size={16} color={Colors.light.icon} />
        <Text style={styles.iconText}>フォロー中</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconText: {
    marginTop: 2,
    fontSize: 9,
    color: Colors.light.text,
  },
});