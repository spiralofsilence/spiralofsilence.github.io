const config = require("../config");
const { STORAGE_KEYS, appendToList } = require("./storage");

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
        const record = {
          id: `payment_${Date.now()}`,
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
    wx.request({
      url: `${config.apiBaseUrl}/payments/create`,
      method: "POST",
      data: { amount, title, referenceId },
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
