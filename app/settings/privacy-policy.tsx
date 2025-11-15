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
import { ChevronLeft, Share2, Printer, Shield } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';

interface PrivacySection {
  id: string;
  title: string;
  content: string;
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [sections, setSections] = useState<PrivacySection[]>([]);
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    fetchPrivacyPolicy();
  }, []);

  const fetchPrivacyPolicy = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/legal/privacy-policy');
      // const data = await response.json();
      // setSections(data.sections);
      // setLastUpdated(data.lastUpdated);

      // Mock data
      const mockSections: PrivacySection[] = [
        {
          id: '1',
          title: 'Information We Collect',
          content: 'We collect information that you provide directly to us, including:\n\n• Account information (username, email, password)\n• Profile information (name, photo, bio)\n• Content you post (photos, videos, comments, messages)\n• Payment information (for purchases and transactions)\n• Communications with us\n\nWe also automatically collect certain information about your device and usage:\n\n• Device information (model, operating system, unique identifiers)\n• Usage information (features used, actions taken, time spent)\n• Location information (with your permission)\n• Log data (IP address, browser type, pages visited)',
        },
        {
          id: '2',
          title: 'How We Use Your Information',
          content: 'We use the information we collect to:\n\n• Provide, maintain, and improve our Service\n• Personalize your experience and content recommendations\n• Process transactions and send related information\n• Send you technical notices, updates, and support messages\n• Respond to your comments and questions\n• Monitor and analyze trends, usage, and activities\n• Detect, investigate, and prevent security incidents\n• Comply with legal obligations\n• Enforce our Terms of Service',
        },
        {
          id: '3',
          title: 'Information Sharing',
          content: 'We may share your information in the following circumstances:\n\n• With other users: Your profile and content are visible to other users according to your privacy settings\n• With service providers: We share information with vendors who perform services on our behalf\n• For legal reasons: We may disclose information if required by law or in response to legal requests\n• Business transfers: In connection with a merger, acquisition, or sale of assets\n• With your consent: We may share information for any other purpose with your consent',
        },
        {
          id: '4',
          title: 'Data Security',
          content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:\n\n• Encryption of data in transit and at rest\n• Regular security assessments and audits\n• Access controls and authentication\n• Employee training on data protection\n\nHowever, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.',
        },
        {
          id: '5',
          title: 'Your Rights',
          content: 'You have the following rights regarding your personal information:\n\n• Access: You can request access to your personal information\n• Correction: You can update or correct inaccurate information\n• Deletion: You can request deletion of your account and data\n• Portability: You can request a copy of your data in a portable format\n• Objection: You can object to certain processing of your information\n• Withdrawal: You can withdraw consent for processing based on consent\n\nTo exercise these rights, please contact us at privacy@piece.app',
        },
        {
          id: '6',
          title: 'Cookies & Tracking',
          content: 'We use cookies and similar tracking technologies to collect and track information about your use of our Service. Cookies are small data files stored on your device.\n\nTypes of cookies we use:\n\n• Essential cookies: Required for the Service to function\n• Analytics cookies: Help us understand how users interact with the Service\n• Preference cookies: Remember your settings and preferences\n• Advertising cookies: Deliver relevant advertisements\n\nYou can control cookies through your browser settings, but disabling certain cookies may limit functionality.',
        },
        {
          id: '7',
          title: "Children's Privacy",
          content: 'Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at privacy@piece.app and we will take steps to delete such information.',
        },
        {
          id: '8',
          title: 'International Transfers',
          content: 'Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from the laws of your country.\n\nWe take appropriate safeguards to ensure that your personal information remains protected in accordance with this Privacy Policy, including:\n\n• Standard contractual clauses approved by the European Commission\n• Privacy Shield certification (where applicable)\n• Other legally approved mechanisms',
        },
        {
          id: '9',
          title: 'Changes to Privacy Policy',
          content: 'We may update this Privacy Policy from time to time. We will notify you of any material changes by:\n\n• Posting the new Privacy Policy on this page\n• Updating the "Last Updated" date\n• Sending you an email notification (if you have provided your email)\n• Displaying a prominent notice on our Service\n\nYour continued use of the Service after any changes constitutes your acceptance of the revised Privacy Policy.',
        },
        {
          id: '10',
          title: 'Contact Us',
          content: 'If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:\n\nEmail: privacy@piece.app\nData Protection Officer: dpo@piece.app\nAddress: Pièce Inc., 123 Fashion Street, New York, NY 10001\n\nFor GDPR-related inquiries (EU residents):\nEmail: gdpr@piece.app\n\nFor CCPA-related inquiries (California residents):\nEmail: ccpa@piece.app\n\nLast Updated: November 9, 2025',
        },
      ];

      setSections(mockSections);
      setLastUpdated('November 9, 2025');
    } catch (error) {
      console.error('Failed to fetch privacy policy:', error);
      Alert.alert('Error', 'Failed to load privacy policy');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/legal/privacy-policy/accept', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      // });

      setAccepted(true);
      Alert.alert('Success', 'You have accepted the Privacy Policy');
      router.back();
    } catch (error) {
      console.error('Failed to accept privacy policy:', error);
      Alert.alert('Error', 'Failed to accept privacy policy');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Pièce Privacy Policy\n\nView the full policy at: https://piece.app/privacy',
        title: 'Pièce Privacy Policy',
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      backgroundColor: colors.primaryLight,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    lastUpdatedText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 8,
    },
    complianceNotice: {
      padding: 16,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    complianceTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    complianceText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.secondaryText,
    },
    section: {
      flexDirection: 'row',
      padding: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    sectionNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginRight: 8,
      marginTop: 2,
    },
    sectionContent: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    sectionText: {
      fontSize: 15,
      lineHeight: 24,
      color: colors.secondaryText,
    },
    footer: {
      padding: 16,
      backgroundColor: colors.cardBackground,
      marginTop: 16,
    },
    footerText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.secondaryText,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    bottomPadding: {
      height: 32,
    },
    acceptContainer: {
      padding: 16,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    acceptButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    acceptButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.background,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
            <Share2 size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePrint} style={styles.iconButton}>
            <Printer size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Last Updated */}
        <View style={styles.lastUpdated}>
          <Shield size={20} color={colors.primary} />
          <Text style={styles.lastUpdatedText}>Last Updated: {lastUpdated}</Text>
        </View>

        {/* Compliance Notices */}
        <View style={styles.complianceNotice}>
          <Text style={styles.complianceTitle}>Privacy Compliance</Text>
          <Text style={styles.complianceText}>
            This Privacy Policy complies with GDPR (EU General Data Protection Regulation) and CCPA
            (California Consumer Privacy Act) requirements. We are committed to protecting your
            privacy and ensuring transparency in our data practices.
          </Text>
        </View>

        {/* Privacy Sections */}
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
            This Privacy Policy is effective as of the date stated above and will remain in effect
            except with respect to any changes in its provisions in the future, which will be in
            effect immediately after being posted on this page.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Accept Button (for first-time users) */}
      {!accepted && (
        <View style={[styles.acceptContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.acceptButtonText}>Accept Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}