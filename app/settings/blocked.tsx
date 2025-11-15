import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, UserX, Search } from 'lucide-react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import * as Haptics from 'expo-haptics';

interface BlockedUser {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string;
  blockedAt: string;
}

export default function BlockedUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      // API call: GET /account/blocked
      // const response = await fetch('/account/blocked');
      // const data = await response.json();
      // setBlockedUsers(data);

      // Mock data for now
      setTimeout(() => {
        setBlockedUsers([
          {
            id: '1',
            username: 'blocked_user_1',
            name: 'Blocked User 1',
            avatarUrl: 'https://i.pravatar.cc/150?img=1',
            blockedAt: '2024-01-15T10:30:00Z',
          },
          {
            id: '2',
            username: 'blocked_user_2',
            name: 'Blocked User 2',
            avatarUrl: 'https://i.pravatar.cc/150?img=2',
            blockedAt: '2024-01-10T14:20:00Z',
          },
          {
            id: '3',
            username: 'blocked_user_3',
            name: 'Blocked User 3',
            avatarUrl: 'https://i.pravatar.cc/150?img=3',
            blockedAt: '2024-01-05T09:15:00Z',
          },
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load blocked users');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBlockedUsers();
    setRefreshing(false);
  };

  const handleUnblock = (user: BlockedUser) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock @${user.username}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unblock',
          style: 'default',
          onPress: async () => {
            try {
              setUnblocking(user.id);

              // API call: DELETE /account/blocked/{user_id}
              // await fetch(`/account/blocked/${user.id}`, {
              //   method: 'DELETE',
              // });

              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }

              setTimeout(() => {
                setBlockedUsers((prev) => prev.filter((u) => u.id !== user.id));
                setUnblocking(null);
              }, 300);
            } catch (error) {
              setUnblocking(null);
              Alert.alert('Error', 'Failed to unblock user');
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const filteredUsers = blockedUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 8,
    },
    clearButton: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    listContent: {
      paddingVertical: 8,
    },
    listContentEmpty: {
      flex: 1,
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
    },
    userLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.cardBackground,
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    userUsername: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    unblockButton: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.primary,
      minWidth: 80,
      alignItems: 'center',
    },
    unblockButtonDisabled: {
      opacity: 0.5,
    },
    unblockButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 16,
      color: colors.secondaryText,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <UserX size={64} color={colors.secondaryText} />
      <Text style={styles.emptyTitle}>No Blocked Accounts</Text>
      <Text style={styles.emptyText}>
        You haven't blocked anyone yet. Blocked accounts won't be able to see your profile or contact you.
      </Text>
    </View>
  );

  const renderSearchEmpty = () => (
    <View style={styles.emptyContainer}>
      <Search size={48} color={colors.secondaryText} />
      <Text style={styles.emptyTitle}>No Results</Text>
      <Text style={styles.emptyText}>
        No blocked users found matching "{searchQuery}"
      </Text>
    </View>
  );

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => {
    const isUnblocking = unblocking === item.id;

    return (
      <View style={styles.userItem}>
        <View style={styles.userLeft}>
          <Image
            source={{ uri: item.avatarUrl || 'https://i.pravatar.cc/150' }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.userUsername} numberOfLines={1}>
              @{item.username}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.unblockButton, isUnblocking && styles.unblockButtonDisabled]}
          onPress={() => handleUnblock(item)}
          disabled={isUnblocking}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.unblockButtonText}>Unblock</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Blocked Accounts</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Blocked Accounts</Text>
        <View style={{ width: 24 }} />
      </View>

      {blockedUsers.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={18} color={colors.secondaryText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search blocked accounts..."
              placeholderTextColor={colors.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearButton}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderBlockedUser}
        contentContainerStyle={[
          styles.listContent,
          (filteredUsers.length === 0 || blockedUsers.length === 0) && styles.listContentEmpty,
        ]}
        ListEmptyComponent={
          searchQuery.length > 0 ? renderSearchEmpty : renderEmptyState
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}