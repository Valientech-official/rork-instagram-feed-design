import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

const { width: screenWidth } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

function Skeleton({ width = '100%', height, borderRadius = 8, style }: SkeletonProps) {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmer.value,
      [0, 1],
      [-screenWidth, screenWidth]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const baseColor = theme === 'dark' ? '#2A2A2A' : '#E0E0E0';
  const highlightColor = theme === 'dark' ? '#3A3A3A' : '#F0F0F0';

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

interface PostSkeletonProps {
  style?: any;
}

export function PostSkeleton({ style }: PostSkeletonProps) {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createPostStyles(colors);

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Skeleton width={36} height={36} borderRadius={18} />
          <View style={styles.headerText}>
            <Skeleton width={120} height={14} />
            <Skeleton width={80} height={10} style={{ marginTop: 6 }} />
          </View>
        </View>
        <View style={styles.headerRight}>
          <Skeleton width={60} height={20} />
        </View>
      </View>

      {/* Caption */}
      <View style={styles.caption}>
        <Skeleton width="90%" height={12} />
        <Skeleton width="70%" height={12} style={{ marginTop: 6 }} />
      </View>

      {/* Image */}
      <Skeleton width="100%" height={400} borderRadius={0} />

      {/* Footer */}
      <View style={styles.footer}>
        <Skeleton width={100} height={10} />
      </View>
    </View>
  );
}

interface UserListSkeletonProps {
  style?: any;
}

export function UserListSkeleton({ style }: UserListSkeletonProps) {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createUserListStyles(colors);

  return (
    <View style={[styles.container, style]}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.info}>
        <Skeleton width={140} height={14} />
        <Skeleton width={100} height={12} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={80} height={32} borderRadius={8} />
    </View>
  );
}

interface ProfileSkeletonProps {
  style?: any;
}

export function ProfileSkeleton({ style }: ProfileSkeletonProps) {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createProfileStyles(colors);

  return (
    <View style={[styles.container, style]}>
      {/* Avatar and stats */}
      <View style={styles.topRow}>
        <Skeleton width={90} height={90} borderRadius={45} />
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Skeleton width={40} height={16} />
            <Skeleton width={50} height={12} style={{ marginTop: 4 }} />
          </View>
          <View style={styles.stat}>
            <Skeleton width={40} height={16} />
            <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
          </View>
          <View style={styles.stat}>
            <Skeleton width={40} height={16} />
            <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>

      {/* Name and bio */}
      <View style={styles.info}>
        <Skeleton width={150} height={16} />
        <Skeleton width="100%" height={12} style={{ marginTop: 8 }} />
        <Skeleton width="80%" height={12} style={{ marginTop: 4 }} />
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Skeleton width="48%" height={36} borderRadius={8} />
        <Skeleton width="48%" height={36} borderRadius={8} />
      </View>
    </View>
  );
}

interface CommentSkeletonProps {
  style?: any;
}

export function CommentSkeleton({ style }: CommentSkeletonProps) {
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createCommentStyles(colors);

  return (
    <View style={[styles.container, style]}>
      <Skeleton width={32} height={32} borderRadius={16} />
      <View style={styles.content}>
        <Skeleton width={100} height={12} />
        <Skeleton width="90%" height={12} style={{ marginTop: 6 }} />
        <Skeleton width="60%" height={12} style={{ marginTop: 4 }} />
        <Skeleton width={80} height={10} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

interface GridSkeletonProps {
  count?: number;
  style?: any;
}

export function GridSkeleton({ count = 9, style }: GridSkeletonProps) {
  const itemWidth = (screenWidth - 6) / 3;

  return (
    <View style={[styles.gridContainer, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          width={itemWidth}
          height={itemWidth}
          borderRadius={2}
          style={styles.gridItem}
        />
      ))}
    </View>
  );
}

interface FeedSkeletonProps {
  count?: number;
}

export function FeedSkeleton({ count = 3 }: FeedSkeletonProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <PostSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridItem: {
    margin: 1,
  },
});

const createPostStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    backgroundColor: colors.shopCard,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  caption: {
    padding: 12,
  },
  footer: {
    padding: 12,
  },
});

const createUserListStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
});

const createProfileStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 24,
  },
  stat: {
    alignItems: 'center',
  },
  info: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const createCommentStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
});
