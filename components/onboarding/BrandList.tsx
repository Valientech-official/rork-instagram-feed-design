import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SectionList } from 'react-native';
import { Check } from 'lucide-react-native';

export interface BrandItem {
  id: string;
  name: string;
  logo?: string;
}

interface BrandListProps {
  items: BrandItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function BrandList({ items, selectedIds, onSelectionChange }: BrandListProps) {
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

  // アルファベット順にグループ化
  const sections = useMemo(() => {
    const grouped: { [key: string]: BrandItem[] } = {};

    items.forEach((item) => {
      const firstLetter = item.name.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(item);
    });

    return Object.keys(grouped)
      .sort()
      .map((letter) => ({
        title: letter,
        data: grouped[letter].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [items]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => {
        const isSelected = selectedIds.includes(item.id);
        return (
          <TouchableOpacity
            style={styles.item}
            onPress={() => toggleItem(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.brandName}>{item.name}</Text>
            {isSelected && (
              <View style={styles.checkmark}>
                <Check size={20} color="#fff" strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        );
      }}
      contentContainerStyle={styles.container}
      stickySectionHeadersEnabled
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionHeader: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
