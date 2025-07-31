import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface ClothingItem {
  id: string;
  name: string;
}

interface ClothingItemsProps {
  selectedItems: string[];
  onItemSelect: (itemId: string) => void;
}

const clothingItems: ClothingItem[] = [
  { id: '1', name: 'T-shirts' },
  { id: '2', name: 'Shirts' },
  { id: '3', name: 'Pants' },
  { id: '4', name: 'Jeans' },
  { id: '5', name: 'Dresses' },
  { id: '6', name: 'Skirts' },
  { id: '7', name: 'Jackets' },
  { id: '8', name: 'Coats' },
  { id: '9', name: 'Sweaters' },
  { id: '10', name: 'Shoes' },
  { id: '11', name: 'Bags' },
  { id: '12', name: 'Hats' },
];

export default function ClothingItems({ selectedItems, onItemSelect }: ClothingItemsProps) {
  const handleItemPress = (itemId: string) => {
    onItemSelect(itemId);
  };

  // Create a 4x3 grid layout (12 items total)
  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < 3; i++) {
      const rowItems = clothingItems.slice(i * 4, (i + 1) * 4);
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          {rowItems.map(item => {
            const isSelected = selectedItems.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemButton,
                  isSelected && styles.itemButtonSelected
                ]}
                onPress={() => handleItemPress(item.id)}
              >
                <ShoppingBag 
                  size={16} 
                  color={isSelected ? Colors.light.background : Colors.light.text} 
                />
                <Text style={[
                  styles.itemName,
                  isSelected && styles.itemNameSelected
                ]}>
                  {item.name}
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
    alignItems: 'center',
  },
  contentWrapper: {
    width: '66.67%', // 2/3 of screen width
  },
  gridContainer: {
    marginTop: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemButton: {
    width: '22%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: Colors.light.shopBackground,
    borderRadius: 8,
  },
  itemButtonSelected: {
    backgroundColor: Colors.light.clothingItemSelected, // Light orange
  },
  itemName: {
    fontSize: 11,
    color: Colors.light.text,
    marginTop: 4,
    textAlign: 'center',
  },
  itemNameSelected: {
    color: Colors.light.background,
  },
});