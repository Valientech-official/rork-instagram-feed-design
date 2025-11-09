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
  AlertTriangle,
  User,
  FileText,
  MessageSquare,
  Radio,
  Check,
  XCircle,
  Eye,
  Ban,
  Flag,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

type ReportStatus = 'pending' | 'resolved' | 'dismissed';
type ReportType = 'post' | 'user' | 'comment' | 'live';

interface Report {
  id: string;
  type: ReportType;
  status: ReportStatus;
  reason: string;
  reportedBy: {
    id: string;
    username: string;
    avatar: string;
  };
  reportedContent: {
    id: string;
    type: ReportType;
    preview: string;
    imageUrl?: string;
  };
  reportedUser: {
    id: string;
    username: string;
    avatar: string;
  };
  timestamp: number;
  description: string;
}

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  const [activeTab, setActiveTab] = useState<'all' | ReportStatus>('pending');
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadReports = async (status?: ReportStatus) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/admin/reports?status=${status || 'all'}`);
      // const data = await response.json();

      // Mock data
      const mockReports: Report[] = [
        {
          id: '1',
          type: 'post',
          status: 'pending',
          reason: 'Spam',
          reportedBy: {
            id: 'user1',
            username: 'reporter1',
            avatar: 'https://picsum.photos/100/100?random=1',
          },
          reportedContent: {
            id: 'post1',
            type: 'post',
            preview: 'This is a spam post with promotional content...',
            imageUrl: 'https://picsum.photos/400/400?random=10',
          },
          reportedUser: {
            id: 'user2',
            username: 'spammer123',
            avatar: 'https://picsum.photos/100/100?random=2',
          },
          timestamp: Date.now() - 3600000,
          description: 'Multiple promotional links and spam content',
        },
        {
          id: '2',
          type: 'user',
          status: 'pending',
          reason: 'Harassment',
          reportedBy: {
            id: 'user3',
            username: 'victim_user',
            avatar: 'https://picsum.photos/100/100?random=3',
          },
          reportedContent: {
            id: 'user4',
            type: 'user',
            preview: 'Harassing user profile',
          },
          reportedUser: {
            id: 'user4',
            username: 'harasser_acc',
            avatar: 'https://picsum.photos/100/100?random=4',
          },
          timestamp: Date.now() - 7200000,
          description: 'Repeatedly sending abusive messages',
        },
      ];

      const filtered = status && status !== 'all'
        ? mockReports.filter((r) => r.status === status)
        : mockReports;

      setReports(mockReports);
      setFilteredReports(filtered);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports(activeTab === 'all' ? undefined : activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = reports.filter(
        (report) =>
          report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.reportedUser.username
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredReports(filtered);
    } else {
      const filtered =
        activeTab === 'all'
          ? reports
          : reports.filter((r) => r.status === activeTab);
      setFilteredReports(filtered);
    }
  }, [searchQuery, reports, activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports(activeTab === 'all' ? undefined : activeTab);
  };

  const handleReportPress = (report: Report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleTakeAction = async (
    action: 'remove' | 'warn' | 'ban',
    reportId: string
  ) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this content/user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: API call
              // await fetch(`/admin/report/${reportId}/action`, {
              //   method: 'POST',
              //   body: JSON.stringify({ action }),
              // });

              setShowDetailModal(false);
              Alert.alert('Success', `Action completed: ${action}`);
              loadReports(activeTab === 'all' ? undefined : activeTab);
            } catch (error) {
              Alert.alert('Error', 'Failed to take action');
            }
          },
        },
      ]
    );
  };

  const handleResolve = async (reportId: string) => {
    try {
      // TODO: API call
      // await fetch(`/admin/report/${reportId}`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ status: 'resolved' }),
      // });

      setShowDetailModal(false);
      Alert.alert('Success', 'Report marked as resolved');
      loadReports(activeTab === 'all' ? undefined : activeTab);
    } catch (error) {
      Alert.alert('Error', 'Failed to resolve report');
    }
  };

  const handleDismiss = async (reportId: string) => {
    try {
      // TODO: API call
      // await fetch(`/admin/report/${reportId}`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ status: 'dismissed' }),
      // });

      setShowDetailModal(false);
      Alert.alert('Success', 'Report dismissed');
      loadReports(activeTab === 'all' ? undefined : activeTab);
    } catch (error) {
      Alert.alert('Error', 'Failed to dismiss report');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'resolved':
        return colors.success;
      case 'dismissed':
        return colors.secondaryText;
      default:
        return colors.text;
    }
  };

  const getTypeIcon = (type: ReportType) => {
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
        return Flag;
    }
  };

  const renderReport = ({ item }: { item: Report }) => {
    const TypeIcon = getTypeIcon(item.type);

    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => handleReportPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.reportHeader}>
          <View style={styles.reportTypeContainer}>
            <TypeIcon size={16} color={colors.icon} />
            <Text style={styles.reportType}>{item.type}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.reportBody}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: item.reportedUser.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.userDetails}>
              <Text style={styles.username}>@{item.reportedUser.username}</Text>
              <Text style={styles.reason}>Reason: {item.reason}</Text>
            </View>
          </View>

          {item.reportedContent.imageUrl && (
            <Image
              source={{ uri: item.reportedContent.imageUrl }}
              style={styles.contentPreview}
              contentFit="cover"
            />
          )}

          <Text style={styles.preview} numberOfLines={2}>
            {item.reportedContent.preview}
          </Text>
        </View>

        <View style={styles.reportFooter}>
          <Text style={styles.timestamp}>
            Reported {formatTimestamp(item.timestamp)}
          </Text>
          <Text style={styles.reporter}>by @{item.reportedBy.username}</Text>
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
          <Text style={styles.headerTitle}>Report Management</Text>
          <Text style={styles.headerSubtitle}>
            {filteredReports.length} reports
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.secondaryText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reports..."
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

      {/* Tabs */}
      <View style={styles.tabs}>
        {['all', 'pending', 'resolved', 'dismissed'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reports List */}
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        renderItem={renderReport}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertTriangle size={48} color={colors.secondaryText} />
            <Text style={styles.emptyText}>No reports found</Text>
          </View>
        }
      />

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
              <Text style={styles.modalTitle}>Report Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <X size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <View style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Reported User</Text>
                  <View style={styles.userRow}>
                    <Image
                      source={{ uri: selectedReport.reportedUser.avatar }}
                      style={styles.modalAvatar}
                      contentFit="cover"
                    />
                    <Text style={styles.detailValue}>
                      @{selectedReport.reportedUser.username}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Report Type</Text>
                  <Text style={styles.detailValue}>{selectedReport.type}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Reason</Text>
                  <Text style={styles.detailValue}>{selectedReport.reason}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>
                    {selectedReport.description}
                  </Text>
                </View>

                {selectedReport.reportedContent.imageUrl && (
                  <Image
                    source={{ uri: selectedReport.reportedContent.imageUrl }}
                    style={styles.modalImage}
                    contentFit="cover"
                  />
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.success }]}
                    onPress={() => handleResolve(selectedReport.id)}
                  >
                    <Check size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>Resolve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.secondaryText },
                    ]}
                    onPress={() => handleDismiss(selectedReport.id)}
                  >
                    <XCircle size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.error }]}
                    onPress={() =>
                      handleTakeAction('remove', selectedReport.id)
                    }
                  >
                    <XCircle size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>Remove</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.warning }]}
                    onPress={() => handleTakeAction('warn', selectedReport.id)}
                  >
                    <AlertTriangle size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>Warn</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#000' }]}
                    onPress={() => handleTakeAction('ban', selectedReport.id)}
                  >
                    <Ban size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>Ban</Text>
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
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      margin: 16,
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
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 8,
      marginBottom: 16,
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
    listContent: {
      padding: 16,
      paddingTop: 0,
    },
    reportCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reportHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    reportTypeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    reportType: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textTransform: 'capitalize',
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
    reportBody: {
      marginBottom: 12,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
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
    reason: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 2,
    },
    contentPreview: {
      width: '100%',
      height: 120,
      borderRadius: 8,
      marginBottom: 8,
    },
    preview: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    reportFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    timestamp: {
      fontSize: 12,
      color: colors.secondaryText,
    },
    reporter: {
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
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    modalImage: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginBottom: 16,
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
  });
