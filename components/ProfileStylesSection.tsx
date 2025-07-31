import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shirt } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface StyleItem {
  id: string;
  name: string;
}

const defaultStyles: StyleItem[] = [
  { id: '1', name: 'Minimalist' },
  { id: '2', name: 'Casual' },
  { id: '3', name: 'Streetwear' },
];

export default function ProfileStylesSection() {
  const [styles, setStyles] = React.useState<StyleItem[]>(defaultStyles);

  const handleAddStyle = () => {
    if (styles.length < 4) {
      setStyles([...styles, { id: `${Date.now()}`, name: 'New Style' }]);
    }
  };

  return (
    <View style={styles2.container}>
      <Text style={styles2.sectionTitle}>自分の系統</Text>
      
      <View style={styles2.stylesList}>
        {styles.map((style) => (
          <View key={style.id} style={styles2.styleItem}>
            <Shirt size={6} color={Colors.light.text} />
            <Text style={styles2.styleName}>{style.name}</Text>
          </View>
        ))}
        
        {styles.length < 4 && (
          <TouchableOpacity style={styles2.addButton} onPress={handleAddStyle}>
            <Text style={styles2.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles2 = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  stylesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  styleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.shopBackground,
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 3,
    gap: 2,
    marginRight: 2,
    marginBottom: 2,
  },
  styleName: {
    fontSize: 8,
    color: Colors.light.text,
  },
  addButton: {
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.light.border,
    alignItems: 'center',
    flexDirection: 'row',
  },
  addButtonText: {
    fontSize: 8,
    color: Colors.light.secondaryText,
  },
});