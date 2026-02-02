const { STORAGE_KEYS, getStorage, setStorage, appendToList } = require("../../utils/storage");
const { requestPayment } = require("../../utils/payment");
const {
  setAssessmentStatus,
  areRequiredCompleted,
  getAssessmentProgressById,
  saveAssessmentProgress
} = require("../../utils/assessment");
const { startServicePlan } = require("../../utils/service");

Page({
  data: {
    assessment: null,
    answers: {},
    scaleValues: {},
    answeredCount: 0,
    totalQuestions: 0,
    progressPercent: 0,
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
    const existingProgress = getAssessmentProgressById(assessment.id);
    const existingAnswers = existingProgress.answers || {};
    assessment.questions.forEach((question) => {
      if (question.type === "scale" && question.scale) {
        const mid = Math.round((question.scale.min + question.scale.max) / 2);
        const existingValue = existingAnswers[question.id];
        scaleValues[question.id] = typeof existingValue === "number" ? existingValue : mid;
        answers[question.id] =
          typeof existingValue === "number" ? existingValue : mid;
      } else if (existingAnswers[question.id] !== undefined) {
        answers[question.id] = existingAnswers[question.id];
      }
    });
    this.setData({
      assessment,
      scaleValues,
      answers,
      totalQuestions: assessment.questions.length
    });
    this.updateProgress();
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
    const answers = { ...this.data.answers, [qid]: Number(index) };
    this.setData({ answers });
    this.saveProgress(answers);
  },
  onScaleChange(e) {
    const qid = e.currentTarget.dataset.qid;
    const value = Number(e.detail.value);
    this.setData({
      scaleValues: { ...this.data.scaleValues, [qid]: value },
      answers: { ...this.data.answers, [qid]: value }
    });
    this.saveProgress({ ...this.data.answers, [qid]: value });
  },
  toggleMultiple(e) {
    const { qid, index } = e.currentTarget.dataset;
    const current = this.data.answers[qid] || [];
    const next = current.includes(index)
      ? current.filter((item) => item !== index)
      : [...current, index];
    const answers = { ...this.data.answers, [qid]: next };
    this.setData({ answers });
    this.saveProgress(answers);
  },
  onTextInput(e) {
    const qid = e.currentTarget.dataset.qid;
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    const answers = { ...this.data.answers, [qid]: value };
    this.setData({ answers });
    this.saveProgress(answers);
  },
  updateProgress() {
    const { assessment, answers } = this.data;
    if (!assessment) return;
    const total = assessment.questions.length;
    const answeredCount = assessment.questions.filter((q) => {
      const value = answers[q.id];
      if (q.type === "multiple") {
        return Array.isArray(value) && value.length > 0;
      }
      if (q.type === "text") {
        return Boolean(value && value.trim());
      }
      return value !== undefined && value !== null && value !== "";
    }).length;
    const progressPercent = Math.round((answeredCount / total) * 100);
    this.setData({ answeredCount, progressPercent });
  },
  saveProgress(answers) {
    if (!this.data.assessment) return;
    saveAssessmentProgress(this.data.assessment.id, answers);
    this.updateProgress();
  },
  submitAssessment() {
    const { assessment, answers } = this.data;
    if (!assessment) return;
    const missingRequired = assessment.questions.some((question) => {
      if (question.required === false) return false;
      const value = answers[question.id];
      if (question.type === "multiple") {
        return !Array.isArray(value) || value.length === 0;
      }
      if (question.type === "text") {
        return !value || !value.trim();
      }
      return value === undefined || value === null || value === "";
    });
    if (missingRequired) {
      wx.showToast({ title: "请完成必填题目", icon: "none" });
      return;
    }
    const proceed = () => {
      const { totalScore, avgScore } = this.calculateScore(assessment, answers);
      const dimensionScores = this.calculateDimensionScores(assessment, answers);
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
        dimensionScores,
        level,
        riskFlag,
        summary: `平均得分 ${avgScore.toFixed(2)}，当前状态：${level}`,
        actionText,
        createdAt: Date.now()
      };
      appendToList(STORAGE_KEYS.ASSESSMENT_REPORTS, report);
      setAssessmentStatus(assessment.id, "completed");
      saveAssessmentProgress(assessment.id, answers);
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
      const value = answers[question.id];
      if (question.type === "scale") {
        totalScore += Number(value || 0);
        return;
      }
      if (question.type === "choice") {
        const optionIndex = Number(value);
        const option = question.options[optionIndex];
        totalScore += option ? option.score : 0;
        return;
      }
      if (question.type === "multiple") {
        const selections = Array.isArray(value) ? value : [];
        const score = selections.reduce((sum, idx) => {
          const option = question.options[idx];
          return sum + (option ? option.score : 0);
        }, 0);
        totalScore += score;
        return;
      }
    });
    const avgScore = totalScore / assessment.questions.length;
    return { totalScore, avgScore };
  },
  calculateDimensionScores(assessment, answers) {
    const scores = {};
    const counts = {};
    assessment.questions.forEach((question) => {
      if (!question.dimension) return;
      const value = answers[question.id];
      let questionScore = 0;
      if (question.type === "scale") {
        questionScore = Number(value || 0);
      } else if (question.type === "choice") {
        const optionIndex = Number(value);
        const option = question.options[optionIndex];
        questionScore = option ? option.score : 0;
      } else if (question.type === "multiple") {
        const selections = Array.isArray(value) ? value : [];
        questionScore = selections.reduce((sum, idx) => {
          const option = question.options[idx];
          return sum + (option ? option.score : 0);
        }, 0);
      }
      scores[question.dimension] = (scores[question.dimension] || 0) + questionScore;
      counts[question.dimension] = (counts[question.dimension] || 0) + 1;
    });
    Object.keys(scores).forEach((dimension) => {
      scores[dimension] = Number((scores[dimension] / counts[dimension]).toFixed(2));
    });
    return scores;
  }
});
