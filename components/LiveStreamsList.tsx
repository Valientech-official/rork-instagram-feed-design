import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LiveStream } from '@/mocks/liveStreams';
import LiveStreamItem from './LiveStreamItem';
import Colors from '@/constants/colors';
import { Image } from 'expo-image';
import { useThemeStore } from '@/store/themeStore';
import { users } from '@/mocks/users';

interface LiveStreamsListProps {
  streams: LiveStream[];
  title?: string;
  showSeeAll?: boolean;
  showHeaderTitle?: boolean;
  doorSubtitle?: string;
}

export default function LiveStreamsList({
  streams,
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

  const handleSeeAllPress = () => {
    router.push('/live');
  };

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || displayCount >= streams.length) return;

    setIsLoadingMore(true);
    // Simulate loading delay
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + 10, streams.length));
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, displayCount, streams.length]);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  if (streams.length === 0) {
    return null;
  }

  const displayedStreams = streams.slice(0, displayCount);
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
        {/* 自分のアカウント */}
        <TouchableOpacity style={styles.doorColumn} onPress={() => router.push('/profile')}>
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

        {/* ウェーブリスト */}
        <FlatList
          data={displayedStreams}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <LiveStreamItem stream={item} size="small" />
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
