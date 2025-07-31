import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Glasses } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface StyleCategory {
  id: string;
  name: string;
}

interface StyleCategoriesProps {
  selectedCategories: string[];
  onCategorySelect: (categoryId: string) => void;
}

const styleCategories: StyleCategory[] = [
  { id: '1', name: 'Casual' },
  { id: '2', name: 'Formal' },
  { id: '3', name: 'Streetwear' },
  { id: '4', name: 'Minimalist' },
  { id: '5', name: 'Vintage' },
  { id: '6', name: 'Bohemian' },
  { id: '7', name: 'Preppy' },
  { id: '8', name: 'Sporty' },
  { id: '9', name: 'Punk' },
  { id: '10', name: 'Gothic' },
  { id: '11', name: 'Romantic' },
  { id: '12', name: 'Artsy' },
];

export default function StyleCategories({ selectedCategories, onCategorySelect }: StyleCategoriesProps) {
  const handleCategoryPress = (categoryId: string) => {
    onCategorySelect(categoryId);
  };

  // Create a 4x3 grid layout (4 columns, 3 rows)
  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < 3; i++) {
      const rowItems = styleCategories.slice(i * 4, (i + 1) * 4);
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          {rowItems.map(category => {
            const isSelected = selectedCategories.includes(category.id);
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  isSelected && styles.categoryItemSelected
                ]}
                onPress={() => handleCategoryPress(category.id)}
              >
                <Glasses 
                  size={16} 
                  color={isSelected ? Colors.light.background : Colors.light.text} 
                />
                <Text style={[
                  styles.categoryName,
                  isSelected && styles.categoryNameSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Glasses size={16} color={Colors.light.text} />
        <Text style={styles.headerText}>系統</Text>
      </View>
      
      <View style={styles.contentWrapper}>
        <View style={styles.gridContainer}>
          {renderGrid()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
  },
  contentWrapper: {
    width: '66.67%', // 2/3 of screen width
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 6,
  },
  gridContainer: {
    marginTop: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  categoryItem: {
    width: '22%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: Colors.light.shopBackground,
    borderRadius: 8,
  },
  categoryItemSelected: {
    backgroundColor: Colors.light.styleCategorySelected, // Light purple
  },
  categoryName: {
    fontSize: 11,
    color: Colors.light.text,
    marginTop: 4,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: Colors.light.background,
  },
});