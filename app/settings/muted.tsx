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
import { ChevronLeft, VolumeX, Search } from 'lucide-react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import * as Haptics from 'expo-haptics';

interface MutedUser {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string;
  mutedAt: string;
  muteType: 'account' | 'story';
}

type TabType = 'accounts' | 'stories';

export default function MutedUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('accounts');
  const [unmuting, setUnmuting] = useState<string | null>(null);

  useEffect(() => {
    loadMutedUsers();
  }, []);

  const loadMutedUsers = async () => {
    try {
      // API call: GET /account/muted
      // const response = await fetch('/account/muted');
      // const data = await response.json();
      // setMutedUsers(data);

      // Mock data for now
      setTimeout(() => {
        setMutedUsers([
          {
            id: '1',
            username: 'muted_account_1',
            name: 'Muted Account 1',
            avatarUrl: 'https://i.pravatar.cc/150?img=11',
            mutedAt: '2024-01-15T10:30:00Z',
            muteType: 'account',
          },
          {
            id: '2',
            username: 'muted_account_2',
            name: 'Muted Account 2',
            avatarUrl: 'https://i.pravatar.cc/150?img=12',
            mutedAt: '2024-01-10T14:20:00Z',
            muteType: 'account',
          },
          {
            id: '3',
            username: 'muted_story_1',
            name: 'Muted Story 1',
            avatarUrl: 'https://i.pravatar.cc/150?img=13',
            mutedAt: '2024-01-05T09:15:00Z',
            muteType: 'story',
          },
          {
            id: '4',
            username: 'muted_story_2',
            name: 'Muted Story 2',
            avatarUrl: 'https://i.pravatar.cc/150?img=14',
            mutedAt: '2024-01-03T16:45:00Z',
            muteType: 'story',
          },
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load muted users');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMutedUsers();
    setRefreshing(false);
  };

  const handleUnmute = (user: MutedUser) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const muteTypeText = user.muteType === 'account' ? 'account' : 'stories';
    Alert.alert(
      'Unmute User',
      `Are you sure you want to unmute @${user.username}'s ${muteTypeText}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unmute',
          style: 'default',
          onPress: async () => {
            try {
              setUnmuting(user.id);

              // API call: DELETE /account/muted/{user_id}
              // await fetch(`/account/muted/${user.id}`, {
              //   method: 'DELETE',
              // });

              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }

              setTimeout(() => {
                setMutedUsers((prev) => prev.filter((u) => u.id !== user.id));
                setUnmuting(null);
              }, 300);
            } catch (error) {
              setUnmuting(null);
              Alert.alert('Error', 'Failed to unmute user');
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

  const handleTabChange = (tab: TabType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    setSearchQuery('');
  };

  const filteredUsers = mutedUsers
    .filter((user) => user.muteType === activeTab.slice(0, -1))
    .filter(
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
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.secondaryText,
    },
    tabTextActive: {
      color: colors.text,
      fontWeight: '600',
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
    unmuteButton: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.primary,
      minWidth: 80,
      alignItems: 'center',
    },
    unmuteButtonDisabled: {
      opacity: 0.5,
    },
    unmuteButtonText: {
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
      <VolumeX size={64} color={colors.secondaryText} />
      <Text style={styles.emptyTitle}>
        No Muted {activeTab === 'accounts' ? 'Accounts' : 'Stories'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'accounts'
          ? "You haven't muted any accounts. Muted accounts won't appear in your feed."
          : "You haven't muted any stories. Muted stories won't appear in your story feed."}
      </Text>
    </View>
  );

  const renderSearchEmpty = () => (
    <View style={styles.emptyContainer}>
      <Search size={48} color={colors.secondaryText} />
      <Text style={styles.emptyTitle}>No Results</Text>
      <Text style={styles.emptyText}>
        No muted {activeTab === 'accounts' ? 'accounts' : 'stories'} found matching "{searchQuery}"
      </Text>
    </View>
  );

  const renderMutedUser = ({ item }: { item: MutedUser }) => {
    const isUnmuting = unmuting === item.id;

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
          style={[styles.unmuteButton, isUnmuting && styles.unmuteButtonDisabled]}
          onPress={() => handleUnmute(item)}
          disabled={isUnmuting}
        >
          {isUnmuting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.unmuteButtonText}>Unmute</Text>
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
          <Text style={styles.title}>Muted Accounts</Text>
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
        <Text style={styles.title}>Muted Accounts</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'accounts' && styles.tabActive]}
          onPress={() => handleTabChange('accounts')}
        >
          <Text style={[styles.tabText, activeTab === 'accounts' && styles.tabTextActive]}>
            Muted Accounts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stories' && styles.tabActive]}
          onPress={() => handleTabChange('stories')}
        >
          <Text style={[styles.tabText, activeTab === 'stories' && styles.tabTextActive]}>
            Muted Stories
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {filteredUsers.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={18} color={colors.secondaryText} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search muted ${activeTab}...`}
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
        renderItem={renderMutedUser}
        contentContainerStyle={[
          styles.listContent,
          filteredUsers.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={searchQuery.length > 0 ? renderSearchEmpty : renderEmptyState}
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