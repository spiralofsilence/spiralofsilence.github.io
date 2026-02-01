const { STORAGE_KEYS, getStorage, setStorage, appendToList } = require("../../utils/storage");
const { requestPayment } = require("../../utils/payment");
const {
  setAssessmentStatus,
  areRequiredCompleted
} = require("../../utils/assessment");
const { startServicePlan } = require("../../utils/service");

Page({
  data: {
    assessment: null,
    answers: {},
    scaleValues: {},
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
    const scaleValues = {};
    const answers = {};
    assessment.questions.forEach((question) => {
      if (question.type === "scale" && question.scale) {
        const mid = Math.round((question.scale.min + question.scale.max) / 2);
        scaleValues[question.id] = mid;
        answers[question.id] = mid;
      }
    });
    this.setData({ assessment, scaleValues, answers });
    const progress = getStorage(STORAGE_KEYS.ASSESSMENT_PROGRESS, {});
    if (!progress[assessment.id] || progress[assessment.id].status !== "completed") {
      setAssessmentStatus(assessment.id, "in_progress");
    }
  },
  onSceneChange(e) {
    this.setData({ sceneIndex: e.detail.value });
  },
  selectOption(e) {
    const { qid, index } = e.currentTarget.dataset;
    const { assessment } = this.data;
    const question = assessment.questions.find((item) => item.id === qid);
    const score = question.options[Number(index)].score;
    const answers = { ...this.data.answers, [qid]: score };
    this.setData({ answers });
  },
  onScaleChange(e) {
    const qid = e.currentTarget.dataset.qid;
    const value = Number(e.detail.value);
    this.setData({
      scaleValues: { ...this.data.scaleValues, [qid]: value },
      answers: { ...this.data.answers, [qid]: value }
    });
  },
  submitAssessment() {
    const { assessment, answers } = this.data;
    if (!assessment) return;
    const totalQuestions = assessment.questions.length;
    if (Object.keys(answers).length !== totalQuestions) {
      wx.showToast({ title: "请完成全部题目", icon: "none" });
      return;
    }
    const proceed = () => {
      const { totalScore, avgScore } = this.calculateScore(assessment, answers);
      const level =
        avgScore >= 3.8 ? "良好" : avgScore >= 2.8 ? "可改善" : "需要关注";
      const riskFlag = avgScore < 2.8;
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
      setAssessmentStatus(assessment.id, "completed");
      if (areRequiredCompleted()) {
        startServicePlan();
        const contract = getStorage(STORAGE_KEYS.CONTRACT);
        if (contract && contract.status === "signed") {
          contract.status = "effective";
          contract.effectiveAt = Date.now();
          setStorage(STORAGE_KEYS.CONTRACT, contract);
        }
      }
      wx.navigateTo({
        url: `/pages/assessment-report/index?reportId=${report.id}`
      });
    };
    if (assessment.isPaid) {
      requestPayment({
        amount: assessment.price,
        title: assessment.title,
        referenceId: assessment.id
      })
        .then(() => proceed())
        .catch((err) => {
          wx.showToast({ title: err.message || "支付失败", icon: "none" });
        });
    } else {
      proceed();
    }
  },
  calculateScore(assessment, answers) {
    let totalScore = 0;
    assessment.questions.forEach((question) => {
      const value = Number(answers[question.id] || 0);
      totalScore += value;
    });
    const avgScore = totalScore / assessment.questions.length;
    return { totalScore, avgScore };
  }
});
