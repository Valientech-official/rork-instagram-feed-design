import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

export default function AnimatedLogo() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    scale.value = withSequence(
      withSpring(1.2, { damping: 5 }),
      withSpring(1, { damping: 8 })
    );
    rotate.value = withTiming(360, { duration: 1000 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, animatedStyle]}>
        <Image
          source={require('../../assets/images/piece.svg')}
          style={{ width: 120, height: 120 }}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
