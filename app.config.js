module.exports = {
  ...require('./app.json').expo,
  extra: {
    ...require('./app.json').expo.extra,
    geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    // AWS Backend Configuration
    API_URL: process.env.EXPO_PUBLIC_API_URL,
    COGNITO_USER_POOL_ID: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID,
    COGNITO_REGION: process.env.EXPO_PUBLIC_COGNITO_REGION,
    S3_BUCKET_NAME: process.env.EXPO_PUBLIC_S3_BUCKET_NAME,
    S3_REGION: process.env.EXPO_PUBLIC_S3_REGION,
    AWS_ACCOUNT_ID: process.env.EXPO_PUBLIC_AWS_ACCOUNT_ID,
    ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT,
  },
};
