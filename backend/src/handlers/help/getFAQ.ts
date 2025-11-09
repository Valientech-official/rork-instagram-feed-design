/**
 * FAQ取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  successResponse,
  internalErrorResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

/**
 * FAQ取得Lambda関数
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // カテゴリフィルター（オプション）
    const category = event.queryStringParameters?.category;

    // TODO: DynamoDBから取得する場合
    // const faqs = await query<FAQItem>({
    //   TableName: TableNames.FAQ,
    //   IndexName: 'CategoryIndex',
    //   KeyConditionExpression: 'category = :category',
    //   ExpressionAttributeValues: {
    //     ':category': category || 'general',
    //   },
    // });

    // モックデータ
    const allFAQs: FAQItem[] = [
      {
        id: '1',
        question: 'How do I create a new account?',
        answer: 'To create a new account, tap the "Sign Up" button on the login screen. Enter your email, username, and password. You will receive a verification email to confirm your account.',
        category: 'getting-started',
        order: 1,
      },
      {
        id: '2',
        question: 'How do I reset my password?',
        answer: 'On the login screen, tap "Forgot Password?". Enter your email address and we will send you instructions to reset your password.',
        category: 'account',
        order: 1,
      },
      {
        id: '3',
        question: 'How do I upload a photo?',
        answer: 'Tap the "+" button at the bottom of the screen. Select a photo from your gallery or take a new one. Add a caption and filters if desired, then tap "Share".',
        category: 'getting-started',
        order: 2,
      },
      {
        id: '4',
        question: 'How do I report inappropriate content?',
        answer: 'Tap the three dots menu on any post. Select "Report" and choose the reason for reporting. Our team will review the content.',
        category: 'safety',
        order: 1,
      },
      {
        id: '5',
        question: 'How do I change my privacy settings?',
        answer: 'Go to Settings > Privacy & Security. Here you can control who can see your posts, stories, and profile information.',
        category: 'privacy',
        order: 1,
      },
      {
        id: '6',
        question: 'What should I do if I can\'t log in?',
        answer: 'First, make sure you\'re using the correct email and password. If you\'ve forgotten your password, use the "Forgot Password" option. If issues persist, contact support.',
        category: 'troubleshooting',
        order: 1,
      },
      {
        id: '7',
        question: 'How do I delete my account?',
        answer: 'Go to Settings > Account > Delete Account. Please note that this action is permanent and cannot be undone. All your data will be permanently deleted.',
        category: 'account',
        order: 2,
      },
    ];

    // カテゴリでフィルター
    const faqs = category
      ? allFAQs.filter(faq => faq.category === category)
      : allFAQs;

    return successResponse({
      faqs: faqs.sort((a, b) => a.order - b.order),
      total: faqs.length,
    });
  } catch (error: any) {
    logError(error as Error, { handler: 'getFAQ' });

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

    return internalErrorResponse('FAQ取得中にエラーが発生しました');
  }
};
