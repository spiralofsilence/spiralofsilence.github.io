const { formatDate, formatDateTime } = require("../../utils/date");
const {
  STORAGE_KEYS,
  getStorage,
  loadOrInit,
  appendToList
} = require("../../utils/storage");
const { microActions } = require("../../utils/mock");

Page({
  data: {
    todayKey: "",
    actions: [],
    selectedAction: "",
    note: "",
    todayLogs: []
  },
  onShow() {
    const todayKey = formatDate();
    const actions = loadOrInit("microActions", microActions);
    const logs = getStorage(STORAGE_KEYS.MICRO_CHECKINS, []);
    const todayLogs = logs
      .filter((log) => log.dateKey === todayKey)
      .map((log) => ({
        ...log,
        timeLabel: formatDateTime(new Date(log.createdAt))
      }));
    this.setData({
      todayKey,
      actions,
      selectedAction: actions[0] || "",
      todayLogs
    });
  },
  selectAction(e) {
    this.setData({ selectedAction: e.currentTarget.dataset.action });
  },
  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },
  submitCheckin() {
    if (!this.data.selectedAction) {
      wx.showToast({ title: "请选择微行动", icon: "none" });
      return;
    }
    const entry = {
      id: `checkin_${Date.now()}`,
      dateKey: formatDate(),
      action: this.data.selectedAction,
      note: this.data.note,
      createdAt: Date.now()
    };
    appendToList(STORAGE_KEYS.MICRO_CHECKINS, entry);
    wx.showToast({ title: "已打卡", icon: "success" });
    this.setData({ note: "" });
    this.onShow();
  }
});
