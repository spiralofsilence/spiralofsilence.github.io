const { formatDate, formatDateTime, daysBetween } = require("../../utils/date");
const {
  STORAGE_KEYS,
  getStorage,
  setStorage,
  loadOrInit,
  appendToList
} = require("../../utils/storage");
const { ensureAssessment } = require("../../utils/gate");
const { homeworkTasks } = require("../../utils/mock");

Page({
  data: {
    title: "",
    note: "",
    attachments: [],
    tasks: [],
    selectedTaskId: "",
    logs: [],
    stats: {
      streak: 0,
      completionRate: 0,
      total: 0
    },
    role: "父母",
    commentDrafts: {},
    ratingDrafts: {},
    excellentDrafts: {}
  },
  onShow() {
    if (!ensureAssessment()) return;
    const tasks = loadOrInit(STORAGE_KEYS.HOMEWORK_TASKS, homeworkTasks);
    const submissions = getStorage(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, []);
    const legacy = getStorage(STORAGE_KEYS.HOMEWORK_LOGS, []);
    const logs = submissions.length ? submissions : legacy;
    const profile = getStorage(STORAGE_KEYS.PROFILE, {});
    this.setData({
      tasks,
      selectedTaskId: tasks[0] ? tasks[0].id : "",
      logs: logs.map((log) => ({
        ...log,
        timeLabel: formatDateTime(new Date(log.createdAt))
      })),
      stats: this.calculateStats(logs),
      role: profile.role || "父母"
    });
  },
  selectTask(e) {
    const taskId = e.currentTarget.dataset.id;
    this.setData({ selectedTaskId: taskId });
  },
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },
  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },
  chooseImage() {
    wx.chooseImage({
      count: 3,
      success: (res) => {
        const files = res.tempFilePaths.map((path) => ({
          name: "图片",
          type: "image",
          path
        }));
        this.setData({ attachments: [...this.data.attachments, ...files] });
      }
    });
  },
  chooseFile() {
    wx.chooseMessageFile({
      count: 3,
      type: "file",
      success: (res) => {
        const files = res.tempFiles.map((file) => ({
          name: file.name,
          type: "file",
          path: file.path
        }));
        this.setData({ attachments: [...this.data.attachments, ...files] });
      }
    });
  },
  chooseVideo() {
    wx.chooseVideo({
      sourceType: ["album", "camera"],
      success: (res) => {
        const file = {
          name: "视频",
          type: "video",
          path: res.tempFilePath
        };
        this.setData({ attachments: [...this.data.attachments, file] });
      }
    });
  },
  removeAttachment(e) {
    const index = e.currentTarget.dataset.index;
    const next = [...this.data.attachments];
    next.splice(index, 1);
    this.setData({ attachments: next });
  },
  submitHomework() {
    const title = (this.data.title || "").trim();
    const selectedTask = this.data.tasks.find(
      (task) => task.id === this.data.selectedTaskId
    );
    if (!selectedTask) {
      wx.showToast({ title: "请选择作业任务", icon: "none" });
      return;
    }
    const entry = {
      id: `homework_${Date.now()}`,
      dateKey: formatDate(),
      taskId: selectedTask.id,
      title: selectedTask.title,
      content: title,
      note: this.data.note,
      attachments: this.data.attachments,
      status: "submitted",
      review: {
        content: "",
        voiceUrl: "",
        rating: 0,
        isExcellent: false,
        reviewedAt: null
      },
      createdAt: Date.now()
    };
    appendToList(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, entry);
    wx.showToast({ title: "已提交", icon: "success" });
    this.setData({ title: "", note: "", attachments: [] });
    this.onShow();
  },
  onCommentInput(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      commentDrafts: {
        ...this.data.commentDrafts,
        [id]: e.detail.value
      }
    });
  },
  submitComment(e) {
    const id = e.currentTarget.dataset.id;
    const comment = (this.data.commentDrafts[id] || "").trim();
    if (!comment) {
      wx.showToast({ title: "请输入点评", icon: "none" });
      return;
    }
    const logs = getStorage(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, []);
    const index = logs.findIndex((log) => log.id === id);
    if (index >= 0) {
      logs[index].review = {
        content: comment,
        voiceUrl: "",
        rating: Number(this.data.ratingDrafts[id] || 0),
        isExcellent: Boolean(this.data.excellentDrafts[id]),
        reviewedAt: Date.now()
      };
      logs[index].status = "reviewed";
      setStorage(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, logs);
      wx.showToast({ title: "已点评", icon: "success" });
      this.onShow();
    }
  },
  onRatingInput(e) {
    const id = e.currentTarget.dataset.id;
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({
      ratingDrafts: {
        ...this.data.ratingDrafts,
        [id]: value
      }
    });
  },
  onExcellentToggle(e) {
    const id = e.currentTarget.dataset.id;
    const checked = Array.isArray(e.detail.value)
      ? e.detail.value.includes("excellent")
      : Boolean(e.detail.value);
    this.setData({
      excellentDrafts: {
        ...this.data.excellentDrafts,
        [id]: checked
      }
    });
  },
  calculateStats(logs) {
    if (!logs.length) {
      return { streak: 0, completionRate: 0, total: 0 };
    }
    const uniqueDays = Array.from(new Set(logs.map((item) => item.dateKey))).sort();
    let streak = 1;
    for (let i = uniqueDays.length - 1; i > 0; i -= 1) {
      const diff = daysBetween(uniqueDays[i - 1], uniqueDays[i]);
      if (diff === 1) {
        streak += 1;
      } else {
        break;
      }
    }
    const last7Days = 7;
    const completionRate = Math.min(100, Math.round((uniqueDays.length / last7Days) * 100));
    return { streak, completionRate, total: logs.length };
  }
});
