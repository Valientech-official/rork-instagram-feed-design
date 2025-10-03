import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Heart, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { dressUpItems, dressUpModes } from '@/mocks/dressUpItems';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AIDressUpModal from '@/components/AIDressUpModal';

export default function CreateScreen() {
  const [showAIModal, setShowAIModal] = useState(false);
  const insets = useSafeAreaInsets();

  const favoriteItems = dressUpItems.filter(item => item.isFavorite);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.favoriteButton}>
          <Heart size={24} color={Colors.light.text} />
          <Text style={styles.headerButtonText}>お気に入り</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => setShowAIModal(true)}
        >
          <Sparkles size={20} color="white" />
          <Text style={styles.aiButtonText}>AI着せ替え</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* お気に入りセクション - 横スクロール */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>お気に入り</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.favoriteScroll}
          >
            {favoriteItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.favoriteCard}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.favoriteImage}
                  contentFit="cover"
                />
                <Text style={styles.favoriteItemName} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 着せ替えモードセクション - 縦スクロール（2列） */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>着せ替えモード</Text>
          <View style={styles.modesGrid}>
            {dressUpModes.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={styles.modeCard}
              >
                <Image
                  source={{ uri: mode.imageUrl }}
                  style={styles.modeImage}
                  contentFit="cover"
                />
                <View style={[styles.modeOverlay, { backgroundColor: mode.color + '99' }]}>
                  <Text style={styles.modeName}>{mode.name}</Text>
                  <Text style={styles.modeDescription}>{mode.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <AIDressUpModal
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.shopBackground,
  },
  headerButtonText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
  },
  aiButtonText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  favoriteScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  favoriteCard: {
    width: 140,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  favoriteImage: {
    width: '100%',
    height: 140,
  },
  favoriteItemName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
    padding: 8,
    textAlign: 'center',
  },
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  modeCard: {
    width: '48%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  modeImage: {
    width: '100%',
    height: '100%',
  },
  modeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  modeName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: 12,
    color: 'white',
  },
});
