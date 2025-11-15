import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, Camera, User, AtSign, FileText } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';

interface ProfileData {
  name: string;
  username: string;
  bio: string;
  profileImage?: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const colors = Colors[theme];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    username: '',
    bio: '',
    profileImage: undefined,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // API call: GET /profile/me
      // const response = await fetch('/profile/me');
      // const data = await response.json();

      // Mock data from user store
      setProfile({
        name: user?.name || '',
        username: user?.handle || user?.username || '',
        bio: '自己紹介文をここに入力してください',
        profileImage: user?.avatar,
      });

      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      setLoading(false);
      Alert.alert('エラー', 'プロフィール情報の読み込みに失敗しました');
    }
  };

  const handlePickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('権限が必要です', '写真ライブラリへのアクセス許可が必要です');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfile((prev) => ({
          ...prev,
          profileImage: result.assets[0].uri,
        }));

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      Alert.alert('エラー', '画像の選択に失敗しました');
    }
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      Alert.alert('入力エラー', '名前を入力してください');
      return;
    }

    if (!profile.username.trim()) {
      Alert.alert('入力エラー', 'ユーザー名を入力してください');
      return;
    }

    // Username validation (alphanumeric and underscore only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(profile.username)) {
      Alert.alert('入力エラー', 'ユーザー名は英数字とアンダースコアのみ使用できます');
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setSaving(true);

      // API call: PUT /profile/me
      // const formData = new FormData();
      // formData.append('name', profile.name);
      // formData.append('username', profile.username);
      // formData.append('bio', profile.bio);
      // if (profile.profileImage) {
      //   formData.append('profile_image', {
      //     uri: profile.profileImage,
      //     type: 'image/jpeg',
      //     name: 'profile.jpg',
      //   });
      // }
      // const response = await fetch('/profile/me', {
      //   method: 'PUT',
      //   body: formData,
      // });

      setTimeout(() => {
        setSaving(false);

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Alert.alert('保存完了', 'プロフィールを更新しました', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }, 800);
    } catch (error) {
      setSaving(false);
      Alert.alert('エラー', 'プロフィールの保存に失敗しました');
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    saveButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: 'white',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    profileImageSection: {
      alignItems: 'center',
      paddingVertical: 32,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    profileImageContainer: {
      position: 'relative',
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    profileImagePlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.shopBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
    },
    cameraButton: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.background,
    },
    changePhotoText: {
      marginTop: 12,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.secondaryText,
      marginLeft: 16,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    inputContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    inputLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    iconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    labelText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    input: {
      fontSize: 16,
      color: colors.text,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.shopBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      fontSize: 16,
      color: colors.text,
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: colors.shopBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    characterCount: {
      fontSize: 12,
      color: colors.secondaryText,
      textAlign: 'right',
      marginTop: 4,
    },
    helperText: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 4,
    },
  });

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={colors.icon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>プロフィール編集</Text>
            <View style={{ width: 80 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.icon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>プロフィール編集</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>保存</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Image */}
          <View style={styles.profileImageSection}>
            <View style={styles.profileImageContainer}>
              {profile.profileImage ? (
                <Image
                  source={{ uri: profile.profileImage }}
                  style={styles.profileImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <User size={40} color={colors.icon} />
                </View>
              )}
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handlePickImage}
              >
                <Camera size={18} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handlePickImage}>
              <Text style={styles.changePhotoText}>写真を変更</Text>
            </TouchableOpacity>
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本情報</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputLabel}>
                <View style={styles.iconContainer}>
                  <User size={14} color={colors.primary} />
                </View>
                <Text style={styles.labelText}>名前</Text>
              </View>
              <TextInput
                style={styles.input}
                value={profile.name}
                onChangeText={(text) =>
                  setProfile((prev) => ({ ...prev, name: text }))
                }
                placeholder="山田 太郎"
                placeholderTextColor={colors.secondaryText}
                maxLength={50}
              />
              <Text style={styles.helperText}>
                表示名として使用されます
              </Text>
            </View>

            {/* Username */}
            <View style={styles.inputContainer}>
              <View style={styles.inputLabel}>
                <View style={styles.iconContainer}>
                  <AtSign size={14} color={colors.primary} />
                </View>
                <Text style={styles.labelText}>ユーザー名</Text>
              </View>
              <TextInput
                style={styles.input}
                value={profile.username}
                onChangeText={(text) =>
                  setProfile((prev) => ({
                    ...prev,
                    username: text.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                  }))
                }
                placeholder="yamada_taro"
                placeholderTextColor={colors.secondaryText}
                maxLength={30}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.helperText}>
                英数字とアンダースコアのみ使用可能
              </Text>
            </View>
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>自己紹介</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputLabel}>
                <View style={styles.iconContainer}>
                  <FileText size={14} color={colors.primary} />
                </View>
                <Text style={styles.labelText}>自己紹介</Text>
              </View>
              <TextInput
                style={styles.textArea}
                value={profile.bio}
                onChangeText={(text) =>
                  setProfile((prev) => ({ ...prev, bio: text }))
                }
                placeholder="あなたについて教えてください"
                placeholderTextColor={colors.secondaryText}
                maxLength={150}
                multiline
                numberOfLines={4}
              />
              <Text style={styles.characterCount}>
                {profile.bio.length} / 150
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
