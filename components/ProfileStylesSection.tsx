import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shirt } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

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
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  const handleAddStyle = () => {
    if (styles.length < 4) {
      setStyles([...styles, { id: `${Date.now()}`, name: 'New Style' }]);
    }
  };

  const styles2 = StyleSheet.create({
    container: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.text,
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
      backgroundColor: colors.shopBackground,
      paddingVertical: 1,
      paddingHorizontal: 4,
      borderRadius: 3,
      gap: 2,
      marginRight: 2,
      marginBottom: 2,
    },
    styleName: {
      fontSize: 8,
      color: colors.text,
    },
    addButton: {
      paddingVertical: 1,
      paddingHorizontal: 4,
      borderRadius: 3,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
      alignItems: 'center',
      flexDirection: 'row',
    },
    addButtonText: {
      fontSize: 8,
      color: colors.secondaryText,
    },
  });

  return (
    <View style={styles2.container}>
      <Text style={styles2.sectionTitle}>自分の系統</Text>

      <View style={styles2.stylesList}>
        {styles.map((style) => (
          <View key={style.id} style={styles2.styleItem}>
            <Shirt size={6} color={colors.text} />
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