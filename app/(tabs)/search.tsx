import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ShoppingBag, ArrowLeft } from 'lucide-react-native';
import SearchBar from '@/components/SearchBar';
import StyleCategories from '@/components/StyleCategories';
import ClothingItems from '@/components/ClothingItems';
import ResearchButton from '@/components/ResearchButton';
import TrendingItemsSection from '@/components/TrendingItemsSection';
import RecommendedSection from '@/components/RecommendedSection';
import FavoritesGrid from '@/components/FavoritesGrid';
import CartGrid from '@/components/CartGrid';
import PhotoGallery from '@/components/PhotoGallery';
import Colors from '@/constants/colors';
import { posts } from '@/mocks/posts';
import { products, Product } from '@/mocks/products';
import { users } from '@/mocks/users';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SearchResult = {
  id: string;
  type: 'post' | 'product' | 'user';
  title: string;
  subtitle?: string;
  image: string;
};

type GenderType = 'メンズ' | 'レディース' | 'ユニセックス' | 'キッズ';
type SortType = 'popular' | 'price-low' | 'price-high' | 'newest';

// Gender colors
const genderColors = {
  'メンズ': '#87CEEB',      // Light blue
  'レディース': '#FFB6C1',   // Light pink
  'ユニセックス': '#DDA0DD',  // Light purple
  'キッズ': '#FFD700'       // Yellow
};

