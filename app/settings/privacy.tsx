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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Lock, Eye, MessageCircle, Tag, Activity, CheckCheck, Share2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface PrivacySettings {
  accountPrivate: boolean;
  storyPrivacy: 'everyone' | 'followers' | 'close_friends';
  commentsControl: 'everyone' | 'followers' | 'off';
  tagApproval: boolean;
  activityStatus: boolean;
  readReceipts: boolean;
  shareSettings: 'everyone' | 'followers' | 'off';
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    accountPrivate: false,
    storyPrivacy: 'everyone',
    commentsControl: 'everyone',
    tagApproval: false,
    activityStatus: true,
    readReceipts: true,
    shareSettings: 'everyone',
  });

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      // API call: GET /account/settings/privacy
      // const response = await fetch('/account/settings/privacy');
      // const data = await response.json();
      // setSettings(data);

      // Mock data for now
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load privacy settings');
    }
  };

  const updateSetting = async <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      setSaving(true);
      // API call: PUT /account/settings/privacy
      // await fetch('/account/settings/privacy', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newSettings),
      // });

      setTimeout(() => {
        setSaving(false);
      }, 300);
    } catch (error) {
      setSaving(false);
      Alert.alert('Error', 'Failed to update privacy settings');
      // Revert on error
      setSettings(settings);
    }
  };

  const showOptionSelector = (
    title: string,
    options: Array<{ label: string; value: string }>,
    currentValue: string,
    onSelect: (value: string) => void
  ) => {
    Alert.alert(
      title,
      undefined,
      [
        ...options.map(option => ({
          text: option.label,
          onPress: () => onSelect(option.value),
          style: option.value === currentValue ? 'default' : 'cancel',
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <ChevronLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Privacy</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <ChevronLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Account Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT PRIVACY</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Lock size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Private Account</Text>
                <Text style={styles.settingDescription}>
                  Only followers can see your posts
                </Text>
              </View>
            </View>
            <Switch
              value={settings.accountPrivate}
              onValueChange={(value) => updateSetting('accountPrivate', value)}
              trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
              thumbColor="white"
              disabled={saving}
            />
          </View>
        </View>

        {/* Story Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STORY PRIVACY</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() =>
              showOptionSelector(
                'Who can see your stories?',
                [
                  { label: 'Everyone', value: 'everyone' },
                  { label: 'Followers Only', value: 'followers' },
                  { label: 'Close Friends', value: 'close_friends' },
                ],
                settings.storyPrivacy,
                (value) => updateSetting('storyPrivacy', value as PrivacySettings['storyPrivacy'])
              )
            }
            disabled={saving}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Eye size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Story Visibility</Text>
                <Text style={styles.settingDescription}>
                  {settings.storyPrivacy === 'everyone'
                    ? 'Everyone'
                    : settings.storyPrivacy === 'followers'
                    ? 'Followers Only'
                    : 'Close Friends'}
                </Text>
              </View>
            </View>
            <Text style={styles.valueText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Interactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTERACTIONS</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() =>
              showOptionSelector(
                'Who can comment on your posts?',
                [
                  { label: 'Everyone', value: 'everyone' },
                  { label: 'Followers Only', value: 'followers' },
                  { label: 'Turn Off Comments', value: 'off' },
                ],
                settings.commentsControl,
                (value) => updateSetting('commentsControl', value as PrivacySettings['commentsControl'])
              )
            }
            disabled={saving}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <MessageCircle size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Comment Controls</Text>
                <Text style={styles.settingDescription}>
                  {settings.commentsControl === 'everyone'
                    ? 'Everyone'
                    : settings.commentsControl === 'followers'
                    ? 'Followers Only'
                    : 'Comments Off'}
                </Text>
              </View>
            </View>
            <Text style={styles.valueText}>Change</Text>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Tag size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Tag Approval</Text>
                <Text style={styles.settingDescription}>
                  Approve tags before they appear
                </Text>
              </View>
            </View>
            <Switch
              value={settings.tagApproval}
              onValueChange={(value) => updateSetting('tagApproval', value)}
              trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
              thumbColor="white"
              disabled={saving}
            />
          </View>
        </View>

        {/* Activity Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIVITY STATUS</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Activity size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Show Activity Status</Text>
                <Text style={styles.settingDescription}>
                  Let others see when you're active
                </Text>
              </View>
            </View>
            <Switch
              value={settings.activityStatus}
              onValueChange={(value) => updateSetting('activityStatus', value)}
              trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
              thumbColor="white"
              disabled={saving}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <CheckCheck size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Read Receipts</Text>
                <Text style={styles.settingDescription}>
                  Show when you've read messages
                </Text>
              </View>
            </View>
            <Switch
              value={settings.readReceipts}
              onValueChange={(value) => updateSetting('readReceipts', value)}
              trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
              thumbColor="white"
              disabled={saving}
            />
          </View>
        </View>

        {/* Sharing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SHARING</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() =>
              showOptionSelector(
                'Who can share your content?',
                [
                  { label: 'Everyone', value: 'everyone' },
                  { label: 'Followers Only', value: 'followers' },
                  { label: 'Turn Off Sharing', value: 'off' },
                ],
                settings.shareSettings,
                (value) => updateSetting('shareSettings', value as PrivacySettings['shareSettings'])
              )
            }
            disabled={saving}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Share2 size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Share Settings</Text>
                <Text style={styles.settingDescription}>
                  {settings.shareSettings === 'everyone'
                    ? 'Everyone'
                    : settings.shareSettings === 'followers'
                    ? 'Followers Only'
                    : 'Sharing Off'}
                </Text>
              </View>
            </View>
            <Text style={styles.valueText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MANAGE</Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/settings/blocked')}
          >
            <Text style={styles.actionLabel}>Blocked Accounts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/settings/muted')}
          >
            <Text style={styles.actionLabel}>Muted Accounts</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
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
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginLeft: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  valueText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  actionLabel: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '500',
  },
});
