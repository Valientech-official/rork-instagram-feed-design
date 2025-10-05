import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { X, Camera, Heart, Library, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Colors from '@/constants/colors';
import { avatars, Avatar } from '@/mocks/avatars';
import { dressUpItems, sizeOptions, SizeOption, DressUpItem } from '@/mocks/dressUpItems';
import SevenElevenLoading from './SevenElevenLoading';

const { width } = Dimensions.get('window');

interface AIDressUpModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4;

export default function AIDressUpModal({ visible, onClose }: AIDressUpModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [selectedItem, setSelectedItem] = useState<DressUpItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeOption>('just');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [remainingCount, setRemainingCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const favoriteAvatars = avatars.filter(a => a.isFavorite);
  const allItems = dressUpItems;

  useEffect(() => {
    if (!visible) {
      // モーダルを閉じる時にリセット
      setTimeout(() => {
        setCurrentStep(1);
        setSelectedAvatar(null);
        setSelectedItem(null);
        setSelectedSize('just');
        setGeneratedImageUrl('');
      }, 300);
    }
  }, [visible]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const convertImageToBase64 = async (imageUri: string): Promise<string> => {
    try {
      // If it's a local file URI (from camera/library)
      if (imageUri.startsWith('file://')) {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
      }

      // If it's a remote URL, fetch and convert
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  const handleGenerate = async () => {
    if (!selectedItem || !selectedAvatar) return;

    setCurrentStep(3);
    setIsGenerating(true);
    setError(null);

    try {
      // Convert images to base64
      const avatarBase64 = await convertImageToBase64(selectedAvatar.imageUrl);
      const itemBase64 = await convertImageToBase64(selectedItem.imageUrl);

      // Build English prompt
      const sizeDescriptions = {
        oversized: 'oversized fit, loose and comfortable',
        just: 'perfect fit, tailored to body',
        small: 'tight fit, form-fitting',
      };

      const prompt = `Transform the person in the first image to wear the clothing item shown in the second image. The fit should be ${sizeDescriptions[selectedSize]}. Maintain the person's pose and background. Professional fashion photography style, studio lighting, clean composition.`;

      // Call API
      const response = await fetch('/api/genimage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          avatarImage: avatarBase64,
          itemImage: itemBase64,
          aspectRatio: '2:3',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Image generation failed');
      }

      // Convert base64 to data URL
      const imageDataUrl = `data:image/png;base64,${data.image}`;
      setGeneratedImageUrl(imageDataUrl);
      setRemainingCount(prev => prev - 1);
      setCurrentStep(4);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate image');
      setCurrentStep(4); // Show result screen with error
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert('カメラへのアクセス許可が必要です');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const newAvatar: Avatar = {
        id: `camera_${Date.now()}`,
        imageUrl: result.assets[0].uri,
        source: 'camera',
        isFavorite: false,
      };
      setSelectedAvatar(newAvatar);
      handleNext();
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const newAvatar: Avatar = {
        id: `library_${Date.now()}`,
        imageUrl: result.assets[0].uri,
        source: 'library',
        isFavorite: false,
      };
      setSelectedAvatar(newAvatar);
      handleNext();
    }
  };

  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.title}>AI着せ替えを始めましょう</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ここではあなたのアバターが着せ替えをすることができます。
        </Text>
        <Text style={styles.remainingText}>
          残り<Text style={styles.remainingCount}>{remainingCount}</Text>回まで無料です
        </Text>
        <Text style={styles.warningText}>
          ※AI生成機能を使用しているため理想とは違うものができる可能性があります。
        </Text>
      </View>

      <Text style={styles.subtitle}>アバターを選択</Text>

      {/* お気に入りから選ぶ */}
      <View style={styles.selectionSection}>
        <View style={styles.sectionHeader}>
          <Heart size={18} color={Colors.light.like} fill={Colors.light.like} />
          <Text style={styles.sectionTitle}>お気に入りから選ぶ</Text>
        </View>
        <View style={styles.avatarsGrid}>
          {favoriteAvatars.map((avatar) => (
            <TouchableOpacity
              key={avatar.id}
              style={[
                styles.avatarCard,
                selectedAvatar?.id === avatar.id && styles.avatarCardSelected
              ]}
              onPress={() => {
                setSelectedAvatar(avatar);
                handleNext();
              }}
            >
              <Image
                source={{ uri: avatar.imageUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* カメラ・ライブラリ */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleTakePhoto}
        >
          <Camera size={24} color={Colors.light.primary} />
          <Text style={styles.actionButtonText}>写真を撮る</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePickImage}
        >
          <Library size={24} color={Colors.light.primary} />
          <Text style={styles.actionButtonText}>ライブラリから選ぶ</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.title}>アイテムとサイズを選択</Text>

      {/* アバターとアイテムの比較 */}
      <View style={styles.comparisonContainer}>
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>選択したアバター</Text>
          {selectedAvatar && (
            <Image
              source={{ uri: selectedAvatar.imageUrl }}
              style={styles.comparisonImage}
              contentFit="cover"
            />
          )}
        </View>

        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>着せ替えアイテム</Text>
          {selectedItem ? (
            <Image
              source={{ uri: selectedItem.imageUrl }}
              style={styles.comparisonImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholderBox}>
              <Text style={styles.placeholderText}>アイテムを選択</Text>
            </View>
          )}
        </View>
      </View>

      {/* アイテム一覧 */}
      <Text style={styles.subtitle}>着せ替えアイテム</Text>
      <View style={styles.itemsGrid}>
        {allItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemCard,
              selectedItem?.id === item.id && styles.itemCardSelected
            ]}
            onPress={() => setSelectedItem(item)}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.itemImage}
              contentFit="cover"
            />
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* サイズ選択 */}
      {selectedItem && (
        <>
          <Text style={styles.subtitle}>サイズを選択</Text>
          <View style={styles.sizeOptions}>
            {sizeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sizeButton,
                  selectedSize === option.value && styles.sizeButtonSelected
                ]}
                onPress={() => setSelectedSize(option.value)}
              >
                <Text style={styles.sizeEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.sizeLabel,
                  selectedSize === option.value && styles.sizeLabelSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* 生成ボタン */}
      {selectedItem && (
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerate}
        >
          <Text style={styles.generateButtonText}>AI着せ替えを生成</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderStep3 = () => (
    <SevenElevenLoading />
  );

  const renderStep4 = () => (
    <ScrollView style={styles.stepContainer}>
      {error ? (
        <>
          <Text style={styles.title}>エラーが発生しました</Text>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setCurrentStep(2);
            }}
          >
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tryAgainButton}
            onPress={() => setCurrentStep(1)}
          >
            <Text style={styles.tryAgainText}>最初からやり直す</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>生成完了！</Text>

          <View style={styles.resultContainer}>
            <Image
              source={{ uri: generatedImageUrl }}
              style={styles.resultImage}
              contentFit="cover"
            />
          </View>

          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.resultButton}>
              <Text style={styles.resultButtonText}>💾 保存する</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resultButton}>
              <Text style={styles.resultButtonText}>📤 共有する</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.resultButton, styles.resultButtonPrimary]}>
              <Text style={[styles.resultButtonText, styles.resultButtonTextPrimary]}>
                📝 投稿する
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.tryAgainButton}
            onPress={() => setCurrentStep(1)}
          >
            <Text style={styles.tryAgainText}>もう一度試す</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* ヘッダー */}
        <View style={styles.modalHeader}>
          {currentStep > 1 && currentStep < 3 && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          )}

          <View style={styles.stepIndicator}>
            {[1, 2, 3, 4].map((step) => (
              <View
                key={step}
                style={[
                  styles.stepDot,
                  step === currentStep && styles.stepDotActive,
                  step < currentStep && styles.stepDotCompleted
                ]}
              />
            ))}
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        {/* コンテンツ */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.border,
  },
  stepDotActive: {
    width: 24,
    backgroundColor: Colors.light.primary,
  },
  stepDotCompleted: {
    backgroundColor: Colors.light.primary,
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: Colors.light.shopBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  remainingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  remainingCount: {
    fontSize: 20,
    color: Colors.light.primary,
  },
  warningText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    fontStyle: 'italic',
  },
  selectionSection: {
    marginBottom: 20,
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
    marginLeft: 8,
  },
  avatarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarCard: {
    width: (width - 56) / 3,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarCardSelected: {
    borderColor: Colors.light.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  actionButtons: {
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    backgroundColor: 'white',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginLeft: 8,
  },
  comparisonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  comparisonItem: {
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginBottom: 8,
  },
  comparisonImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  placeholderBox: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.light.shopBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemCard: {
    width: (width - 56) / 3,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'white',
  },
  itemCardSelected: {
    borderColor: Colors.light.primary,
  },
  itemImage: {
    width: '100%',
    height: 100,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
    padding: 8,
    textAlign: 'center',
  },
  sizeOptions: {
    gap: 12,
  },
  sizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  sizeButtonSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.shopBackground,
  },
  sizeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  sizeLabelSelected: {
    fontWeight: '700',
    color: Colors.light.primary,
  },
  generateButton: {
    marginTop: 24,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultImage: {
    width: width - 32,
    height: (width - 32) * 1.3,
    borderRadius: 12,
  },
  resultActions: {
    gap: 12,
    marginBottom: 20,
  },
  resultButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  resultButtonPrimary: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  resultButtonTextPrimary: {
    color: 'white',
  },
  tryAgainButton: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  tryAgainText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    fontSize: 15,
    color: '#DC2626',
    lineHeight: 22,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
