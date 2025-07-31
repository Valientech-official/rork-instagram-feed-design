import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronLeft, Camera, Video, Mic, Wifi, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

export default function CreateLiveStreamScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  const handleBack = () => {
    router.back();
  };

  const handlePickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setThumbnailUri(result.assets[0].uri);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleStartLiveStream = () => {
    if (title.trim()) {
      // In a real app, this would start the actual live stream
      // For demo purposes, we'll just navigate to the live streams list
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.push('/live');
    }
  };

  const isFormValid = title.trim() !== '';

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: "Create Live Stream",
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Thumbnail Preview/Selector */}
        <TouchableOpacity style={styles.thumbnailContainer} onPress={handlePickThumbnail}>
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Camera size={48} color={Colors.light.secondaryText} />
              <Text style={styles.thumbnailText}>Tap to select a thumbnail</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Stream Title */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Stream Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter a title for your stream..."
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <Text style={styles.characterCount}>{title.length}/100</Text>
        </View>
        
        {/* Tags */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Add tags (e.g., travel, cooking)..."
              value={currentTag}
              onChangeText={setCurrentTag}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
            <TouchableOpacity 
              style={[styles.addTagButton, !currentTag.trim() && styles.addTagButtonDisabled]} 
              onPress={handleAddTag}
              disabled={!currentTag.trim()}
            >
              <Text style={styles.addTagButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  <TouchableOpacity 
                    style={styles.removeTagButton} 
                    onPress={() => handleRemoveTag(tag)}
                  >
                    <X size={12} color={Colors.light.secondaryText} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Stream Settings */}
        <View style={styles.settingsContainer}>
          <Text style={styles.settingsTitle}>Stream Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Video size={20} color={Colors.light.text} />
              <Text style={styles.settingText}>Video Quality</Text>
            </View>
            <Text style={styles.settingValue}>HD (720p)</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Mic size={20} color={Colors.light.text} />
              <Text style={styles.settingText}>Microphone</Text>
            </View>
            <Text style={styles.settingValue}>On</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Wifi size={20} color={Colors.light.text} />
              <Text style={styles.settingText}>Network</Text>
            </View>
            <Text style={styles.settingValue}>Wi-Fi</Text>
          </View>
        </View>
        
        {/* Start Stream Button */}
        <TouchableOpacity 
          style={[styles.startButton, !isFormValid && styles.startButtonDisabled]} 
          onPress={handleStartLiveStream}
          disabled={!isFormValid}
        >
          <Text style={styles.startButtonText}>Start Live Stream</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: Colors.light.shopBackground,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    textAlign: 'right',
    marginTop: 4,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
  },
  addTagButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addTagButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  addTagButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.shopBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: Colors.light.primary,
    marginRight: 4,
  },
  removeTagButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContainer: {
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
  startButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  startButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});