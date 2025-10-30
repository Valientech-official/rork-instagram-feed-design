import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import OnboardingHeader from '../../components/onboarding/OnboardingHeader';

// ========================================
// Validation Functions
// ========================================

const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'メールアドレスは必須です';
  if (!emailRegex.test(email)) return 'メールアドレスの形式が正しくありません';
  return null;
};

const validateHandle = (handle: string): string | null => {
  if (!handle) return 'ユーザー名は必須です';
  if (handle.length < 3) return 'ユーザー名は3文字以上である必要があります';
  if (handle.length > 30) return 'ユーザー名は30文字以下である必要があります';

  const handleRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  if (!handleRegex.test(handle)) {
    return 'ユーザー名は英字で始まり、英数字とアンダースコアのみ使用できます';
  }

  const reservedWords = ['admin', 'api', 'www', 'system', 'support', 'help'];
  if (reservedWords.includes(handle.toLowerCase())) {
    return 'このユーザー名は使用できません';
  }

  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'パスワードは必須です';
  if (password.length < 8) return 'パスワードは8文字以上である必要があります';
  if (password.length > 128) return 'パスワードは128文字以下である必要があります';

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUppercase) return 'パスワードには大文字を含める必要があります';
  if (!hasLowercase) return 'パスワードには小文字を含める必要があります';
  if (!hasNumber) return 'パスワードには数字を含める必要があります';

  return null;
};

