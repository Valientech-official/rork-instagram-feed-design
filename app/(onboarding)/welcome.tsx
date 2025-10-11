import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../store/authStore';
import { WELCOME_IMAGES } from '../../mocks/onboardingData';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 48) / 2;

export default function WelcomeScreen() {
  const router = useRouter();
  const { updateOnboardingStep } = useAuthStore();
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    updateOnboardingStep(1);
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>ぴーすへようこそ</Text>
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

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>始める</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
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
