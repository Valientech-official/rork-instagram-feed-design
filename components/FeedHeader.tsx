import React from 'react';
import { Platform, Alert } from 'react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Video } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import DMIcon from './icons/DMIcon';
import NotificationIcon from './icons/NotificationIcon';
import SearchIcon from './icons/SearchIcon';

interface FeedHeaderProps {
  onMenuPress?: () => void;
}

export default function FeedHeader({ onMenuPress }: FeedHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const handleLivePress = () => {
    router.push('/live');
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    router.push('/notification');
  };

  const handleSearchPress = () => {
    console.log('User search pressed');
    router.push('/user_search');
  };

  const handleDMPress = () => {
    console.log('DM pressed');
    router.push('/dm');
  };

  const handleMenuPress = () => {
    console.log('Menu pressed');
    if (onMenuPress) {
      onMenuPress();
    }
  };
  
  const handleShopPress = () => {
    router.push('/shop');
  };

  const handleProfilePress = () => {
    router.push('/profile');
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
      await MediaLibrary.createAlbumAsync('Piece', asset, false);
      Alert.alert('保存完了', '画像がフォトライブラリに保存されました。');
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('エラー', '画像の保存中にエラーが発生しました。');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 16) }]}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>
          <Text style={styles.logoP}>P</Text>
          <Text style={styles.logoI}>i</Text>
          <Text style={styles.logoE1}>è</Text>
          <Text style={styles.logoC}>c</Text>
          <Text style={styles.logoE2}>e</Text>
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconButton} onPress={handleLivePress}>
          <Video size={24} color={Colors.light.icon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={handleNotificationPress}>
          <NotificationIcon size={24} color={Colors.light.icon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={handleSearchPress}>
          <SearchIcon size={24} color={Colors.light.icon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={handleDMPress}>
          <DMIcon size={24} color={Colors.light.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'Marker Felt',
      android: 'casual',
      web: 'Quicksand, Nunito, Fredoka One, Comfortaa, Poppins, sans-serif',
    }),
    letterSpacing: 0.5,
  },
  logoP: {
    color: '#9ACD32', // Yellow-green
  },
  logoI: {
    color: '#FF69B4', // Pink
  },
  logoE1: {
    color: '#87CEEB', // Sky blue
  },
  logoC: {
    color: '#FFD700', // Gold/Yellow
  },
  logoE2: {
    color: '#DDA0DD', // Plum/Light purple
  },
  actions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 12,
  },
  favoriteButton: {
    position: 'relative',
    padding: 8,
    marginLeft: 12,
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
    marginLeft: 12,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.light.shopAccent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});