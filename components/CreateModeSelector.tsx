import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { X, Camera, ShoppingBag, Video, Radio } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { BlurView } from 'expo-blur';

interface CreateModeSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'post' | 'listing' | 'wave' | 'live') => void;
}

export default function CreateModeSelector({ visible, onClose, onSelectMode }: CreateModeSelectorProps) {
  const modes = [
    {
      id: 'post' as const,
      icon: Camera,
      title: '投稿',
      description: '写真や動画をシェア',
      color: '#007AFF',
    },
    {
      id: 'listing' as const,
      icon: ShoppingBag,
      title: '出品',
      description: '商品を販売',
      color: '#FF9500',
    },
    {
      id: 'wave' as const,
      icon: Video,
      title: 'ウェーブ',
      description: 'ショート動画を投稿',
      color: '#FF2D55',
    },
    {
      id: 'live' as const,
      icon: Radio,
      title: 'ライブ',
      description: 'ライブ配信を開始',
      color: '#FF3B30',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />

        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>作成</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modesGrid}>
            {modes.map((mode) => {
              const IconComponent = mode.icon;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={styles.modeCard}
                  onPress={() => {
                    onSelectMode(mode.id);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: mode.color }]}>
                    <IconComponent size={32} color="white" />
                  </View>
                  <Text style={styles.modeTitle}>{mode.title}</Text>
                  <Text style={styles.modeDescription}>{mode.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.shopBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 16,
  },
  modeCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
});
