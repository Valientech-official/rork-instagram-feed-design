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
import {
  ChevronLeft,
  ChevronRight,
  User,
  Lock,
  Shield,
  Smartphone,
  Mail,
  Phone,
  Link2,
  Globe,
  Trash2,
  UserX,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/themeStore';

interface AccountSettings {
  email: string;
  phoneNumber?: string;
  twoFactorEnabled: boolean;
  language: string;
  region: string;
  connectedAccounts: {
    instagram?: boolean;
    twitter?: boolean;
    facebook?: boolean;
  };
}

interface LoginSession {
  id: string;
  deviceName: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AccountSettings>({
    email: 'user@example.com',
    phoneNumber: '+81 90-1234-5678',
    twoFactorEnabled: false,
    language: 'Japanese (日本語)',
    region: 'Japan',
    connectedAccounts: {
      instagram: true,
      twitter: false,
      facebook: false,
    },
  });
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([]);
  const [toggling2FA, setToggling2FA] = useState(false);

  useEffect(() => {
    loadAccountSettings();
    loadLoginSessions();
  }, []);

  const loadAccountSettings = async () => {
    try {
      // API call: GET /account/settings
      // const response = await fetch('/account/settings');
      // const data = await response.json();
      // setSettings(data);

      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load account settings');
    }
  };

  const loadLoginSessions = async () => {
    try {
      // API call: GET /account/sessions
      // const response = await fetch('/account/sessions');
      // const data = await response.json();
      // setLoginSessions(data);

      // Mock data
      setLoginSessions([
        {
          id: '1',
          deviceName: 'iPhone 15 Pro',
          location: 'Tokyo, Japan',
          lastActive: 'Active now',
          isCurrent: true,
        },
        {
          id: '2',
          deviceName: 'Chrome on MacBook Pro',
          location: 'Tokyo, Japan',
          lastActive: '2 hours ago',
          isCurrent: false,
        },
      ]);
    } catch (error) {
      console.error('Failed to load login sessions');
    }
  };

  const handleToggle2FA = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const action = settings.twoFactorEnabled ? 'disable' : 'enable';
    Alert.alert(
      `${action === 'enable' ? 'Enable' : 'Disable'} Two-Factor Authentication`,
      `Are you sure you want to ${action} 2FA?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'enable' ? 'Enable' : 'Disable',
          onPress: async () => {
            try {
              setToggling2FA(true);

              // API call: POST /account/2fa/enable or POST /account/2fa/disable
              // await fetch(`/account/2fa/${action}`, { method: 'POST' });

              setTimeout(() => {
                setSettings((prev) => ({
                  ...prev,
                  twoFactorEnabled: !prev.twoFactorEnabled,
                }));
                setToggling2FA(false);

                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              }, 500);
            } catch (error) {
              setToggling2FA(false);
              Alert.alert('Error', `Failed to ${action} 2FA`);
            }
          },
        },
      ]
    );
  };

  const handleDeactivateAccount = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    Alert.alert(
      'Deactivate Account',
      'Your account will be temporarily disabled. You can reactivate it by logging in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Deactivate Account', 'This feature is not yet implemented.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Please type "DELETE" to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'I understand',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Delete Account', 'This feature is not yet implemented.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
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
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
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
      color: colors.secondaryText,
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
      backgroundColor: colors.background,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
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
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    iconContainerWarning: {
      backgroundColor: '#FFF9E6',
    },
    iconContainerDanger: {
      backgroundColor: '#FFE6E6',
    },
    settingTextContainer: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 13,
      color: colors.secondaryText,
    },
    dangerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    dangerLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.warning,
      marginBottom: 2,
    },
    dangerLabelDelete: {
      color: colors.error,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <ChevronLeft size={24} color={colors.icon} />
          </TouchableOpacity>
          <Text style={styles.title}>Account Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <ChevronLeft size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={styles.title}>Account Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFILE</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/(onboarding)/profile')}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <User size={20} color={colors.primary} />
              </View>
              <Text style={styles.settingLabel}>Edit Profile</Text>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert('Change Password', 'This feature is not yet implemented.');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Lock size={20} color={colors.primary} />
              </View>
              <Text style={styles.settingLabel}>Change Password</Text>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Shield size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
                <Text style={styles.settingDescription}>
                  {settings.twoFactorEnabled ? 'Enabled' : 'Add extra security'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.twoFactorEnabled}
              onValueChange={handleToggle2FA}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
              disabled={toggling2FA}
            />
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert('Login Activity', 'Viewing active sessions...');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Smartphone size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Login Activity</Text>
                <Text style={styles.settingDescription}>
                  {loginSessions.length} active session(s)
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert('Change Email', 'This feature is not yet implemented.');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Mail size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Email</Text>
                <Text style={styles.settingDescription}>{settings.email}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert('Change Phone Number', 'This feature is not yet implemented.');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Phone size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Phone Number</Text>
                <Text style={styles.settingDescription}>
                  {settings.phoneNumber || 'Not set'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Connected Accounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONNECTED ACCOUNTS</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert('Connected Accounts', 'Manage your connected social accounts.');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Link2 size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Social Accounts</Text>
                <Text style={styles.settingDescription}>
                  {Object.values(settings.connectedAccounts).filter(Boolean).length} connected
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Language & Region */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert('Language', 'This feature is not yet implemented.');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Globe size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Language</Text>
                <Text style={styles.settingDescription}>{settings.language}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert('Region', 'This feature is not yet implemented.');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Globe size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Region</Text>
                <Text style={styles.settingDescription}>{settings.region}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Account Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT MANAGEMENT</Text>

          <TouchableOpacity
            style={styles.dangerItem}
            onPress={handleDeactivateAccount}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, styles.iconContainerWarning]}>
                <UserX size={20} color={colors.warning} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.dangerLabel}>Deactivate Account</Text>
                <Text style={styles.settingDescription}>
                  Temporarily disable your account
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerItem}
            onPress={handleDeleteAccount}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, styles.iconContainerDanger]}>
                <Trash2 size={20} color={colors.error} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.dangerLabel, styles.dangerLabelDelete]}>
                  Delete Account
                </Text>
                <Text style={styles.settingDescription}>
                  Permanently delete your account and data
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

