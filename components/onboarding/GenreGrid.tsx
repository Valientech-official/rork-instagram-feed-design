import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Check } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 64) / 3;

export interface GenreItem {
  id: string;
  name: string;
  emoji?: string;
}

interface GenreGridProps {
  items: GenreItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function GenreGrid({ items, selectedIds, onSelectionChange }: GenreGridProps) {
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
              style={[styles.item, isSelected && styles.selectedItem]}
              onPress={() => toggleItem(item.id)}
              activeOpacity={0.7}
            >
              {item.emoji && <Text style={styles.emoji}>{item.emoji}</Text>}
              <Text style={[styles.itemText, isSelected && styles.selectedText]}>
                {item.name}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Check size={16} color="#fff" strokeWidth={3} />
                </View>
              )}
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
    gap: 12,
  },
  item: {
    width: ITEM_WIDTH,
    height: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedItem: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  itemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  selectedText: {
    color: '#fff',
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
