import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { brands, Brand } from '@/mocks/brands';
import { stores, Store } from '@/mocks/stores';

type FilterType = 'brands' | 'stores';

export default function SearchFilterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('brands');
  const [searchText, setSearchText] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleBack = () => {
    router.back();
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const getFilteredData = () => {
    const lowerSearchText = searchText.toLowerCase();
    
    switch (selectedFilter) {
      case 'brands':
        return brands.filter(brand => 
          brand.name.toLowerCase().includes(lowerSearchText) ||
          brand.description.toLowerCase().includes(lowerSearchText)
        );
      case 'stores':
        return stores.filter(store => 
          store.name.toLowerCase().includes(lowerSearchText) ||
          store.description.toLowerCase().includes(lowerSearchText) ||
          store.location.toLowerCase().includes(lowerSearchText)
        );
      default:
        return [];
    }
  };

  const renderBrandItem = ({ item }: { item: Brand }) => (
    <TouchableOpacity 
      style={[
        styles.itemContainer,
        selectedItems.includes(item.id) && styles.selectedItem
      ]}
      onPress={() => handleItemSelect(item.id)}
    >
      <Image
        source={{ uri: item.logo }}
        style={styles.brandLogo}
        contentFit="cover"
      />
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <Check size={12} color="white" />
            </View>
          )}
        </View>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemCount}>{item.productCount}商品</Text>
      </View>
      {selectedItems.includes(item.id) && (
        <View style={styles.checkIcon}>
          <Check size={20} color={Colors.light.shopAccent} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStoreItem = ({ item }: { item: Store }) => (
    <TouchableOpacity 
      style={[
        styles.itemContainer,
        selectedItems.includes(item.id) && styles.selectedItem
      ]}
      onPress={() => handleItemSelect(item.id)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.storeImage}
        contentFit="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <View style={styles.storeDetails}>
          <Text style={styles.storeLocation}>{item.location}</Text>
          <Text style={styles.storeRating}>★ {item.rating}</Text>
        </View>
        <Text style={styles.itemCount}>{item.productCount}商品</Text>
      </View>
      {selectedItems.includes(item.id) && (
        <View style={styles.checkIcon}>
          <Check size={20} color={Colors.light.shopAccent} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: any }) => {
    switch (selectedFilter) {
      case 'brands':
        return renderBrandItem({ item });
      case 'stores':
        return renderStoreItem({ item });
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ブランド・Shopを選択</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'brands' && styles.activeFilterTab
          ]}
          onPress={() => setSelectedFilter('brands')}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === 'brands' && styles.activeFilterTabText
          ]}>
            ブランド
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'stores' && styles.activeFilterTab
          ]}
          onPress={() => setSelectedFilter('stores')}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === 'stores' && styles.activeFilterTabText
          ]}>
            Shop
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.light.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`${selectedFilter === 'brands' ? 'ブランド' : 'Shop'}を検索...`}
          placeholderTextColor={Colors.light.secondaryText}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Results */}
      <FlatList
        data={getFilteredData()}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Selected Count */}
      {selectedItems.length > 0 && (
        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>
            {selectedItems.length}件選択中
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  headerRight: {
    width: 36,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.light.shopBackground,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeFilterTab: {
    backgroundColor: Colors.light.shopAccent,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  activeFilterTabText: {
    color: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.shopBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    margin: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    height: '100%',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: Colors.light.shopCard,
    borderRadius: 12,
  },
  selectedItem: {
    backgroundColor: Colors.light.shopBackground,
    borderWidth: 2,
    borderColor: Colors.light.shopAccent,
  },
  brandLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  storeImage: {
    width: 60,
    height: 45,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 8,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.shopAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDescription: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  storeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeLocation: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginRight: 12,
  },
  storeRating: {
    fontSize: 12,
    color: Colors.light.warning,
  },
  checkIcon: {
    marginLeft: 8,
  },
  selectedCount: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.light.shopAccent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  selectedCountText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});