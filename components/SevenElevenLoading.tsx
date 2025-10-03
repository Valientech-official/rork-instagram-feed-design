import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function SevenElevenLoading() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 回転アニメーション
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // プログレスアニメーション (0% → 100%)
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 3000,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();

    // パルスアニメーション
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const [displayProgress, setDisplayProgress] = React.useState(0);

  useEffect(() => {
    const listener = progressAnim.addListener(({ value }) => {
      setDisplayProgress(Math.floor(value));
    });

    return () => progressAnim.removeListener(listener);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Sparkles size={60} color={Colors.light.primary} />
        </Animated.View>
      </Animated.View>

      <Text style={styles.title}>AI着せ替え生成中...</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{displayProgress}%</Text>
      </View>

      <View style={styles.stepsContainer}>
        <StepItem
          label="アバター準備中"
          isActive={displayProgress < 33}
          isCompleted={displayProgress >= 33}
        />
        <StepItem
          label="着せ替え生成中"
          isActive={displayProgress >= 33 && displayProgress < 66}
          isCompleted={displayProgress >= 66}
        />
        <StepItem
          label="仕上げ中"
          isActive={displayProgress >= 66 && displayProgress < 100}
          isCompleted={displayProgress >= 100}
        />
      </View>

      <Text style={styles.hint}>少々お待ちください...</Text>
    </View>
  );
}

interface StepItemProps {
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

function StepItem({ label, isActive, isCompleted }: StepItemProps) {
  return (
    <View style={styles.stepItem}>
      <View
        style={[
          styles.stepDot,
          isActive && styles.stepDotActive,
          isCompleted && styles.stepDotCompleted,
        ]}
      />
      <Text
        style={[
          styles.stepLabel,
          isActive && styles.stepLabelActive,
          isCompleted && styles.stepLabelCompleted,
        ]}
      >
        {label}
      </Text>
      {isCompleted && <Text style={styles.checkmark}>✓</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.light.background,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  stepsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.border,
    marginRight: 12,
  },
  stepDotActive: {
    backgroundColor: Colors.light.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stepDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepLabel: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    flex: 1,
  },
  stepLabelActive: {
    fontWeight: '600',
    color: Colors.light.primary,
  },
  stepLabelCompleted: {
    color: '#4CAF50',
  },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '700',
  },
  hint: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontStyle: 'italic',
  },
});
