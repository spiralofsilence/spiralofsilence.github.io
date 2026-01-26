const config = {
  appName: "育儿陪伴",
  mockEnabled: true,
  apiBaseUrl: "https://example.com/api",
  ai: {
    provider: "openai",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    temperature: 0.6
  },
  triggerDefaults: {
    consecutiveMissedDays: 3,
    lowMoodScore: 2,
    keywordList: ["厌学", "情绪崩溃", "失控", "焦虑", "抑郁"]
  }
};

module.exports = config;
