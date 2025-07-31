import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay,
  runOnJS
} from 'react-native-reanimated';
import { Hand } from 'lucide-react-native';
import { Platform } from 'react-native';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

interface DoubleTapLikeProps {
  visible: boolean;
  liked: boolean;
  onAnimationComplete: () => void;
}

export default function DoubleTapLike({ visible, liked, onAnimationComplete }: DoubleTapLikeProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      // Start animation
      scale.value = 0;
      opacity.value = 0;
      
      if (Platform.OS !== 'web') {
        // Use Reanimated for native platforms
        opacity.value = withSequence(
          withTiming(1, { duration: 100 }),
          withDelay(
            700,
            withTiming(0, { duration: 200 }, (finished) => {
              if (finished) {
                runOnJS(onAnimationComplete)();
              }
            })
          )
        );
        
        scale.value = withSequence(
          withTiming(1.2, { duration: 300 }),
          withTiming(1, { duration: 200 })
        );
      } else {
        // Simple animation for web
        opacity.value = 1;
        scale.value = 1;
        
        // Manually trigger animation complete after delay on web
        setTimeout(() => {
          opacity.value = 0;
          onAnimationComplete();
        }, 1000);
      }
    }
  }, [visible, scale, opacity, onAnimationComplete]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  if (Platform.OS === 'web' && !visible) {
    return null;
  }

  // Don't show animation when unliking (canceling peace)
  if (!liked) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.heartContainer, animatedStyle]}>
        <Hand size={80} fill={Colors.light.like} color={Colors.light.like} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});