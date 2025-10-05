import { GoogleGenerativeAI } from '@google/generative-ai';
import { backoff } from 'exponential-backoff';
import Constants from 'expo-constants';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey;
const TIMEOUT_MS = 15000;

interface GenerateImageRequest {
  prompt: string;
  avatarImage: string; // base64
  itemImage: string; // base64
  aspectRatio?: string;
}

interface GenerateImageResponse {
  success: boolean;
  image?: string; // base64
  error?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as GenerateImageRequest;
    const { prompt, avatarImage, itemImage, aspectRatio = '1:1' } = body;

    if (!prompt || !avatarImage || !itemImage) {
      return Response.json(
        { success: false, error: 'Prompt, avatarImage, and itemImage are required' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return Response.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

    // Generate image with exponential backoff
    const result = await backoff(
      async () => {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_MS)
        );

        const generatePromise = model.generateContent({
          contents: [{
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: avatarImage,
                },
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: itemImage,
                },
              },
              { text: prompt },
            ],
          }],
          generationConfig: {
            responseModalities: ['image'],
            aspectRatio: aspectRatio,
          },
        });

        return Promise.race([generatePromise, timeoutPromise]);
      },
      {
        numOfAttempts: 3,
        startingDelay: 1000,
        timeMultiple: 2,
        retry: (error: any) => {
          // Retry on 429 (rate limit) or 5xx errors
          const status = error?.response?.status || error?.status;
          return status === 429 || (status >= 500 && status < 600);
        },
      }
    );

    // Extract base64 image from response
    const response = result as any;
    const imagePart = response?.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData
    );

    if (!imagePart?.inlineData?.data) {
      return Response.json(
        { success: false, error: 'No image data in response' },
        { status: 500 }
      );
    }

    const base64Image = imagePart.inlineData.data;

    return Response.json({
      success: true,
      image: base64Image,
    } as GenerateImageResponse);

  } catch (error: any) {
    console.error('Image generation error:', error);

    const errorMessage = error?.message || 'Unknown error occurred';
    const status = error?.response?.status || 500;

    return Response.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}
