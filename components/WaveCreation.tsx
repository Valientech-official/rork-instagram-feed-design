import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Camera, Music, Sparkles, Timer, X, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function WaveCreation() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [step, setStep] = useState<'record' | 'edit' | 'publish'>('record');
  const [caption, setCaption] = useState('');
  const [selectedMusic, setSelectedMusic] = useState('');
  const [selectedEffect, setSelectedEffect] = useState('');

  const maxDuration = 60;
  const effects = ['オリジナル', 'ビューティー', 'レトロ', 'ビビッド', 'モノクロ'];
  const musicTracks = ['トレンド 1', 'トレンド 2', 'ポップ', 'チル', 'アップビート'];

  const handleRecord = () => {
    setIsRecording(!isRecording);
  };

  const handleNextStep = () => {
    if (step === 'record') {
      setStep('edit');
    } else if (step === 'edit') {
      setStep('publish');
    }
  };

  const handlePublish = () => {
    console.log('Publishing wave...');
  };

  return (
    <View style={styles.container}>
      {step === 'record' && (
        <View style={styles.recordContainer}>
          <View style={styles.cameraPreview}>
            <Text style={styles.cameraPlaceholder}>カメラプレビュー</Text>

            <View style={styles.topControls}>
              <TouchableOpacity style={styles.controlButton}>
                <X size={24} color="white" />
              </TouchableOpacity>
              <View style={styles.timerDisplay}>
                <Timer size={16} color="white" />
                <Text style={styles.timerText}>
                  {recordedDuration}s / {maxDuration}s
                </Text>
              </View>
              <TouchableOpacity style={styles.controlButton}>
                <Sparkles size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.sideControls}>
              <TouchableOpacity style={styles.sideButton}>
                <Music size={28} color="white" />
                <Text style={styles.sideButtonLabel}>音楽</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sideButton}>
                <Sparkles size={28} color="white" />
                <Text style={styles.sideButtonLabel}>エフェクト</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomControls}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(recordedDuration / maxDuration) * 100}%` }
                  ]}
                />
              </View>

              <TouchableOpacity
                style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                onPress={handleRecord}
              >
                {isRecording ? (
                  <View style={styles.stopIcon} />
                ) : (
                  <View style={styles.recordIcon} />
                )}
              </TouchableOpacity>

              {recordedDuration > 0 && (
                <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
                  <Check size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {step === 'edit' && (
        <ScrollView style={styles.editContainer}>
          <Text style={styles.sectionTitle}>エフェクトを選択</Text>
          <View style={styles.optionsRow}>
            {effects.map((effect) => (
              <TouchableOpacity
                key={effect}
                style={[
                  styles.optionChip,
                  selectedEffect === effect && styles.optionChipActive
                ]}
                onPress={() => setSelectedEffect(effect)}
              >
                <Text style={[
                  styles.optionChipText,
                  selectedEffect === effect && styles.optionChipTextActive
                ]}>
                  {effect}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>音楽を選択</Text>
          <View style={styles.optionsRow}>
            {musicTracks.map((track) => (
              <TouchableOpacity
                key={track}
                style={[
                  styles.optionChip,
                  selectedMusic === track && styles.optionChipActive
                ]}
                onPress={() => setSelectedMusic(track)}
              >
                <Text style={[
                  styles.optionChipText,
                  selectedMusic === track && styles.optionChipTextActive
                ]}>
                  {track}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleNextStep}>
            <Text style={styles.primaryButtonText}>次へ</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === 'publish' && (
        <ScrollView style={styles.publishContainer}>
          <Text style={styles.title}>ウェーブを投稿</Text>

          <View style={styles.section}>
            <Text style={styles.label}>キャプション</Text>
            <TextInput
              style={styles.textArea}
              placeholder="キャプションを入力"
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>公開設定</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity style={[styles.optionChip, styles.optionChipActive]}>
                <Text style={[styles.optionChipText, styles.optionChipTextActive]}>
                  公開
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionChip}>
                <Text style={styles.optionChipText}>フォロワーのみ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionChip}>
                <Text style={styles.optionChipText}>非公開</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handlePublish}>
            <Text style={styles.primaryButtonText}>投稿する</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  recordContainer: {
    flex: 1,
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  cameraPlaceholder: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -12 }],
    color: '#666',
    fontSize: 16,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  timerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  sideControls: {
    position: 'absolute',
    right: 16,
    top: '40%',
    gap: 24,
  },
  sideButton: {
    alignItems: 'center',
  },
  sideButtonLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  bottomControls: {
    alignItems: 'center',
    paddingBottom: 40,
    gap: 16,
  },
  progressBar: {
    width: '90%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  recordButtonActive: {
    borderColor: '#FF3B30',
  },
  recordIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
  },
  stopIcon: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  nextButton: {
    position: 'absolute',
    right: 40,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editContainer: {
    flex: 1,
    padding: 16,
  },
  publishContainer: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  optionChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  optionChipText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  optionChipTextActive: {
    color: 'white',
    fontWeight: '600',
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
  primaryButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
