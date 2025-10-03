import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Plus, X, ChevronRight, Tag, DollarSign, Link as LinkIcon, Ruler, Palette } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface ProductImage {
  uri: string;
  id: string;
}

interface ProductListingFlowProps {
  onClose?: () => void;
}

export default function ProductListingFlow({ onClose }: ProductListingFlowProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [description, setDescription] = useState('');
  const [ecLink, setEcLink] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);

  const categories = [
    'トップス', 'ボトムス', 'ワンピース', 'アウター',
    'シューズ', 'アクセサリー', 'バッグ', 'その他'
  ];

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const availableColors = ['黒', '白', 'グレー', 'ベージュ', '茶', '赤', '青', '緑'];

  const handleAddImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, {
        uri: result.assets[0].uri,
        id: Date.now().toString(),
      }]);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };

  const toggleSize = (size: string) => {
    if (sizes.includes(size)) {
      setSizes(sizes.filter(s => s !== size));
    } else {
      setSizes([...sizes, size]);
    }
  };

  const toggleColor = (color: string) => {
    if (colors.includes(color)) {
      setColors(colors.filter(c => c !== color));
    } else {
      setColors([...colors, color]);
    }
  };

  return (
    <View style={styles.wrapper}>
      {onClose && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>商品を出品</Text>
          <View style={{ width: 80 }} />
        </View>
      )}
      <ScrollView style={styles.container}>
        <Text style={styles.title}>商品を出品</Text>

      {/* 写真追加 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>商品写真</Text>
        <View style={styles.imagesGrid}>
          {images.map((image) => (
            <View key={image.id} style={styles.imageItem}>
              <Image
                source={{ uri: image.uri }}
                style={styles.productImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => handleRemoveImage(image.id)}
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}

          {images.length < 6 && (
            <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage}>
              <Plus size={32} color={Colors.light.secondaryText} />
              <Text style={styles.addImageText}>写真追加</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 商品名 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>商品名</Text>
        <TextInput
          style={styles.input}
          placeholder="商品名を入力"
          value={productName}
          onChangeText={setProductName}
        />
      </View>

      {/* カテゴリ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ジャンル</Text>
        <View style={styles.chipsContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                category === cat && styles.chipActive
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[
                styles.chipText,
                category === cat && styles.chipTextActive
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 価格 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <DollarSign size={18} color={Colors.light.text} />
          <Text style={styles.sectionTitle}>価格</Text>
        </View>
        <View style={styles.priceRow}>
          <View style={styles.priceInput}>
            <Text style={styles.priceLabel}>通常価格</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.priceInput}>
            <Text style={styles.priceLabel}>セール価格</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={salePrice}
              onChangeText={setSalePrice}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* サイズ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ruler size={18} color={Colors.light.text} />
          <Text style={styles.sectionTitle}>サイズ</Text>
        </View>
        <View style={styles.chipsContainer}>
          {availableSizes.map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.chip,
                sizes.includes(size) && styles.chipActive
              ]}
              onPress={() => toggleSize(size)}
            >
              <Text style={[
                styles.chipText,
                sizes.includes(size) && styles.chipTextActive
              ]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* カラー */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Palette size={18} color={Colors.light.text} />
          <Text style={styles.sectionTitle}>カラー</Text>
        </View>
        <View style={styles.chipsContainer}>
          {availableColors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.chip,
                colors.includes(color) && styles.chipActive
              ]}
              onPress={() => toggleColor(color)}
            >
              <Text style={[
                styles.chipText,
                colors.includes(color) && styles.chipTextActive
              ]}>
                {color}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 説明 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>商品説明</Text>
        <TextInput
          style={styles.textArea}
          placeholder="商品の詳細を入力"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* ECサイトリンク */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <LinkIcon size={18} color={Colors.light.text} />
          <Text style={styles.sectionTitle}>ECサイトリンク</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="https://your-shop.com/product"
          value={ecLink}
          onChangeText={setEcLink}
          keyboardType="url"
        />
      </View>

      {/* ハッシュタグ */}
      <TouchableOpacity style={styles.actionItem}>
        <Tag size={20} color={Colors.light.text} />
        <Text style={styles.actionText}>ハッシュタグを追加</Text>
        <ChevronRight size={20} color={Colors.light.secondaryText} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.publishButton}>
        <Text style={styles.publishButtonText}>出品する</Text>
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeText: {
    fontSize: 15,
    color: Colors.light.primary,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
    marginLeft: 8,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageItem: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.shopBackground,
  },
  addImageText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginTop: 4,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  chipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInput: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    marginLeft: 12,
  },
  publishButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
