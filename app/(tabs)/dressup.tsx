import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Heart, Sparkles, LayoutGrid, Rows } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useFavoritesStore } from '@/store/favoritesStore';
import { dressUpModes, DressUpMode } from '@/mocks/dressUpItems';
import AIDressUpModal from '@/components/AIDressUpModal';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 2列分のカード幅
const PAGE_WIDTH = width - 32; // ページ幅

export default function DressUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items: favoriteItems } = useFavoritesStore();
  const [showAIDressUpModal, setShowAIDressUpModal] = useState(false);
  const [favoritesViewMode, setFavoritesViewMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const [modesViewMode, setModesViewMode] = useState<'vertical' | 'horizontal'>('vertical');

  // お気に入りを8個ずつのページに分割（2列×4行）
  const paginatedFavorites = [];
  for (let i = 0; i < favoriteItems.length; i += 8) {
    paginatedFavorites.push(favoriteItems.slice(i, i + 8));
  }

  const handleFavoritePress = (productId: string) => {
    // 投稿詳細画面に遷移
    router.push(`/post/${productId}`);
  };

  const handleModePress = (mode: DressUpMode) => {
    console.log('Dress up mode pressed:', mode.name);
    setShowAIDressUpModal(true);
  };

  const renderFavoritePage = ({ item: pageItems }: { item: typeof favoriteItems }) => {
    return (
      <View style={styles.favoritePage}>
        <View style={styles.favoriteGrid}>
          {pageItems.map((item) => {
            const isOnSale = item.salePrice && item.salePrice < item.price;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.favoriteCard}
                onPress={() => handleFavoritePress(item.productId)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.favoriteImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.favoriteInfo}>
                  <Text style={styles.favoriteName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {isOnSale ? (
                    <Text style={styles.favoritePrice}>¥{item.salePrice?.toFixed(0)}</Text>
                  ) : (
                    <Text style={styles.favoritePrice}>¥{item.price.toFixed(0)}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderModeRow = (modes: DressUpMode[]) => {
    return (
      <View style={styles.modeRow}>
        {modes.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={styles.modeCard}
            onPress={() => handleModePress(mode)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: mode.imageUrl }}
              style={styles.modeImage}
              contentFit="cover"
            />
            <View style={[styles.modeOverlay, { backgroundColor: mode.color + '90' }]}>
              <Text style={styles.modeName}>{mode.name}</Text>
              <Text style={styles.modeDescription}>{mode.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "着せ替え",
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダーボタン */}
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, styles.favoriteButton]}
            onPress={() => {
              // TODO: お気に入り一覧モーダルを開く
              console.log('お気に入り一覧');
            }}
          >
            <Heart size={20} color={Colors.light.like} fill={Colors.light.like} />
            <Text style={styles.headerButtonText}>お気に入り</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerButton, styles.aiButton]}
            onPress={() => setShowAIDressUpModal(true)}
          >
            <Sparkles size={20} color="white" />
            <Text style={[styles.headerButtonText, styles.aiButtonText]}>AI着せ替え</Text>
          </TouchableOpacity>
        </View>

        {/* お気に入りセクション（横スライド二列） */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>お気に入り</Text>
            <View style={styles.sectionRight}>
              <Text style={styles.sectionSubtitle}>二列</Text>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setFavoritesViewMode(favoritesViewMode === 'horizontal' ? 'vertical' : 'horizontal')}
              >
                {favoritesViewMode === 'horizontal' ? (
                  <Rows size={20} color={Colors.light.text} />
                ) : (
                  <LayoutGrid size={20} color={Colors.light.text} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {favoriteItems.length > 0 ? (
            favoritesViewMode === 'horizontal' ? (
              <FlatList
                horizontal
                pagingEnabled
                data={paginatedFavorites}
                keyExtractor={(_, index) => `page_${index}`}
                renderItem={renderFavoritePage}
                showsHorizontalScrollIndicator={false}
                snapToInterval={PAGE_WIDTH}
                decelerationRate="fast"
                contentContainerStyle={styles.favoritesScrollContent}
              />
            ) : (
              <View style={styles.favoriteGrid}>
                {favoriteItems.map((item) => {
                  const isOnSale = item.salePrice && item.salePrice < item.price;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.favoriteCard}
                      onPress={() => handleFavoritePress(item.productId)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: item.image }}
                        style={styles.favoriteImage}
                        contentFit="cover"
                        transition={200}
                      />
                      <View style={styles.favoriteInfo}>
                        <Text style={styles.favoriteName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {isOnSale ? (
                          <Text style={styles.favoritePrice}>¥{item.salePrice?.toFixed(0)}</Text>
                        ) : (
                          <Text style={styles.favoritePrice}>¥{item.price.toFixed(0)}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          ) : (
            <View style={styles.emptyState}>
              <Heart size={48} color={Colors.light.border} />
              <Text style={styles.emptyText}>お気に入りがありません</Text>
            </View>
          )}
        </View>

        {/* 着せ替えモードセクション（縦スライド） */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>着せ替えモード</Text>
            <Text style={styles.sectionSubtitle}>二行</Text>
          </View>

          <ScrollView
            style={styles.modesScrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {/* 2行ずつ表示 */}
            {renderModeRow(dressUpModes.slice(0, 2))}
            {renderModeRow(dressUpModes.slice(2, 4))}
            {renderModeRow(dressUpModes.slice(4, 6))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* AI着せ替えモーダル */}
      <AIDressUpModal
        visible={showAIDressUpModal}
        onClose={() => setShowAIDressUpModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  favoriteButton: {
    backgroundColor: Colors.light.shopBackground,
    borderWidth: 1,
    borderColor: Colors.light.like,
  },
  aiButton: {
    backgroundColor: Colors.light.primary,
  },
  headerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  aiButtonText: {
    color: 'white',
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.secondaryText,
    backgroundColor: Colors.light.shopBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  favoritesScrollContent: {
    paddingLeft: 16,
  },
  favoritePage: {
    width: PAGE_WIDTH,
    paddingRight: 16,
  },
  favoriteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  favoriteCard: {
    width: ITEM_WIDTH,
    backgroundColor: Colors.light.shopCard,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  favoriteImage: {
    width: '100%',
    height: ITEM_WIDTH,
  },
  favoriteInfo: {
    padding: 10,
  },
  favoriteName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  favoritePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.shopPrice,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.light.secondaryText,
    marginTop: 12,
  },
  modesScrollContainer: {
    maxHeight: 600,
    paddingHorizontal: 16,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  modeCard: {
    flex: 1,
    height: 140,
    borderRadius: 16,
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
    fontWeight: '500',
    color: 'white',
  },
});
