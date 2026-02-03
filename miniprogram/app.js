const { loadOrInit, STORAGE_KEYS } = require("./utils/storage");
const {
  starterTasks,
  assessments,
  microActions,
  contractTemplates,
  homeworkTasks
} = require("./utils/mock");

App({
  globalData: {
    version: "0.1.0"
  },
  onLaunch() {
    loadOrInit(STORAGE_KEYS.TASKS, starterTasks);
    const storedAssessments = loadOrInit(STORAGE_KEYS.ASSESSMENTS, assessments);
    if (storedAssessments.length < assessments.length) {
      wx.setStorageSync(STORAGE_KEYS.ASSESSMENTS, assessments);
    }
    loadOrInit("microActions", microActions);
    loadOrInit(STORAGE_KEYS.CONTRACT_TEMPLATES, contractTemplates);
    loadOrInit(STORAGE_KEYS.HOMEWORK_TASKS, homeworkTasks);
    const settings = loadOrInit(STORAGE_KEYS.SETTINGS, {});
    if (settings.activeAssessmentId === undefined) {
      wx.setStorageSync(STORAGE_KEYS.SETTINGS, {
        ...settings,
        activeAssessmentId: "",
        assessmentRequired: false
      });
    }
  }
});
