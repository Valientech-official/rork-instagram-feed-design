import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  ImageOff,
  Users,
  MessageSquare,
  Bell,
  Search,
  Heart,
  Bookmark,
  ShoppingBag,
  Radio
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

export type EmptyStateType =
  | 'no-posts'
  | 'no-followers'
  | 'no-following'
  | 'no-messages'
  | 'no-notifications'
  | 'no-results'
  | 'no-liked-posts'
  | 'no-saved-posts'
  | 'no-products'
  | 'no-live-streams';

interface EmptyStateConfig {
  icon: React.ComponentType<any>;
  title: string;
  message: string;
}

const emptyStateConfigs: Record<EmptyStateType, EmptyStateConfig> = {
  'no-posts': {
    icon: ImageOff,
    title: 'No posts yet',
    message: 'When you create posts, they\'ll appear here',
  },
  'no-followers': {
    icon: Users,
    title: 'No followers yet',
    message: 'When people follow you, they\'ll appear here',
  },
  'no-following': {
    icon: Users,
    title: 'Not following anyone',
    message: 'Find people to follow and see their posts',
  },
  'no-messages': {
    icon: MessageSquare,
    title: 'No messages yet',
    message: 'Start a conversation with your followers',
  },
  'no-notifications': {
    icon: Bell,
    title: 'No notifications',
    message: 'When you get notifications, they\'ll appear here',
  },
  'no-results': {
    icon: Search,
    title: 'No results found',
    message: 'Try adjusting your search or filters',
  },
  'no-liked-posts': {
    icon: Heart,
    title: 'No liked posts',
    message: 'Posts you like will appear here',
  },
  'no-saved-posts': {
    icon: Bookmark,
    title: 'No saved posts',
    message: 'Save posts to view them later',
  },
  'no-products': {
    icon: ShoppingBag,
    title: 'No products yet',
    message: 'Products will appear here when available',
  },
  'no-live-streams': {
    icon: Radio,
    title: 'No live streams',
    message: 'Start a live stream or check back later',
  },
};

interface ActionButton {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  message?: string;
  icon?: React.ComponentType<any>;
  actionButton?: ActionButton;
  illustration?: React.ReactNode;
}

export default function EmptyState({
  type,
  title: customTitle,
  message: customMessage,
  icon: CustomIcon,
  actionButton,
  illustration,
}: EmptyStateProps) {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  const config = emptyStateConfigs[type];
  const Icon = CustomIcon || config.icon;
  const title = customTitle || config.title;
  const message = customMessage || config.message;

  return (
    <View style={styles.container}>
      {illustration ? (
        <View style={styles.illustrationContainer}>
          {illustration}
        </View>
      ) : (
        <View style={styles.iconContainer}>
          <Icon size={80} color={colors.secondaryText} strokeWidth={1.5} />
        </View>
      )}

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {actionButton && (
        <TouchableOpacity style={styles.actionButton} onPress={actionButton.onPress}>
          <Text style={styles.actionButtonText}>{actionButton.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    marginBottom: 24,
  },
  illustrationContainer: {
    marginBottom: 24,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  actionButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
  },
});
