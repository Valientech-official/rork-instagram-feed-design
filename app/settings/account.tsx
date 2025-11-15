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
import { useRouter, Stack } from 'expo-router';
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
      Alert.alert('エラー', 'アカウント設定の読み込みに失敗しました');
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
      `二段階認証を${action === 'enable' ? '有効化' : '無効化'}`,
      `二段階認証を${action === 'enable' ? '有効' : '無効'}にしますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: action === 'enable' ? '有効化' : '無効化',
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
              Alert.alert('エラー', `二段階認証の${action === 'enable' ? '有効化' : '無効化'}に失敗しました`);
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
      'アカウントを無効化',
      'アカウントが一時的に無効になります。再度ログインすることで再有効化できます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '無効化',
          style: 'destructive',
          onPress: () => {
            Alert.alert('アカウントを無効化', 'この機能はまだ実装されていません。');
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
      'アカウントを削除',
      'この操作は取り消せません。すべてのデータが完全に削除されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '本当によろしいですか？',
              'アカウント削除を確定するには「削除」と入力してください。',
              [
                { text: 'キャンセル', style: 'cancel' },
                {
                  text: '理解しました',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('アカウントを削除', 'この機能はまだ実装されていません。');
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
    backButton: {
      padding: 4,
    },
    headerTitle: {
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
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={colors.icon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>アカウント設定</Text>
            <View style={{ width: 32 }} />
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
          <Text style={styles.headerTitle}>アカウント設定</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プロフィール</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/settings/edit-profile')}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <User size={20} color={colors.primary} />
              </View>
              <Text style={styles.settingLabel}>プロフィール編集</Text>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert('パスワード変更', 'この機能はまだ実装されていません。');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Lock size={20} color={colors.primary} />
              </View>
              <Text style={styles.settingLabel}>パスワード変更</Text>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>セキュリティ</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Shield size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>二段階認証</Text>
                <Text style={styles.settingDescription}>
                  {settings.twoFactorEnabled ? '有効' : 'セキュリティを強化'}
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
              Alert.alert('ログイン履歴', 'アクティブなセッションを表示中...');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Smartphone size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>ログイン履歴</Text>
                <Text style={styles.settingDescription}>
                  {loginSessions.length} 件のアクティブセッション
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>連絡先情報</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert('メールアドレス変更', 'この機能はまだ実装されていません。');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Mail size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>メールアドレス</Text>
                <Text style={styles.settingDescription}>{settings.email}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert('電話番号変更', 'この機能はまだ実装されていません。');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Phone size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>電話番号</Text>
                <Text style={styles.settingDescription}>
                  {settings.phoneNumber || '未設定'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Connected Accounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>連携アカウント</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert('連携アカウント', '連携されたソーシャルアカウントを管理します。');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Link2 size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>ソーシャルアカウント</Text>
                <Text style={styles.settingDescription}>
                  {Object.values(settings.connectedAccounts).filter(Boolean).length} 件連携中
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Language & Region */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設定</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert('言語', 'この機能はまだ実装されていません。');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Globe size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>言語</Text>
                <Text style={styles.settingDescription}>{settings.language}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert('地域', 'この機能はまだ実装されていません。');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Globe size={20} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>地域</Text>
                <Text style={styles.settingDescription}>{settings.region}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Account Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント管理</Text>

          <TouchableOpacity
            style={styles.dangerItem}
            onPress={handleDeactivateAccount}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, styles.iconContainerWarning]}>
                <UserX size={20} color={colors.warning} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.dangerLabel}>アカウントを無効化</Text>
                <Text style={styles.settingDescription}>
                  アカウントを一時的に無効にする
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
                  アカウントを削除
                </Text>
                <Text style={styles.settingDescription}>
                  アカウントとデータを完全に削除する
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </>
  );
}

