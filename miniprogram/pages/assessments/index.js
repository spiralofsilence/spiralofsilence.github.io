const { formatDateTime } = require("../../utils/date");
const { STORAGE_KEYS, getStorage } = require("../../utils/storage");
const {
  getAssessments,
  getAssessmentProgress,
  getRequiredAssessmentIds
} = require("../../utils/assessment");

Page({
  data: {
    assessments: [],
    reports: [],
    progressMap: {},
    requiredIds: [],
    requiredOnly: false
  },
  onLoad(options) {
    this.setData({ requiredOnly: options.required === "1" });
  },
  onShow() {
    const assessmentList = getAssessments();
    const reports = getStorage(STORAGE_KEYS.ASSESSMENT_REPORTS, []).map(
      (report) => ({
        ...report,
        timeLabel: formatDateTime(new Date(report.createdAt))
      })
    );
    const progressMap = getAssessmentProgress();
    const requiredIds = getRequiredAssessmentIds();
    const list = this.data.requiredOnly
      ? assessmentList.filter((item) => requiredIds.includes(item.id))
      : assessmentList;
    const withStatus = list.map((item) => ({
      ...item,
      progressStatus: progressMap[item.id] ? progressMap[item.id].status : "未开始"
    }));
    this.setData({
      assessments: withStatus,
      reports,
      progressMap,
      requiredIds
    });
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
