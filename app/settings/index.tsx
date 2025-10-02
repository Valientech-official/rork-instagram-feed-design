import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Moon, Globe, Palette, Volume2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [darkMode, setDarkMode] = React.useState(false);
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  const settingsSections = [
    {
      title: 'アカウント',
      items: [
        { icon: '👤', label: 'プロフィール編集', route: '/profile' },
        { icon: '📧', label: 'メールアドレス', value: 'user@example.com' },
        { icon: '📱', label: '電話番号', value: '設定なし' },
      ],
    },
    {
      title: '表示設定',
      items: [
        { icon: '🌙', label: 'ダークモード', toggle: true, value: darkMode, onChange: setDarkMode },
        { icon: '🌐', label: '言語', value: '日本語' },
        { icon: '🎨', label: 'テーマカラー', value: 'デフォルト' },
        { icon: '🔊', label: 'サウンド', toggle: true, value: soundEnabled, onChange: setSoundEnabled },
      ],
    },
    {
      title: 'その他',
      items: [
        { icon: '💾', label: 'データ使用量', value: '1.2 GB' },
        { icon: '🔄', label: 'キャッシュクリア', action: () => console.log('Clear cache') },
        { icon: '📖', label: 'バージョン', value: '1.0.0' },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>設定</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.settingItem}
                onPress={() => {
                  if (item.route) {
                    router.push(item.route as any);
                  } else if (item.action) {
                    item.action();
                  }
                }}
                disabled={item.toggle}
                activeOpacity={item.toggle ? 1 : 0.7}
              >
                <View style={styles.settingLeft}>
                  <Text style={styles.settingIcon}>{item.icon}</Text>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                <View style={styles.settingRight}>
                  {item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onChange}
                      trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
                    />
                  ) : item.value ? (
                    <Text style={styles.settingValue}>{item.value}</Text>
                  ) : (
                    <ChevronRight size={20} color={Colors.light.secondaryText} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    fontSize: 16,
    color: Colors.light.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginRight: 4,
  },
});