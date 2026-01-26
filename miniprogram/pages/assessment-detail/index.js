const { STORAGE_KEYS, getStorage, appendToList } = require("../../utils/storage");

Page({
  data: {
    assessment: null,
    answers: {},
    sceneOptions: ["一般测评", "服务前测", "服务中测", "服务后测"],
    sceneIndex: 0
  },
  onLoad(options) {
    const list = getStorage(STORAGE_KEYS.ASSESSMENTS, []);
    const assessment = list.find((item) => item.id === options.id);
    if (!assessment) {
      wx.showToast({ title: "未找到测评", icon: "none" });
      return;
    }
    this.setData({ assessment });
  },
  onSceneChange(e) {
    this.setData({ sceneIndex: e.detail.value });
  },
  selectOption(e) {
    const { qid, index } = e.currentTarget.dataset;
    const answers = { ...this.data.answers, [qid]: Number(index) };
    this.setData({ answers });
  },
  submitAssessment() {
    const { assessment, answers } = this.data;
    if (!assessment) return;
    const totalQuestions = assessment.questions.length;
    if (Object.keys(answers).length !== totalQuestions) {
      wx.showToast({ title: "请完成全部题目", icon: "none" });
      return;
    }
    if (assessment.isPaid) {
      wx.showModal({
        title: "模拟支付",
        content: "已完成支付模拟流程（实际接入微信支付）",
        showCancel: false
      });
    }
    const { totalScore, avgScore } = this.calculateScore(assessment, answers);
    const level = avgScore >= 3.5 ? "良好" : avgScore >= 2.5 ? "可改善" : "需要关注";
    const riskFlag = avgScore < 2.5;
    const actionText = riskFlag
      ? "您的问题可能需要更系统的支持。可预约一次专业顾问的免费深度报告解读。"
      : "系统已为您推荐相关任务，坚持完成21天，会有明显改善。";
    const report = {
      id: `report_${Date.now()}`,
      assessmentId: assessment.id,
      title: assessment.title,
      scene: this.data.sceneOptions[this.data.sceneIndex],
      totalScore,
      avgScore: Number(avgScore.toFixed(2)),
      level,
      riskFlag,
      summary: `平均得分 ${avgScore.toFixed(2)}，当前状态：${level}`,
      actionText,
      createdAt: Date.now()
    };
    appendToList(STORAGE_KEYS.ASSESSMENT_REPORTS, report);
    wx.navigateTo({
      url: `/pages/assessment-report/index?reportId=${report.id}`
    });
  },
  calculateScore(assessment, answers) {
    let totalScore = 0;
    assessment.questions.forEach((question) => {
      const optionIndex = answers[question.id];
      totalScore += question.options[optionIndex].score;
    });
    const avgScore = totalScore / assessment.questions.length;
    return { totalScore, avgScore };
  }
});
