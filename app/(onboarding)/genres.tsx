import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import OnboardingHeader from '../../components/onboarding/OnboardingHeader';
import GenreGrid from '../../components/onboarding/GenreGrid';
import { FASHION_GENRES } from '../../mocks/onboardingData';

export default function GenresScreen() {
  const router = useRouter();
  const { updateOnboardingStep, saveOnboardingData } = useAuthStore();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  React.useEffect(() => {
    updateOnboardingStep(5);
  }, []);

  const handleNext = () => {
    saveOnboardingData({ selectedGenres });
    router.push('/(onboarding)/brands');
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader
        currentStep={5}
        totalSteps={7}
        title="ジャンルを選ぶ"
        onBack={() => router.back()}
      />

      <View style={styles.content}>
        <Text style={styles.instruction}>
          好きなファッションジャンルを選んでください（複数選択可）
        </Text>
        <GenreGrid
          items={FASHION_GENRES}
          selectedIds={selectedGenres}
          onSelectionChange={setSelectedGenres}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, selectedGenres.length === 0 && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selectedGenres.length === 0}
        >
          <Text style={styles.buttonText}>次へ ({selectedGenres.length}個選択)</Text>
        </TouchableOpacity>
      </View>
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
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
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
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
