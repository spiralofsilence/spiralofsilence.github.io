const { STORAGE_KEYS, getStorage } = require("../../utils/storage");
const { formatDateTime } = require("../../utils/date");

Page({
  data: {
    report: null,
    dimensionList: []
  },
  onLoad(options) {
    const reports = getStorage(STORAGE_KEYS.ASSESSMENT_REPORTS, []);
    const report = reports.find((item) => item.id === options.reportId);
    if (!report) {
      wx.showToast({ title: "未找到报告", icon: "none" });
      return;
    }
    const dimensionList = report.dimensionScores
      ? Object.keys(report.dimensionScores).map((key) => ({
          name: key,
          score: report.dimensionScores[key]
        }))
      : [];
    this.setData({
      report: {
        ...report,
        timeLabel: formatDateTime(new Date(report.createdAt))
      },
      dimensionList
    });
  },
  goToTasks() {
    wx.switchTab({ url: "/pages/home/index" });
  },
  requestConsultation() {
    wx.showModal({
      title: "预约咨询",
      content: "已提交免费15分钟解读申请（模拟）",
      showCancel: false
    });
  },
  openService() {
    wx.navigateTo({ url: "/pages/service/index" });
  }
});
