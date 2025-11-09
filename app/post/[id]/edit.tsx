import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  X,
  MapPin,
  Tag,
  GripVertical,
  Trash2
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const MAX_CAPTION_LENGTH = 2200;
const MAX_IMAGES = 10;
const MAX_TAGS = 5;

interface PostImage {
  url: string;
  order: number;
}

interface ProductTag {
  product_id: string;
  product_name: string;
  x_position: number;
  y_position: number;
}

interface Location {
  latitude: number;
  longitude: number;
  name?: string;
}

interface PostData {
  post_id: string;
  caption: string;
  images: PostImage[];
  location?: Location;
  product_tags: ProductTag[];
}

export default function EditPostScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<PostImage[]>([]);
  const [location, setLocation] = useState<Location | undefined>();
  const [locationName, setLocationName] = useState('');
  const [productTags, setProductTags] = useState<ProductTag[]>([]);
  const [originalData, setOriginalData] = useState<PostData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPostData();
  }, [id]);

  useEffect(() => {
    checkForChanges();
  }, [caption, images, location, productTags]);

  const loadPostData = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/post/${id}`, {
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json' }
      // });
      // const data = await response.json();

      // Mock data for development
      const data: PostData = {
        post_id: id as string,
        caption: 'Sample caption for this post. #fashion #style',
        images: [
          { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d', order: 0 },
          { url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b', order: 1 },
        ],
        location: {
          latitude: 35.6762,
          longitude: 139.6503,
          name: 'Tokyo, Japan',
        },
        product_tags: [
          {
            product_id: 'prod_1',
            product_name: 'Summer Dress',
            x_position: 0.5,
            y_position: 0.3,
          },
        ],
      };

      setOriginalData(data);
      setCaption(data.caption);
      setImages(data.images.sort((a, b) => a.order - b.order));
      setLocation(data.location);
      setLocationName(data.location?.name || '');
      setProductTags(data.product_tags);
    } catch (error) {
      console.error('Failed to load post:', error);
      Alert.alert('Error', 'Failed to load post data. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const checkForChanges = () => {
    if (!originalData) return;

    const captionChanged = caption !== originalData.caption;
    const imagesChanged = JSON.stringify(images) !== JSON.stringify(originalData.images);
    const locationChanged = JSON.stringify(location) !== JSON.stringify(originalData.location);
    const tagsChanged = JSON.stringify(productTags) !== JSON.stringify(originalData.product_tags);

    setHasChanges(captionChanged || imagesChanged || locationChanged || tagsChanged);
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    if (images.length === 0) {
      Alert.alert('Error', 'You must have at least one image.');
      return;
    }

    if (productTags.length > MAX_TAGS) {
      Alert.alert('Error', `You can only have up to ${MAX_TAGS} product tags.`);
      return;
    }

    try {
      setSaving(true);

      const updatedPost = {
        caption,
        images: images.map((img, index) => ({ ...img, order: index })),
        location,
        product_tags: productTags,
      };

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/post/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updatedPost)
      // });
      //
      // if (!response.ok) {
      //   throw new Error('Failed to update post');
      // }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Success', 'Your post has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Failed to save post:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    if (images.length <= 1) {
      Alert.alert('Error', 'You must have at least one image.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newImages = images.filter((_, i) => i !== index);
            setImages(newImages);
          },
        },
      ]
    );
  };

  const handleMoveImage = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;

    if (toIndex < 0 || toIndex >= images.length) return;

    const newImages = [...images];
    const temp = newImages[fromIndex];
    newImages[fromIndex] = newImages[toIndex];
    newImages[toIndex] = temp;

    setImages(newImages);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRemoveTag = (index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      'Remove Tag',
      'Remove this product tag?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newTags = productTags.filter((_, i) => i !== index);
            setProductTags(newTags);
          },
        },
      ]
    );
  };

  const handleLocationSearch = () => {
    Alert.alert(
      'Location Search',
      'Location search feature would be implemented here.',
      [{ text: 'OK' }]
    );
  };

  const handleAddTag = () => {
    if (productTags.length >= MAX_TAGS) {
      Alert.alert('Limit Reached', `You can only add up to ${MAX_TAGS} product tags.`);
      return;
    }

    Alert.alert(
      'Add Product Tag',
      'Product tag selection feature would be implemented here.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Edit Post',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={!hasChanges || saving}
              style={styles.headerButton}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.light.primary} />
              ) : (
                <Text
                  style={[
                    styles.saveButton,
                    (!hasChanges || saving) && styles.saveButtonDisabled,
                  ]}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Caption Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caption</Text>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="Write a caption..."
              placeholderTextColor={Colors.light.secondaryText}
              multiline
              maxLength={MAX_CAPTION_LENGTH}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {caption.length}/{MAX_CAPTION_LENGTH}
            </Text>
          </View>

          {/* Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Images</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesScroll}
            >
              {images.map((image, index) => (
                <View key={index} style={styles.imageItem}>
                  <Image
                    source={{ uri: image.url }}
                    style={styles.imagePreview}
                    contentFit="cover"
                  />

                  {/* Remove button */}
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <X size={16} color="white" />
                  </TouchableOpacity>

                  {/* Reorder controls */}
                  <View style={styles.reorderControls}>
                    {index > 0 && (
                      <TouchableOpacity
                        style={styles.reorderButton}
                        onPress={() => handleMoveImage(index, 'left')}
                      >
                        <Text style={styles.reorderButtonText}>←</Text>
                      </TouchableOpacity>
                    )}
                    <View style={styles.orderNumber}>
                      <Text style={styles.orderNumberText}>{index + 1}</Text>
                    </View>
                    {index < images.length - 1 && (
                      <TouchableOpacity
                        style={styles.reorderButton}
                        onPress={() => handleMoveImage(index, 'right')}
                      >
                        <Text style={styles.reorderButtonText}>→</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.helperText}>
              Tap and hold to reorder. At least 1 image required.
            </Text>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleLocationSearch}
            >
              <MapPin size={20} color={Colors.light.icon} />
              <Text style={styles.locationText}>
                {locationName || 'Add location'}
              </Text>
              {location && (
                <TouchableOpacity
                  onPress={() => {
                    setLocation(undefined);
                    setLocationName('');
                  }}
                  style={styles.clearLocation}
                >
                  <X size={16} color={Colors.light.secondaryText} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* Product Tags Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Product Tags</Text>
              <Text style={styles.tagCount}>
                {productTags.length}/{MAX_TAGS}
              </Text>
            </View>

            {productTags.length > 0 && (
              <View style={styles.tagsList}>
                {productTags.map((tag, index) => (
                  <View key={index} style={styles.tagItem}>
                    <Tag size={16} color={Colors.light.icon} />
                    <Text style={styles.tagName} numberOfLines={1}>
                      {tag.product_name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTag(index)}
                      style={styles.removeTagButton}
                    >
                      <X size={16} color={Colors.light.secondaryText} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {productTags.length < MAX_TAGS && (
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={handleAddTag}
              >
                <Tag size={20} color={Colors.light.primary} />
                <Text style={styles.addTagText}>Add Product Tag</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.helperText}>
              Tag products from your shop (max {MAX_TAGS})
            </Text>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
  headerButton: {
    padding: 8,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  saveButtonDisabled: {
    color: Colors.light.secondaryText,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.separator,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  captionInput: {
    fontSize: 16,
    color: Colors.light.text,
    minHeight: 120,
    maxHeight: 200,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    textAlign: 'right',
    marginTop: 8,
  },
  imagesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  imageItem: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  reorderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  orderNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.separator,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  helperText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginTop: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 8,
  },
  clearLocation: {
    padding: 4,
  },
  tagCount: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  tagsList: {
    marginBottom: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    marginBottom: 8,
  },
  tagName: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 8,
  },
  removeTagButton: {
    padding: 4,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addTagText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
});
