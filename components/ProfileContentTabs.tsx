import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { Grid3x3, Users } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';
import ProfileRoomsSection from '@/components/ProfileRoomsSection';
import ProfilePostsGrid from '@/components/ProfilePostsGrid';
import { profilePosts } from '@/mocks/profilePosts';

const { width } = Dimensions.get('window');

type TabType = 'posts' | 'rooms';

export default function ProfileContentTabs() {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [nextTab, setNextTab] = useState<TabType | null>(null);

  const postsOpacity = useRef(new Animated.Value(1)).current;
  const postsTranslate = useRef(new Animated.Value(0)).current;
  const roomsOpacity = useRef(new Animated.Value(0)).current;
  const roomsTranslate = useRef(new Animated.Value(width)).current;

  // タブ下線のアニメーション
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;

  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;

    const isMovingRight = newTab === 'rooms';

    if (isMovingRight) {
      // 投稿 → ルーム
      Animated.parallel([
        // 投稿を左に移動しながらフェードアウト
        Animated.timing(postsOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(postsTranslate, {
          toValue: -width * 0.3,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        // ルームを右から登場しながらフェードイン
        Animated.timing(roomsOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(roomsTranslate, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        // タブ下線を右に移動
        Animated.timing(tabIndicatorPosition, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false, // translateX uses layout animation
          easing: Easing.inOut(Easing.ease),
        }),
      ]).start(() => {
        setActiveTab(newTab);
      });
    } else {
      // ルーム → 投稿
      Animated.parallel([
        // ルームを右に移動しながらフェードアウト
        Animated.timing(roomsOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(roomsTranslate, {
          toValue: width * 0.3,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        // 投稿を左から登場しながらフェードイン
        Animated.timing(postsOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(postsTranslate, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        // タブ下線を左に移動
        Animated.timing(tabIndicatorPosition, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ]).start(() => {
        setActiveTab(newTab);
      });
    }
  };

  const indicatorTranslateX = tabIndicatorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width / 2],
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
      position: 'relative',
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    tabIndicator: {
      position: 'absolute',
      bottom: -0.5,
      left: 0,
      width: width / 2,
      height: 2,
      backgroundColor: colors.text,
    },
    tabContent: {
      flex: 1,
      position: 'relative',
    },
    animatedContent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  });

  return (
    <View style={styles.container}>
      {/* タブバー */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange('posts')}
          activeOpacity={0.7}
        >
          <Grid3x3 size={24} color={activeTab === 'posts' ? colors.text : colors.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange('rooms')}
          activeOpacity={0.7}
        >
          <Users size={24} color={activeTab === 'rooms' ? colors.text : colors.icon} />
        </TouchableOpacity>

        {/* アニメーション下線 */}
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              transform: [{ translateX: indicatorTranslateX }],
            },
          ]}
        />
      </View>

      {/* タブコンテンツ - 両方を同時にレンダリング */}
      <View style={styles.tabContent}>
        {/* 投稿タブ */}
        <Animated.View
          style={[
            styles.animatedContent,
            {
              opacity: postsOpacity,
              transform: [{ translateX: postsTranslate }],
            },
          ]}
          pointerEvents={activeTab === 'posts' ? 'auto' : 'none'}
        >
          <ProfilePostsGrid posts={profilePosts} />
        </Animated.View>

        {/* ルームタブ */}
        <Animated.View
          style={[
            styles.animatedContent,
            {
              opacity: roomsOpacity,
              transform: [{ translateX: roomsTranslate }],
            },
          ]}
          pointerEvents={activeTab === 'rooms' ? 'auto' : 'none'}
        >
          <ProfileRoomsSection />
        </Animated.View>
      </View>
    </View>
  );
}
