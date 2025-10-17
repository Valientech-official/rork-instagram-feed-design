import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { MoreHorizontal } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

interface Stylist {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

const STYLISTS: Stylist[] = [
  {
    id: '1',
    name: 'Rachel',
    username: '@rachel_style',
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: '2',
    name: 'Gabriel',
    username: '@gabriel_mode',
    avatar: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: '3',
    name: 'Renee',
    username: '@renee_fashion',
    avatar: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: '4',
    name: 'Amanda',
    username: '@amanda_chic',
    avatar: 'https://i.pravatar.cc/150?img=4',
  },
];

export default function TopStylists() {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>トップスタイリスト</Text>
        <TouchableOpacity>
          <MoreHorizontal size={20} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {STYLISTS.map((stylist) => (
          <View key={stylist.id} style={styles.stylistCard}>
            <Image
              source={{ uri: stylist.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
            <Text style={styles.name} numberOfLines={1}>{stylist.name}</Text>
            <Text style={styles.username} numberOfLines={1}>{stylist.username}</Text>
          </View>
        ))}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followButtonText}>フォロー</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contentsButton}>
            <Text style={styles.contentsButtonText}>投稿を見る</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  stylistCard: {
    alignItems: 'center',
    width: 80,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  username: {
    fontSize: 11,
    color: colors.secondaryText,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
    justifyContent: 'center',
    marginLeft: 8,
  },
  followButton: {
    backgroundColor: colors.text,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '600',
  },
  contentsButton: {
    backgroundColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contentsButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
