const config = require("../config");
const { STORAGE_KEYS, appendToList, getStorage } = require("./storage");

function getActiveUserId() {
  const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
  const profile = getStorage(STORAGE_KEYS.PROFILE, {});
  return settings.activeUserId || profile.userId || "";
}

function logPayment(payload) {
  appendToList(STORAGE_KEYS.PAYMENT_LOGS, payload);
}

function mockPayment({ amount, title, referenceId }) {
  return new Promise((resolve) => {
    wx.showModal({
      title: "模拟支付",
      content: `已模拟支付 ¥${amount}（${title}）`,
      showCancel: false,
      success: () => {
        const userId = getActiveUserId();
        const record = {
          id: `payment_${Date.now()}`,
          userId,
          amount,
          title,
          referenceId,
          status: "mock_success",
          createdAt: Date.now()
        };
        logPayment(record);
        resolve(record);
      }
    });
  });
}

function requestPayment({ amount, title, referenceId }) {
  if (config.mockEnabled || !config.payment.enabled) {
    return mockPayment({ amount, title, referenceId });
  }
  return new Promise((resolve, reject) => {
    const userId = getActiveUserId();
    wx.request({
      url: `${config.apiBaseUrl}/payments/create`,
      method: "POST",
      data: { amount, title, referenceId, userId },
      success(res) {
        const params = res.data;
        if (!params) {
          reject(new Error("支付参数缺失"));
          return;
        }
        wx.requestPayment({
          ...params,
          success() {
            const record = {
              id: `payment_${Date.now()}`,
              userId,
              amount,
              title,
              referenceId,
              status: "success",
              createdAt: Date.now()
            };
            logPayment(record);
            resolve(record);
          },
          fail(err) {
            logPayment({
              id: `payment_${Date.now()}`,
              userId,
              amount,
              title,
              referenceId,
              status: "failed",
              error: err.errMsg,
              createdAt: Date.now()
            });
            reject(err);
          }
        });
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

module.exports = { requestPayment };
