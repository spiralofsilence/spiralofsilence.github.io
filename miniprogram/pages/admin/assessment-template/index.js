const { createId } = require("../../../utils/id");
const {
  STORAGE_KEYS,
  getStorage,
  setStorage,
  loadOrInit
} = require("../../../utils/storage");

Page({
  data: {
    templates: [],
    templateId: "",
    templateName: "",
    description: "",
    dimensionsInput: "情绪管理,学习动力,家庭支持",
    isEntrance: false,
    questions: [],
    questionTitle: "",
    questionType: "choice",
    questionDimension: "",
    questionRequired: true,
    optionsInput: "",
    scaleMin: 1,
    scaleMax: 5,
    scaleLeft: "低",
    scaleRight: "高",
    forceRequired: false,
    activeAssessmentId: ""
  },
  onShow() {
    const templates = loadOrInit(STORAGE_KEYS.ASSESSMENTS, []);
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    this.setData({
      templates,
      forceRequired: settings.assessmentRequired === true,
      activeAssessmentId: settings.activeAssessmentId || ""
    });
  },
  onTemplateNameInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ templateName: value });
  },
  onDescriptionInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ description: value });
  },
  onDimensionsInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ dimensionsInput: value });
  },
  onQuestionTitleInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ questionTitle: value });
  },
  onQuestionTypeChange(e) {
    const value = e.currentTarget.dataset.type;
    this.setData({ questionType: value });
  },
  onQuestionDimensionInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ questionDimension: value });
  },
  onQuestionRequiredToggle(e) {
    const checked = Array.isArray(e.detail.value)
      ? e.detail.value.includes("required")
      : Boolean(e.detail.value);
    this.setData({ questionRequired: checked });
  },
  onOptionsInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ optionsInput: value });
  },
  onScaleMinInput(e) {
    const value = Number(typeof e.detail === "string" ? e.detail : e.detail.value);
    this.setData({ scaleMin: value });
  },
  onScaleMaxInput(e) {
    const value = Number(typeof e.detail === "string" ? e.detail : e.detail.value);
    this.setData({ scaleMax: value });
  },
  onScaleLeftInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ scaleLeft: value });
  },
  onScaleRightInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ scaleRight: value });
  },
  toggleEntrance(e) {
    const checked = Array.isArray(e.detail.value)
      ? e.detail.value.includes("entrance")
      : Boolean(e.detail.value);
    this.setData({ isEntrance: checked });
  },
  parseDimensions() {
    return this.data.dimensionsInput
      .split(/[,，\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  },
  parseOptions() {
    const lines = this.data.optionsInput
      .split(/\n|,|，/)
      .map((item) => item.trim())
      .filter(Boolean);
    return lines.map((line, index) => {
      const parts = line.split("|");
      if (parts.length === 2) {
        return { label: parts[0].trim(), score: Number(parts[1]) || index + 1 };
      }
      return { label: line, score: index + 1 };
    });
  },
  addQuestion() {
    const title = (this.data.questionTitle || "").trim();
    if (!title) {
      wx.showToast({ title: "请输入题目", icon: "none" });
      return;
    }
    const question = {
      id: createId("q"),
      title,
      type: this.data.questionType,
      dimension: this.data.questionDimension || "",
      required: this.data.questionRequired
    };
    if (this.data.questionType === "scale") {
      question.scale = {
        min: this.data.scaleMin,
        max: this.data.scaleMax,
        leftLabel: this.data.scaleLeft,
        rightLabel: this.data.scaleRight
      };
    } else if (this.data.questionType === "choice" || this.data.questionType === "multiple") {
      question.options = this.parseOptions();
    }
    const questions = [...this.data.questions, question];
    this.setData({
      questions,
      questionTitle: "",
      optionsInput: ""
    });
  },
  removeQuestion(e) {
    const id = e.currentTarget.dataset.id;
    const questions = this.data.questions.filter((item) => item.id !== id);
    this.setData({ questions });
  },
  saveTemplate() {
    const name = (this.data.templateName || "").trim();
    if (!name) {
      wx.showToast({ title: "请输入测评名称", icon: "none" });
      return;
    }
    if (this.data.questions.length === 0) {
      wx.showToast({ title: "请添加题目", icon: "none" });
      return;
    }
    const templates = getStorage(STORAGE_KEYS.ASSESSMENTS, []);
    const template = {
      id: this.data.templateId || createId("assessment_tpl"),
      templateId: this.data.templateId || createId("template"),
      title: name,
      description: this.data.description,
      isPaid: false,
      required: false,
      isEntrance: this.data.isEntrance,
      category: this.data.isEntrance ? "入学测评" : "自定义测评",
      dimensions: this.parseDimensions(),
      questions: this.data.questions
    };
    let next = [];
    if (this.data.templateId) {
      next = templates.map((item) => (item.id === this.data.templateId ? template : item));
    } else {
      next = [template, ...templates];
    }
    setStorage(STORAGE_KEYS.ASSESSMENTS, next);
    wx.showToast({ title: "已保存", icon: "success" });
    this.resetForm();
    this.onShow();
  },
  resetForm() {
    this.setData({
      templateId: "",
      templateName: "",
      description: "",
      dimensionsInput: "情绪管理,学习动力,家庭支持",
      isEntrance: false,
      questions: []
    });
  },
  editTemplate(e) {
    const template = e.currentTarget.dataset.template;
    this.setData({
      templateId: template.id,
      templateName: template.title,
      description: template.description || "",
      dimensionsInput: (template.dimensions || []).join(","),
      isEntrance: template.isEntrance === true,
      questions: template.questions || []
    });
  },
  deleteTemplate(e) {
    const template = e.currentTarget.dataset.template;
    wx.showModal({
      title: "删除测评",
      content: "确认删除该测评模板吗？",
      success: (res) => {
        if (!res.confirm) return;
        const templates = getStorage(STORAGE_KEYS.ASSESSMENTS, []);
        const next = templates.filter((item) => item.id !== template.id);
        setStorage(STORAGE_KEYS.ASSESSMENTS, next);
        this.onShow();
      }
    });
  },
  setEntrance(e) {
    const template = e.currentTarget.dataset.template;
    const templates = getStorage(STORAGE_KEYS.ASSESSMENTS, []);
    const next = templates.map((item) => ({
      ...item,
      isEntrance: item.id === template.id
    }));
    setStorage(STORAGE_KEYS.ASSESSMENTS, next);
    wx.showToast({ title: "已设为入学测评", icon: "success" });
    this.onShow();
  },
  pushAssessment(e) {
    const template = e.currentTarget.dataset.template;
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    setStorage(STORAGE_KEYS.SETTINGS, {
      ...settings,
      assessmentRequired: true,
      activeAssessmentId: template.id
    });
    wx.showModal({
      title: "测评已推送",
      content: "已向用户推送测评（模拟）。",
      showCancel: false
    });
    this.onShow();
  },
  clearAssessmentGate() {
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    setStorage(STORAGE_KEYS.SETTINGS, {
      ...settings,
      assessmentRequired: false,
      activeAssessmentId: ""
    });
    wx.showToast({ title: "已解除强制", icon: "success" });
    this.onShow();
  }
});
