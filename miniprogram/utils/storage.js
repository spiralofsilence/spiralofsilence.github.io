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
  AI_LOGS: "aiLogs",
  ASSESSMENTS: "assessments",
  ASSESSMENT_REPORTS: "assessmentReports",
  ASSESSMENT_PROGRESS: "assessmentProgress",
  PROFILE: "userProfile",
  CONTRACT: "contractRecord",
  CONTRACT_TEMPLATES: "contractTemplates",
  CONTRACT_RECORDS: "contractRecords",
  CONTRACT_ASSIGNMENTS: "contractAssignments",
  USERS: "users",
  SERVICE_PLAN: "servicePlan",
  HOMEWORK_LOGS: "homeworkLogs",
  HOMEWORK_TASKS: "homeworkTasks",
  HOMEWORK_SUBMISSIONS: "homeworkSubmissions",
  HOMEWORK_STATS: "homeworkStats",
  PAYMENT_LOGS: "paymentLogs",
  NOTIFICATIONS: "notificationQueue",
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
