import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, BellOff } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';

interface NotificationPreferences {
  posts: {
    likes: boolean;
    comments: boolean;
    newFollowers: boolean;
  };
  messages: {
    messageRequests: boolean;
    directMessages: boolean;
  };
  liveVideo: {
    liveStreams: boolean;
    igtvUploads: boolean;
  };
  fromPiece: {
    productUpdates: boolean;
    newsAnnouncements: boolean;
  };
  email: {
    enabled: boolean;
    frequency: 'instant' | 'daily' | 'weekly';
  };
  sms: {
    enabled: boolean;
  };
  pauseAll: boolean;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    posts: {
      likes: true,
      comments: true,
      newFollowers: true,
    },
    messages: {
      messageRequests: true,
      directMessages: true,
    },
    liveVideo: {
      liveStreams: false,
      igtvUploads: false,
    },
    fromPiece: {
      productUpdates: true,
      newsAnnouncements: true,
    },
    email: {
      enabled: true,
      frequency: 'daily',
    },
    sms: {
      enabled: false,
    },
    pauseAll: false,
  });

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/account/settings/notifications');
      // const data = await response.json();
      // setPreferences(data.preferences);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      setSaving(true);
      // TODO: Replace with actual API call
      // await fetch('/api/account/settings/notifications', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ preferences: newPreferences }),
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (section: keyof NotificationPreferences, key: string) => {
    const newPreferences = { ...preferences };
    if (typeof newPreferences[section] === 'object' && !Array.isArray(newPreferences[section])) {
      (newPreferences[section] as any)[key] = !(newPreferences[section] as any)[key];
      updatePreferences(newPreferences);
    }
  };

  const handlePauseAll = () => {
    const newPauseAll = !preferences.pauseAll;
    const newPreferences: NotificationPreferences = {
      ...preferences,
      pauseAll: newPauseAll,
    };
    updatePreferences(newPreferences);
  };

  const handleTestNotification = () => {
    Alert.alert(
      'Test Notification',
      'A test notification has been sent to your device',
      [{ text: 'OK' }]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    headerRight: {
      width: 32,
    },
    content: {
      flex: 1,
    },
    pauseAllSection: {
      padding: 16,
      backgroundColor: colors.background,
    },
    pauseAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    pauseAllButtonActive: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    pauseAllText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    pauseAllTextActive: {
      color: colors.background,
    },
    section: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.secondaryText,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionDescription: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 8,
      marginLeft: 16,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    settingLabelDisabled: {
      color: colors.secondaryText,
    },
    testButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 16,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.background,
    },
    testButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 8,
    },
    bottomPadding: {
      height: 32,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pause All Section */}
        <View style={styles.pauseAllSection}>
          <TouchableOpacity
            style={[styles.pauseAllButton, preferences.pauseAll && styles.pauseAllButtonActive]}
            onPress={handlePauseAll}
            disabled={saving}
          >
            {preferences.pauseAll ? (
              <BellOff size={20} color={colors.background} />
            ) : (
              <Bell size={20} color={colors.icon} />
            )}
            <Text style={[styles.pauseAllText, preferences.pauseAll && styles.pauseAllTextActive]}>
              {preferences.pauseAll ? 'Notifications Paused' : 'Pause All Notifications'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts & Stories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posts & Stories</Text>
          <SettingItem
            label="Likes on your posts"
            value={preferences.posts.likes}
            onChange={() => handleToggle('posts', 'likes')}
            disabled={preferences.pauseAll || saving}
          />
          <SettingItem
            label="Comments on your posts"
            value={preferences.posts.comments}
            onChange={() => handleToggle('posts', 'comments')}
            disabled={preferences.pauseAll || saving}
          />
          <SettingItem
            label="New followers"
            value={preferences.posts.newFollowers}
            onChange={() => handleToggle('posts', 'newFollowers')}
            disabled={preferences.pauseAll || saving}
          />
        </View>

        {/* Messages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Messages</Text>
          <SettingItem
            label="Message requests"
            value={preferences.messages.messageRequests}
            onChange={() => handleToggle('messages', 'messageRequests')}
            disabled={preferences.pauseAll || saving}
          />
          <SettingItem
            label="Direct messages"
            value={preferences.messages.directMessages}
            onChange={() => handleToggle('messages', 'directMessages')}
            disabled={preferences.pauseAll || saving}
          />
        </View>

        {/* Live & Video */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live & Video</Text>
          <SettingItem
            label="Live streams you might like"
            value={preferences.liveVideo.liveStreams}
            onChange={() => handleToggle('liveVideo', 'liveStreams')}
            disabled={preferences.pauseAll || saving}
          />
          <SettingItem
            label="IGTV uploads"
            value={preferences.liveVideo.igtvUploads}
            onChange={() => handleToggle('liveVideo', 'igtvUploads')}
            disabled={preferences.pauseAll || saving}
          />
        </View>

        {/* From Pièce */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From Pièce</Text>
          <SettingItem
            label="Product updates"
            value={preferences.fromPiece.productUpdates}
            onChange={() => handleToggle('fromPiece', 'productUpdates')}
            disabled={preferences.pauseAll || saving}
          />
          <SettingItem
            label="News & announcements"
            value={preferences.fromPiece.newsAnnouncements}
            onChange={() => handleToggle('fromPiece', 'newsAnnouncements')}
            disabled={preferences.pauseAll || saving}
          />
        </View>

        {/* Email Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Notifications</Text>
          <SettingItem
            label="Enable email notifications"
            value={preferences.email.enabled}
            onChange={() => handleToggle('email', 'enabled')}
            disabled={preferences.pauseAll || saving}
          />
          <Text style={styles.sectionDescription}>
            Frequency: {preferences.email.frequency.charAt(0).toUpperCase() + preferences.email.frequency.slice(1)}
          </Text>
        </View>

        {/* SMS Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SMS Notifications</Text>
          <SettingItem
            label="Enable SMS notifications"
            value={preferences.sms.enabled}
            onChange={() => handleToggle('sms', 'enabled')}
            disabled={preferences.pauseAll || saving}
          />
          <Text style={styles.sectionDescription}>
            Standard message rates may apply
          </Text>
        </View>

        {/* Test Notification Button */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={handleTestNotification}
          disabled={saving}
        >
          <Bell size={18} color={colors.primary} />
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

interface SettingItemProps {
  label: string;
  value: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function SettingItem({ label, value, onChange, disabled }: SettingItemProps) {
  return (
    <View style={styles.settingItem}>
      <Text style={[styles.settingLabel, disabled && styles.settingLabelDisabled]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: Colors[useThemeStore.getState().theme].border, true: Colors[useThemeStore.getState().theme].primary }}
        thumbColor={Colors[useThemeStore.getState().theme].background}
      />
    </View>
  );
}

