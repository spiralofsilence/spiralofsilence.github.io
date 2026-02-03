const { STORAGE_KEYS, getStorage } = require("./storage");

function getActiveUserId() {
  const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
  const profile = getStorage(STORAGE_KEYS.PROFILE, {});
  return settings.activeUserId || profile.userId || "";
}

function isAssessmentCompletedForUser(assessmentId, userId) {
  if (!assessmentId || !userId) return false;
  const records = getStorage(STORAGE_KEYS.USER_ASSESSMENTS, []);
  return records.some(
    (item) =>
      item.userId === userId &&
      item.assessmentId === assessmentId &&
      item.status === "completed"
  );
}

function ensureAssessment() {
  const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
  const profile = getStorage(STORAGE_KEYS.PROFILE, {});
  if (profile.role && profile.role !== "父母") {
    return true;
  }
  const activeUserId = getActiveUserId();
  const activeId = settings.activeAssessmentId;
  if (!settings.assessmentRequired || !activeId) {
    return true;
  }
  if (isAssessmentCompletedForUser(activeId, activeUserId)) {
    return true;
  }
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  if (
    current &&
    [
      "pages/assessments/index",
      "pages/assessment-detail/index",
      "pages/profile/index",
      "pages/onboarding/index",
      "pages/contract/index",
      "pages/contract/signature"
    ].includes(
      current.route
    )
  ) {
    return false;
  }
  wx.redirectTo({ url: `/pages/assessments/index?required=1&force=1&id=${activeId}` });
  return false;
}

module.exports = {
  ensureAssessment
};
