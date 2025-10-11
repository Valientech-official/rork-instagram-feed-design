import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, Camera } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';

export default function AvatarScreen() {
  const router = useRouter();
  const { updateOnboardingStep, skipOnboardingStep } = useAuthStore();

  React.useEffect(() => {
    updateOnboardingStep(3);
  }, []);

  const handleSkip = () => {
    skipOnboardingStep();
    router.push('/(onboarding)/styles');
  };

  const handleCreateAvatar = () => {
    // 実際のAI機能は実装しない（モックアップ）
    alert('AI機能は現在開発中です');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>アバター作成</Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>スキップ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.aiSection}>
          <Sparkles size={64} color="#000" strokeWidth={1.5} />
          <Text style={styles.title}>AI でアバターを作成</Text>
          <Text style={styles.description}>
            あなたの写真から、AI が自動的にスタイリッシュなアバターを生成します
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem
            icon="✨"
            title="自動生成"
            description="写真をアップロードするだけで完成"
          />
          <FeatureItem
            icon="🎨"
            title="複数のスタイル"
            description="様々なアート スタイルから選択可能"
          />
          <FeatureItem
            icon="⚡"
            title="高速処理"
            description="数秒で高品質なアバターを作成"
          />
        </View>

        <TouchableOpacity style={styles.createButton} onPress={handleCreateAvatar}>
          <Camera size={20} color="#fff" />
          <Text style={styles.createButtonText}>写真をアップロード</Text>
        </TouchableOpacity>

        <Text style={styles.laterText}>後で設定することもできます</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
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
  skipText: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  aiSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  features: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  createButton: {
    backgroundColor: '#000',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  laterText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
});
