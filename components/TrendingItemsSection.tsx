import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Play, ShoppingBag } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 64) / 3; // 3 items per row with padding and gaps

interface TrendingItem {
  id: string;
  type: 'post' | 'video' | 'cm';
  imageUrl: string;
  title: string;
  likes?: number;
}

// Sample data for trending items - all fashion related
const trendingItems: TrendingItem[] = [
  {
    id: '1',
    type: 'post',
    imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000',
    title: 'Summer Collection',
    likes: 423
  },
  {
    id: '2',
    type: 'video',
    imageUrl: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=1000',
    title: 'Street Style Guide',
    likes: 892
  },
  {
    id: '3',
    type: 'cm',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000',
    title: 'New Arrivals',
    likes: 567
  },
  {
    id: '4',
    type: 'post',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000',
    title: 'Casual Wear',
    likes: 345
  },
  {
    id: '5',
    type: 'video',
    imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000',
    title: 'Fashion Week Highlights',
    likes: 721
  },
  {
    id: '6',
    type: 'cm',
    imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?q=80&w=1000',
    title: 'Designer Bags',
    likes: 489
  },
  {
    id: '7',
    type: 'post',
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000',
    title: 'Autumn Trends',
    likes: 634
  },
  {
    id: '8',
    type: 'video',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000',
    title: 'Styling Tips',
    likes: 512
  },
  {
    id: '9',
    type: 'cm',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000',
    title: 'Winter Sale',
    likes: 789
  },
  {
    id: '10',
    type: 'post',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000',
    title: 'Formal Wear',
    likes: 456
  },
  {
    id: '11',
    type: 'video',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000',
    title: 'Accessories Guide',
    likes: 298
  },
  {
    id: '12',
    type: 'cm',
    imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1000',
    title: 'Spring Sale',
    likes: 673
  }
];

export default function TrendingItemsSection() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  const handleItemPress = (item: TrendingItem) => {
    switch (item.type) {
      case 'post':
        router.push(`/post/${item.id}`);
        break;
      case 'video':
        router.push(`/post/${item.id}`);
        break;
      case 'cm':
        router.push(`/product/${item.id}`);
        break;
    }
  };

  const renderItem = (item: TrendingItem) => (
    <TouchableOpacity 
      key={item.id}
      style={styles.itemContainer}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.itemImage}
          contentFit="cover"
        />
        
        {/* Type indicator */}
        <View style={styles.typeIndicator}>
          {item.type === 'video' && (
            <Play size={10} color="white" fill="white" />
          )}
          {item.type === 'cm' && (
            <ShoppingBag size={10} color="white" />
          )}
        </View>
      </View>
      
      <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
      {item.likes && (
        <Text style={styles.itemLikes}>{item.likes} likes</Text>
      )}
    </TouchableOpacity>
  );

  // Create rows of 3 items each
  const renderRows = () => {
    const rows = [];
    for (let i = 0; i < trendingItems.length; i += 3) {
      const rowItems = trendingItems.slice(i, i + 3);
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          {rowItems.map(item => renderItem(item))}
          {/* Fill empty spaces if row has less than 3 items */}
          {rowItems.length < 3 && Array.from({ length: 3 - rowItems.length }).map((_, index) => (
            <View key={`empty-${i}-${index}`} style={styles.itemContainer} />
          ))}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>☆トレンドアイテム&あなたにオススメ☆</Text>
      </View>
      
      <View style={styles.listContainer}>
        {renderRows()}
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  listContainer: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  itemContainer: {
    width: ITEM_WIDTH,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: ITEM_WIDTH, // Square images
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  typeIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    marginTop: 6,
    lineHeight: 16,
  },
  itemLikes: {
    fontSize: 10,
    color: colors.secondaryText,
    marginTop: 2,
  },
});