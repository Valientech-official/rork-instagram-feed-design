import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ShoppingBag, ArrowLeft } from 'lucide-react-native';
import SearchBar from '@/components/SearchBar';
import ItemCategoriesAccordion from '@/components/ItemCategoriesAccordion';
import StyleGenres from '@/components/StyleGenres';
import ResearchButton from '@/components/ResearchButton';
import TrendingItemsSection from '@/components/TrendingItemsSection';
import FavoritesGrid from '@/components/FavoritesGrid';
import CartGrid from '@/components/CartGrid';
import PhotoGallery from '@/components/PhotoGallery';
import Colors from '@/constants/colors';
import { posts } from '@/mocks/posts';
import { products, Product } from '@/mocks/products';
import { users } from '@/mocks/users';
import { itemCategories } from '@/mocks/itemCategories';
import { styleGenres } from '@/mocks/styleGenres';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SearchResult = {
  id: string;
  type: 'post' | 'product' | 'user';
  title: string;
  subtitle?: string;
  image: string;
};

type GenderType = 'メンズ' | 'レディース' | 'ユニセックス' | 'キッズ';

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
  const [selectedItemCategories, setSelectedItemCategories] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showResearchResults, setShowResearchResults] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const insets = useSafeAreaInsets();

  const genderOptions: GenderType[] = ['メンズ', 'レディース', 'ユニセックス', 'キッズ'];

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

  const filterProducts = () => {
    let filtered = [...products];

    // Filter by gender
    filtered = filtered.filter(product =>
      product.gender === selectedGender || product.gender === 'ユニセックス'
    );

    // Filter by item categories
    if (selectedItemCategories.length > 0) {
      filtered = filtered.filter(product => {
        return selectedItemCategories.some(itemId => {
          // Find the subcategory in our master data
          let keywords: string[] = [];
          for (const category of itemCategories) {
            const subCategory = category.subCategories.find(sub => sub.id === itemId);
            if (subCategory) {
              keywords = subCategory.keywords;
              break;
            }
          }

          return keywords.some(keyword =>
            product.category.toLowerCase().includes(keyword) ||
            product.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
            product.name.toLowerCase().includes(keyword)
          );
        });
      });
    }

    // Filter by style genres
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(product => {
        return selectedGenres.some(genreId => {
          const genre = styleGenres.find(g => g.id === genreId);
          const keywords = genre?.keywords || [];

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
    console.log('Selected item categories:', selectedItemCategories);
    console.log('Selected genres:', selectedGenres);

    const filtered = filterProducts();
    setFilteredProducts(filtered);
    setShowResearchResults(true);
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

  const handleItemCategorySelect = (itemId: string) => {
    setSelectedItemCategories(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleGenreSelect = (genreId: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreId)) {
        return prev.filter(id => id !== genreId);
      } else {
        return [...prev, genreId];
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
        onFavoritesPress={handleFavoritesPress}
        onCartPress={handleCartPress}
        onSearchPress={handleSearchPress}
        onPhotoGalleryPress={handlePhotoGalleryPress}
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

          {/* Item Categories Accordion section */}
          <View style={styles.sectionContainer}>
            <ItemCategoriesAccordion
              selectedItems={selectedItemCategories}
              onItemSelect={handleItemCategorySelect}
            />
          </View>

          {/* Style Genres section */}
          <View style={styles.sectionContainer}>
            <StyleGenres
              selectedGenres={selectedGenres}
              onGenreSelect={handleGenreSelect}
            />
          </View>
          
          {/* Research button section with border */}
          <View style={styles.researchSectionContainer}>
            <ResearchButton 
              onPress={handleResearchPress}
              onBudgetSelect={handleBudgetSelect}
            />
          </View>
          
          <TrendingItemsSection />
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