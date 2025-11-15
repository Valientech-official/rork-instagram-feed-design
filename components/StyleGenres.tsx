import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Tag } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';
import { styleGenres } from '@/mocks/styleGenres';

type StyleGenresProps = {
  selectedGenres: string[];
  onGenreSelect: (genreId: string) => void;
};

export default function StyleGenres({
  selectedGenres,
  onGenreSelect
}: StyleGenresProps) {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Tag size={14} color={colors.text} />
        <Text style={styles.headerTitle}>系統（ジャンル）</Text>
        {selectedGenres.length > 0 && (
          <Text style={styles.selectedCount}>
            {selectedGenres.length}件選択中
          </Text>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {styleGenres.map((genre) => {
          const isSelected = selectedGenres.includes(genre.id);
          return (
            <TouchableOpacity
              key={genre.id}
              style={[
                styles.genreChip,
                isSelected && styles.genreChipSelected,
                isSelected && { backgroundColor: genre.color },
              ]}
              onPress={() => onGenreSelect(genre.id)}
            >
              <Text
                style={[
                  styles.genreText,
                  isSelected && styles.genreTextSelected,
                ]}
              >
                {genre.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 4,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  selectedCount: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.shopPrice,
  },
  scrollView: {
    paddingBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 10,
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.shopBackground,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  genreChipSelected: {
    borderColor: 'transparent',
  },
  genreText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  genreTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
