const { loadOrInit, STORAGE_KEYS } = require("./utils/storage");
const { starterTasks, assessments, microActions } = require("./utils/mock");

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
  }
});
