const config = require("../../config");
const { formatDateTime } = require("../../utils/date");
const {
  STORAGE_KEYS,
  getStorage,
  setStorage
} = require("../../utils/storage");
const { aiQuickPrompts, getMockAiReply } = require("../../utils/mock");
const { askAi } = require("../../utils/ai");
const { ensureOnboarding } = require("../../utils/onboarding");

const systemPrompt =
  "你是一位家庭教育顾问，遵循共情、尊重与可执行建议的原则。回答要避免诊断式表述，使用建议与引导式表达，鼓励记录可量化的行动与反馈。";

Page({
  data: {
    messages: [],
    inputText: "",
    quickPrompts: aiQuickPrompts,
    loading: false,
    feedbackMap: {},
    mockEnabled: config.mockEnabled
  },
  onShow() {
    if (!ensureOnboarding()) return;
    const messages = getStorage(STORAGE_KEYS.AI_CHATS, []).map((msg) => ({
      ...msg,
      timeLabel: formatDateTime(new Date(msg.createdAt))
    }));
    const feedbackList = getStorage(STORAGE_KEYS.AI_FEEDBACK, []);
    const feedbackMap = feedbackList.reduce((acc, item) => {
      acc[item.messageId] = item;
      return acc;
    }, {});
    this.setData({ messages, feedbackMap });
  },
  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },
  usePrompt(e) {
    const prompt = e.currentTarget.dataset.prompt;
    this.setData({ inputText: prompt });
  },
  sendMessage() {
    if (this.data.loading) return;
    const content = (this.data.inputText || "").trim();
    if (!content) {
      wx.showToast({ title: "请输入问题", icon: "none" });
      return;
    }
    const userMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content,
      createdAt: Date.now()
    };
    const messages = [
      { ...userMessage, timeLabel: formatDateTime(new Date(userMessage.createdAt)) },
      ...this.data.messages
    ];
    setStorage(
      STORAGE_KEYS.AI_CHATS,
      messages.map(({ timeLabel, ...rest }) => rest)
    );
    this.setData({ messages, inputText: "", loading: true });

    const conversation = messages
      .slice(0, 8)
      .reverse()
      .map((msg) => ({ role: msg.role, content: msg.content }));
    const mockReply = getMockAiReply(content);

    askAi(
      [{ role: "system", content: systemPrompt }, ...conversation],
      mockReply,
      { prompt: content }
    )
      .then((reply) => {
        const answer =
          typeof reply === "string" ? { content: reply } : reply || {};
        const assistantMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: "assistant",
          content: answer.content || "已收到，我们会尽快补充建议。",
          tags: answer.tags || [],
          createdAt: Date.now()
        };
        const assistantWithTime = {
          ...assistantMessage,
          timeLabel: formatDateTime(new Date(assistantMessage.createdAt))
        };
        const updatedMessages = [assistantWithTime, ...messages];
        setStorage(
          STORAGE_KEYS.AI_CHATS,
          updatedMessages.map(({ timeLabel, ...rest }) => rest)
        );
        this.setData({ messages: updatedMessages, loading: false });
      })
      .catch((err) => {
        wx.showToast({ title: err.message || "请求失败", icon: "none" });
        this.setData({ loading: false });
      });
  },
  showFeedback(e) {
    const messageId = e.currentTarget.dataset.id;
    const current = this.data.feedbackMap[messageId];
    wx.showActionSheet({
      itemList: ["很满意", "比较满意", "一般", "不太满意", "不满意", "点赞", "踩"],
      success: (res) => {
        const mapping = {
          0: { rating: 5 },
          1: { rating: 4 },
          2: { rating: 3 },
          3: { rating: 2 },
          4: { rating: 1 },
          5: { like: true },
          6: { like: false }
        };
        const payload = mapping[res.tapIndex];
        if (!payload) return;
        const feedbackList = getStorage(STORAGE_KEYS.AI_FEEDBACK, []);
        const next = {
          messageId,
          updatedAt: Date.now(),
          ...current,
          ...payload
        };
        const existingIndex = feedbackList.findIndex(
          (item) => item.messageId === messageId
        );
        if (existingIndex >= 0) {
          feedbackList.splice(existingIndex, 1, next);
        } else {
          feedbackList.unshift(next);
        }
        setStorage(STORAGE_KEYS.AI_FEEDBACK, feedbackList);
        const feedbackMap = {
          ...this.data.feedbackMap,
          [messageId]: next
        };
        this.setData({ feedbackMap });
      }
    });
  }
});
