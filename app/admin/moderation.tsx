import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Filter,
  AlertTriangle,
  User,
  FileText,
  MessageSquare,
  Radio,
  Check,
  XCircle,
  Ban,
  Shield,
  Eye,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

type ContentType = 'post' | 'comment' | 'user' | 'live';
type FlagReason =
  | 'violence'
  | 'nudity'
  | 'spam'
  | 'hate_speech'
  | 'misinformation'
  | 'harassment';

interface FlaggedContent {
  id: string;
  contentId: string;
  type: ContentType;
  reason: FlagReason;
  aiConfidence: number;
  flaggedAt: number;
  content: {
    preview: string;
    imageUrl?: string;
    user: {
      id: string;
      username: string;
      avatar: string;
      previousViolations: number;
    };
  };
  metadata: {
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
  };
}

export default function ContentModerationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  const [activeTab, setActiveTab] = useState<ContentType>('post');
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [filteredContent, setFilteredContent] = useState<FlaggedContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<FlaggedContent | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterReason, setFilterReason] = useState<FlagReason | 'all'>('all');
  const [filterConfidence, setFilterConfidence] = useState<number>(0);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const loadFlaggedContent = async (type: ContentType) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/admin/moderation/flagged?type=${type}`);
      // const data = await response.json();

      // Mock data
      const mockContent: FlaggedContent[] = [
        {
          id: '1',
          contentId: 'post_123',
          type: 'post',
          reason: 'spam',
          aiConfidence: 0.92,
          flaggedAt: Date.now() - 1800000,
          content: {
            preview:
              'Buy now! Limited time offer! Click here for amazing deals...',
            imageUrl: 'https://picsum.photos/400/400?random=20',
            user: {
              id: 'user1',
              username: 'spammer_acc',
              avatar: 'https://picsum.photos/100/100?random=5',
              previousViolations: 3,
            },
          },
          metadata: {
            viewCount: 450,
            likeCount: 12,
            commentCount: 3,
          },
        },
        {
          id: '2',
          contentId: 'post_124',
          type: 'post',
          reason: 'violence',
          aiConfidence: 0.78,
          flaggedAt: Date.now() - 3600000,
          content: {
            preview: 'Post containing potentially violent content',
            imageUrl: 'https://picsum.photos/400/400?random=21',
            user: {
              id: 'user2',
              username: 'violator123',
              avatar: 'https://picsum.photos/100/100?random=6',
              previousViolations: 1,
            },
          },
          metadata: {
            viewCount: 1200,
            likeCount: 45,
            commentCount: 18,
          },
        },
        {
          id: '3',
          contentId: 'post_125',
          type: 'post',
          reason: 'hate_speech',
          aiConfidence: 0.85,
          flaggedAt: Date.now() - 7200000,
          content: {
            preview: 'Post flagged for hate speech content',
            imageUrl: 'https://picsum.photos/400/400?random=22',
            user: {
              id: 'user3',
              username: 'hater_user',
              avatar: 'https://picsum.photos/100/100?random=7',
              previousViolations: 5,
            },
          },
          metadata: {
            viewCount: 890,
            likeCount: 23,
            commentCount: 67,
          },
        },
      ];

      const filtered = mockContent.filter((c) => c.type === type);
      setFlaggedContent(mockContent);
      setFilteredContent(filtered);
    } catch (error) {
      console.error('Failed to load flagged content:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFlaggedContent(activeTab);
  }, [activeTab]);

  useEffect(() => {
    let filtered = flaggedContent.filter((c) => c.type === activeTab);

    if (filterReason !== 'all') {
      filtered = filtered.filter((c) => c.reason === filterReason);
    }

    if (filterConfidence > 0) {
      filtered = filtered.filter((c) => c.aiConfidence >= filterConfidence);
    }

    setFilteredContent(filtered);
  }, [filterReason, filterConfidence, flaggedContent, activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFlaggedContent(activeTab);
  };

  const handleContentPress = (content: FlaggedContent) => {
    setSelectedContent(content);
    setShowDetailModal(true);
  };

  const handleApprove = async (contentId: string) => {
    Alert.alert(
      'Approve Content',
      'Are you sure this content is safe to approve?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              // TODO: API call
              // await fetch(`/admin/moderation/${contentId}/approve`, {
              //   method: 'POST',
              // });
              Alert.alert('Success', 'Content approved');
              setShowDetailModal(false);
              loadFlaggedContent(activeTab);
            } catch (error) {
              Alert.alert('Error', 'Failed to approve content');
            }
          },
        },
      ]
    );
  };

  const handleRemove = async (contentId: string) => {
    Alert.alert(
      'Remove Content',
      'Are you sure you want to remove this content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: API call
              // await fetch(`/admin/moderation/${contentId}/remove`, {
              //   method: 'POST',
              // });
              Alert.alert('Success', 'Content removed');
              setShowDetailModal(false);
              loadFlaggedContent(activeTab);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove content');
            }
          },
        },
      ]
    );
  };

  const handleWarnUser = async (contentId: string) => {
    try {
      // TODO: API call
      // await fetch(`/admin/moderation/${contentId}/warn`, {
      //   method: 'POST',
      // });
      Alert.alert('Success', 'Warning sent to user');
    } catch (error) {
      Alert.alert('Error', 'Failed to send warning');
    }
  };

  const handleBanUser = async (contentId: string) => {
    Alert.alert(
      'Ban User',
      'Are you sure you want to ban this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: API call
              // await fetch(`/admin/moderation/${contentId}/ban`, {
              //   method: 'POST',
              // });
              Alert.alert('Success', 'User banned');
              setShowDetailModal(false);
              loadFlaggedContent(activeTab);
            } catch (error) {
              Alert.alert('Error', 'Failed to ban user');
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return colors.error;
    if (confidence >= 0.7) return colors.warning;
    return colors.success;
  };

  const getReasonColor = (reason: FlagReason) => {
    switch (reason) {
      case 'violence':
      case 'hate_speech':
        return '#F44336';
      case 'nudity':
      case 'harassment':
        return '#FF9800';
      case 'spam':
      case 'misinformation':
        return '#FFC107';
      default:
        return colors.secondaryText;
    }
  };

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'post':
        return FileText;
      case 'user':
        return User;
      case 'comment':
        return MessageSquare;
      case 'live':
        return Radio;
      default:
        return AlertTriangle;
    }
  };

  const renderContent = ({ item }: { item: FlaggedContent }) => {
    const TypeIcon = getTypeIcon(item.type);
    const confidenceColor = getConfidenceColor(item.aiConfidence);
    const reasonColor = getReasonColor(item.reason);

    return (
      <TouchableOpacity
        style={styles.contentCard}
        onPress={() => handleContentPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.contentHeader}>
          <View style={styles.headerLeft}>
            <TypeIcon size={16} color={colors.icon} />
            <Text style={styles.contentType}>{item.type}</Text>
          </View>
          <View
            style={[styles.confidenceBadge, { backgroundColor: confidenceColor }]}
          >
            <Text style={styles.confidenceText}>
              {Math.round(item.aiConfidence * 100)}%
            </Text>
          </View>
        </View>

        {item.content.imageUrl && (
          <Image
            source={{ uri: item.content.imageUrl }}
            style={styles.contentImage}
            contentFit="cover"
          />
        )}

        <View style={styles.contentBody}>
          <View style={[styles.reasonBadge, { backgroundColor: reasonColor }]}>
            <Text style={styles.reasonText}>{item.reason.replace('_', ' ')}</Text>
          </View>

          <Text style={styles.preview} numberOfLines={2}>
            {item.content.preview}
          </Text>

          <View style={styles.userInfo}>
            <Image
              source={{ uri: item.content.user.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.userDetails}>
              <Text style={styles.username}>
                @{item.content.user.username}
              </Text>
              {item.content.user.previousViolations > 0 && (
                <View style={styles.violationBadge}>
                  <AlertTriangle size={12} color={colors.error} />
                  <Text style={styles.violationText}>
                    {item.content.user.previousViolations} violations
                  </Text>
                </View>
              )}
            </View>
          </View>

          {item.metadata.viewCount !== undefined && (
            <View style={styles.metadata}>
              <Text style={styles.metadataText}>
                {item.metadata.viewCount} views
              </Text>
              <Text style={styles.metadataText}>
                {item.metadata.likeCount} likes
              </Text>
              <Text style={styles.metadataText}>
                {item.metadata.commentCount} comments
              </Text>
            </View>
          )}
        </View>

        <View style={styles.contentFooter}>
          <Text style={styles.timestamp}>
            Flagged {formatTimestamp(item.flaggedAt)}
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
          <Text style={styles.headerTitle}>コンテンツ審査</Text>
          <Text style={styles.headerSubtitle}>
            {filteredContent.length} 件のフラグ済みアイテム
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={styles.filterButton}
          >
            <Filter size={20} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'post', label: '投稿' },
          { key: 'comment', label: 'コメント' },
          { key: 'user', label: 'ユーザー' },
          { key: 'live', label: 'ライブ' }
        ].map(({key, label}) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.activeTab]}
            onPress={() => setActiveTab(key as ContentType)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === key && styles.activeTabText,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active Filters */}
      {(filterReason !== 'all' || filterConfidence > 0) && (
        <View style={styles.activeFilters}>
          {filterReason !== 'all' && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                {filterReason.replace('_', ' ')}
              </Text>
              <TouchableOpacity onPress={() => setFilterReason('all')}>
                <X size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
          {filterConfidence > 0 && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                Confidence: {Math.round(filterConfidence * 100)}%+
              </Text>
              <TouchableOpacity onPress={() => setFilterConfidence(0)}>
                <X size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Content List */}
      <FlatList
        data={filteredContent}
        keyExtractor={(item) => item.id}
        renderItem={renderContent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Shield size={48} color={colors.secondaryText} />
            <Text style={styles.emptyText}>フラグ済みコンテンツはありません</Text>
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
              <Text style={styles.filterSectionTitle}>Flag Reason</Text>
              <View style={styles.filterOptions}>
                {[
                  'all',
                  'violence',
                  'nudity',
                  'spam',
                  'hate_speech',
                  'misinformation',
                  'harassment',
                ].map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.filterOption,
                      filterReason === reason && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilterReason(reason as any)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterReason === reason &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {reason.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>
                Minimum Confidence
              </Text>
              <View style={styles.confidenceSlider}>
                {[0, 0.5, 0.7, 0.9].map((conf) => (
                  <TouchableOpacity
                    key={conf}
                    style={[
                      styles.confidenceOption,
                      filterConfidence === conf &&
                        styles.confidenceOptionActive,
                    ]}
                    onPress={() => setFilterConfidence(conf)}
                  >
                    <Text
                      style={[
                        styles.confidenceOptionText,
                        filterConfidence === conf &&
                          styles.confidenceOptionTextActive,
                      ]}
                    >
                      {conf === 0 ? 'All' : `${Math.round(conf * 100)}%+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>コンテンツ確認</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <X size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {selectedContent && (
              <View style={styles.modalBody}>
                {selectedContent.content.imageUrl && (
                  <Image
                    source={{ uri: selectedContent.content.imageUrl }}
                    style={styles.modalImage}
                    contentFit="cover"
                  />
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Flag Reason</Text>
                  <View
                    style={[
                      styles.reasonBadge,
                      {
                        backgroundColor: getReasonColor(selectedContent.reason),
                      },
                    ]}
                  >
                    <Text style={styles.reasonText}>
                      {selectedContent.reason.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>AI Confidence</Text>
                  <Text style={styles.detailValue}>
                    {Math.round(selectedContent.aiConfidence * 100)}%
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Content</Text>
                  <Text style={styles.detailValue}>
                    {selectedContent.content.preview}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>User Info</Text>
                  <View style={styles.userRow}>
                    <Image
                      source={{ uri: selectedContent.content.user.avatar }}
                      style={styles.modalAvatar}
                      contentFit="cover"
                    />
                    <View>
                      <Text style={styles.detailValue}>
                        @{selectedContent.content.user.username}
                      </Text>
                      <Text style={styles.violationsText}>
                        {selectedContent.content.user.previousViolations}{' '}
                        previous violations
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.success },
                    ]}
                    onPress={() => handleApprove(selectedContent.contentId)}
                  >
                    <Check size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>承認</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.error }]}
                    onPress={() => handleRemove(selectedContent.contentId)}
                  >
                    <XCircle size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>削除</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.warning },
                    ]}
                    onPress={() => handleWarnUser(selectedContent.contentId)}
                  >
                    <AlertTriangle size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>警告を送信</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#000' }]}
                    onPress={() => handleBanUser(selectedContent.contentId)}
                  >
                    <Ban size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>ユーザーをBAN</Text>
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
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    filterButton: {
      padding: 8,
    },
    closeButton: {
      padding: 8,
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 8,
      marginVertical: 16,
    },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.cardBackground,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    activeTabText: {
      color: '#FFF',
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
      paddingTop: 0,
    },
    contentCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    contentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    contentType: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textTransform: 'capitalize',
    },
    confidenceBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    confidenceText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFF',
    },
    contentImage: {
      width: '100%',
      height: 180,
      borderRadius: 8,
      marginBottom: 12,
    },
    contentBody: {
      gap: 12,
    },
    reasonBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    reasonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFF',
      textTransform: 'capitalize',
    },
    preview: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    userDetails: {
      flex: 1,
    },
    username: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    violationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    violationText: {
      fontSize: 12,
      color: colors.error,
      fontWeight: '500',
    },
    metadata: {
      flexDirection: 'row',
      gap: 16,
    },
    metadataText: {
      fontSize: 12,
      color: colors.secondaryText,
    },
    contentFooter: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 12,
    },
    timestamp: {
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
    modalImage: {
      width: '100%',
      height: 250,
      borderRadius: 12,
      marginBottom: 16,
    },
    detailSection: {
      marginBottom: 16,
    },
    detailLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.secondaryText,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    detailValue: {
      fontSize: 15,
      color: colors.text,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modalAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    violationsText: {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      gap: 6,
    },
    actionBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFF',
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
      textTransform: 'capitalize',
    },
    filterOptionTextActive: {
      color: '#FFF',
    },
    confidenceSlider: {
      flexDirection: 'row',
      gap: 8,
    },
    confidenceOption: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    confidenceOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    confidenceOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    confidenceOptionTextActive: {
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
  });
