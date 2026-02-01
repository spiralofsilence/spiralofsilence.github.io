const config = require("../config");
const { formatDate, daysBetween } = require("./date");
const { STORAGE_KEYS, getStorage, setStorage, appendToList } = require("./storage");

const DEFAULT_MESSAGE =
  "看来您遇到了一些挑战，我们的专业顾问可以为您提供一次15分钟的免费分析。";

function getMergedSettings() {
  const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
  return { ...config.triggerDefaults, ...settings };
}

function getEventKey(type, dateKey, metaKey = "") {
  return `${type}:${dateKey}:${metaKey}`;
}

function hasEvent(eventKey) {
  const events = getStorage(STORAGE_KEYS.TRIGGER_EVENTS, []);
  return events.some((item) => item.eventKey === eventKey);
}

function collectKeywordHits(keywordList, moodLogs, deepRecords) {
  if (!keywordList || keywordList.length === 0) {
    return [];
  }
  const pool = [];
  moodLogs.forEach((log) => {
    if (log.note) pool.push(log.note);
  });
  deepRecords.forEach((record) => {
    if (record.reflection) pool.push(record.reflection);
    if (record.moodChange) pool.push(record.moodChange);
    if (record.keywords && record.keywords.length) pool.push(record.keywords.join(" "));
  });
  const hits = [];
  keywordList.forEach((keyword) => {
    const count = pool.filter((text) => text.includes(keyword)).length;
    if (count > 0) {
      hits.push({ keyword, count });
    }
  });
  return hits;
}

function buildEvent(type, meta = {}) {
  const dateKey = formatDate();
  const metaKey = meta.keyword || "";
  const eventKey = getEventKey(type, dateKey, metaKey);
  return {
    id: `trigger_${Date.now()}`,
    type,
    eventKey,
    dateKey,
    message: DEFAULT_MESSAGE,
    meta,
    source: "auto",
    createdAt: Date.now()
  };
}

function queueNotification(event) {
  const payload = {
    id: `notify_${Date.now()}`,
    triggerId: event.id,
    type: event.type,
    message: event.message,
    status: "pending",
    createdAt: Date.now()
  };
  appendToList(STORAGE_KEYS.NOTIFICATIONS, payload);
}

function evaluateTriggers() {
  const settings = getMergedSettings();
  const todayKey = formatDate();
  const checkins = getStorage(STORAGE_KEYS.MICRO_CHECKINS, []);
  const moodLogs = getStorage(STORAGE_KEYS.MOOD_LOGS, []);
  const deepRecords = getStorage(STORAGE_KEYS.DEEP_RECORDS, []);

  const events = [];

  const lastCheckin = checkins[0] ? checkins[0].dateKey : "";
  const missedDays = lastCheckin
    ? daysBetween(lastCheckin, todayKey)
    : settings.consecutiveMissedDays + 1;
  if (missedDays >= settings.consecutiveMissedDays) {
    const eventKey = getEventKey("missed_checkin", todayKey);
    if (!hasEvent(eventKey)) {
      events.push(buildEvent("missed_checkin", { missedDays }));
    }
  }

  const todayMood = moodLogs.find((log) => log.dateKey === todayKey);
  if (todayMood && todayMood.score <= settings.lowMoodScore) {
    const eventKey = getEventKey("low_mood", todayKey);
    if (!hasEvent(eventKey)) {
      events.push(buildEvent("low_mood", { score: todayMood.score }));
    }
  }

  const keywordHits = collectKeywordHits(settings.keywordList, moodLogs, deepRecords);
  keywordHits.forEach((hit) => {
    const eventKey = getEventKey("keyword_hit", todayKey, hit.keyword);
    if (!hasEvent(eventKey)) {
      events.push(buildEvent("keyword_hit", { keyword: hit.keyword, count: hit.count }));
    }
  });

  return events;
}

function applyTriggers({ notify = false } = {}) {
  const newEvents = evaluateTriggers();
  if (newEvents.length === 0) return [];
  const events = getStorage(STORAGE_KEYS.TRIGGER_EVENTS, []);
  const updated = [...newEvents, ...events];
  setStorage(STORAGE_KEYS.TRIGGER_EVENTS, updated);
  newEvents.forEach(queueNotification);
  if (notify) {
    const first = newEvents[0];
    wx.showModal({
      title: "求助提示",
      content: first.message,
      showCancel: true,
      confirmText: "了解"
    });
  }
  return newEvents;
}

module.exports = {
  getMergedSettings,
  collectKeywordHits,
  evaluateTriggers,
  applyTriggers
};
