import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { itemCategories, ItemCategory } from '@/mocks/itemCategories';

type ItemCategoriesAccordionProps = {
  selectedItems: string[];
  onItemSelect: (itemId: string) => void;
};

export default function ItemCategoriesAccordion({
  selectedItems,
  onItemSelect
}: ItemCategoriesAccordionProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const isExpanded = (categoryId: string) => expandedCategories.has(categoryId);

  const renderCategory = (category: ItemCategory) => {
    const expanded = isExpanded(category.id);
    const selectedCount = category.subCategories.filter(
      sub => selectedItems.includes(sub.id)
    ).length;

    return (
      <View key={category.id} style={styles.categoryContainer}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category.id)}
        >
          <View style={styles.categoryTitleContainer}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            {selectedCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{selectedCount}</Text>
              </View>
            )}
          </View>
          {expanded ? (
            <ChevronUp size={18} color={Colors.light.secondaryText} />
          ) : (
            <ChevronDown size={18} color={Colors.light.secondaryText} />
          )}
        </TouchableOpacity>

        {expanded && (
          <View style={styles.subCategoriesContainer}>
            {category.subCategories.map((subCategory, index) => {
              const isSelected = selectedItems.includes(subCategory.id);
              return (
                <TouchableOpacity
                  key={subCategory.id}
                  style={[
                    styles.subCategoryButton,
                    isSelected && styles.subCategoryButtonSelected,
                    index === category.subCategories.length - 1 && styles.subCategoryButtonLast,
                  ]}
                  onPress={() => onItemSelect(subCategory.id)}
                >
                  <Text
                    style={[
                      styles.subCategoryText,
                      isSelected && styles.subCategoryTextSelected,
                    ]}
                  >
                    {subCategory.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>アイテムカテゴリ</Text>
        {selectedItems.length > 0 && (
          <Text style={styles.selectedCount}>
            {selectedItems.length}件選択中
          </Text>
        )}
      </View>
      <View style={styles.categoriesList}>
        {itemCategories.map(renderCategory)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  selectedCount: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.shopPrice,
  },
  categoriesList: {
    paddingHorizontal: 10,
  },
  categoryContainer: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.shopBackground,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  badge: {
    backgroundColor: Colors.light.shopPrice,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subCategoriesContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subCategoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  subCategoryButtonSelected: {
    backgroundColor: Colors.light.shopPrice,
    borderColor: Colors.light.shopPrice,
  },
  subCategoryButtonLast: {
    // Style for last item if needed
  },
  subCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  subCategoryTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