// 電話番号をE.164形式に変換
const formatPhoneToE164 = (phone: string): string => {
  if (!phone) return '';

  // ハイフン、スペース、括弧を削除
  let cleaned = phone.replace(/[-\s()]/g, '');

  // 先頭の0を削除して+81を追加
  if (cleaned.startsWith('0')) {
    cleaned = '+81' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+81' + cleaned;
  }

  return cleaned;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { updateOnboardingStep, saveOnboardingData, signUp, error, clearError, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    username: '', // handle として使用
    name: '',
    password: '',
    birthday: '',
    phone: '',
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  useEffect(() => {
    updateOnboardingStep(2);
    return () => clearError();
  }, []);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    const handleError = validateHandle(formData.username);
    if (handleError) errors.username = handleError;

    if (!formData.name || formData.name.length < 2) {
      errors.name = '名前は2文字以上である必要があります';
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) errors.password = passwordError;

    if (formData.phone) {
      const phoneE164 = formatPhoneToE164(formData.phone);
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneE164)) {
        errors.phone = '電話番号の形式が正しくありません';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // 電話番号をE.164形式に変換
      const phoneE164 = formatPhoneToE164(formData.phone);

      // プロフィールデータを保存（verify-emailで使用）
      saveOnboardingData({ profile: { ...formData, phone: phoneE164 } });

      // Cognito SignUp
      const result = await signUp({
        username: formData.username, // Cognito username
        email: formData.email,
        password: formData.password,
        phoneNumber: phoneE164,
        handle: formData.username, // custom:handle
        name: formData.name,
        birthday: formData.birthday,
      });

      if (result.success) {
        // 確認コード入力画面へ遷移
        router.push(`/(auth)/verify-email?username=${encodeURIComponent(formData.username)}`);
      }
    } catch (err) {
      // エラーは authStore.error に設定される
      console.error('SignUp failed:', err);
    }
  };

  const isFormValid = () => {
    return (
      formData.email.length > 0 &&
      formData.username.length >= 3 &&
      formData.name.length >= 2 &&
      formData.password.length >= 8
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
          {/* Email */}
          <Text style={styles.label}>メールアドレス *</Text>
          <TextInput
            style={[styles.input, validationErrors.email && styles.inputError]}
            placeholder="例: user@example.com"
            value={formData.email}
            onChangeText={(text) => {
              setFormData({ ...formData, email: text });
              if (validationErrors.email) {
                setValidationErrors({ ...validationErrors, email: '' });
              }
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!isLoading}
          />
          {validationErrors.email && (
            <Text style={styles.errorText}>{validationErrors.email}</Text>
          )}

          {/* Username (Handle) */}
          <Text style={styles.label}>ユーザー名 *</Text>
          <TextInput
            style={[styles.input, validationErrors.username && styles.inputError]}
            placeholder="例: fashionlover123"
            value={formData.username}
            onChangeText={(text) => {
              setFormData({ ...formData, username: text });
              if (validationErrors.username) {
                setValidationErrors({ ...validationErrors, username: '' });
              }
            }}
            autoCapitalize="none"
            editable={!isLoading}
          />
          {validationErrors.username && (
            <Text style={styles.errorText}>{validationErrors.username}</Text>
          )}
          <Text style={styles.hint}>英字で始まり、英数字とアンダースコアのみ使用可能（3-30文字）</Text>

          {/* Name */}
          <Text style={styles.label}>名前 *</Text>
          <TextInput
            style={[styles.input, validationErrors.name && styles.inputError]}
            placeholder="例: 田中太郎"
            value={formData.name}
            onChangeText={(text) => {
              setFormData({ ...formData, name: text });
              if (validationErrors.name) {
                setValidationErrors({ ...validationErrors, name: '' });
              }
            }}
            editable={!isLoading}
          />
          {validationErrors.name && (
            <Text style={styles.errorText}>{validationErrors.name}</Text>
          )}

          {/* Password */}
          <Text style={styles.label}>パスワード *</Text>
          <TextInput
            style={[styles.input, validationErrors.password && styles.inputError]}
            placeholder="8文字以上、大文字・小文字・数字を含む"
            value={formData.password}
            onChangeText={(text) => {
              setFormData({ ...formData, password: text });
              if (validationErrors.password) {
                setValidationErrors({ ...validationErrors, password: '' });
              }
            }}
            secureTextEntry
            onFocus={() => setShowPasswordRequirements(true)}
            onBlur={() => setShowPasswordRequirements(false)}
            editable={!isLoading}
          />
          {validationErrors.password && (
            <Text style={styles.errorText}>{validationErrors.password}</Text>
          )}
          {showPasswordRequirements && (
            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>パスワードの要件:</Text>
              <Text style={styles.requirementItem}>• 8文字以上</Text>
              <Text style={styles.requirementItem}>• 大文字を含む (A-Z)</Text>
              <Text style={styles.requirementItem}>• 小文字を含む (a-z)</Text>
              <Text style={styles.requirementItem}>• 数字を含む (0-9)</Text>
            </View>
          )}

          {/* Birthday */}
          <Text style={styles.label}>生年月日</Text>
          <TextInput
            style={styles.input}
            placeholder="例: 2000-01-01"
            value={formData.birthday}
            onChangeText={(text) => setFormData({ ...formData, birthday: text })}
            editable={!isLoading}
          />
          <Text style={styles.hint}>YYYY-MM-DD形式（省略可）</Text>

          {/* Phone */}
          <Text style={styles.label}>電話番号</Text>
          <TextInput
            style={[styles.input, validationErrors.phone && styles.inputError]}
            placeholder="例: 090-1234-5678 (自動で+81に変換)"
            value={formData.phone}
            onChangeText={(text) => {
              setFormData({ ...formData, phone: text });
              if (validationErrors.phone) {
                setValidationErrors({ ...validationErrors, phone: '' });
              }
            }}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
          {validationErrors.phone && (
            <Text style={styles.errorText}>{validationErrors.phone}</Text>
          )}
          <Text style={styles.hint}>電話番号はE.164形式（+81...）に自動変換されます（省略可）</Text>

          {/* Global Error */}
          {error && (
            <View style={styles.globalErrorContainer}>
              <Text style={styles.globalErrorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.requiredHint}>* は必須項目です</Text>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, (!isFormValid() || isLoading) && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>次へ</Text>
            )}
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
    backgroundColor: '#F9F9F9',
  },
  inputError: {
    borderColor: '#F00',
    borderWidth: 2,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#F00',
    marginTop: 4,
  },
  requirementsBox: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  requirementItem: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  globalErrorContainer: {
    backgroundColor: '#FEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F00',
  },
  globalErrorText: {
    color: '#C00',
    fontSize: 14,
  },
  requiredHint: {
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
