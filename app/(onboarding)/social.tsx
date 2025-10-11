import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Instagram, Twitter } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import OnboardingHeader from '../../components/onboarding/OnboardingHeader';

export default function SocialScreen() {
  const router = useRouter();
  const { updateOnboardingStep, saveOnboardingData, completeOnboarding } = useAuthStore();

  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    twitter: '',
    tiktok: '',
    youtube: '',
  });

  React.useEffect(() => {
    updateOnboardingStep(7);
  }, []);

  const handleComplete = async () => {
    saveOnboardingData({ socialLinks });
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader
        currentStep={7}
        totalSteps={7}
        title="SNSリンク"
        onBack={() => router.back()}
        onSkip={handleSkip}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.instruction}>
          SNSアカウントをリンクして、友達を見つけやすくしましょう（任意）
        </Text>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Instagram size={20} color="#E4405F" />
            <Text style={styles.label}>Instagram</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="@username"
            value={socialLinks.instagram}
            onChangeText={(text) => setSocialLinks({ ...socialLinks, instagram: text })}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Twitter size={20} color="#1DA1F2" />
            <Text style={styles.label}>Twitter / X</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="@username"
            value={socialLinks.twitter}
            onChangeText={(text) => setSocialLinks({ ...socialLinks, twitter: text })}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.emoji}>🎵</Text>
            <Text style={styles.label}>TikTok</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="@username"
            value={socialLinks.tiktok}
            onChangeText={(text) => setSocialLinks({ ...socialLinks, tiktok: text })}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.emoji}>▶️</Text>
            <Text style={styles.label}>YouTube</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="@channelname"
            value={socialLinks.youtube}
            onChangeText={(text) => setSocialLinks({ ...socialLinks, youtube: text })}
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.hint}>後でプロフィール設定から変更できます</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleComplete}>
          <Text style={styles.buttonText}>完了してアプリを始める</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  emoji: {
    fontSize: 20,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
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
