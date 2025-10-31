import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();
  const {
    confirmSignUp,
    resendConfirmationCode,
    error,
    clearError,
    isLoading,
  } = useAuthStore();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // タイマー処理
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  useEffect(() => {
    return () => clearError();
  }, []);

  // コード入力処理
  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // 次のフィールドに自動フォーカス
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // 6桁入力完了したら自動送信
    if (newCode.every((digit) => digit !== '') && index === 5) {
      handleVerify(newCode.join(''));
    }
  };

  // バックスペース処理
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // 確認処理
  const handleVerify = async (verificationCode?: string) => {
    const finalCode = verificationCode || code.join('');

    if (finalCode.length !== 6) {
      Alert.alert('エラー', '6桁の確認コードを入力してください');
      return;
    }

    if (!username) {
      Alert.alert('エラー', 'ユーザー名が見つかりません');
      return;
    }

    try {
      // Cognito confirmSignUp
      await confirmSignUp(username, finalCode);

      // 未確認状態を削除（確認完了）
      await AsyncStorage.removeItem('@pending_verification');

      // 確認完了後、ログイン画面へ誘導
      Alert.alert(
        '成功',
        'メールアドレスが確認されました。ログインしてください。',
        [{
          text: 'OK',
          onPress: () => router.replace('/(auth)/login')
        }]
      );
    } catch (err) {
      // エラーは authStore.error に設定される
      console.error('Verify failed:', err);
    }
  };

  // 再送信処理
  const handleResend = async () => {
    if (!canResend || !username) return;

    try {
      await resendConfirmationCode(username);
      Alert.alert('成功', '確認コードを再送信しました');
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      console.error('Resend failed:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>メールアドレスの確認</Text>
          <Text style={styles.subtitle}>
            {username ? `${username} に送信された` : ''}
            {'\n'}6桁の確認コードを入力してください
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text.slice(-1), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={index === 0}
              editable={!isLoading}
            />
          ))}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={() => handleVerify()}
          disabled={isLoading || code.some((digit) => !digit)}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>確認</Text>
          )}
        </TouchableOpacity>

        {/* Resend Section */}
        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} disabled={isLoading}>
              <Text style={styles.resendText}>確認コードを再送信</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              再送信まで {resendTimer} 秒
            </Text>
          )}
        </View>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(auth)/login')}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>ログイン画面に戻る</Text>
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
    paddingHorizontal: 24,
    paddingTop: 64,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#F9F9F9',
  },
  otpInputFilled: {
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  errorContainer: {
    backgroundColor: '#FEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F00',
  },
  errorText: {
    color: '#C00',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#000',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  timerText: {
    fontSize: 14,
    color: '#999',
  },
  backButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: '#666',
  },
});
