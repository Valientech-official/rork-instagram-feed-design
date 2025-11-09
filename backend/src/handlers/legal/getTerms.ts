/**
 * 利用規約取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  successResponse,
  internalErrorResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';

interface TermsSection {
  id: string;
  title: string;
  content: string;
}

/**
 * 利用規約取得Lambda関数
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // バージョン指定（オプション）
    const version = event.queryStringParameters?.version || 'latest';

    // TODO: DynamoDBまたはS3から取得する場合
    // const terms = await getItem({
    //   TableName: TableNames.LEGAL,
    //   Key: {
    //     PK: 'TERMS',
    //     SK: `VERSION#${version}`,
    //   },
    // });

    // モックデータ
    const sections: TermsSection[] = [
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
        content: 'If you have any questions about these Terms, please contact us at:\n\nEmail: legal@piece.app\nAddress: Pièce Inc., 123 Fashion Street, New York, NY 10001',
      },
    ];

    return successResponse({
      sections,
      version,
      lastUpdated: '2025-11-09',
    });
  } catch (error: any) {
    logError(error as Error, { handler: 'getTerms' });

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

    return internalErrorResponse('利用規約取得中にエラーが発生しました');
  }
};
