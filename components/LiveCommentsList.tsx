import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { LiveComment as LiveCommentType } from '@/mocks/liveComments';
import LiveComment from './LiveComment';

interface LiveCommentsListProps {
  comments: LiveCommentType[];
}

export default function LiveCommentsList({ comments }: LiveCommentsListProps) {
  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LiveComment comment={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        inverted
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 300,
  },
  listContent: {
    paddingVertical: 8,
  },
});