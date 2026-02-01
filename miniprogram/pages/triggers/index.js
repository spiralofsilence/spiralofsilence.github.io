const config = require("../../config");
const { formatDate, daysBetween } = require("../../utils/date");
const {
  STORAGE_KEYS,
  getStorage,
  setStorage,
  appendToList
} = require("../../utils/storage");
const { getMergedSettings, collectKeywordHits, applyTriggers } = require("../../utils/trigger");

Page({
  data: {
    settings: {
      consecutiveMissedDays: config.triggerDefaults.consecutiveMissedDays,
      lowMoodScore: config.triggerDefaults.lowMoodScore,
      keywordList: config.triggerDefaults.keywordList
    },
    summary: {
      missedDays: 0,
      lastCheckin: "",
      lowMoodHits: 0,
      keywordHits: []
    },
    triggerEvents: [],
    notifications: [],
    newKeyword: ""
  },
  onShow() {
    const settings = getMergedSettings();
    this.setData({ settings });
    this.refreshSummary(settings);
    const triggerEvents = getStorage(STORAGE_KEYS.TRIGGER_EVENTS, []);
    const notifications = getStorage(STORAGE_KEYS.NOTIFICATIONS, []);
    this.setData({ triggerEvents, notifications });
  },
  refreshSummary(settings) {
    const todayKey = formatDate();
    const checkins = getStorage(STORAGE_KEYS.MICRO_CHECKINS, []);
    const moodLogs = getStorage(STORAGE_KEYS.MOOD_LOGS, []);
    const deepRecords = getStorage(STORAGE_KEYS.DEEP_RECORDS, []);
    const lastCheckin = checkins[0] ? checkins[0].dateKey : "";
    const missedDays = lastCheckin
      ? daysBetween(lastCheckin, todayKey)
      : settings.consecutiveMissedDays + 1;
    const lowMoodHits = moodLogs.filter(
      (log) => log.score <= settings.lowMoodScore
    ).length;
    const keywordHits = collectKeywordHits(settings.keywordList, moodLogs, deepRecords);
    this.setData({
      summary: {
        missedDays,
        lastCheckin,
        lowMoodHits,
        keywordHits
      }
    });
  },
  onMissedDaysInput(e) {
    const value = Number(e.detail.value);
    this.updateSettings({ consecutiveMissedDays: value });
  },
  onLowMoodChange(e) {
    const value = Number(e.detail.value);
    this.updateSettings({ lowMoodScore: value });
  },
  onKeywordInput(e) {
    this.setData({ newKeyword: e.detail.value });
  },
  addKeyword() {
    const keyword = (this.data.newKeyword || "").trim();
    if (!keyword) return;
    const keywordList = Array.from(
      new Set([...this.data.settings.keywordList, keyword])
    );
    this.updateSettings({ keywordList }, true);
    this.setData({ newKeyword: "" });
  },
  removeKeyword(e) {
    const keyword = e.currentTarget.dataset.keyword;
    const keywordList = this.data.settings.keywordList.filter(
      (item) => item !== keyword
    );
    this.updateSettings({ keywordList }, true);
  },
  updateSettings(partial, refresh = true) {
    const settings = { ...this.data.settings, ...partial };
    setStorage(STORAGE_KEYS.SETTINGS, settings);
    this.setData({ settings });
    if (refresh) {
      this.refreshSummary(settings);
    }
  },
  submitHelpSignal() {
    const entry = {
      id: `trigger_${Date.now()}`,
      type: "manual",
      createdAt: Date.now(),
      message:
        "看来您遇到了一些挑战，我们的专业顾问可以为您提供一次15分钟的免费分析。"
    };
    appendToList(STORAGE_KEYS.TRIGGER_EVENTS, entry);
    wx.showModal({
      title: "求助信号已发出",
      content: entry.message,
      showCancel: false
    });
  },
  runAutoTrigger() {
    const events = applyTriggers({ notify: true });
    if (events.length) {
      this.onShow();
    } else {
      wx.showToast({ title: "暂无新触发", icon: "none" });
    }
  },
  markNotificationSent(e) {
    const id = e.currentTarget.dataset.id;
    const list = getStorage(STORAGE_KEYS.NOTIFICATIONS, []);
    const index = list.findIndex((item) => item.id === id);
    if (index >= 0) {
      list[index].status = "sent";
      list[index].sentAt = Date.now();
      setStorage(STORAGE_KEYS.NOTIFICATIONS, list);
      this.setData({ notifications: list });
    }
  }
});
