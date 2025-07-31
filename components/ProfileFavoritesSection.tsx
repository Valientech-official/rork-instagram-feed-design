import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ShoppingBag, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';

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

  const handleAddFavorite = () => {
    // In a real app, this would open a modal to add a new favorite
    console.log('Add favorite');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>好きなブランド＆Shop</Text>
        <TouchableOpacity onPress={handleAddFavorite}>
          <Plus size={9} color={Colors.light.secondaryText} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.favoritesList}
      >
        {favorites.map((item) => (
          <View key={item.id} style={styles.favoriteItem}>
            <ShoppingBag size={9} color={Colors.light.text} />
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
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
    color: Colors.light.text,
  },
  favoritesList: {
    flexDirection: 'row',
    paddingBottom: 2,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.shopBackground,
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 3,
    marginRight: 3,
    gap: 2,
  },
  favoriteName: {
    fontSize: 9,
    color: Colors.light.text,
    fontWeight: '500',
  },
  favoriteType: {
    fontSize: 7,
    color: Colors.light.secondaryText,
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
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 9,
    color: Colors.light.secondaryText,
  },
});