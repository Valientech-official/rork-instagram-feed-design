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
  User,
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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';

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
}

export default function MenuDrawer({ visible, onClose }: MenuDrawerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuthStore();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const [darkMode, setDarkMode] = useState(false);
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
          id: 'profile',
          icon: User,
          title: 'プロフィール編集',
          subtitle: '@username',
          route: '/profile',
        },
        {
          id: 'email',
          icon: Mail,
          title: 'メールアドレス',
          subtitle: 'user@example.com',
        },
        {
          id: 'phone',
          icon: Phone,
          title: '電話番号',
          subtitle: '設定なし',
        },
      ],
    },
    {
      title: '表示設定',
      items: [
        {
          id: 'darkmode',
          icon: Moon,
          title: 'ダークモード',
          toggle: true,
          value: darkMode,
          onChange: setDarkMode,
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
          id: 'notification',
          icon: Bell,
          title: '通知設定',
          subtitle: 'プッシュ通知の管理',
          route: '/settings/notification',
        },
        {
          id: 'security',
          icon: Shield,
          title: 'セキュリティ',
          subtitle: 'パスワード・認証設定',
          route: '/settings/security',
        },
        {
          id: 'privacy',
          icon: Lock,
          title: 'プライバシー',
          subtitle: 'アカウント公開設定',
          route: '/settings/privacy',
        },
      ],
    },
    {
      title: 'その他',
      items: [
        {
          id: 'data',
          icon: Database,
          title: 'データ使用量',
          subtitle: '1.2 GB',
        },
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
          subtitle: '利用規約・プライバシーポリシー',
          action: () => console.log('Open terms'),
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
            await logout();
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
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' }}
              style={styles.avatar}
            />
            <View style={styles.userText}>
              <Text style={styles.userName}>ユーザー名</Text>
              <Text style={styles.userHandle}>@username</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          {menuSections.map((section, sectionIndex) => (
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
                      color={isLogout ? Colors.light.shopSale : Colors.light.icon}
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
                        trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
                      />
                    ) : !isLogout && (
                      <ChevronRight size={20} color={Colors.light.secondaryText} />
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
    backgroundColor: Colors.light.background,
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
    borderBottomColor: Colors.light.border,
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
  userText: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  userHandle: {
    fontSize: 14,
    color: Colors.light.secondaryText,
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
    color: Colors.light.secondaryText,
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
    color: Colors.light.text,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginTop: 2,
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    color: Colors.light.shopSale,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
});