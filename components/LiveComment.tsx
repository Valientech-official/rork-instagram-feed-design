import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LiveComment as LiveCommentType } from '@/mocks/liveComments';
import Colors from '@/constants/colors';

interface LiveCommentProps {
  comment: LiveCommentType;
}

export default function LiveComment({ comment }: LiveCommentProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: comment.avatar }}
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={styles.contentContainer}>
        <Text style={styles.username}>{comment.username}</Text>
        <Text style={styles.text}>{comment.text}</Text>
      </View>
      <Text style={styles.timestamp}>{comment.timestamp}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    marginBottom: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  contentContainer: {
    flex: 1,
  },
  username: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  text: {
    fontSize: 14,
    color: 'white',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
  },
});