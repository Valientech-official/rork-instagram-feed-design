import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageCircle,
  AlertCircle,
  Book,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  route?: string;
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  const helpCategories: HelpCategory[] = [
    {
      id: '1',
      title: 'Getting Started',
      icon: 'Book',
      description: 'Learn the basics of using Pièce',
    },
    {
      id: '2',
      title: 'Account & Security',
      icon: 'Shield',
      description: 'Manage your account and security settings',
    },
    {
      id: '3',
      title: 'Privacy & Safety',
      icon: 'Lock',
      description: 'Control your privacy and safety settings',
    },
    {
      id: '4',
      title: 'Troubleshooting',
      icon: 'Tool',
      description: 'Fix common issues and errors',
    },
    {
      id: '5',
      title: 'Reporting Problems',
      icon: 'Flag',
      description: 'Report bugs, issues, or inappropriate content',
    },
  ];

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/help/faq');
      // const data = await response.json();
      // setFaqs(data.faqs);

      // Mock FAQ data
      const mockFAQs: FAQItem[] = [
        {
          id: '1',
          question: 'How do I create a new account?',
          answer: 'To create a new account, tap the "Sign Up" button on the login screen. Enter your email, username, and password. You will receive a verification email to confirm your account.',
        },
        {
          id: '2',
          question: 'How do I reset my password?',
          answer: 'On the login screen, tap "Forgot Password?". Enter your email address and we will send you instructions to reset your password.',
        },
        {
          id: '3',
          question: 'How do I upload a photo?',
          answer: 'Tap the "+" button at the bottom of the screen. Select a photo from your gallery or take a new one. Add a caption and filters if desired, then tap "Share".',
        },
        {
          id: '4',
          question: 'How do I report inappropriate content?',
          answer: 'Tap the three dots menu on any post. Select "Report" and choose the reason for reporting. Our team will review the content.',
        },
        {
          id: '5',
          question: 'How do I change my privacy settings?',
          answer: 'Go to Settings > Privacy & Security. Here you can control who can see your posts, stories, and profile information.',
        },
      ];

      setFaqs(mockFAQs);
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
      Alert.alert('Error', 'Failed to load help content');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how you would like to contact us:',
      [
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@piece.app'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleReportProblem = () => {
    Alert.alert(
      'Report a Problem',
      'What kind of problem are you experiencing?',
      [
        { text: 'App Crash', onPress: () => submitProblemReport('crash') },
        { text: 'Feature Issue', onPress: () => submitProblemReport('feature') },
        { text: 'Other', onPress: () => submitProblemReport('other') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const submitProblemReport = async (type: string) => {
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/support/ticket', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ type, systemInfo: getSystemInfo() }),
      // });

      Alert.alert('Success', 'Your problem report has been submitted. We will get back to you soon.');
    } catch (error) {
      console.error('Failed to submit problem report:', error);
      Alert.alert('Error', 'Failed to submit problem report');
    }
  };

  const handleCommunityGuidelines = () => {
    Linking.openURL('https://piece.app/community-guidelines');
  };

  const getSystemInfo = () => {
    return {
      platform: Platform.OS,
      platformVersion: Platform.Version,
      appVersion: Constants.expoConfig?.version || '1.0.0',
      deviceModel: Device.modelName,
      deviceYear: Device.deviceYearClass,
    };
  };

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const systemInfo = getSystemInfo();

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={20} color={Colors.light.secondaryText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search help topics..."
              placeholderTextColor={Colors.light.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Help Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help Categories</Text>
          {helpCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryItem}
              onPress={() => {
                if (category.route) {
                  router.push(category.route as any);
                }
              }}
            >
              <View style={styles.categoryIcon}>
                <HelpCircle size={24} color={Colors.light.primary} />
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </View>
              <ChevronRight size={20} color={Colors.light.secondaryText} />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {filteredFAQs.map((faq) => (
            <View key={faq.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                {expandedFAQ === faq.id ? (
                  <ChevronUp size={20} color={Colors.light.secondaryText} />
                ) : (
                  <ChevronDown size={20} color={Colors.light.secondaryText} />
                )}
              </TouchableOpacity>
              {expandedFAQ === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton} onPress={handleContactSupport}>
            <MessageCircle size={20} color={Colors.light.primary} />
            <Text style={styles.actionButtonText}>Contact Support</Text>
            <ChevronRight size={20} color={Colors.light.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleReportProblem}>
            <AlertCircle size={20} color={Colors.light.secondary} />
            <Text style={styles.actionButtonText}>Report a Problem</Text>
            <ChevronRight size={20} color={Colors.light.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleCommunityGuidelines}>
            <Book size={20} color={Colors.light.text} />
            <Text style={styles.actionButtonText}>Community Guidelines</Text>
            <ChevronRight size={20} color={Colors.light.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* System Info */}
        <View style={styles.systemInfo}>
          <Text style={styles.systemInfoTitle}>System Information</Text>
          <Text style={styles.systemInfoText}>App Version: {systemInfo.appVersion}</Text>
          <Text style={styles.systemInfoText}>Platform: {systemInfo.platform} {systemInfo.platformVersion}</Text>
          {systemInfo.deviceModel && (
            <Text style={styles.systemInfoText}>Device: {systemInfo.deviceModel}</Text>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  searchSection: {
    padding: 16,
    backgroundColor: Colors.light.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: Colors.light.border,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  faqItem: {
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: Colors.light.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.background,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
    marginRight: 8,
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: Colors.light.cardBackground,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondaryText,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: Colors.light.border,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginLeft: 12,
  },
  systemInfo: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
  },
  systemInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  systemInfoText: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginTop: 4,
  },
  bottomPadding: {
    height: 32,
  },
});
