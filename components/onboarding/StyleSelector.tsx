import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { Check } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 2;

export interface StyleItem {
  id: string;
  name: string;
  image: string;
}

interface StyleSelectorProps {
  items: StyleItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  minSelection?: number;
}

export default function StyleSelector({
  items,
  selectedIds,
  onSelectionChange,
  minSelection = 1,
}: StyleSelectorProps) {
  const toggleItem = (id: string) => {
    const isSelected = selectedIds.includes(id);
    let newSelection: string[];

    if (isSelected) {
      newSelection = selectedIds.filter((item) => item !== id);
    } else {
      newSelection = [...selectedIds, id];
    }

    onSelectionChange(newSelection);
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.item}
              onPress={() => toggleItem(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.imageWrapper, isSelected && styles.selectedWrapper]}>
                <Image source={{ uri: item.image }} style={styles.image} />
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Check size={24} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  item: {
    width: ITEM_SIZE,
    marginBottom: 8,
  },
  imageWrapper: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  selectedWrapper: {
    borderWidth: 3,
    borderColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
