/**
 * Live Stream Start Screen
 * Camera preview with stream configuration before going live
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Camera } from 'expo-camera';
import {
  ChevronLeft,
  Camera as CameraIcon,
  Sparkles,
  Globe,
  Users,
  Video,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { createLiveStream } from '@/services/liveStreamService';

export default function LiveStreamStartScreen() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'followers_only'>('public');
  const [beautyFilter, setBeautyFilter] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const micPermission = await Camera.requestMicrophonePermissionsAsync();

      setHasPermission(
        cameraPermission.status === 'granted' &&
          micPermission.status === 'granted'
      );

      if (
        cameraPermission.status !== 'granted' ||
        micPermission.status !== 'granted'
      ) {
        Alert.alert(
          'Permissions Required',
          'Camera and microphone permissions are required to go live.'
        );
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setHasPermission(false);
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const toggleCamera = () => {
    setCameraFacing(cameraFacing === 'front' ? 'back' : 'front');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleStartLive = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your stream');
      return;
    }

    if (!hasPermission) {
      Alert.alert(
        'Permissions Required',
        'Camera and microphone permissions are required'
      );
      return;
    }

    try {
      setIsCreating(true);

      const response = await createLiveStream({
        title: title.trim(),
        description: description.trim() || undefined,
        privacy,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Navigate to management screen with stream data
      router.push({
        pathname: '/live/manage/[streamId]',
        params: {
          streamId: response.stream.stream_id,
          streamKey: response.stream_key,
          rtmpUrl: response.rtmp_url,
        },
      });
    } catch (error) {
      console.error('Failed to create stream:', error);
      Alert.alert('Error', 'Failed to create live stream. Please try again.');
      setIsCreating(false);
    }
  };

  const isFormValid = title.trim() !== '' && hasPermission;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'Go Live',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container}>
        {/* Camera Preview */}
        <View style={styles.cameraContainer}>
          {hasPermission ? (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraPlaceholderText}>Camera Preview</Text>
              <Text style={styles.cameraSubtext}>
                {cameraFacing === 'front' ? 'Front Camera' : 'Back Camera'}
              </Text>
            </View>
          ) : (
            <View style={styles.cameraPlaceholder}>
              <CameraIcon size={48} color={Colors.light.secondaryText} />
              <Text style={styles.permissionText}>
                Camera permission required
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.flipCameraButton}
            onPress={toggleCamera}
          >
            <CameraIcon size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stream Configuration */}
        <View style={styles.configContainer}>
          {/* Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Stream Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="What's happening?"
              placeholderTextColor={Colors.light.secondaryText}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add more details..."
              placeholderTextColor={Colors.light.secondaryText}
              value={description}
              onChangeText={setDescription}
              maxLength={500}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>{description.length}/500</Text>
          </View>

          {/* Privacy Settings */}
          <View style={styles.settingSection}>
            <Text style={styles.label}>Privacy</Text>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                privacy === 'public' && styles.privacyOptionSelected,
              ]}
              onPress={() => {
                setPrivacy('public');
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              <Globe
                size={20}
                color={
                  privacy === 'public'
                    ? Colors.light.primary
                    : Colors.light.text
                }
              />
              <View style={styles.privacyInfo}>
                <Text
                  style={[
                    styles.privacyTitle,
                    privacy === 'public' && styles.privacyTitleSelected,
                  ]}
                >
                  Public
                </Text>
                <Text style={styles.privacyDescription}>
                  Anyone can watch your stream
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                privacy === 'followers_only' && styles.privacyOptionSelected,
              ]}
              onPress={() => {
                setPrivacy('followers_only');
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              <Users
                size={20}
                color={
                  privacy === 'followers_only'
                    ? Colors.light.primary
                    : Colors.light.text
                }
              />
              <View style={styles.privacyInfo}>
                <Text
                  style={[
                    styles.privacyTitle,
                    privacy === 'followers_only' && styles.privacyTitleSelected,
                  ]}
                >
                  Followers Only
                </Text>
                <Text style={styles.privacyDescription}>
                  Only your followers can watch
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Beauty Filter */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Sparkles size={20} color={Colors.light.text} />
              <Text style={styles.settingText}>Beauty Filter</Text>
            </View>
            <Switch
              value={beautyFilter}
              onValueChange={(value) => {
                setBeautyFilter(value);
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              trackColor={{
                false: Colors.light.border,
                true: Colors.light.primary,
              }}
              thumbColor="white"
            />
          </View>

          {/* Stream Quality Info */}
          <View style={styles.infoSection}>
            <Video size={16} color={Colors.light.secondaryText} />
            <Text style={styles.infoText}>
              Streaming in HD quality (720p). Good internet connection
              recommended.
            </Text>
          </View>
        </View>

        {/* Start Live Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            (!isFormValid || isCreating) && styles.startButtonDisabled,
          ]}
          onPress={handleStartLive}
          disabled={!isFormValid || isCreating}
        >
          <Text style={styles.startButtonText}>
            {isCreating ? 'Starting...' : 'Start Live Stream'}
          </Text>
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
  backButton: {
    padding: 8,
  },
  cameraContainer: {
    width: '100%',
    height: 280,
    backgroundColor: 'black',
    position: 'relative',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  cameraPlaceholderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  permissionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 12,
  },
  flipCameraButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  configContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
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
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    textAlign: 'right',
    marginTop: 4,
  },
  settingSection: {
    marginBottom: 20,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    marginTop: 8,
    gap: 12,
  },
  privacyOptionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
  },
  privacyInfo: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  privacyTitleSelected: {
    color: Colors.light.primary,
  },
  privacyDescription: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.cardBackground,
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.secondaryText,
    lineHeight: 18,
  },
  startButton: {
    backgroundColor: Colors.light.error,
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
