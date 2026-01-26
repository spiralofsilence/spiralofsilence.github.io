const { formatDate, formatDateTime } = require("../../utils/date");
const {
  STORAGE_KEYS,
  getStorage,
  setStorage
} = require("../../utils/storage");

const TAGS = ["平静", "愉快", "疲惫", "紧张", "生气", "无助", "满足", "焦虑"];

Page({
  data: {
    todayKey: "",
    score: 3,
    note: "",
    tags: TAGS,
    selectedTags: [],
    recentLogs: []
  },
  onShow() {
    const todayKey = formatDate();
    const logs = getStorage(STORAGE_KEYS.MOOD_LOGS, []);
    const todayLog = logs.find((log) => log.dateKey === todayKey);
    const recentLogs = logs.slice(0, 7).map((log) => ({
      ...log,
      timeLabel: formatDateTime(new Date(log.createdAt))
    }));
    this.setData({
      todayKey,
      score: todayLog ? todayLog.score : 3,
      note: todayLog ? todayLog.note : "",
      selectedTags: todayLog ? todayLog.tags || [] : [],
      recentLogs
    });
  },
  onScoreChange(e) {
    this.setData({ score: e.detail.value });
  },
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const selected = new Set(this.data.selectedTags);
    if (selected.has(tag)) {
      selected.delete(tag);
    } else {
      selected.add(tag);
    }
    this.setData({ selectedTags: Array.from(selected) });
  },
  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },
  saveMood() {
    const logs = getStorage(STORAGE_KEYS.MOOD_LOGS, []);
    const todayKey = formatDate();
    const existingIndex = logs.findIndex((log) => log.dateKey === todayKey);
    const entry = {
      id: existingIndex >= 0 ? logs[existingIndex].id : `mood_${Date.now()}`,
      dateKey: todayKey,
      score: Number(this.data.score),
      tags: this.data.selectedTags,
      note: this.data.note,
      createdAt: Date.now()
    };
    if (existingIndex >= 0) {
      logs.splice(existingIndex, 1, entry);
    } else {
      logs.unshift(entry);
    }
    setStorage(STORAGE_KEYS.MOOD_LOGS, logs);
    wx.showToast({ title: "已保存", icon: "success" });
    this.onShow();
  }
});
