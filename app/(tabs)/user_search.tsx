import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Search, UserPlus, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { users } from '@/mocks/users';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  isFollowing?: boolean;
  followers?: number;
  following?: number;
}

export default function UserSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  const [followingStatus, setFollowingStatus] = useState<{[key: string]: boolean}>({});

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(text.toLowerCase()) ||
        user.displayName.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleFollow = (userId: string) => {
    setFollowingStatus(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleUserPress = (userId: string) => {
    // Navigate to user profile
    console.log('Navigate to user:', userId);
    // router.push(`/profile/${userId}`);
  };

  const renderUser = ({ item }: { item: User }) => {
    const isFollowing = followingStatus[item.id] || item.isFollowing;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => handleUserPress(item.id)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.avatar }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{item.displayName}</Text>
          <Text style={styles.username}>@{item.username}</Text>
          {item.bio && (
            <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={() => handleFollow(item.id)}
        >
          {isFollowing ? (
            <Text style={styles.followingText}>フォロー中</Text>
          ) : (
            <>
              <UserPlus size={16} color={Colors.light.background} />
              <Text style={styles.followText}>フォロー</Text>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>ユーザー検索</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.light.secondaryText} />
        <TextInput
          style={styles.searchInput}
          placeholder="ユーザー名や名前で検索"
          placeholderTextColor={Colors.light.secondaryText}
          value={searchText}
          onChangeText={handleSearch}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <X size={20} color={Colors.light.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.categoriesContainer} horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity style={styles.categoryChip}>
          <Text style={styles.categoryText}>おすすめ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryChip}>
          <Text style={styles.categoryText}>人気ユーザー</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryChip}>
          <Text style={styles.categoryText}>新規ユーザー</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryChip}>
          <Text style={styles.categoryText}>フォロー中</Text>
        </TouchableOpacity>
      </ScrollView>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 60,
  },
  categoryChip: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryText: {
    color: Colors.light.text,
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  username: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  bio: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginTop: 2,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  followingButton: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  followText: {
    color: Colors.light.background,
    marginLeft: 4,
    fontWeight: '600',
  },
  followingText: {
    color: Colors.light.text,
    fontWeight: '600',
  },
});