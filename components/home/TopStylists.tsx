import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { ArrowUpRight } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

interface TrendingCreator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  category: string;
  weeklyGain: number;
  growthPercent: number;
}

const TRENDING_CREATORS: TrendingCreator[] = [
  {
    id: '1',
    name: 'Mika',
    username: '@mika_daily',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80',
    category: 'モード / シティ',
    weeklyGain: 1420,
    growthPercent: 38,
  },
  {
    id: '2',
    name: 'Nozomi',
    username: '@nozomi_fit',
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=150&q=80',
    category: 'アクティブ',
    weeklyGain: 980,
    growthPercent: 27,
  },
  {
    id: '3',
    name: 'Riku',
    username: '@riku_wear',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    category: 'ストリート',
    weeklyGain: 1760,
    growthPercent: 44,
  },
  {
    id: '4',
    name: 'Aya',
    username: '@aya_minimal',
    avatar: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=150&q=80',
    category: 'ミニマル',
    weeklyGain: 860,
    growthPercent: 22,
  },
];

const formatFollowerGain = (count: number) => {
  if (count >= 1000) {
    const value = (count / 1000).toFixed(1).replace(/\.0$/, '');
    return `${value}K`;
  }
  return `${count}`;
};

export default function TopStylists() {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>人気急上昇中</Text>
          <Text style={styles.subtitle}>今週フォロワーが急増しているクリエイター</Text>
        </View>
        <ArrowUpRight size={20} color={colors.secondaryText} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TRENDING_CREATORS.map((creator) => (
          <View key={creator.id} style={styles.card}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: creator.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.gainBadge}>
                <Text style={styles.gainValue}>+{formatFollowerGain(creator.weeklyGain)}</Text>
                <Text style={styles.gainLabel}>今週</Text>
              </View>
            </View>

            <Text style={styles.name} numberOfLines={1}>{creator.name}</Text>
            <Text style={styles.username} numberOfLines={1}>{creator.username}</Text>
            <Text style={styles.category} numberOfLines={1}>{creator.category}</Text>

            <View style={styles.growthRow}>
              <Text style={[styles.growthPercent, { color: colors.success }]}>
                +{creator.growthPercent}%
              </Text>
              <Text style={styles.growthCaption}>フォロワー増</Text>
            </View>

            <TouchableOpacity style={[styles.followButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.followButtonText}>フォローする</Text>
            </TouchableOpacity>
          </View>
        ))}
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
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    width: 150,
    borderRadius: 16,
    padding: 12,
    gap: 6,
    backgroundColor: colors.cardBackground,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  gainBadge: {
    position: 'absolute',
    bottom: -6,
    right: 8,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gainValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  gainLabel: {
    fontSize: 10,
    color: colors.secondaryText,
    textAlign: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  username: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
  },
  category: {
    fontSize: 11,
    color: colors.secondaryText,
    textAlign: 'center',
  },
  growthRow: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 4,
  },
  growthPercent: {
    fontSize: 16,
    fontWeight: '700',
  },
  growthCaption: {
    fontSize: 11,
    color: colors.secondaryText,
  },
  followButton: {
    marginTop: 4,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
