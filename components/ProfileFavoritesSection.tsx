import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ShoppingBag, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

interface FavoriteItem {
  id: string;
  name: string;
  type: 'brand' | 'store';
}

const defaultFavorites: FavoriteItem[] = [
  { id: '1', name: 'Nike', type: 'brand' },
  { id: '2', name: 'Uniqlo', type: 'brand' },
  { id: '3', name: 'Zara', type: 'store' },
];

export default function ProfileFavoritesSection() {
  const [favorites, setFavorites] = React.useState<FavoriteItem[]>(defaultFavorites);
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  const handleAddFavorite = () => {
    // In a real app, this would open a modal to add a new favorite
    console.log('Add favorite');
  };

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 3,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text,
    },
    favoritesList: {
      flexDirection: 'row',
      paddingBottom: 2,
    },
    favoriteItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.shopBackground,
      paddingVertical: 1,
      paddingHorizontal: 5,
      borderRadius: 3,
      marginRight: 3,
      gap: 2,
    },
    favoriteName: {
      fontSize: 9,
      color: colors.text,
      fontWeight: '500',
    },
    favoriteType: {
      fontSize: 7,
      color: colors.secondaryText,
      backgroundColor: 'rgba(0,0,0,0.05)',
      paddingHorizontal: 2,
      paddingVertical: 1,
      borderRadius: 2,
    },
    addButton: {
      paddingVertical: 1,
      paddingHorizontal: 5,
      borderRadius: 3,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      fontSize: 9,
      color: colors.secondaryText,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>好きなブランド＆Shop</Text>
        <TouchableOpacity onPress={handleAddFavorite}>
          <Plus size={9} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.favoritesList}
      >
        {favorites.map((item) => (
          <View key={item.id} style={styles.favoriteItem}>
            <ShoppingBag size={9} color={colors.text} />
            <Text style={styles.favoriteName}>{item.name}</Text>
            <Text style={styles.favoriteType}>{item.type}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={handleAddFavorite}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}