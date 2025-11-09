import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { users } from '@/mocks/users';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

export default function RecommendedUsersSlider() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);

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
        <Text style={styles.title}>おすすめユーザー</Text>
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

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
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
    borderColor: colors.border,
  },
  username: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 48,
    right: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  verifiedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
