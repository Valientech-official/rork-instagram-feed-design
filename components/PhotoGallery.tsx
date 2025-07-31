import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Alert } from 'react-native';
import { Image } from 'expo-image';
import { X, Trash2 } from 'lucide-react-native';
import { usePhotoGalleryStore, SavedPhoto } from '@/store/photoGalleryStore';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48) / 3; // 3 columns with 16px padding on sides and 8px gaps

interface PhotoGalleryProps {
  onClose: () => void;
}

export default function PhotoGallery({ onClose }: PhotoGalleryProps) {
  const { photos, removePhoto } = usePhotoGalleryStore();

  const handleDeletePhoto = (photo: SavedPhoto) => {
    Alert.alert(
      '写真を削除',
      'この写真を削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => removePhoto(photo.id),
        },
      ]
    );
  };

  const renderPhoto = ({ item, index }: { item: SavedPhoto; index: number }) => {
    const marginLeft = index % 3 === 0 ? 0 : 8;
    
    return (
      <TouchableOpacity 
        style={[styles.photoContainer, { marginLeft }]}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.photo}
          contentFit="cover"
          transition={200}
        />
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeletePhoto(item)}
        >
          <Trash2 size={16} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>保存した写真 ({photos.length})</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={Colors.light.icon} />
        </TouchableOpacity>
      </View>
      
      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>保存された写真がありません</Text>
          <Text style={styles.emptySubText}>メモアイコンから写真を保存してください</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={renderPhoto}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
        />
      )}
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
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  row: {
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  photoContainer: {
    position: 'relative',
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.light.border,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
});