export default function SearchScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<GenderType>('メンズ');
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedClothingItems, setSelectedClothingItems] = useState<string[]>([]);
  const [selectedStyleCategories, setSelectedStyleCategories] = useState<string[]>([]);
  const [showResearchResults, setShowResearchResults] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [sortType, setSortType] = useState<SortType>('popular');
  const insets = useSafeAreaInsets();

  const genderOptions: GenderType[] = ['メンズ', 'レディース', 'ユニセックス', 'キッズ'];

  // Update preview count when filters change
  useEffect(() => {
    const filtered = filterProducts();
    setPreviewCount(filtered.length);
  }, [selectedGender, selectedBudget, selectedClothingItems, selectedStyleCategories]);

  // Clothing items mapping for filtering
  const clothingItemsMap: { [key: string]: string[] } = {
    '1': ['tops', 't-shirt', 'shirt', 'blouse'],
    '2': ['tops', 'shirt', 'blouse'],
    '3': ['bottoms', 'pants', 'trousers'],
    '4': ['bottoms', 'jeans', 'denim'],
    '5': ['dresses', 'dress'],
    '6': ['bottoms', 'skirts', 'skirt'],
    '7': ['outerwear', 'jacket'],
    '8': ['outerwear', 'coat'],
    '9': ['tops', 'sweater', 'knitwear'],
    '10': ['shoes', 'footwear', 'sneakers', 'boots'],
    '11': ['bags', 'handbags', 'backpack', 'purse'],
    '12': ['hats', 'caps', 'headwear', 'beanie'],
  };

  // Style categories mapping for filtering
  const styleCategoriesMap: { [key: string]: string[] } = {
    '1': ['casual'],
    '2': ['formal', 'elegant'],
    '3': ['streetwear', 'urban'],
    '4': ['minimalist', 'simple'],
    '5': ['vintage', 'retro'],
    '6': ['bohemian', 'boho'],
    '7': ['preppy', 'classic'],
    '8': ['sporty', 'athletic'],
    '9': ['punk', 'edgy'],
    '10': ['gothic', 'dark'],
    '11': ['romantic', 'feminine'],
    '12': ['artsy', 'creative'],
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Simple search implementation
    const lowerText = text.toLowerCase();
    
    // Search posts
    const matchedPosts = posts
      .filter(post => 
        post.caption.toLowerCase().includes(lowerText) || 
        post.user.username.toLowerCase().includes(lowerText)
      )
      .map(post => ({
        id: `post-${post.id}`,
        type: 'post' as const,
        title: post.user.username,
        subtitle: post.caption.substring(0, 50) + (post.caption.length > 50 ? '...' : ''),
        image: post.images[0]
      }));
    
    // Search products
    const matchedProducts = products
      .filter(product => 
        product.name.toLowerCase().includes(lowerText) || 
        product.description.toLowerCase().includes(lowerText)
      )
      .map(product => ({
        id: `product-${product.id}`,
        type: 'product' as const,
        title: product.name,
        subtitle: `$${product.price.toFixed(2)}`,
        image: product.images[0]
      }));
    
    // Search users
    const matchedUsers = users
      .filter(user => 
        user.username.toLowerCase().includes(lowerText)
      )
      .map(user => ({
        id: `user-${user.id}`,
        type: 'user' as const,
        title: user.username,
        subtitle: user.verified ? 'Verified' : '',
        image: user.avatar
      }));
    
    // Combine results
    setSearchResults([...matchedUsers, ...matchedPosts, ...matchedProducts]);
  };

  const handleResultPress = (result: SearchResult) => {
    switch (result.type) {
      case 'post':
        router.push(`/post/${result.id.replace('post-', '')}`);
        break;
      case 'product':
        router.push(`/product/${result.id.replace('product-', '')}`);
        break;
      case 'user':
        router.push('/(tabs)/profile');
        break;
    }
  };

  const sortProducts = (productsToSort: Product[]) => {
    const sorted = [...productsToSort];

    switch (sortType) {
      case 'popular':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'price-low':
        return sorted.sort((a, b) => {
          const priceA = a.salePrice || a.price;
          const priceB = b.salePrice || b.price;
          return priceA - priceB;
        });
      case 'price-high':
        return sorted.sort((a, b) => {
          const priceA = a.salePrice || a.price;
          const priceB = b.salePrice || b.price;
          return priceB - priceA;
        });
      case 'newest':
        // Since we don't have creation date, use product id as a proxy
        return sorted.reverse();
      default:
        return sorted;
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filter by gender
    filtered = filtered.filter(product =>
      product.gender === selectedGender || product.gender === 'ユニセックス'
    );

    // Filter by clothing items
    if (selectedClothingItems.length > 0) {
      filtered = filtered.filter(product => {
        return selectedClothingItems.some(itemId => {
          const keywords = clothingItemsMap[itemId] || [];
          return keywords.some(keyword =>
            product.category.toLowerCase().includes(keyword) ||
            product.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
            product.name.toLowerCase().includes(keyword)
          );
        });
      });
    }

    // Filter by style categories
    if (selectedStyleCategories.length > 0) {
      filtered = filtered.filter(product => {
        return selectedStyleCategories.some(categoryId => {
          const keywords = styleCategoriesMap[categoryId] || [];
          return keywords.some(keyword =>
            product.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
            product.description.toLowerCase().includes(keyword)
          );
        });
      });
    }

    // Filter by budget
    if (selectedBudget && selectedBudget !== '上限なし') {
      const budgetValue = parseInt(selectedBudget.replace(/[^\d]/g, ''));
      filtered = filtered.filter(product => {
        const price = product.salePrice || product.price;
        return price <= budgetValue;
      });
    }

    return filtered;
  };

  const handleResearchPress = () => {
    console.log('Research button pressed');
    console.log('Selected gender:', selectedGender);
    console.log('Selected budget:', selectedBudget);
    console.log('Selected clothing items:', selectedClothingItems);
    console.log('Selected style categories:', selectedStyleCategories);

    const filtered = filterProducts();
    const sorted = sortProducts(filtered);
    setFilteredProducts(sorted);
    setShowResearchResults(true);
  };

  const handleSortChange = (newSortType: SortType) => {
    setSortType(newSortType);
    const sorted = sortProducts(filteredProducts);
    setFilteredProducts(sorted);
  };

  const handleBudgetSelect = (budget: string) => {
    setSelectedBudget(budget);
    console.log('Budget selected:', budget);
  };

  const handleFavoritesPress = () => {
    setShowFavorites(true);
  };

  const handleCloseFavorites = () => {
    setShowFavorites(false);
  };

  const handleCartPress = () => {
    setShowCart(true);
  };

  const handleCloseCart = () => {
    setShowCart(false);
  };

  const handlePhotoGalleryPress = () => {
    setShowPhotoGallery(true);
  };

  const handleClosePhotoGallery = () => {
    setShowPhotoGallery(false);
  };

  const handleSearchPress = () => {
    router.push('/search-filter');
  };

  const handleGenderSelect = (gender: GenderType) => {
    setSelectedGender(gender);
    console.log('Gender selected:', gender);
  };

  const handleClothingItemSelect = (itemId: string) => {
    setSelectedClothingItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleStyleCategorySelect = (categoryId: string) => {
    setSelectedStyleCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleBackFromResearch = () => {
    setShowResearchResults(false);
    setFilteredProducts([]);
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity 
      style={styles.resultItem}
      onPress={() => handleResultPress(item)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.resultImage}
        contentFit="cover"
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        {item.subtitle && <Text style={styles.resultSubtitle}>{item.subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productItem}
      onPress={() => handleProductPress(item.id)}
    >
      <Image
        source={{ uri: item.images[0] }}
        style={styles.productImage}
        contentFit="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceContainer}>
          {item.salePrice ? (
            <>
              <Text style={styles.salePrice}>¥{Math.round(item.salePrice * 100)}</Text>
              <Text style={styles.originalPrice}>¥{Math.round(item.price * 100)}</Text>
            </>
          ) : (
            <Text style={styles.price}>¥{Math.round(item.price * 100)}</Text>
          )}
        </View>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>★ {item.rating}</Text>
          <Text style={styles.reviews}>({item.reviews})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (showFavorites) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <FavoritesGrid onClose={handleCloseFavorites} />
      </View>
    );
  }

  if (showCart) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <CartGrid onClose={handleCloseCart} />
      </View>
    );
  }

  if (showPhotoGallery) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <PhotoGallery onClose={handleClosePhotoGallery} />
      </View>
    );
  }

  if (showResearchResults) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.researchHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackFromResearch}
          >
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.researchTitle}>検索結果 ({filteredProducts.length}件)</Text>
        </View>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortOptionsContainer}>
            <TouchableOpacity
              style={[styles.sortOption, sortType === 'popular' && styles.sortOptionActive]}
              onPress={() => handleSortChange('popular')}
            >
              <Text style={[styles.sortOptionText, sortType === 'popular' && styles.sortOptionTextActive]}>人気順</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortOption, sortType === 'price-low' && styles.sortOptionActive]}
              onPress={() => handleSortChange('price-low')}
            >
              <Text style={[styles.sortOptionText, sortType === 'price-low' && styles.sortOptionTextActive]}>価格: 安い順</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortOption, sortType === 'price-high' && styles.sortOptionActive]}
              onPress={() => handleSortChange('price-high')}
            >
              <Text style={[styles.sortOptionText, sortType === 'price-high' && styles.sortOptionTextActive]}>価格: 高い順</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortOption, sortType === 'newest' && styles.sortOptionActive]}
              onPress={() => handleSortChange('newest')}
            >
              <Text style={[styles.sortOptionText, sortType === 'newest' && styles.sortOptionTextActive]}>新着順</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          columnWrapperStyle={styles.productRow}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>条件に合う商品が見つかりませんでした</Text>
            </View>
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <SearchBar
        onSearch={handleSearch}
        onSearchPress={handleSearchPress}
        placeholder="ブランド&Shop"
      />
      
      {searchText ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchResult}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No results found for "{searchText}"</Text>
            </View>
          }
        />
      ) : (
        <ScrollView>
          {/* Gender selection section - moved above items */}
          <View style={styles.genderSectionContainer}>
            <View style={styles.genderSelectionContainer}>
              {genderOptions.map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderOption,
                    selectedGender === gender && {
                      backgroundColor: genderColors[gender]
                    }
                  ]}
                  onPress={() => handleGenderSelect(gender)}
                >
                  <Text style={[
                    styles.genderOptionText,
                    selectedGender === gender && styles.genderOptionTextSelected
                  ]}>
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Items section without gender selection */}
          <View style={styles.sectionContainer}>
            <View style={styles.itemsSection}>
              <View style={styles.itemsHeader}>
                <ShoppingBag size={14} color={Colors.light.text} />
                <Text style={styles.itemsTitle}>アイテム</Text>
              </View>
            </View>
            
            {/* Add the clothing items grid */}
            <ClothingItems 
              selectedItems={selectedClothingItems}
              onItemSelect={handleClothingItemSelect}
            />
          </View>
          
          {/* Style categories section */}
          <View style={styles.sectionContainer}>
            <StyleCategories 
              selectedCategories={selectedStyleCategories}
              onCategorySelect={handleStyleCategorySelect}
            />
          </View>
          
          {/* Preview count section */}
          {(selectedClothingItems.length > 0 || selectedStyleCategories.length > 0 || selectedBudget) && (
            <View style={styles.previewCountContainer}>
              <Text style={styles.previewCountText}>
                約 <Text style={styles.previewCountNumber}>{previewCount}</Text> 件の商品が見つかります
              </Text>
            </View>
          )}

          {/* Research button section with border */}
          <View style={styles.researchSectionContainer}>
            <ResearchButton
              onPress={handleResearchPress}
              onBudgetSelect={handleBudgetSelect}
            />
          </View>

          <TrendingItemsSection />

          {/* Recommended Section */}
          <RecommendedSection
            selectedGender={selectedGender}
            selectedClothingItems={selectedClothingItems}
            selectedStyleCategories={selectedStyleCategories}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContent: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  resultImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
  // Section container for items
  sectionContainer: {
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: 8,
  },
  // New gender section container
  genderSectionContainer: {
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: 8,
  },
  // Preview count section
  previewCountContainer: {
    backgroundColor: Colors.light.shopAccent + '10',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewCountText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  previewCountNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.shopAccent,
  },
  // Research section container with top border
  researchSectionContainer: {
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  // Adjusted styles for items section to match StyleCategories
  itemsSection: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 4,
  },
  // Gender selection styles - moved to separate section
  genderSelectionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.light.shopBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  genderOptionTextSelected: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  // Research results styles
  researchHeader: {
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
  researchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  // Sort options styles
  sortContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  sortOptionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.shopBackground,
    marginRight: 8,
  },
  sortOptionActive: {
    backgroundColor: Colors.light.shopAccent,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  sortOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  productsGrid: {
    padding: 16,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productItem: {
    width: '48%',
    backgroundColor: Colors.light.shopCard,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 200,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.shopPrice,
  },
  salePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.shopSale,
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: Colors.light.warning,
    marginRight: 4,
  },
  reviews: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  // Keeping the separator style definition in case it's needed elsewhere
  separator: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginTop: 6,
    marginBottom: 0,
  },
});