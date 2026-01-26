const { formatDate } = require("./date");
const { createId } = require("./id");

const STORAGE_KEYS = {
  TASKS: "tasks",
  TASK_LOGS: "taskLogs",
  MOOD_LOGS: "moodLogs",
  MICRO_CHECKINS: "microCheckins",
  DEEP_RECORDS: "deepRecords",
  AI_CHATS: "aiChats",
  AI_FEEDBACK: "aiFeedback",
  ASSESSMENTS: "assessments",
  ASSESSMENT_REPORTS: "assessmentReports",
  PROFILE: "userProfile",
  TRIGGER_EVENTS: "triggerEvents",
  SETTINGS: "settings"
};

function getStorage(key, defaultValue) {
  const value = wx.getStorageSync(key);
  if (value === "" || value === undefined) {
    return defaultValue;
  }
  return value;
}

function setStorage(key, value) {
  wx.setStorageSync(key, value);
}

function loadOrInit(key, defaultValue) {
  const existing = getStorage(key);
  if (existing === undefined || existing === "") {
    setStorage(key, defaultValue);
    return defaultValue;
  }
  return existing;
}

function appendToList(key, item) {
  const list = getStorage(key, []);
  list.unshift(item);
  setStorage(key, list);
  return list;
}

function updateList(key, updater) {
  const list = getStorage(key, []);
  const updated = updater(list) || list;
  setStorage(key, updated);
  return updated;
}

function createDailyRecord(extra = {}) {
  return {
    id: createId("record"),
    dateKey: formatDate(),
    createdAt: Date.now(),
    ...extra
  };
}

module.exports = {
  STORAGE_KEYS,
  getStorage,
  setStorage,
  loadOrInit,
  appendToList,
  updateList,
  createDailyRecord
};
