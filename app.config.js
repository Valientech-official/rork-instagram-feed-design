module.exports = {
  ...require('./app.json').expo,
  extra: {
    ...require('./app.json').expo.extra,
    geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  },
};
