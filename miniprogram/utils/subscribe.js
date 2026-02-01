const config = require("../config");
const { STORAGE_KEYS, getStorage, setStorage } = require("./storage");

function getTemplateIds() {
  const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
  const ids = [
    settings.taskReminderTemplateId || config.subscriptionTemplates.taskReminder,
    settings.helpAlertTemplateId || config.subscriptionTemplates.helpAlert
  ].filter(Boolean);
  return ids;
}

function requestSubscription() {
  return new Promise((resolve, reject) => {
    const tmplIds = getTemplateIds();
    if (tmplIds.length === 0) {
      reject(new Error("未配置订阅消息模板ID"));
      return;
    }
    wx.requestSubscribeMessage({
      tmplIds,
      success(res) {
        const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
        setStorage(STORAGE_KEYS.SETTINGS, {
          ...settings,
          subscriptionResult: res,
          subscriptionAcceptedAt: Date.now()
        });
        resolve(res);
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

module.exports = {
  getTemplateIds,
  requestSubscription
};
