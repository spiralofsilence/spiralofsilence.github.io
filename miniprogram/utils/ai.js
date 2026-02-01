const config = require("../config");
const { STORAGE_KEYS, getStorage, appendToList } = require("./storage");

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

function requestProxy(messages) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.apiBaseUrl}/ai/chat`,
      method: "POST",
      data: { messages },
      success(res) {
        const content = res.data && res.data.content;
        if (content) {
          resolve(content.trim());
        } else {
          reject(new Error("AI代理返回格式异常"));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

function logAiEvent(payload) {
  appendToList(STORAGE_KEYS.AI_LOGS, payload);
}

function askAi(messages, mockReply, meta = {}) {
  const startedAt = Date.now();
  const settings = getStorage("settings", {});
  if (config.mockEnabled) {
    const record = {
      id: `ailog_${Date.now()}`,
      source: "mock",
      durationMs: Date.now() - startedAt,
      promptCount: messages.length,
      meta,
      createdAt: Date.now()
    };
    logAiEvent(record);
    return Promise.resolve(mockReply);
  }
  const useProxy = settings.aiUseProxy === true;
  const request = useProxy ? requestProxy : requestOpenAI;
  return request(messages)
    .then((result) => {
      logAiEvent({
        id: `ailog_${Date.now()}`,
        source: useProxy ? "proxy" : "openai",
        durationMs: Date.now() - startedAt,
        promptCount: messages.length,
        meta,
        createdAt: Date.now()
      });
      return result;
    })
    .catch((err) => {
      logAiEvent({
        id: `ailog_${Date.now()}`,
        source: useProxy ? "proxy" : "openai",
        durationMs: Date.now() - startedAt,
        promptCount: messages.length,
        meta,
        error: err.message || String(err),
        createdAt: Date.now()
      });
      throw err;
    });
}

module.exports = { askAi };
