const { formatDateTime } = require("../../utils/date");
const { STORAGE_KEYS, getStorage } = require("../../utils/storage");
const { assessments } = require("../../utils/mock");

Page({
  data: {
    assessments: [],
    reports: []
  },
  onShow() {
    const assessmentList = getStorage(STORAGE_KEYS.ASSESSMENTS, assessments);
    const reports = getStorage(STORAGE_KEYS.ASSESSMENT_REPORTS, []).map(
      (report) => ({
        ...report,
        timeLabel: formatDateTime(new Date(report.createdAt))
      })
    );
    this.setData({ assessments: assessmentList, reports });
  },
  startAssessment(e) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/assessment-detail/index?id=${item.id}`
    });
  },
  openReport(e) {
    const reportId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/assessment-report/index?reportId=${reportId}`
    });
  }
});
