import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import OnboardingHeader from '../../components/onboarding/OnboardingHeader';
import BrandList from '../../components/onboarding/BrandList';
import { POPULAR_BRANDS } from '../../mocks/onboardingData';

export default function BrandsScreen() {
  const router = useRouter();
  const { updateOnboardingStep, saveOnboardingData, skipOnboardingStep } = useAuthStore();
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  React.useEffect(() => {
    updateOnboardingStep(6);
  }, []);

  const handleNext = () => {
    saveOnboardingData({ selectedBrands });
    router.push('/(onboarding)/social');
  };

  const handleSkip = () => {
    skipOnboardingStep();
    router.push('/(onboarding)/social');
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader
        currentStep={6}
        totalSteps={7}
        title="好きなブランド"
        onBack={() => router.back()}
        onSkip={handleSkip}
      />

      <View style={styles.content}>
        <Text style={styles.instruction}>
          好きなブランドを選んでください（複数選択可・スキップ可）
        </Text>
        <BrandList
          items={POPULAR_BRANDS}
          selectedIds={selectedBrands}
          onSelectionChange={setSelectedBrands}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {selectedBrands.length > 0 ? `次へ (${selectedBrands.length}個選択)` : '次へ'}
          </Text>
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
