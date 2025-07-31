import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';

const categories = [
  { id: 'all', name: 'All' },
  { id: 'featured', name: 'Featured' },
  { id: 'home-decor', name: 'Home Decor' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'accessories', name: 'Accessories' },
  { id: 'clothing', name: 'Clothing' },
];

interface CategoryScrollProps {
  onSelectCategory: (category: string) => void;
}

export default function CategoryScroll({ onSelectCategory }: CategoryScrollProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onSelectCategory(categoryId);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.selectedCategory,
            ]}
            onPress={() => handleCategoryPress(category.id)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.selectedCategoryText,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: Colors.light.shopBackground,
  },
  selectedCategory: {
    backgroundColor: Colors.light.shopAccent,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  selectedCategoryText: {
    color: 'white',
    fontWeight: '500',
  },
});