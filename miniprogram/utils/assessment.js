const { STORAGE_KEYS, getStorage, setStorage } = require("./storage");
const { assessments } = require("./mock");

function getAssessments() {
  return getStorage(STORAGE_KEYS.ASSESSMENTS, assessments);
}

function getAssessmentProgress() {
  return getStorage(STORAGE_KEYS.ASSESSMENT_PROGRESS, {});
}

function setAssessmentStatus(assessmentId, status) {
  const progress = getAssessmentProgress();
  const existing = progress[assessmentId] || {};
  progress[assessmentId] = {
    status,
    updatedAt: Date.now(),
    completedAt: status === "completed" ? Date.now() : existing.completedAt || null
  };
  setStorage(STORAGE_KEYS.ASSESSMENT_PROGRESS, progress);
  return progress;
}

function getRequiredAssessmentIds() {
  return getAssessments()
    .filter((item) => item.required)
    .map((item) => item.id);
}

function areRequiredCompleted() {
  const requiredIds = getRequiredAssessmentIds();
  if (requiredIds.length === 0) return true;
  const progress = getAssessmentProgress();
  return requiredIds.every(
    (id) => progress[id] && progress[id].status === "completed"
  );
}

module.exports = {
  getAssessments,
  getAssessmentProgress,
  setAssessmentStatus,
  getRequiredAssessmentIds,
  areRequiredCompleted
};
