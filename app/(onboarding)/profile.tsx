import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import OnboardingHeader from '../../components/onboarding/OnboardingHeader';

export default function ProfileScreen() {
  const router = useRouter();
  const { updateOnboardingStep, saveOnboardingData } = useAuthStore();

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    birthday: '',
    phone: '',
  });

  React.useEffect(() => {
    updateOnboardingStep(2);
  }, []);

  const handleNext = () => {
    saveOnboardingData({ profile: formData });
    router.push('/(onboarding)/avatar');
  };

  const isFormValid = () => {
    return (
      formData.username.length >= 3 &&
      formData.name.length >= 2 &&
      formData.password.length >= 6
    );
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader
        currentStep={2}
        totalSteps={7}
        title="プロフィール情報"
        onBack={() => router.back()}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>ユーザー名 *</Text>
          <TextInput
            style={styles.input}
            placeholder="例: fashionlover123"
            value={formData.username}
            onChangeText={(text) => setFormData({ ...formData, username: text })}
            autoCapitalize="none"
          />

          <Text style={styles.label}>名前 *</Text>
          <TextInput
            style={styles.input}
            placeholder="例: 田中太郎"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <Text style={styles.label}>パスワード *</Text>
          <TextInput
            style={styles.input}
            placeholder="6文字以上"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
          />

          <Text style={styles.label}>生年月日</Text>
          <TextInput
            style={styles.input}
            placeholder="例: 2000/01/01"
            value={formData.birthday}
            onChangeText={(text) => setFormData({ ...formData, birthday: text })}
          />

          <Text style={styles.label}>電話番号</Text>
          <TextInput
            style={styles.input}
            placeholder="例: 090-1234-5678"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />

          <Text style={styles.hint}>* は必須項目です</Text>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, !isFormValid() && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!isFormValid()}
          >
            <Text style={styles.buttonText}>次へ</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
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
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
