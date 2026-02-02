const { STORAGE_KEYS, getStorage } = require("./storage");
const { isAssessmentCompleted } = require("./assessment");

function ensureAssessment() {
  const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
  const profile = getStorage(STORAGE_KEYS.PROFILE, {});
  if (profile.role && profile.role !== "父母") {
    return true;
  }
  const activeId = settings.activeAssessmentId;
  if (!settings.assessmentRequired || !activeId) {
    return true;
  }
  if (isAssessmentCompleted(activeId)) {
    return true;
  }
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  if (
    current &&
    ["pages/assessments/index", "pages/assessment-detail/index", "pages/profile/index", "pages/onboarding/index"].includes(
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
