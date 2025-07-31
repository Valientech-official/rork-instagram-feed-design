import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MoreHorizontal } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface PostHeaderProps {
  username: string;
  avatar: string;
  location?: string;
}

export default function PostHeader({ username, avatar, location }: PostHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.userContainer}>
        <Image
          source={{ uri: avatar }}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{username}</Text>
          {location && <Text style={styles.location}>{location}</Text>}
        </View>
      </View>
      <TouchableOpacity>
        <MoreHorizontal size={24} color={Colors.light.icon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  userInfo: {
    justifyContent: 'center',
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.light.text,
  },
  location: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
});