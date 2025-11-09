/**
 * プライバシーポリシー取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  successResponse,
  internalErrorResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';

interface PrivacySection {
  id: string;
  title: string;
  content: string;
}

/**
 * プライバシーポリシー取得Lambda関数
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // バージョン指定（オプション）
    const version = event.queryStringParameters?.version || 'latest';

    // TODO: DynamoDBまたはS3から取得する場合
    // const policy = await getItem({
    //   TableName: TableNames.LEGAL,
    //   Key: {
    //     PK: 'PRIVACY',
    //     SK: `VERSION#${version}`,
    //   },
    // });

    // モックデータ
    const sections: PrivacySection[] = [
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
        content: 'If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:\n\nEmail: privacy@piece.app\nData Protection Officer: dpo@piece.app\nAddress: Pièce Inc., 123 Fashion Street, New York, NY 10001\n\nFor GDPR-related inquiries (EU residents):\nEmail: gdpr@piece.app\n\nFor CCPA-related inquiries (California residents):\nEmail: ccpa@piece.app',
      },
    ];

    return successResponse({
      sections,
      version,
      lastUpdated: '2025-11-09',
      compliance: {
        gdpr: true,
        ccpa: true,
      },
    });
  } catch (error: any) {
    logError(error as Error, { handler: 'getPrivacyPolicy' });

    if (error.code && error.statusCode) {
      return {
        statusCode: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        }),
      };
    }

    return internalErrorResponse('プライバシーポリシー取得中にエラーが発生しました');
  }
};
