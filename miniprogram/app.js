const { loadOrInit, STORAGE_KEYS } = require("./utils/storage");
const { starterTasks, assessments, microActions } = require("./utils/mock");

App({
  globalData: {
    version: "0.1.0"
  },
  onLaunch() {
    loadOrInit(STORAGE_KEYS.TASKS, starterTasks);
    loadOrInit(STORAGE_KEYS.ASSESSMENTS, assessments);
    loadOrInit("microActions", microActions);
  }
});
