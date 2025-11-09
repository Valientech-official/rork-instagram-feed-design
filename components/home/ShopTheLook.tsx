import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MoreHorizontal } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const GRID_COLUMNS = 4;
const GRID_ROWS = 2;
const GRID_CONTAINER_WIDTH = width - 32; // align with previous padding
const GRID_GAP = 12;
const ITEM_WIDTH =
  (GRID_CONTAINER_WIDTH - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
const CHUNK_SIZE = GRID_COLUMNS * GRID_ROWS;

interface LookItem {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  liked: boolean;
  weeklyLikes: number;
  rank: number;
}

const ITEMS: LookItem[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    title: 'エアリーワンピース',
    subtitle: 'サマーコレクション',
    liked: false,
    weeklyLikes: 12840,
    rank: 1,
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    title: 'オーバーサイズシャツ',
    subtitle: 'カジュアルスタイル',
    liked: false,
    weeklyLikes: 11760,
    rank: 2,
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400',
    title: 'グラフィックTシャツ',
    subtitle: 'ストリート系',
    liked: false,
    weeklyLikes: 10980,
    rank: 3,
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea3c8a7f?w=400',
    title: 'イエロージャケット',
    subtitle: 'アウター',
    liked: false,
    weeklyLikes: 9980,
    rank: 4,
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400',
    title: 'カジュアルルック',
    subtitle: 'デイリーコーデ',
    liked: false,
    weeklyLikes: 9320,
    rank: 5,
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400',
    title: 'ニットセーター',
    subtitle: '秋冬コレクション',
    liked: false,
    weeklyLikes: 9040,
    rank: 6,
  },
  {
    id: '7',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
    title: 'ボヘミアンスタイル',
    subtitle: 'リゾートウェア',
    liked: false,
    weeklyLikes: 8760,
    rank: 7,
  },
  {
    id: '8',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400',
    title: 'レイヤードコーデ',
    subtitle: 'トレンドスタイル',
    liked: false,
    weeklyLikes: 8420,
    rank: 8,
  },
];

const formatLikes = (count: number) => {
  if (count >= 1000) {
    const value = (count / 1000).toFixed(1).replace(/\.0$/, '');
    return `${value}K`;
  }
  return `${count}`;
};

export default function ShopTheLook() {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);
  const [items, setItems] = useState(ITEMS);

  const toggleLike = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, liked: !item.liked } : item
      )
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>ピース数 Weeklyランキング</Text>
          <Text style={styles.subtitle}>1週間以内・全ジャンルいいね数ランキング</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Heart size={20} color={colors.secondaryText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <MoreHorizontal size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={GRID_CONTAINER_WIDTH + GRID_GAP * 2}
        decelerationRate="fast"
      >
        {Array.from({ length: Math.ceil(items.length / CHUNK_SIZE) }).map((_, chunkIndex) => {
          const chunkItems = items.slice(
            chunkIndex * CHUNK_SIZE,
            chunkIndex * CHUNK_SIZE + CHUNK_SIZE
          );
          return (
            <View key={chunkIndex} style={styles.gridPage}>
              {chunkItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridItem}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                    contentFit="cover"
                  />
                  <View style={styles.overlay}>
                    <View style={styles.textContainer}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.itemSubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>
                    <View style={styles.likesRow}>
                      <Text style={styles.likesLabel}>今週いいね</Text>
                      <Text style={styles.likesValue}>+{formatLikes(item.weeklyLikes)}</Text>
                    </View>
                  </View>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{item.rank}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.likeButton}
                    onPress={() => toggleLike(item.id)}
                  >
                    <Heart
                      size={16}
                      color={item.liked ? colors.like : '#fff'}
                      fill={item.liked ? colors.like : 'transparent'}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  gridPage: {
    width: GRID_CONTAINER_WIDTH,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginRight: 16,
  },
  gridItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.shopCard,
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  textContainer: {
    gap: 2,
  },
  likesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  likesLabel: {
    color: '#fff',
    fontSize: 11,
  },
  likesValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  itemTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemSubtitle: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.8,
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
