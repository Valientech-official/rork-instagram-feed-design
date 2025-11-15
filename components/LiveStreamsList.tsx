import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LiveStream } from '@/mocks/liveStreams';
import { Wave } from '@/mocks/waves';
import LiveStreamItem from './LiveStreamItem';
import Colors from '@/constants/colors';
import { Image } from 'expo-image';
import { useThemeStore } from '@/store/themeStore';
import { users } from '@/mocks/users';

// 将来的にライブとウェーブを混在表示するための型
type ContentItem = (LiveStream & { type: 'live' }) | (Wave & { type: 'wave' });

interface LiveStreamsListProps {
  streams?: LiveStream[]; // 後方互換性のため残す
  waves?: Wave[]; // ウェーブデータ
  items?: ContentItem[]; // 将来: ライブとウェーブを混在表示
  title?: string;
  showSeeAll?: boolean;
  showHeaderTitle?: boolean;
  doorSubtitle?: string;
}

export default function LiveStreamsList({
  streams,
  waves,
  items,
  title = "ウェーブス",
  showSeeAll = false,
  showHeaderTitle = true,
  doorSubtitle = "ウェーブス",
}: LiveStreamsListProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // データソースの優先順位: items > waves > streams
  // 将来: items でライブとウェーブを混在表示
  // 現在: waves でウェーブのみ表示
  const contentData = items ||
    (waves ? waves.map(w => ({ ...w, type: 'wave' as const })) : []) ||
    (streams ? streams.map(s => ({ ...s, type: 'live' as const })) : []);

  const handleSeeAllPress = () => {
    // 将来: ウェーブとライブの混在ページ
    // 現在: ウェーブタイムラインへ
    router.push('/wave');
  };

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || displayCount >= contentData.length) return;

    setIsLoadingMore(true);
    // Simulate loading delay
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + 10, contentData.length));
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, displayCount, contentData.length]);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  if (contentData.length === 0) {
    return null;
  }

  const displayedContent = contentData.slice(0, displayCount);
  const currentUser = users[0]; // 現在のユーザー（janedoe）

  return (
    <View style={styles.container}>
      {showHeaderTitle && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {showSeeAll && (
            <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAllPress}>
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.contentRow}>
        {/* 自分のアカウント - ウェーブタイムラインへ */}
        <TouchableOpacity style={styles.doorColumn} onPress={() => router.push('/wave')}>
          <View style={styles.doorImageContainer}>
            <Image
              source={{ uri: currentUser.avatar }}
              style={styles.doorImage}
              contentFit="cover"
            />
            <View style={styles.addWaveButton}>
              <Plus size={20} color="white" />
            </View>
          </View>
          {!!doorSubtitle && (
            <Text style={styles.doorSubtitle}>{doorSubtitle}</Text>
          )}
        </TouchableOpacity>

        {/* コンテンツリスト (ウェーブ or ライブ or 混在) */}
        <FlatList
          data={displayedContent}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <LiveStreamItem
              stream={'type' in item && item.type === 'live' ? item : undefined}
              wave={'type' in item && item.type === 'wave' ? item : undefined}
              size="small"
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
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
  contentRow: {
    flexDirection: 'row',
    paddingLeft: 16,
  },
  doorColumn: {
    width: 100,
    alignItems: 'center',
    marginRight: 12,
  },
  doorImageContainer: {
    width: '100%',
    height: 125,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  doorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  addWaveButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  doorSubtitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    alignSelf: 'center',
  },
  listContent: {
    paddingRight: 8,
  },
  footerLoader: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
