import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
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
}

export default function MenuDrawer({ visible, onClose }: MenuDrawerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuthStore();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      icon: User,
      title: 'プロフィール編集',
      subtitle: '@username',
      route: '/profile',
    },
    {
      id: 'settings',
      icon: Settings,
      title: '設定',
      subtitle: 'アカウント・表示設定',
      route: '/settings',
    },
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
    {
      id: 'logout',
      icon: LogOut,
      title: 'ログアウト',
      action: async () => {
        await logout();
        router.replace('/(auth)/login');
      },
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
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isLogout = item.id === 'logout';
            const isLastBeforeLogout = index === menuItems.length - 2;

            return (
              <View key={item.id}>
                <TouchableOpacity
                  style={[styles.menuItem, isLogout && styles.logoutItem]}
                  onPress={() => handleMenuPress(item)}
                  activeOpacity={0.7}
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
                  {!isLogout && (
                    <ChevronRight size={20} color={Colors.light.secondaryText} />
                  )}
                </TouchableOpacity>
                {isLastBeforeLogout && <View style={styles.separator} />}
              </View>
            );
          })}

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
  separator: {
    height: 0.5,
    backgroundColor: Colors.light.border,
    marginHorizontal: 20,
    marginVertical: 8,
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