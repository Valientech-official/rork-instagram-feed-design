import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Search,
  Filter,
  User,
  Users,
  Shield,
  Ban,
  AlertTriangle,
  Eye,
  UserCog,
  Calendar,
  Heart,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

type AccountType = 'user' | 'shop' | 'admin';
type UserStatus = 'active' | 'suspended' | 'banned';

interface UserData {
  id: string;
  username: string;
  email: string;
  avatar: string;
  accountType: AccountType;
  status: UserStatus;
  followerCount: number;
  followingCount: number;
  postCount: number;
  joinedAt: number;
  lastActive: number;
  reportCount: number;
}

interface UserStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  avgEngagement: number;
}

export default function UsersManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<AccountType | 'all'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const loadUsers = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/admin/users');
      // const data = await response.json();

      // Mock data
      const mockUsers: UserData[] = [
        {
          id: '1',
          username: 'johndoe',
          email: 'john@example.com',
          avatar: 'https://picsum.photos/100/100?random=1',
          accountType: 'user',
          status: 'active',
          followerCount: 1250,
          followingCount: 890,
          postCount: 145,
          joinedAt: Date.now() - 86400000 * 120,
          lastActive: Date.now() - 3600000,
          reportCount: 0,
        },
        {
          id: '2',
          username: 'fashion_shop',
          email: 'shop@example.com',
          avatar: 'https://picsum.photos/100/100?random=2',
          accountType: 'shop',
          status: 'active',
          followerCount: 5420,
          followingCount: 120,
          postCount: 340,
          joinedAt: Date.now() - 86400000 * 200,
          lastActive: Date.now() - 7200000,
          reportCount: 1,
        },
        {
          id: '3',
          username: 'spammer_user',
          email: 'spam@example.com',
          avatar: 'https://picsum.photos/100/100?random=3',
          accountType: 'user',
          status: 'suspended',
          followerCount: 50,
          followingCount: 2000,
          postCount: 800,
          joinedAt: Date.now() - 86400000 * 30,
          lastActive: Date.now() - 86400000,
          reportCount: 15,
        },
      ];

      setUsers(mockUsers);
      applyFilters(mockUsers, filterStatus, filterType, searchQuery);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (
    data: UserData[],
    status: UserStatus | 'all',
    type: AccountType | 'all',
    query: string
  ) => {
    let filtered = data;

    if (status !== 'all') {
      filtered = filtered.filter((u) => u.status === status);
    }

    if (type !== 'all') {
      filtered = filtered.filter((u) => u.accountType === type);
    }

    if (query.trim()) {
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()) ||
          u.id.toLowerCase().includes(query.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters(users, filterStatus, filterType, searchQuery);
  }, [searchQuery, filterStatus, filterType, users]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleUserPress = async (user: UserData) => {
    setSelectedUser(user);
    // Load user stats
    // TODO: API call
    setUserStats({
      totalPosts: 145,
      totalLikes: 3420,
      totalComments: 890,
      avgEngagement: 28.5,
    });
    setShowDetailModal(true);
  };

  const handleSuspendUser = (userId: string) => {
    Alert.alert(
      'アカウント停止',
      'このユーザーを停止しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '停止する',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: API call
              // await fetch(`/admin/user/${userId}/status`, {
              //   method: 'PUT',
              //   body: JSON.stringify({ status: 'suspended' }),
              // });
              Alert.alert('成功', 'ユーザーを停止しました');
              setShowDetailModal(false);
              loadUsers();
            } catch (error) {
              Alert.alert('エラー', 'ユーザーの停止に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleBanUser = (userId: string) => {
    Alert.alert(
      'ユーザーBAN',
      'このユーザーを永久にBANしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'BANする',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: API call
              // await fetch(`/admin/user/${userId}/status`, {
              //   method: 'PUT',
              //   body: JSON.stringify({ status: 'banned' }),
              // });
              Alert.alert('成功', 'ユーザーをBANしました');
              setShowDetailModal(false);
              loadUsers();
            } catch (error) {
              Alert.alert('エラー', 'ユーザーのBANに失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleWarnUser = (userId: string) => {
    Alert.alert('警告を送信', 'このユーザーに警告を送信しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '送信する',
        onPress: async () => {
          try {
            // TODO: API call
            // await fetch(`/admin/user/${userId}/warn`, {
            //   method: 'POST',
            // });
            Alert.alert('成功', '警告を送信しました');
          } catch (error) {
            Alert.alert('エラー', '警告の送信に失敗しました');
          }
        },
      },
    ]);
  };

  const handleChangeAccountType = (userId: string, newType: AccountType) => {
    Alert.alert(
      'Change Account Type',
      `Change account type to ${newType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: async () => {
            try {
              // TODO: API call
              // await fetch(`/admin/user/${userId}/type`, {
              //   method: 'PUT',
              //   body: JSON.stringify({ accountType: newType }),
              // });
              Alert.alert('Success', 'Account type changed');
              setShowDetailModal(false);
              loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to change account type');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'suspended':
        return colors.warning;
      case 'banned':
        return colors.error;
      default:
        return colors.secondaryText;
    }
  };

  const getAccountTypeBadgeColor = (type: AccountType) => {
    switch (type) {
      case 'shop':
        return '#FF9800';
      case 'admin':
        return '#9C27B0';
      default:
        return colors.primary;
    }
  };

  const renderUser = ({ item }: { item: UserData }) => {
    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.userHeader}>
          <Image
            source={{ uri: item.avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.userInfo}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>@{item.username}</Text>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: getAccountTypeBadgeColor(item.accountType) },
                ]}
              >
                <Text style={styles.typeBadgeText}>{item.accountType}</Text>
              </View>
            </View>
            <Text style={styles.email}>{item.email}</Text>
          </View>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Users size={16} color={colors.secondaryText} />
            <Text style={styles.statValue}>{item.followerCount}</Text>
            <Text style={styles.statLabel}>フォロワー</Text>
          </View>
          <View style={styles.statItem}>
            <User size={16} color={colors.secondaryText} />
            <Text style={styles.statValue}>{item.followingCount}</Text>
            <Text style={styles.statLabel}>フォロー中</Text>
          </View>
          <View style={styles.statItem}>
            <AlertTriangle size={16} color={colors.error} />
            <Text style={styles.statValue}>{item.reportCount}</Text>
            <Text style={styles.statLabel}>通報</Text>
          </View>
        </View>

        <View style={styles.userFooter}>
          <Text style={styles.joinedText}>
            登録日 {formatDate(item.joinedAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>ユーザー管理</Text>
          <Text style={styles.headerSubtitle}>
            {filteredUsers.length} 人のユーザー
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder="ユーザーを検索..."
            placeholderTextColor={colors.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {(filterStatus !== 'all' || filterType !== 'all') && (
        <View style={styles.activeFilters}>
          {filterStatus !== 'all' && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                Status: {filterStatus}
              </Text>
              <TouchableOpacity onPress={() => setFilterStatus('all')}>
                <X size={14} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
          {filterType !== 'all' && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                Type: {filterType}
              </Text>
              <TouchableOpacity onPress={() => setFilterType('all')}>
                <X size={14} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <User size={48} color={colors.secondaryText} />
            <Text style={styles.emptyText}>ユーザーが見つかりません</Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>フィルター</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.filterSectionTitle}>ステータス</Text>
              <View style={styles.filterOptions}>
                {[
                  { key: 'all', label: 'すべて' },
                  { key: 'active', label: 'アクティブ' },
                  { key: 'suspended', label: '停止中' },
                  { key: 'banned', label: 'BAN済み' }
                ].map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.filterOption,
                      filterStatus === key && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilterStatus(key as any)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterStatus === key && styles.filterOptionTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>アカウント種別</Text>
              <View style={styles.filterOptions}>
                {[
                  { key: 'all', label: 'すべて' },
                  { key: 'user', label: '一般' },
                  { key: 'shop', label: 'ショップ' },
                  { key: 'admin', label: '管理者' }
                ].map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.filterOption,
                      filterType === key && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilterType(key as any)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterType === key && styles.filterOptionTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>フィルターを適用</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* User Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ユーザー詳細</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <X size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={styles.modalBody}>
                <View style={styles.userDetailHeader}>
                  <Image
                    source={{ uri: selectedUser.avatar }}
                    style={styles.largeAvatar}
                    contentFit="cover"
                  />
                  <Text style={styles.detailUsername}>
                    @{selectedUser.username}
                  </Text>
                  <Text style={styles.detailEmail}>{selectedUser.email}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(selectedUser.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {selectedUser.status === 'active' ? 'アクティブ' : selectedUser.status === 'suspended' ? '停止中' : 'BAN済み'}
                    </Text>
                  </View>
                </View>

                {userStats && (
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxValue}>
                        {userStats.totalPosts}
                      </Text>
                      <Text style={styles.statBoxLabel}>投稿</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxValue}>
                        {userStats.totalLikes}
                      </Text>
                      <Text style={styles.statBoxLabel}>いいね</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxValue}>
                        {userStats.avgEngagement}%
                      </Text>
                      <Text style={styles.statBoxLabel}>エンゲージ率</Text>
                    </View>
                  </View>
                )}

                <View style={styles.actionSection}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.warning }]}
                    onPress={() => handleWarnUser(selectedUser.id)}
                  >
                    <AlertTriangle size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>警告を送信</Text>
                  </TouchableOpacity>

                  {selectedUser.status === 'active' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.error }]}
                      onPress={() => handleSuspendUser(selectedUser.id)}
                    >
                      <Shield size={20} color="#FFF" />
                      <Text style={styles.actionBtnText}>アカウント停止</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#000' }]}
                    onPress={() => handleBanUser(selectedUser.id)}
                  >
                    <Ban size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>BAN</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => router.push(`/profile/${selectedUser.id}`)}
                  >
                    <Eye size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>プロフィール表示</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 4,
    },
    closeButton: {
      padding: 8,
    },
    searchContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    filterButton: {
      backgroundColor: colors.cardBackground,
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activeFilters: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 8,
      marginBottom: 12,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 6,
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: '500',
      color: '#FFF',
      textTransform: 'capitalize',
    },
    listContent: {
      padding: 16,
    },
    userCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userHeader: {
      flexDirection: 'row',
      marginBottom: 16,
      position: 'relative',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    usernameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    username: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    typeBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#FFF',
      textTransform: 'uppercase',
    },
    email: {
      fontSize: 13,
      color: colors.secondaryText,
    },
    statusIndicator: {
      position: 'absolute',
      right: 0,
      top: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statItem: {
      alignItems: 'center',
      gap: 4,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    statLabel: {
      fontSize: 11,
      color: colors.secondaryText,
    },
    userFooter: {
      marginTop: 12,
    },
    joinedText: {
      fontSize: 12,
      color: colors.secondaryText,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: colors.secondaryText,
      marginTop: 16,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    modalBody: {
      padding: 16,
    },
    filterSectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      marginTop: 16,
    },
    filterOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterOption: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    filterOptionTextActive: {
      color: '#FFF',
    },
    applyButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 24,
    },
    applyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFF',
    },
    userDetailHeader: {
      alignItems: 'center',
      marginBottom: 24,
    },
    largeAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 12,
    },
    detailUsername: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    detailEmail: {
      fontSize: 14,
      color: colors.secondaryText,
      marginBottom: 12,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFF',
      textTransform: 'capitalize',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 24,
      padding: 16,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
    },
    statBox: {
      alignItems: 'center',
    },
    statBoxValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    statBoxLabel: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 4,
    },
    actionSection: {
      gap: 12,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 12,
      gap: 8,
    },
    actionBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFF',
    },
  });
