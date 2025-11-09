import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Share2, Printer } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TermsSection {
  id: string;
  title: string;
  content: string;
}

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [sections, setSections] = useState<TermsSection[]>([]);
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    fetchTermsOfService();
  }, []);

  const fetchTermsOfService = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/legal/terms');
      // const data = await response.json();
      // setSections(data.sections);
      // setLastUpdated(data.lastUpdated);

      // Mock data
      const mockSections: TermsSection[] = [
        {
          id: '1',
          title: 'Introduction',
          content: 'Welcome to Pièce. These Terms of Service ("Terms") govern your access to and use of our services, including our mobile applications, websites, and other services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.',
        },
        {
          id: '2',
          title: 'User Accounts',
          content: 'To use certain features of the Service, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 13 years old to create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.',
        },
        {
          id: '3',
          title: 'Content Ownership',
          content: 'You retain all rights to any content you post, upload, or otherwise make available through the Service ("User Content"). By posting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such content in connection with the Service. You represent and warrant that you own or have the necessary rights to all User Content you post.',
        },
        {
          id: '4',
          title: 'Prohibited Activities',
          content: 'You agree not to engage in any of the following prohibited activities: (a) violating any applicable laws or regulations; (b) infringing upon or violating our intellectual property rights or the intellectual property rights of others; (c) harassing, abusing, or harming another person; (d) uploading or transmitting viruses or any other type of malicious code; (e) spamming, phishing, or engaging in other fraudulent activity; (f) interfering with or disrupting the Service or servers or networks connected to the Service.',
        },
        {
          id: '5',
          title: 'Termination',
          content: 'We reserve the right to suspend or terminate your account and access to the Service at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users of the Service, us, or third parties, or for any other reason in our sole discretion. You may terminate your account at any time by following the instructions in the Service.',
        },
        {
          id: '6',
          title: 'Limitation of Liability',
          content: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL PIÈCE, ITS AFFILIATES, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.',
        },
        {
          id: '7',
          title: 'Changes to Terms',
          content: 'We reserve the right to modify these Terms at any time. If we make material changes to these Terms, we will notify you by email or by posting a notice on the Service prior to the effective date of the changes. Your continued use of the Service after the effective date of the revised Terms constitutes your acceptance of the changes.',
        },
        {
          id: '8',
          title: 'Contact Information',
          content: 'If you have any questions about these Terms, please contact us at:\n\nEmail: legal@piece.app\nAddress: Pièce Inc., 123 Fashion Street, New York, NY 10001\n\nLast Updated: November 9, 2025',
        },
      ];

      setSections(mockSections);
      setLastUpdated('November 9, 2025');
    } catch (error) {
      console.error('Failed to fetch terms of service:', error);
      Alert.alert('Error', 'Failed to load terms of service');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/legal/terms/accept', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      // });

      setAccepted(true);
      Alert.alert('Success', 'You have accepted the Terms of Service');
      router.back();
    } catch (error) {
      console.error('Failed to accept terms:', error);
      Alert.alert('Error', 'Failed to accept terms');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Pièce Terms of Service\n\nView the full terms at: https://piece.app/terms',
        title: 'Pièce Terms of Service',
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handlePrint = () => {
    Alert.alert(
      'Print',
      'Printing functionality would open the system print dialog',
      [{ text: 'OK' }]
    );
  };

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
        <Text style={styles.title}>Terms of Service</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
            <Share2 size={20} color={Colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePrint} style={styles.iconButton}>
            <Printer size={20} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Last Updated */}
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>Last Updated: {lastUpdated}</Text>
        </View>

        {/* Terms Sections */}
        {sections.map((section, index) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionNumber}>{index + 1}.</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionText}>{section.content}</Text>
            </View>
          </View>
        ))}

        {/* Legal Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            These Terms of Service constitute a legally binding agreement between you and Pièce Inc.
            By using our Service, you acknowledge that you have read, understood, and agree to be
            bound by these Terms.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Accept Button (for first-time users) */}
      {!accepted && (
        <View style={[styles.acceptContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.acceptButtonText}>Accept Terms of Service</Text>
          </TouchableOpacity>
        </View>
      )}
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
    flex: 1,
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  lastUpdated: {
    padding: 16,
    backgroundColor: Colors.light.primaryLight,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  lastUpdatedText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    textAlign: 'center',
  },
  section: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  sectionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 8,
    marginTop: 2,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.light.secondaryText,
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.light.cardBackground,
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondaryText,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 32,
  },
  acceptContainer: {
    padding: 16,
    borderTopWidth: 0.5,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  acceptButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
});
