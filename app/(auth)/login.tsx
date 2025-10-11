import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Phone } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();

  const handleLogin = async (method: 'email' | 'google' | 'line' | 'phone') => {
    await login(method);
    router.replace('/(onboarding)/welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>ぴーすへようこそ</Text>
          <Text style={styles.subtitle}>アカウントでログインまたは新規登録</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={() => handleLogin('google')}
          >
            <Text style={styles.buttonText}>Googleでログイン</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.lineButton]}
            onPress={() => handleLogin('line')}
          >
            <Text style={styles.buttonText}>LINEでログイン</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.emailButton]}
            onPress={() => handleLogin('email')}
          >
            <Mail size={20} color="#fff" />
            <Text style={styles.buttonText}>メールアドレスでログイン</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.phoneButton]}
            onPress={() => handleLogin('phone')}
          >
            <Phone size={20} color="#fff" />
            <Text style={styles.buttonText}>電話番号でログイン</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            アカウントをお持ちでない場合は、自動的に新規登録されます
          </Text>
        </View>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    gap: 8,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  lineButton: {
    backgroundColor: '#00B900',
  },
  emailButton: {
    backgroundColor: '#000',
  },
  phoneButton: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
