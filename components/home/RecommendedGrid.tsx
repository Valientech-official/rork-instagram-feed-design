import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MoreHorizontal } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 16px padding on sides + 16px gap

interface RecommendedItem {
  id: string;
  image: string;
  title: string;
  brand: string;
  liked: boolean;
}

const ITEMS: RecommendedItem[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    title: 'エアリーワンピース',
    brand: 'サマーブリーズ',
    liked: false,
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    title: 'オーバーサイズシャツ',
    brand: 'アーバンカジュアル',
    liked: false,
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400',
    title: 'グラフィックTシャツ',
    brand: 'ストリートベース',
    liked: false,
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea3c8a7f?w=400',
    title: 'イエロージャケット',
    brand: 'カラーポップ',
    liked: false,
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400',
    title: 'カジュアルコーデ',
    brand: 'デイリースタイル',
    liked: false,
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400',
    title: '暖かニットセーター',
    brand: 'ウィンターウール',
    liked: false,
  },
  {
    id: '7',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
    title: 'ボヘミアンドレス',
    brand: 'リゾートウェア',
    liked: false,
  },
  {
    id: '8',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400',
    title: 'レイヤードスタイル',
    brand: 'モードミックス',
    liked: false,
  },
];

export default function RecommendedGrid() {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);
  const [items, setItems] = useState(ITEMS);
  const [displayCount, setDisplayCount] = useState(8);

  const toggleLike = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, liked: !item.liked } : item
    ));
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + 8, items.length));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>おすすめ&トレンドアイテム</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Heart size={20} color={colors.secondaryText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <MoreHorizontal size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.grid}>
        {items.slice(0, displayCount).map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.gridItem,
              index % 2 === 0 ? styles.leftItem : styles.rightItem,
            ]}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.itemImage}
              contentFit="cover"
            />
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
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.itemBrand} numberOfLines={1}>{item.brand}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {displayCount < items.length && (
          <TouchableOpacity
            style={[styles.gridItem, styles.moreButton]}
            onPress={handleLoadMore}
            activeOpacity={0.8}
          >
            <Text style={styles.moreButtonText}>more</Text>
          </TouchableOpacity>
        )}
      </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  gridItem: {
    width: ITEM_WIDTH,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.shopCard,
  },
  leftItem: {
    marginRight: 8,
  },
  rightItem: {
    marginLeft: 8,
  },
  itemImage: {
    width: '100%',
    height: ITEM_WIDTH * 1.3,
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 8,
  },
  itemInfo: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 11,
    color: colors.secondaryText,
  },
  moreButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
