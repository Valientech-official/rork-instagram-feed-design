import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Heart, Sparkles, LayoutGrid, Rows } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useFavoritesStore } from '@/store/favoritesStore';
import { dressUpModes, DressUpMode } from '@/mocks/dressUpItems';
import AIDressUpModal from '@/components/AIDressUpModal';
import { useThemeStore } from '@/store/themeStore';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

type ViewMode = 'horizontal' | 'vertical';

export default function DressUpScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { items: favoriteItems } = useFavoritesStore();
  const [showAIDressUpModal, setShowAIDressUpModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('vertical');

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  };

  const handleFavoritePress = (productId: string) => {
    router.push(`/post/${productId}`);
  };

  const handleModePress = (mode: DressUpMode) => {
    setShowAIDressUpModal(true);
  };

  const renderFavoriteItem = ({ item }: { item: typeof favoriteItems[0] }) => {
    const isOnSale = item.salePrice && item.salePrice < item.price;
    return (
      <TouchableOpacity
        style={[
          styles.favoriteItem,
          viewMode === 'horizontal' ? styles.favoriteItemHorizontal : {}
        ]}
        onPress={() => handleFavoritePress(item.productId)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.image }}
          style={[
            styles.favoriteImage,
            viewMode === 'horizontal' ? styles.favoriteImageHorizontal : {}
          ]}
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
  };

  const renderModeItem = ({ item }: { item: DressUpMode }) => (
    <TouchableOpacity
      style={[
        styles.modeItem,
        viewMode === 'horizontal' ? styles.modeItemHorizontal : {}
      ]}
      onPress={() => handleModePress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={[
          styles.modeImage,
          viewMode === 'horizontal' ? styles.modeImageHorizontal : {}
        ]}
        contentFit="cover"
      />
      <View style={[styles.modeOverlay, { backgroundColor: item.color + '90' }]}>
        <Text style={styles.modeName}>{item.name}</Text>
        <Text style={styles.modeDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerButtonsContainer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 6,
    },
    favoriteHeaderButton: {
      backgroundColor: colors.shopBackground,
      borderWidth: 1.5,
      borderColor: colors.like,
    },
    aiHeaderButton: {
      backgroundColor: colors.primary,
    },
    headerButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    aiButtonText: {
      color: 'white',
    },
    toggleButton: {
      backgroundColor: colors.shopCard,
      padding: 10,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      marginLeft: 4,
    },
    contentContainer: {
      flex: 1,
    },
    horizontalLayout: {
      flexDirection: 'column',
    },
    verticalLayout: {
      flexDirection: 'row',
    },
    section: {
      borderColor: colors.border,
    },
    halfWidth: {
      width: '50%',
      borderRightWidth: 1,
    },
    halfHeight: {
      height: '50%',
      borderBottomWidth: 1,
      width: '100%',
    },
    sectionHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionHeaderHorizontal: {
      padding: 8,
      paddingHorizontal: 12,
    },
    titleWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    sectionTitleHorizontal: {
      fontSize: 16,
    },
    iconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    itemCount: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.secondaryText,
    },
    itemCountHorizontal: {
      fontSize: 12,
    },
    list: {
      padding: 8,
    },
    horizontalList: {
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    favoriteItem: {
      marginBottom: 12,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.shopCard,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    favoriteItemHorizontal: {
      marginBottom: 0,
      marginRight: 12,
      width: 280,
    },
    favoriteImage: {
      width: '100%',
      height: 180,
    },
    favoriteImageHorizontal: {
      width: 280,
      height: 220,
    },
    favoriteInfo: {
      padding: 12,
    },
    favoriteName: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    favoritePrice: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.shopPrice,
    },
    modeItem: {
      marginBottom: 12,
      borderRadius: 16,
      overflow: 'hidden',
      position: 'relative',
      height: 140,
    },
    modeItemHorizontal: {
      marginBottom: 0,
      marginRight: 12,
      width: 280,
      height: 180,
    },
    modeImage: {
      width: '100%',
      height: '100%',
    },
    modeImageHorizontal: {
      width: 280,
      height: 180,
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
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 48,
    },
    emptyText: {
      fontSize: 15,
      color: colors.secondaryText,
      marginTop: 12,
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "着せ替え",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
        }}
      />

      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header Buttons */}
        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity
            style={[styles.headerButton, styles.favoriteHeaderButton]}
            onPress={() => {
              console.log('お気に入り一覧');
            }}
          >
            <Heart size={18} color={colors.like} fill={colors.like} />
            <Text style={styles.headerButtonText}>お気に入り</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerButton, styles.aiHeaderButton]}
            onPress={() => setShowAIDressUpModal(true)}
          >
            <Sparkles size={18} color="white" />
            <Text style={[styles.headerButtonText, styles.aiButtonText]}>AI着せ替え</Text>
          </TouchableOpacity>

          {/* Toggle View Mode Button */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleViewMode}
            activeOpacity={0.7}
          >
            {viewMode === 'horizontal' ? (
              <Rows size={22} color={colors.text} />
            ) : (
              <LayoutGrid size={22} color={colors.text} />
            )}
          </TouchableOpacity>
        </View>

        <View style={[
          styles.contentContainer,
          viewMode === 'horizontal'
            ? styles.horizontalLayout
            : styles.verticalLayout
        ]}>
          {/* Favorites Section */}
          <View style={[
            styles.section,
            viewMode === 'horizontal' ? styles.halfHeight : styles.halfWidth
          ]}>
            <View style={[
              styles.sectionHeader,
              viewMode === 'horizontal' ? styles.sectionHeaderHorizontal : {}
            ]}>
              <View style={styles.titleWithIcon}>
                <Text style={[
                  styles.sectionTitle,
                  viewMode === 'horizontal' ? styles.sectionTitleHorizontal : {}
                ]}>お気に入り</Text>
                <View style={styles.iconContainer}>
                  <Heart
                    size={viewMode === 'horizontal' ? 14 : 18}
                    color={colors.like}
                    fill={colors.like}
                  />
                  <Text style={[
                    styles.itemCount,
                    viewMode === 'horizontal' ? styles.itemCountHorizontal : {}
                  ]}>{favoriteItems.length}</Text>
                </View>
              </View>
            </View>

            {favoriteItems.length > 0 ? (
              <FlatList
                key={`favorites-${viewMode}`}
                data={favoriteItems}
                renderItem={renderFavoriteItem}
                keyExtractor={item => item.id}
                horizontal={viewMode === 'horizontal'}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.list,
                  viewMode === 'horizontal' ? styles.horizontalList : {}
                ]}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Heart size={48} color={colors.border} />
                    <Text style={styles.emptyText}>お気に入りがありません</Text>
                  </View>
                }
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Heart size={48} color={colors.border} />
                <Text style={styles.emptyText}>お気に入りがありません</Text>
              </View>
            )}
          </View>

          {/* Dress-up Modes Section */}
          <View style={[
            styles.section,
            viewMode === 'horizontal' ? styles.halfHeight : styles.halfWidth
          ]}>
            <View style={[
              styles.sectionHeader,
              viewMode === 'horizontal' ? styles.sectionHeaderHorizontal : {}
            ]}>
              <View style={styles.titleWithIcon}>
                <Text style={[
                  styles.sectionTitle,
                  viewMode === 'horizontal' ? styles.sectionTitleHorizontal : {}
                ]}>着せ替えモード</Text>
                <View style={styles.iconContainer}>
                  <Sparkles
                    size={viewMode === 'horizontal' ? 14 : 18}
                    color={colors.primary}
                  />
                  <Text style={[
                    styles.itemCount,
                    viewMode === 'horizontal' ? styles.itemCountHorizontal : {}
                  ]}>{dressUpModes.length}</Text>
                </View>
              </View>
            </View>

            <FlatList
              key={`modes-${viewMode}`}
              data={dressUpModes}
              renderItem={renderModeItem}
              keyExtractor={item => item.id}
              horizontal={viewMode === 'horizontal'}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.list,
                viewMode === 'horizontal' ? styles.horizontalList : {}
              ]}
            />
          </View>
        </View>
      </View>

      {/* AI Dress-up Modal */}
      <AIDressUpModal
        visible={showAIDressUpModal}
        onClose={() => setShowAIDressUpModal(false)}
      />
    </>
  );
}
