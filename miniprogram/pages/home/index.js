const { formatDate } = require("../../utils/date");
const {
  STORAGE_KEYS,
  getStorage,
  loadOrInit
} = require("../../utils/storage");
const { starterTasks, microActions } = require("../../utils/mock");
const { applyTriggers } = require("../../utils/trigger");

Page({
  data: {
    todayKey: "",
    summary: {
      taskCount: 0,
      completedTasks: 0,
      moodScore: null,
      checkins: 0,
      streak: 0
    },
    highlightTask: null,
    microAction: "",
    triggerEvents: []
  },
  onShow() {
    const todayKey = formatDate();
    const tasks = loadOrInit(STORAGE_KEYS.TASKS, starterTasks);
    const taskLogs = getStorage(STORAGE_KEYS.TASK_LOGS, []);
    const moodLogs = getStorage(STORAGE_KEYS.MOOD_LOGS, []);
    const checkins = getStorage(STORAGE_KEYS.MICRO_CHECKINS, []);
    applyTriggers();
    const triggerEvents = getStorage(STORAGE_KEYS.TRIGGER_EVENTS, []);
    const moodToday = moodLogs.find((log) => log.dateKey === todayKey);
    const completedTasks = taskLogs.filter(
      (log) => log.dateKey === todayKey
    );
    const todayCheckins = checkins.filter((log) => log.dateKey === todayKey);
    const streak = this.calculateStreak(checkins);
    const microActionList = loadOrInit("microActions", microActions);

    this.setData({
      todayKey,
      summary: {
        taskCount: tasks.length,
        completedTasks: completedTasks.length,
        moodScore: moodToday ? moodToday.score : null,
        checkins: todayCheckins.length,
        streak
      },
      highlightTask: tasks[0] || null,
      microAction:
        microActionList[Math.floor(Math.random() * microActionList.length)] ||
        "",
      triggerEvents
    });
  },
  calculateStreak(checkins) {
    if (!checkins.length) return 0;
    const uniqueDays = Array.from(
      new Set(checkins.map((item) => item.dateKey))
    ).sort();
    let streak = 1;
    for (let i = uniqueDays.length - 1; i > 0; i -= 1) {
      const current = new Date(uniqueDays[i]);
      const prev = new Date(uniqueDays[i - 1]);
      const diff = current.getTime() - prev.getTime();
      if (diff === 24 * 60 * 60 * 1000) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  },
  goTo(page) {
    const tabPages = ["home", "tasks", "checkin", "ai", "profile"];
    if (tabPages.includes(page)) {
      wx.switchTab({ url: `/pages/${page}/index` });
    } else {
      wx.navigateTo({ url: `/pages/${page}/index` });
    }
  },
  openTriggers() {
    wx.navigateTo({
      url: "/pages/triggers/index"
    });
  }
});
