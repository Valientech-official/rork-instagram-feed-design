import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { AccountSummary } from '@/types/api';
import { useUsersStore } from '@/store/usersStore';
import { useAuthStore } from '@/store/authStore';
import FollowButton from '@/components/FollowButton';

export default function FollowingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { followingList, followingLoading, fetchFollowing } = useUsersStore();

  // accountId取得（デフォルトは自分）
  const accountId = (params.id as string) || user?.sub || 'me';
  const following = followingList[accountId] || [];
  const loading = followingLoading[accountId] || false;

  useEffect(() => {
    fetchFollowing(accountId);
  }, [accountId]);

  const handleBack = () => {
    router.back();
  };

  const renderFollowing = ({ item }: { item: AccountSummary }) => (
    <View style={styles.followingItem}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => router.push(`/profile/${item.account_id}`)}
      >
        <Image
          source={{ uri: item.profile_image || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <View style={styles.followingInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.userHandle}>@{item.handle}</Text>
        </View>
      </TouchableOpacity>
      {item.account_id !== user?.sub && (
        <FollowButton
          accountId={item.account_id}
          initialIsFollowing={true}
          size="small"
        />
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'フォロー中',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        {loading && following.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : (
          <FlatList
            data={following}
            keyExtractor={(item) => item.account_id}
            renderItem={renderFollowing}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>フォロー中のユーザーがいません</Text>
                <Text style={styles.emptyStateText}>
                  誰かをフォローすると、ここに表示されます
                </Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  backButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  followingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  followingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  userHandle: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
});
