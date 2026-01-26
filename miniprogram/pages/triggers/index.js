const config = require("../../config");
const { formatDate, daysBetween } = require("../../utils/date");
const {
  STORAGE_KEYS,
  getStorage,
  setStorage,
  appendToList
} = require("../../utils/storage");

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
    }
  },
  onShow() {
    const settings = {
      ...this.data.settings,
      ...getStorage(STORAGE_KEYS.SETTINGS, {})
    };
    this.setData({ settings });
    this.refreshSummary(settings);
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
    const keywordHits = this.collectKeywordHits(
      settings.keywordList,
      moodLogs,
      deepRecords
    );
    this.setData({
      summary: {
        missedDays,
        lastCheckin,
        lowMoodHits,
        keywordHits
      }
    });
  },
  collectKeywordHits(keywordList, moodLogs, deepRecords) {
    if (!keywordList || keywordList.length === 0) {
      return [];
    }
    const pool = [];
    moodLogs.forEach((log) => {
      if (log.note) pool.push(log.note);
    });
    deepRecords.forEach((record) => {
      if (record.reflection) pool.push(record.reflection);
      if (record.moodChange) pool.push(record.moodChange);
      if (record.keywords) pool.push(record.keywords.join(" "));
    });
    const hits = [];
    keywordList.forEach((keyword) => {
      const count = pool.filter((text) => text.includes(keyword)).length;
      if (count > 0) {
        hits.push({ keyword, count });
      }
    });
    return hits;
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
  }
});
