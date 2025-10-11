import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import StyleSelector from '../../components/onboarding/StyleSelector';
import { FASHION_STYLES } from '../../mocks/onboardingData';

export default function StylesScreen() {
  const router = useRouter();
  const { updateOnboardingStep, saveOnboardingData } = useAuthStore();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  React.useEffect(() => {
    updateOnboardingStep(4);
  }, []);

  const handleNext = () => {
    saveOnboardingData({ selectedStyles });
    router.push('/(onboarding)/genres');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>好きな服を選ぼう</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>
          好きな画像の系統を選んでください（複数選択可）
        </Text>
        <StyleSelector
          items={FASHION_STYLES}
          selectedIds={selectedStyles}
          onSelectionChange={setSelectedStyles}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, selectedStyles.length === 0 && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selectedStyles.length === 0}
        >
          <Text style={styles.buttonText}>次へ ({selectedStyles.length}個選択)</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
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
