module.exports = {
  ...require('./app.json').expo,
  extra: {
    ...require('./app.json').expo.extra,
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
};
