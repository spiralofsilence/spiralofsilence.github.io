const { STORAGE_KEYS, getStorage } = require("./storage");

function isOnboardingComplete() {
  const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
  return settings.onboardingComplete === true;
}

function ensureOnboarding() {
  if (isOnboardingComplete()) return true;
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  if (current && current.route === "pages/onboarding/index") {
    return false;
  }
  wx.redirectTo({ url: "/pages/onboarding/index" });
  return false;
}

module.exports = {
  isOnboardingComplete,
  ensureOnboarding
};
