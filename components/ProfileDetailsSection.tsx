import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Shirt, ShoppingBag, Instagram, Twitter, Youtube, Link } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

interface StyleItem {
  id: string;
  name: string;
}

interface FavoriteItem {
  id: string;
  name: string;
  type: 'brand' | 'store';
}

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
}

export default function ProfileDetailsSection() {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // デフォルトデータ
  const styles: StyleItem[] = [
    { id: '1', name: 'Minimalist' },
    { id: '2', name: 'Casual' },
    { id: '3', name: 'Streetwear' },
  ];

  const favorites: FavoriteItem[] = [
    { id: '1', name: 'Nike', type: 'brand' },
    { id: '2', name: 'Uniqlo', type: 'brand' },
    { id: '3', name: 'Zara', type: 'store' },
  ];

  const accounts: SocialAccount[] = [
    { id: '1', platform: 'Instagram', username: '@username' },
    { id: '2', platform: 'Twitter', username: '@username' },
    { id: '3', platform: 'YouTube', username: 'Username' },
  ];

  // カードデータ
  const cards = [
    {
      id: 0,
      icon: <Shirt size={18} color={colors.icon} />,
      label: '好み',
      items: styles.map(s => s.name),
    },
    {
      id: 1,
      icon: <ShoppingBag size={18} color={colors.icon} />,
      label: 'お気に入り',
      items: favorites.map(f => f.name),
    },
    {
      id: 2,
      icon: <Link size={18} color={colors.icon} />,
      label: 'SNS',
      items: accounts.map(a => a.platform),
    },
  ];

  // 3秒ごとに自動スワイプ（easeInOutアニメーション付き）
  useEffect(() => {
    const interval = setInterval(() => {
      // フェードアウト
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }).start(() => {
        // インデックス更新
        setCurrentIndex((prev) => (prev + 1) % cards.length);

        // フェードイン
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram':
        return <Instagram size={16} color={colors.text} />;
      case 'Twitter':
        return <Twitter size={16} color={colors.text} />;
      case 'YouTube':
        return <Youtube size={16} color={colors.text} />;
      default:
        return <Link size={16} color={colors.text} />;
    }
  };

  const styleSheet = StyleSheet.create({
    container: {
      paddingVertical: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    card: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardIcon: {
      marginRight: 8,
    },
    cardLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.secondaryText,
      marginRight: 8,
    },
    cardContent: {
      flex: 1,
    },
    cardText: {
      fontSize: 14,
      color: colors.text,
    },
    cardCounter: {
      fontSize: 12,
      color: colors.secondaryText,
      marginLeft: 8,
    },
    indicators: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
    },
    indicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    indicatorActive: {
      backgroundColor: colors.primary,
    },
  });

  const currentCard = cards[currentIndex];

  return (
    <View style={styleSheet.container}>
      {/* 現在のカード */}
      <Animated.View style={[styleSheet.card, { opacity: fadeAnim }]}>
        <View style={styleSheet.cardIcon}>{currentCard.icon}</View>
        <Text style={styleSheet.cardLabel}>{currentCard.label}:</Text>
        <View style={styleSheet.cardContent}>
          <Text style={styleSheet.cardText} numberOfLines={1}>
            {currentCard.items.join(', ')}
          </Text>
        </View>
        <Text style={styleSheet.cardCounter}>[{currentIndex + 1}/{cards.length}]</Text>
      </Animated.View>

      {/* インジケーター */}
      <View style={styleSheet.indicators}>
        {cards.map((_, index) => (
          <View
            key={index}
            style={[
              styleSheet.indicator,
              index === currentIndex && styleSheet.indicatorActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}
