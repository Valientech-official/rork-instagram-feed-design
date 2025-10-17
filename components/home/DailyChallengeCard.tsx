import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MoreHorizontal } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

export default function DailyChallengeCard() {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Daily Theme Challenge</Text>
          <Text style={styles.subtitle}>Based your likes</Text>
          <Text style={styles.subtitle}>Similar to #Streetwear</Text>
        </View>
        <TouchableOpacity style={styles.contentsButton}>
          <Text style={styles.contentsButtonText}>Contents</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.challengeCard}>
        <Text style={styles.challengeTitle}>Singio Ccactluss</Text>
        <View style={styles.cardContent}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800' }}
            style={styles.challengeImage}
            contentFit="cover"
          />
          <View style={styles.cardOverlay}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Daily Theme Challenge</Text>
              <Text style={styles.hashtagText}>#SummerVibes</Text>
            </View>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Challenge</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.likeButton}>
            <Heart size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: colors.secondaryText,
    lineHeight: 18,
  },
  contentsButton: {
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contentsButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '600',
  },
  challengeCard: {
    backgroundColor: colors.shopCard,
    borderRadius: 16,
    padding: 16,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  cardContent: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  challengeImage: {
    width: '100%',
    height: 200,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flex: 1,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  hashtagText: {
    fontSize: 12,
    color: colors.primary,
  },
  joinButton: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  likeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 8,
  },
});
