const { formatDate, formatDateTime } = require("../../utils/date");
const {
  STORAGE_KEYS,
  getStorage,
  loadOrInit,
  appendToList
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
    triggerEvents: [],
    tasks: [],
    visibleTasks: [],
    todayTaskLogs: [],
    actions: [],
    selectedAction: "",
    checkinNote: "",
    todayCheckins: [],
    showAllTasks: false
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
    const selectedAction =
      this.data.selectedAction && microActionList.includes(this.data.selectedAction)
        ? this.data.selectedAction
        : microActionList[0] || "";
    const todayTaskLogs = taskLogs
      .filter((log) => log.dateKey === todayKey)
      .map((log) => ({
        ...log,
        timeLabel: formatDateTime(new Date(log.createdAt))
      }));
    const todayCheckinsWithTime = todayCheckins.map((log) => ({
      ...log,
      timeLabel: formatDateTime(new Date(log.createdAt))
    }));
    const showAllTasks = this.data.showAllTasks;
    const visibleTasks = showAllTasks ? tasks : tasks.slice(0, 3);

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
      triggerEvents,
      tasks,
      visibleTasks,
      todayTaskLogs,
      actions: microActionList,
      selectedAction,
      todayCheckins: todayCheckinsWithTime
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
  goTo(e) {
    const page = e.currentTarget.dataset.page;
    if (!page) return;
    const tabPages = ["home", "ai", "profile"];
    if (tabPages.includes(page)) {
      wx.switchTab({ url: `/pages/${page}/index` });
    } else {
      wx.navigateTo({ url: `/pages/${page}/index` });
    }
  },
  toggleTaskList() {
    const showAllTasks = !this.data.showAllTasks;
    const visibleTasks = showAllTasks
      ? this.data.tasks
      : this.data.tasks.slice(0, 3);
    this.setData({ showAllTasks, visibleTasks });
  },
  markComplete(e) {
    const task = e.currentTarget.dataset.task;
    if (!task) return;
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
    if (!task) return;
    wx.navigateTo({
      url: `/pages/record/index?taskId=${task.id}&taskTitle=${encodeURIComponent(
        task.title
      )}`
    });
  },
  selectAction(e) {
    const action = e.currentTarget.dataset.action;
    if (!action) return;
    this.setData({ selectedAction: action });
  },
  onCheckinNoteInput(e) {
    this.setData({ checkinNote: e.detail.value });
  },
  submitCheckin() {
    const action = this.data.selectedAction;
    if (!action) {
      wx.showToast({ title: "请选择微行动", icon: "none" });
      return;
    }
    const entry = {
      id: `checkin_${Date.now()}`,
      dateKey: formatDate(),
      action,
      note: this.data.checkinNote,
      createdAt: Date.now()
    };
    appendToList(STORAGE_KEYS.MICRO_CHECKINS, entry);
    wx.showToast({ title: "已打卡", icon: "success" });
    this.setData({ checkinNote: "" });
    applyTriggers();
    this.onShow();
  },
  quickCheckin() {
    const action = this.data.microAction;
    if (!action) {
      wx.showToast({ title: "暂无可用微行动", icon: "none" });
      return;
    }
    const entry = {
      id: `checkin_${Date.now()}`,
      dateKey: formatDate(),
      action,
      note: "",
      createdAt: Date.now()
    };
    appendToList(STORAGE_KEYS.MICRO_CHECKINS, entry);
    wx.showToast({ title: "已打卡", icon: "success" });
    applyTriggers();
    this.onShow();
  },
  openTriggers() {
    wx.navigateTo({
      url: "/pages/triggers/index"
    });
  }
});
