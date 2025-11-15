import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';
import { Search, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

interface SearchBarProps {
  onSearch?: (text: string) => void;
  onSearchPress?: () => void;
  placeholder?: string;
  value?: string;
}

export default function SearchBar({ onSearch, onSearchPress, placeholder = "Search...", value }: SearchBarProps) {
  const [searchText, setSearchText] = useState('');
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  // 外部から値が渡された場合は、それを使用
  const displayValue = value !== undefined ? value : searchText;

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


  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.background,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.shopBackground,
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
      color: colors.text,
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
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    favoriteBadgeInner: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.shopSale,
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
      backgroundColor: colors.shopAccent,
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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.searchContainer} onPress={handleSearchPress}>
        <Search size={18} color={colors.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.secondaryText}
          value={displayValue}
          onChangeText={handleChangeText}
          editable={!onSearchPress}
          pointerEvents={onSearchPress ? 'none' : 'auto'}
        />
        {displayValue.length > 0 && !onSearchPress && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={18} color={colors.secondaryText} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
}