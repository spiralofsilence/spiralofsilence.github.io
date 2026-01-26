const config = require("../config");
const { getStorage } = require("./storage");

function requestOpenAI(messages) {
  return new Promise((resolve, reject) => {
    const settings = getStorage("settings", {});
    const apiKey = settings.aiApiKey;
    if (!apiKey) {
      reject(new Error("未配置OpenAI API Key"));
      return;
    }
    wx.request({
      url: config.ai.endpoint,
      method: "POST",
      header: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      data: {
        model: config.ai.model,
        temperature: config.ai.temperature,
        messages
      },
      success(res) {
        const content =
          res.data &&
          res.data.choices &&
          res.data.choices[0] &&
          res.data.choices[0].message &&
          res.data.choices[0].message.content;
        if (content) {
          resolve(content.trim());
        } else {
          reject(new Error("OpenAI返回格式异常"));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

function askAi(messages, mockReply) {
  if (config.mockEnabled) {
    return Promise.resolve(mockReply);
  }
  return requestOpenAI(messages);
}

module.exports = { askAi };
