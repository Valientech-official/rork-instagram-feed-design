import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { WELCOME_IMAGES } from '../../mocks/onboardingData';
import OnboardingProgress from '../../components/onboarding/OnboardingProgress';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 48) / 2;

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateOnboardingStep, onboardingStep } = useAuthStore();
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    // ステップ0の場合のみステップ1に更新（既に進んでいる場合は上書きしない）
    if (onboardingStep === 0) {
      updateOnboardingStep(1);
    }
    // 画像読み込み開始をシミュレート
    const timer = setTimeout(() => {
      setImagesLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    router.push('/(onboarding)/profile');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.progressWrapper, { paddingTop: insets.top }]}>
        <OnboardingProgress currentStep={1} totalSteps={7} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            <Text style={styles.logoP}>P</Text>
            <Text style={styles.logoI}>i</Text>
            <Text style={styles.logoE1}>è</Text>
            <Text style={styles.logoC}>c</Text>
            <Text style={styles.logoE2}>e</Text>
          </Text>
          <Text style={styles.subtitle}>あなたのファッションの旅が始まります</Text>
        </View>

        <View style={styles.imageGrid}>
          {imagesLoaded &&
            WELCOME_IMAGES.map((image, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(index * 100).duration(600)}
              >
                <Image source={{ uri: image }} style={styles.image} />
              </Animated.View>
            ))}
        </View>
      </View>

      <SafeAreaView style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>始める</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: 'Marker Felt',
      android: 'casual',
      web: 'Quicksand, Nunito, Fredoka One, Comfortaa, Poppins, sans-serif',
    }),
    letterSpacing: 0.5,
  },
  logoP: {
    color: '#9ACD32', // Yellow-green
  },
  logoI: {
    color: '#FF69B4', // Pink
  },
  logoE1: {
    color: '#87CEEB', // Sky blue
  },
  logoC: {
    color: '#FFD700', // Gold/Yellow
  },
  logoE2: {
    color: '#DDA0DD', // Plum/Light purple
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  button: {
    backgroundColor: '#000',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
