import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { users } from '@/mocks/users';
import Colors from '@/constants/colors';

export default function RecommendedUsersSlider() {
  const router = useRouter();

  const handleUserPress = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleSeeAllPress = () => {
    router.push('/discover-users');
  };

  const renderUser = ({ item }: { item: typeof users[0] }) => (
    <TouchableOpacity 
      style={styles.userCard} 
      onPress={() => handleUserPress(item.id)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.avatar }}
        style={styles.avatar}
        contentFit="cover"
        transition={200}
      />
      <Text style={styles.username} numberOfLines={1}>
        {item.username}
      </Text>
      {item.verified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>あなたにおすすめアイテム&ユーザー</Text>
      </View>
      
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={renderUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    marginRight: 2,
  },
  listContent: {
    paddingHorizontal: 12,
  },
  userCard: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 80,
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  username: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
    textAlign: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 48,
    right: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  verifiedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});