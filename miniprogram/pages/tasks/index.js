const { formatDate, formatDateTime } = require("../../utils/date");
const {
  STORAGE_KEYS,
  getStorage,
  appendToList
} = require("../../utils/storage");
const { starterTasks } = require("../../utils/mock");
const { requestSubscription } = require("../../utils/subscribe");

Page({
  data: {
    todayKey: "",
    tasks: [],
    todayLogs: []
  },
  onShow() {
    const todayKey = formatDate();
    const tasks = getStorage(STORAGE_KEYS.TASKS, starterTasks);
    const logs = getStorage(STORAGE_KEYS.TASK_LOGS, []);
    const todayLogs = logs
      .filter((log) => log.dateKey === todayKey)
      .map((log) => ({
        ...log,
        timeLabel: formatDateTime(new Date(log.createdAt))
      }));

    this.setData({ todayKey, tasks, todayLogs });
  },
  markComplete(e) {
    const task = e.currentTarget.dataset.task;
    const entry = {
      id: `tasklog_${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      dateKey: formatDate(),
      createdAt: Date.now()
    };
    appendToList(STORAGE_KEYS.TASK_LOGS, entry);
    wx.showToast({ title: "已记录", icon: "success" });
    this.onShow();
  },
  openRecord(e) {
    const task = e.currentTarget.dataset.task;
    wx.navigateTo({
      url: `/pages/record/index?taskId=${task.id}&taskTitle=${encodeURIComponent(
        task.title
      )}`
    });
  },
  subscribeTaskReminder() {
    requestSubscription()
      .then(() => {
        appendToList(STORAGE_KEYS.NOTIFICATIONS, {
          id: `notify_${Date.now()}`,
          type: "task_reminder",
          message: "今日任务提醒",
          status: "pending",
          createdAt: Date.now()
        });
        wx.showToast({ title: "已订阅提醒", icon: "success" });
      })
      .catch((err) => {
        wx.showToast({ title: err.message || "订阅失败", icon: "none" });
      });
  }
});
