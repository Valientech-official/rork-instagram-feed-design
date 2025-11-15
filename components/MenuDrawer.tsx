import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
  Switch,
} from 'react-native';
import {
  Settings,
  Bell,
  Shield,
  Lock,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  X,
  Moon,
  Globe,
  Volume2,
  Mail,
  Phone,
  Database,
  UserCog,
  UserCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;

interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  icon: any;
  title: string;
  subtitle?: string;
  route?: string;
  action?: () => void;
  toggle?: boolean;
  value?: any;
  onChange?: (value: any) => void;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
  adminOnly?: boolean; // 管理者のみ表示
}

export default function MenuDrawer({ visible, onClose }: MenuDrawerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const colors = Colors[theme];
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const menuSections: MenuSection[] = [
    {
      title: 'アカウント',
      items: [
        {
          id: 'account',
          icon: Settings,
          title: 'アカウント設定',
          subtitle: user?.handle ? `@${user.handle}` : user?.username ? `@${user.username}` : '@username',
          route: '/settings/account',
        },
      ],
    },
    {
      title: '管理',
      items: [
        {
          id: 'admin-panel',
          icon: UserCog,
          title: '管理者パネル',
          subtitle: 'ユーザー管理・モデレーション',
          route: '/admin',
        },
      ],
      adminOnly: true, // 管理者のみ表示
    },
    {
      title: '表示設定',
      items: [
        {
          id: 'darkmode',
          icon: Moon,
          title: 'ダークモード',
          toggle: true,
          value: theme === 'dark',
          onChange: toggleTheme,
        },
        {
          id: 'language',
          icon: Globe,
          title: '言語',
          subtitle: '日本語',
        },
        {
          id: 'sound',
          icon: Volume2,
          title: 'サウンド',
          toggle: true,
          value: soundEnabled,
          onChange: setSoundEnabled,
        },
      ],
    },
    {
      title: 'プライバシー・セキュリティ',
      items: [
        {
          id: 'notifications',
          icon: Bell,
          title: '通知設定',
          subtitle: 'プッシュ通知の管理',
          route: '/settings/notifications',
        },
        {
          id: 'privacy',
          icon: Lock,
          title: 'プライバシー',
          subtitle: 'アカウント公開設定',
          route: '/settings/privacy',
        },
        {
          id: 'blocked',
          icon: Shield,
          title: 'ブロック済みアカウント',
          subtitle: 'ブロックしたユーザー管理',
          route: '/settings/blocked',
        },
        {
          id: 'muted',
          icon: Volume2,
          title: 'ミュート済みアカウント',
          subtitle: 'ミュートしたユーザー管理',
          route: '/settings/muted',
        },
      ],
    },
    {
      title: 'サポート & 法的情報',
      items: [
        {
          id: 'help',
          icon: HelpCircle,
          title: 'ヘルプ',
          subtitle: 'よくある質問・お問い合わせ',
          route: '/settings/help',
        },
        {
          id: 'terms',
          icon: FileText,
          title: '利用規約',
          route: '/settings/terms',
        },
        {
          id: 'privacy-policy',
          icon: Lock,
          title: 'プライバシーポリシー',
          route: '/settings/privacy-policy',
        },
        {
          id: 'data',
          icon: Database,
          title: 'データ使用量',
          subtitle: '1.2 GB',
        },
      ],
    },
    {
      items: [
        {
          id: 'logout',
          icon: LogOut,
          title: 'ログアウト',
          action: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ],
    },
  ];

  const handleMenuPress = (item: MenuItem) => {
    onClose();
    setTimeout(() => {
      if (item.route) {
        router.push(item.route as any);
      } else if (item.action) {
        item.action();
      }
    }, 300);
  };

  const styles = StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawer: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: DRAWER_WIDTH,
      backgroundColor: colors.background,
      shadowColor: '#000',
      shadowOffset: {
        width: 2,
        height: 0,
      },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    avatarPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.shopBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    userText: {
      marginLeft: 12,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    userHandle: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    closeButton: {
      padding: 8,
    },
    menuContainer: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.secondaryText,
      marginLeft: 20,
      marginTop: 20,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    sectionSeparator: {
      height: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    menuTextContainer: {
      flex: 1,
      marginLeft: 16,
    },
    menuTitle: {
      fontSize: 16,
      color: colors.text,
    },
    menuSubtitle: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 2,
    },
    logoutItem: {
      marginTop: 8,
    },
    logoutText: {
      color: colors.shopSale,
    },
    footer: {
      padding: 20,
      alignItems: 'center',
    },
    version: {
      fontSize: 12,
      color: colors.secondaryText,
    },
  });

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents={visible ? 'auto' : 'none'}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX }],
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserCircle size={50} color={colors.icon} />
              </View>
            )}
            <View style={styles.userText}>
              <Text style={styles.userName}>
                {user?.name || user?.username || 'ユーザー名'}
              </Text>
              <Text style={styles.userHandle}>
                @{user?.handle || user?.username || 'username'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          {menuSections
            .filter(section => {
              // 開発中: 全員に管理者メニューを表示（テスト用）
              // 本番: user?.accountType === 'admin' の場合のみ表示
              // if (section.adminOnly && user?.accountType !== 'admin') {
              //   return false;
              // }
              return true; // 開発中は全セクション表示
            })
            .map((section, sectionIndex) => (
            <View key={sectionIndex}>
              {section.title && (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isLogout = item.id === 'logout';

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.menuItem, isLogout && styles.logoutItem]}
                    onPress={() => !item.toggle && handleMenuPress(item)}
                    activeOpacity={item.toggle ? 1 : 0.7}
                    disabled={item.toggle}
                  >
                    <Icon
                      size={24}
                      color={isLogout ? colors.shopSale : colors.icon}
                    />
                    <View style={styles.menuTextContainer}>
                      <Text style={[styles.menuTitle, isLogout && styles.logoutText]}>
                        {item.title}
                      </Text>
                      {item.subtitle && (
                        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                      )}
                    </View>
                    {item.toggle ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onChange}
                        trackColor={{ false: colors.border, true: colors.primary }}
                      />
                    ) : !isLogout && (
                      <ChevronRight size={20} color={colors.secondaryText} />
                    )}
                  </TouchableOpacity>
                );
              })}
              {sectionIndex < menuSections.length - 1 && (
                <View style={styles.sectionSeparator} />
              )}
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}