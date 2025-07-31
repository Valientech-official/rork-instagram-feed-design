import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Shirt, ChevronDown, ChevronUp, Bookmark, ShoppingBag, Layers, Box, Watch } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface ClothingCategoriesProps {
  title?: string;
  compact?: boolean;
  horizontal?: boolean;
  collapsible?: boolean;
}

const categories: Category[] = [
  { id: '1', name: 'Tシャツ', icon: <Shirt size={24} color={Colors.light.text} /> },
  { id: '2', name: 'シャツ', icon: <Shirt size={24} color={Colors.light.text} /> },
  { id: '3', name: 'パンツ', icon: <Bookmark size={24} color={Colors.light.text} /> },
  { id: '4', name: 'ジーンズ', icon: <Bookmark size={24} color={Colors.light.text} /> },
  { id: '5', name: 'ドレス', icon: <ShoppingBag size={24} color={Colors.light.text} /> },
  { id: '6', name: 'スカート', icon: <ShoppingBag size={24} color={Colors.light.text} /> },
  { id: '7', name: 'ジャケット', icon: <Layers size={24} color={Colors.light.text} /> },
  { id: '8', name: 'コート', icon: <Layers size={24} color={Colors.light.text} /> },
  { id: '9', name: 'セーター', icon: <Shirt size={24} color={Colors.light.text} /> },
  { id: '10', name: 'パーカー', icon: <Layers size={24} color={Colors.light.text} /> },
  { id: '11', name: '靴', icon: <Box size={24} color={Colors.light.text} /> },
  { id: '12', name: 'アクセサリー', icon: <Watch size={24} color={Colors.light.text} /> },
];

export default function ClothingCategories({ title, compact = false, horizontal = false, collapsible = false }: ClothingCategoriesProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        // Remove category if already selected
        return prev.filter(id => id !== categoryId);
      } else {
        // Add category if not selected
        return [...prev, categoryId];
      }
    });
    console.log(`Category ${categoryId} toggled`);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const renderCategoryItem = (item: Category, index: number) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.categoryItem,
        selectedCategories.includes(item.id) && styles.selectedCategory,
        horizontal && styles.horizontalCategoryItem,
        isCollapsed && collapsible && styles.collapsedCategoryItem,
        !isCollapsed && horizontal && styles.expandedHorizontalCategoryItem,
        !isCollapsed && !horizontal && styles.expandedVerticalCategoryItem
      ]}
      onPress={() => handleCategoryPress(item.id)}
    >
      {isCollapsed && collapsible ? (
        <View style={styles.iconContainer}>
          {item.icon}
        </View>
      ) : (
        <View style={styles.expandedItemContent}>
          <Text 
            style={[
              styles.categoryName,
              selectedCategories.includes(item.id) && styles.selectedCategoryText
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCollapsibleGrid = () => {
    // For horizontal mode with expanded view, wrap in ScrollView
    if (horizontal && !isCollapsed) {
      return (
        <ScrollView 
          style={styles.verticalScrollView}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.horizontalGridContainer}>
            {categories.map((item, index) => renderCategoryItem(item, index))}
          </View>
        </ScrollView>
      );
    }
    
    // For vertical mode with expanded view, display items in a vertical list
    if (!horizontal && !isCollapsed) {
      return (
        <ScrollView 
          style={styles.verticalScrollView}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.verticalListContainer}>
            {categories.map((item, index) => renderCategoryItem(item, index))}
          </View>
        </ScrollView>
      );
    }
    
    // Default grid view for collapsed state
    return (
      <View style={[
        styles.gridContainer,
        horizontal && !isCollapsed && styles.horizontalGridContainer
      ]}>
        {categories.map((item, index) => renderCategoryItem(item, index))}
      </View>
    );
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <TouchableOpacity 
        style={[styles.header, compact && styles.compactHeader]}
        onPress={collapsible ? toggleCollapse : undefined}
      >
        <View style={styles.headerLeft}>
          <Shirt size={compact ? 14 : 16} color={Colors.light.text} />
          {title && <Text style={[styles.headerText, compact && styles.compactHeaderText]}>{title || 'カテゴリー'}</Text>}
          {selectedCategories.length > 0 && (
            <View style={styles.selectedCountBadge}>
              <Text style={styles.selectedCountText}>{selectedCategories.length}</Text>
            </View>
          )}
        </View>
        {collapsible && (
          <View style={styles.collapseIcon}>
            {isCollapsed ? (
              <ChevronDown size={16} color={Colors.light.text} />
            ) : (
              <ChevronUp size={16} color={Colors.light.text} />
            )}
          </View>
        )}
      </TouchableOpacity>
      
      {(!collapsible || !isCollapsed) && (
        <View style={[
          styles.categoriesContainer,
          horizontal && styles.horizontalCategoriesContainer,
          !isCollapsed && horizontal && styles.expandedHorizontalContainer
        ]}>
          {collapsible ? (
            renderCollapsibleGrid()
          ) : (
            <ScrollView 
              style={styles.categoriesScrollView}
              horizontal={horizontal}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.categoriesScrollContent,
                horizontal && styles.horizontalScrollContent
              ]}
            >
              {categories.map((item) => renderCategoryItem(item, 0))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  compactContainer: {
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  compactHeader: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 6,
  },
  compactHeaderText: {
    fontSize: 12,
  },
  selectedCountBadge: {
    backgroundColor: Colors.light.shopAccent,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  selectedCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  collapseIcon: {
    padding: 4,
  },
  categoriesContainer: {
    backgroundColor: Colors.light.background,
    paddingVertical: 8,
  },
  horizontalCategoriesContainer: {
    paddingVertical: 12,
  },
  expandedHorizontalContainer: {
    maxHeight: 280,
    overflow: 'hidden',
  },
  categoriesScrollView: {
    maxHeight: 200,
  },
  verticalScrollView: {
    maxHeight: 240,
  },
  categoriesScrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  horizontalScrollContent: {
    paddingHorizontal: 12,
    flexDirection: 'row',
  },
  categoryItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.shopBackground,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  horizontalCategoryItem: {
    marginRight: 8,
    marginBottom: 0,
  },
  expandedHorizontalCategoryItem: {
    width: '90%',
    marginHorizontal: '5%',
    marginVertical: 4,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedVerticalCategoryItem: {
    width: '100%', // Make the item take full width
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-start', // Align text to the left
    marginVertical: 4,
  },
  collapsedCategoryItem: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    margin: 6,
  },
  selectedCategory: {
    backgroundColor: Colors.light.shopAccent,
    borderColor: Colors.light.shopAccent,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    textAlign: 'left', // Align text to the left
    width: '100%',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  horizontalGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  verticalListContainer: {
    flexDirection: 'column', // Display items in a column
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedItemContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start', // Align content to the left
    width: '100%',
  },
});