import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch } from 'react-native';
import { Video, Users, Lock, Globe, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface LiveStartProps {
  onClose?: () => void;
}

export default function LiveStart({ onClose }: LiveStartProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'followers' | 'private'>('public');
  const [allowComments, setAllowComments] = useState(true);
  const [allowGifts, setAllowGifts] = useState(true);

  const categories = [
    'ファッション', 'メイク', 'トーク', 'ショッピング',
    'Q&A', 'チュートリアル', 'その他'
  ];

  const handleStartLive = () => {
    console.log('Starting live stream...');
  };

  return (
    <View style={styles.wrapper}>
      {onClose && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ライブ配信</Text>
          <View style={{ width: 80 }} />
        </View>
      )}
      <ScrollView style={styles.container}>
        <Text style={styles.title}>ライブ配信を開始</Text>

      <View style={styles.previewSection}>
        <View style={styles.cameraPreview}>
          <Text style={styles.previewPlaceholder}>カメラプレビュー</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>配信タイトル</Text>
        <TextInput
          style={styles.input}
          placeholder="配信のタイトルを入力"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>説明</Text>
        <TextInput
          style={styles.textArea}
          placeholder="配信の説明を入力"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>カテゴリ</Text>
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

      <View style={styles.section}>
        <Text style={styles.label}>公開設定</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setPrivacy('public')}
        >
          <View style={styles.settingLeft}>
            <Globe size={20} color={Colors.light.text} />
            <Text style={styles.settingText}>公開</Text>
          </View>
          {privacy === 'public' && (
            <View style={styles.checkmark}>
              <View style={styles.checkmarkDot} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setPrivacy('followers')}
        >
          <View style={styles.settingLeft}>
            <Users size={20} color={Colors.light.text} />
            <Text style={styles.settingText}>フォロワーのみ</Text>
          </View>
          {privacy === 'followers' && (
            <View style={styles.checkmark}>
              <View style={styles.checkmarkDot} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setPrivacy('private')}
        >
          <View style={styles.settingLeft}>
            <Lock size={20} color={Colors.light.text} />
            <Text style={styles.settingText}>非公開</Text>
          </View>
          {privacy === 'private' && (
            <View style={styles.checkmark}>
              <View style={styles.checkmarkDot} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>その他の設定</Text>

        <View style={styles.toggleItem}>
          <Text style={styles.toggleText}>コメントを許可</Text>
          <Switch
            value={allowComments}
            onValueChange={setAllowComments}
            trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
            thumbColor="white"
          />
        </View>

        <View style={styles.toggleItem}>
          <Text style={styles.toggleText}>ギフトを許可</Text>
          <Switch
            value={allowGifts}
            onValueChange={setAllowGifts}
            trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
            thumbColor="white"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={handleStartLive}>
        <Video size={20} color="white" />
        <Text style={styles.startButtonText}>配信を開始</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ライブ配信を開始すると、フォロワーに通知が送信されます。
        </Text>
      </View>
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
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 20,
  },
  previewSection: {
    marginBottom: 24,
  },
  cameraPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewPlaceholder: {
    color: '#666',
    fontSize: 16,
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  liveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
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
    minHeight: 80,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 15,
    color: Colors.light.text,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  toggleText: {
    fontSize: 15,
    color: Colors.light.text,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  infoBox: {
    backgroundColor: Colors.light.shopBackground,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 40,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
});
