import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MoreHorizontal } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 64) / 4; // 16px padding on sides + 16px gap between items

interface LookItem {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  liked: boolean;
}

const ITEMS: LookItem[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    title: 'Peryl Free',
    subtitle: 'Kvennpoh',
    liked: false,
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    title: 'Má pas banc',
    subtitle: 'Apparition',
    liked: false,
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400',
    title: 'Reynresstrue',
    subtitle: 'Apeods',
    liked: false,
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea3c8a7f?w=400',
    title: 'Edoguitnon',
    subtitle: 'Harlund',
    liked: false,
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400',
    title: 'Vaniestomua',
    subtitle: 'Turhumitd',
    liked: false,
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400',
    title: 'Woshife',
    subtitle: 'Nyonaris',
    liked: false,
  },
  {
    id: '7',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
    title: 'Banlik Solttoe',
    subtitle: 'Paranemold',
    liked: false,
  },
  {
    id: '8',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400',
    title: 'Kiroscmlons',
    subtitle: 'Tbeods',
    liked: false,
  },
];

export default function ShopTheLook() {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);
  const [items, setItems] = useState(ITEMS);

  const toggleLike = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, liked: !item.liked } : item
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recommended for You</Text>
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
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.gridItem}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.itemImage}
              contentFit="cover"
            />
            <View style={styles.overlay}>
              <View style={styles.textContainer}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
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
    gap: 8,
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
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 9,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 6,
  },
});
