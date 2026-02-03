const { formatDate } = require("../../utils/date");
const {
  STORAGE_KEYS,
  appendToList
} = require("../../utils/storage");
const { applyTriggers } = require("../../utils/trigger");
const { ensureAssessment } = require("../../utils/gate");

Page({
  data: {
    taskId: "",
    taskTitle: "",
    interactionScore: 3,
    moodChange: "",
    reflection: "",
    keywords: ""
  },
  onLoad(options) {
    if (!ensureAssessment()) return;
    this.setData({
      taskId: options.taskId || "",
      taskTitle: options.taskTitle ? decodeURIComponent(options.taskTitle) : ""
    });
  },
  onInteractionChange(e) {
    this.setData({ interactionScore: e.detail.value });
  },
  onMoodChangeInput(e) {
    this.setData({ moodChange: e.detail.value });
  },
  onReflectionInput(e) {
    this.setData({ reflection: e.detail.value });
  },
  onKeywordsInput(e) {
    this.setData({ keywords: e.detail.value });
  },
  saveRecord() {
    const entry = {
      id: `record_${Date.now()}`,
      dateKey: formatDate(),
      taskId: this.data.taskId,
      taskTitle: this.data.taskTitle,
      interactionScore: Number(this.data.interactionScore),
      moodChange: this.data.moodChange,
      reflection: this.data.reflection,
      keywords: this.data.keywords
        .split(/[,，\s]+/)
        .map((item) => item.trim())
        .filter(Boolean),
      createdAt: Date.now()
    };
    appendToList(STORAGE_KEYS.DEEP_RECORDS, entry);
    wx.showToast({ title: "已保存", icon: "success" });
    applyTriggers();
    this.setData({
      interactionScore: 3,
      moodChange: "",
      reflection: "",
      keywords: ""
    });
  }
});
