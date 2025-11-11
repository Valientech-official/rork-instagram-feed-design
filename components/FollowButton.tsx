/**
 * FollowButton コンポーネント
 * フォロー/アンフォローボタン
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import Colors from '@/constants/colors';
import { followUser, unfollowUser } from '@/lib/api/follows';
import { handleError } from '@/lib/utils/errorHandler';

export interface FollowButtonProps {
  accountId: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
}

export default function FollowButton({
  accountId,
  initialIsFollowing,
  onFollowChange,
  style,
  size = 'medium',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;

    // 楽観的UI更新
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);
    setLoading(true);

    try {
      if (previousState) {
        // アンフォロー
        await unfollowUser(accountId);
        onFollowChange?.(false);
      } else {
        // フォロー
        await followUser(accountId);
        onFollowChange?.(true);
      }
    } catch (error: any) {
      // エラー時はロールバック
      setIsFollowing(previousState);
      const { message } = handleError(error, 'followUser');
      console.error('[FollowButton]', message);
    } finally {
      setLoading(false);
    }
  };

  const buttonStyles = [
    styles.button,
    styles[`button_${size}`],
    isFollowing ? styles.buttonFollowing : styles.buttonNotFollowing,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    styles[`buttonText_${size}`],
    isFollowing ? styles.buttonTextFollowing : styles.buttonTextNotFollowing,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isFollowing ? Colors.light.text : Colors.light.background}
        />
      ) : (
        <Text style={textStyles}>
          {isFollowing ? 'フォロー中' : 'フォロー'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  button_small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  button_medium: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  button_large: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  buttonNotFollowing: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  buttonFollowing: {
    backgroundColor: Colors.light.background,
    borderColor: Colors.light.border,
  },
  buttonText: {
    fontWeight: '600',
  },
  buttonText_small: {
    fontSize: 12,
  },
  buttonText_medium: {
    fontSize: 14,
  },
  buttonText_large: {
    fontSize: 16,
  },
  buttonTextNotFollowing: {
    color: Colors.light.background,
  },
  buttonTextFollowing: {
    color: Colors.light.text,
  },
});
