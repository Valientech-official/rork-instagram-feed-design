import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';
import { Search, X, Heart, ShoppingCart, NotebookPen } from 'lucide-react-native';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useCartStore } from '@/store/cartStore';
import { usePhotoGalleryStore } from '@/store/photoGalleryStore';
import Colors from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

interface SearchBarProps {
  onSearch?: (text: string) => void;
  onFavoritesPress?: () => void;
  onCartPress?: () => void;
  onSearchPress?: () => void;
  onPhotoGalleryPress?: () => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, onFavoritesPress, onCartPress, onSearchPress, onPhotoGalleryPress, placeholder = "Search..." }: SearchBarProps) {
  const [searchText, setSearchText] = useState('');
  const { items: favoriteItems } = useFavoritesStore();
  const { items: cartItems, getTotalItems } = useCartStore();
  const { addPhoto } = usePhotoGalleryStore();

  const handleClear = () => {
    setSearchText('');
    if (onSearch) {
      onSearch('');
    }
  };

  const handleChangeText = (text: string) => {
    setSearchText(text);
    if (onSearch) {
      onSearch(text);
    }
  };

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    }
  };

  const handleImageSave = async () => {
    try {
      // Request permissions
      const { status: cameraRollStatus } = await MediaLibrary.requestPermissionsAsync();
      const { status: imagePickerStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraRollStatus !== 'granted' || imagePickerStatus !== 'granted') {
        Alert.alert('権限が必要です', 'この機能を使用するには、写真ライブラリへのアクセス権限が必要です。');
        return;
      }

      // Show action sheet to choose between camera and library
      Alert.alert(
        '画像を選択',
        '画像の取得方法を選択してください',
        [
          {
            text: 'カメラ',
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              
              if (!result.canceled && result.assets[0]) {
                await saveImageToLibrary(result.assets[0].uri);
                // Save to photo gallery store
                addPhoto({ uri: result.assets[0].uri });
              }
            },
          },
          {
            text: 'フォトライブラリ',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              
              if (!result.canceled && result.assets[0]) {
                await saveImageToLibrary(result.assets[0].uri);
                // Save to photo gallery store
                addPhoto({ uri: result.assets[0].uri });
              }
            },
          },
          {
            text: 'キャンセル',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error handling image save:', error);
      Alert.alert('エラー', '画像の処理中にエラーが発生しました。');
    }
  };

  const saveImageToLibrary = async (uri: string) => {
    try {
      if (Platform.OS === 'web') {
        // Web doesn't support MediaLibrary, show alternative message
        Alert.alert('保存完了', 'ブラウザのダウンロード機能を使用して画像を保存してください。');
        return;
      }
      
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Pièce', asset, false);
      Alert.alert('保存完了', '画像がフォトライブラリに保存されました。');
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('エラー', '画像の保存中にエラーが発生しました。');
    }
  };

  const totalCartItems = getTotalItems();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.searchContainer} onPress={handleSearchPress}>
        <Search size={18} color={Colors.light.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.secondaryText}
          value={searchText}
          onChangeText={handleChangeText}
          editable={!onSearchPress}
          pointerEvents={onSearchPress ? 'none' : 'auto'}
        />
        {searchText.length > 0 && !onSearchPress && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={18} color={Colors.light.secondaryText} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.notebookButton} 
        onPress={onPhotoGalleryPress}
        activeOpacity={0.7}
      >
        <NotebookPen size={20} color={Colors.light.secondaryText} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.favoriteButton} 
        onPress={onFavoritesPress}
        activeOpacity={0.7}
      >
        <Heart 
          size={20} 
          color={favoriteItems.length > 0 ? Colors.light.shopSale : Colors.light.secondaryText}
          fill={favoriteItems.length > 0 ? Colors.light.shopSale : 'transparent'}
        />
        {favoriteItems.length > 0 && (
          <View style={styles.favoriteBadge}>
            <View style={styles.favoriteBadgeInner} />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.cartButton} 
        onPress={onCartPress}
        activeOpacity={0.7}
      >
        <ShoppingCart size={20} color={Colors.light.text} />
        {totalCartItems > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>
              {totalCartItems > 99 ? '99+' : totalCartItems.toString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.shopBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  notebookButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  favoriteButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadgeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.shopSale,
  },
  cartButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.light.shopAccent,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});