import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Video, Sparkles, ChevronRight, MapPin, Hash, AtSign, Globe, BarChart3 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import AIDressUpModal from './AIDressUpModal';
import { dressUpModes } from '@/mocks/dressUpItems';

const { width } = Dimensions.get('window');

type Step = 'select' | 'edit' | 'caption';

interface SelectedMedia {
  uri: string;
  type: 'image' | 'video';
}

export default function PostCreationFlow() {
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);

  // 編集状態
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [textOverlay, setTextOverlay] = useState('');

  // キャプション状態
  const [caption, setCaption] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);

  const filters = [
    { id: 'normal', name: '通常' },
    { id: 'bright', name: '明るく' },
    { id: 'vintage', name: 'ヴィンテージ' },
    { id: 'bw', name: '白黒' },
    { id: 'warm', name: '暖色' },
    { id: 'cool', name: '寒色' },
  ];

  const suggestedHashtags = [
    '#アメリカ村心斎橋',
    '#アメリカ村古着',
    '#大阪ファッション',
    '#今日のコーデ',
    '#古着コーデ',
  ];

  const handleTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedMedia({
        uri: result.assets[0].uri,
        type: 'image',
      });
      setCurrentStep('edit');
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedMedia({
        uri: result.assets[0].uri,
        type: 'image',
      });
      setCurrentStep('edit');
    }
  };

  const handlePickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedMedia({
        uri: result.assets[0].uri,
        type: 'video',
      });
      setCurrentStep('edit');
    }
  };

  const handleAddHashtag = (tag: string) => {
    if (!hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  // ステップ1: 撮影・選択画面
  const renderSelectStep = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.stepTitle}>コンテンツを選択</Text>

      <View style={styles.optionsGrid}>
        <TouchableOpacity style={styles.optionCard} onPress={handleTakePhoto}>
          <View style={styles.optionIcon}>
            <Camera size={40} color={Colors.light.primary} />
          </View>
          <Text style={styles.optionTitle}>カメラ撮影</Text>
          <Text style={styles.optionDescription}>写真を撮影</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={() => setShowAIModal(true)}>
          <View style={styles.optionIcon}>
            <Sparkles size={40} color={Colors.light.primary} />
          </View>
          <Text style={styles.optionTitle}>AI着せ替え</Text>
          <Text style={styles.optionDescription}>AIで着せ替え</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={handlePickImage}>
          <View style={styles.optionIcon}>
            <ImageIcon size={40} color={Colors.light.primary} />
          </View>
          <Text style={styles.optionTitle}>ギャラリー</Text>
          <Text style={styles.optionDescription}>写真を選択</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={handlePickVideo}>
          <View style={styles.optionIcon}>
            <Video size={40} color={Colors.light.primary} />
          </View>
          <Text style={styles.optionTitle}>動画</Text>
          <Text style={styles.optionDescription}>動画を選択</Text>
        </TouchableOpacity>
      </View>

      <AIDressUpModal
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
      />
    </ScrollView>
  );

  // ステップ2: 編集ページ
  const renderEditStep = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.stepTitle}>編集</Text>

      {selectedMedia && (
        <Image
          source={{ uri: selectedMedia.uri }}
          style={styles.previewImage}
          contentFit="cover"
        />
      )}

      {/* フィルター */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>フィルター</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtersRow}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.id && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.filterTextActive
                ]}>
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* テキスト追加 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>テキスト追加</Text>
        <TextInput
          style={styles.textInput}
          placeholder="画像に表示するテキスト"
          value={textOverlay}
          onChangeText={setTextOverlay}
        />
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => setCurrentStep('caption')}
      >
        <Text style={styles.nextButtonText}>次へ</Text>
        <ChevronRight size={20} color="white" />
      </TouchableOpacity>
    </ScrollView>
  );

  // ステップ3: キャプション入力
  const renderCaptionStep = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.stepTitle}>キャプション入力</Text>

      {/* プレビュー */}
      {selectedMedia && (
        <Image
          source={{ uri: selectedMedia.uri }}
          style={styles.thumbnailImage}
          contentFit="cover"
        />
      )}

      {/* キャプション */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>説明を入力</Text>
        <TextInput
          style={styles.captionInput}
          placeholder="キャプションを入力..."
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Rooms選択 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rooms選択</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.roomsRow}>
            <TouchableOpacity
              style={[
                styles.roomChip,
                selectedRoom === null && styles.roomChipActive
              ]}
              onPress={() => setSelectedRoom(null)}
            >
              <Text style={[
                styles.roomChipText,
                selectedRoom === null && styles.roomChipTextActive
              ]}>
                なし
              </Text>
            </TouchableOpacity>

            {dressUpModes.slice(0, 6).map((room) => (
              <TouchableOpacity
                key={room.id}
                style={[
                  styles.roomChip,
                  selectedRoom === room.id && styles.roomChipActive
                ]}
                onPress={() => setSelectedRoom(room.id)}
              >
                <Text style={[
                  styles.roomChipText,
                  selectedRoom === room.id && styles.roomChipTextActive
                ]}>
                  {room.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* ハッシュタグ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Hash size={18} color={Colors.light.text} />
          <Text style={styles.sectionTitle}>ハッシュタグ</Text>
        </View>

        <View style={styles.hashtagsContainer}>
          {hashtags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.hashtagChip}
              onPress={() => handleRemoveHashtag(tag)}
            >
              <Text style={styles.hashtagText}>{tag}</Text>
              <Text style={styles.hashtagRemove}>×</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.suggestionLabel}>おすすめタグ</Text>
        <View style={styles.suggestedHashtags}>
          {suggestedHashtags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.suggestedTag}
              onPress={() => handleAddHashtag(tag)}
            >
              <Text style={styles.suggestedTagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* タグ付け */}
      <TouchableOpacity style={styles.actionItem}>
        <AtSign size={20} color={Colors.light.text} />
        <Text style={styles.actionText}>ユーザーをタグ付け</Text>
        <ChevronRight size={20} color={Colors.light.secondaryText} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionItem}>
        <Globe size={20} color={Colors.light.text} />
        <Text style={styles.actionText}>Webサイト / SNSリンク</Text>
        <ChevronRight size={20} color={Colors.light.secondaryText} />
      </TouchableOpacity>

      {/* 位置情報 */}
      <TouchableOpacity style={styles.actionItem}>
        <MapPin size={20} color={Colors.light.text} />
        <Text style={styles.actionText}>位置情報を追加</Text>
        <ChevronRight size={20} color={Colors.light.secondaryText} />
      </TouchableOpacity>

      {/* アンケート */}
      <TouchableOpacity style={styles.actionItem}>
        <BarChart3 size={20} color={Colors.light.text} />
        <Text style={styles.actionText}>アンケートを追加</Text>
        <ChevronRight size={20} color={Colors.light.secondaryText} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.publishButton}>
        <Text style={styles.publishButtonText}>投稿する</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.wrapper}>
      {currentStep === 'select' && renderSelectStep()}
      {currentStep === 'edit' && renderEditStep()}
      {currentStep === 'caption' && renderCaptionStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  optionCard: {
    width: (width - 48) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  optionIcon: {
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
  thumbnailImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
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
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  captionInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  roomsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roomChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  roomChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  roomChipText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  roomChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  hashtagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hashtagText: {
    fontSize: 14,
    color: 'white',
    marginRight: 6,
  },
  hashtagRemove: {
    fontSize: 18,
    color: 'white',
    fontWeight: '700',
  },
  suggestionLabel: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginBottom: 8,
  },
  suggestedHashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  suggestedTagText: {
    fontSize: 13,
    color: Colors.light.text,
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginRight: 8,
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
