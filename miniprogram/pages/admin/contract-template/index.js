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
    templateName: "",
    placeholdersInput: "userName,phone,servicePeriod,amount",
    templateFile: null,
    editingId: "",
    assessments: [],
    selectedAssessmentId: "",
    users: [],
    selectedUserId: ""
  },
  onShow() {
    const templates = loadOrInit(STORAGE_KEYS.CONTRACT_TEMPLATES, []);
    const assessments = loadOrInit(STORAGE_KEYS.ASSESSMENTS, []);
    const entrance =
      assessments.find((item) => item.isEntrance) || assessments[0] || null;
    const users = loadOrInit(STORAGE_KEYS.USERS, []);
    this.setData({
      templates,
      assessments,
      selectedAssessmentId: entrance ? entrance.id : "",
      users,
      selectedUserId: users[0] ? users[0].userId : ""
    });
  },
  onNameInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ templateName: value });
  },
  onPlaceholdersInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ placeholdersInput: value });
  },
  onAssessmentChange(e) {
    const index = Number(e.detail.value);
    const target = this.data.assessments[index];
    this.setData({ selectedAssessmentId: target ? target.id : "" });
  },
  onUserChange(e) {
    const index = Number(e.detail.value);
    const target = this.data.users[index];
    this.setData({ selectedUserId: target ? target.userId : "" });
  },
  uploadTemplateFile() {
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      success: (res) => {
        const file = res.tempFiles[0];
        wx.saveFile({
          tempFilePath: file.path,
          success: (saveRes) => {
            this.setData({
              templateFile: {
                name: file.name,
                path: saveRes.savedFilePath
              }
            });
            wx.showToast({ title: "已上传", icon: "success" });
          },
          fail: () => {
            wx.showToast({ title: "保存失败", icon: "none" });
          }
        });
      }
    });
  },
  openTemplateFile(e) {
    const template = e.currentTarget.dataset.template;
    if (!template || !template.templateFileUrl) {
      wx.showToast({ title: "未上传文件", icon: "none" });
      return;
    }
    wx.openDocument({
      filePath: template.templateFileUrl,
      showMenu: true
    });
  },
  parsePlaceholders(input) {
    return input
      .split(/[,，\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  },
  saveTemplate() {
    const name = (this.data.templateName || "").trim();
    if (!name) {
      wx.showToast({ title: "请输入模板名称", icon: "none" });
      return;
    }
    const placeholders = this.parsePlaceholders(this.data.placeholdersInput);
    const templates = getStorage(STORAGE_KEYS.CONTRACT_TEMPLATES, []);
    let updatedList = [...templates];
    if (this.data.editingId) {
      updatedList = updatedList.map((item) =>
        item.id === this.data.editingId
          ? {
              ...item,
              templateName: name,
              placeholders,
              templateFileUrl: this.data.templateFile
                ? this.data.templateFile.path
                : item.templateFileUrl
            }
          : item
      );
    } else {
      updatedList.unshift({
        id: createId("contract_tpl"),
        templateName: name,
        templateFileUrl: this.data.templateFile
          ? this.data.templateFile.path
          : "",
        placeholders,
        status: "inactive",
        createdAt: Date.now()
      });
    }
    setStorage(STORAGE_KEYS.CONTRACT_TEMPLATES, updatedList);
    this.resetForm();
    this.onShow();
    wx.showToast({ title: "已保存", icon: "success" });
  },
  resetForm() {
    this.setData({
      templateName: "",
      placeholdersInput: "userName,phone,servicePeriod,amount",
      templateFile: null,
      editingId: ""
    });
  },
  editTemplate(e) {
    const template = e.currentTarget.dataset.template;
    this.setData({
      templateName: template.templateName,
      placeholdersInput: (template.placeholders || []).join(","),
      templateFile: template.templateFileUrl
        ? { name: template.templateName, path: template.templateFileUrl }
        : null,
      editingId: template.id
    });
  },
  deleteTemplate(e) {
    const template = e.currentTarget.dataset.template;
    wx.showModal({
      title: "删除模板",
      content: "确认删除该模板吗？",
      success: (res) => {
        if (!res.confirm) return;
        const templates = getStorage(STORAGE_KEYS.CONTRACT_TEMPLATES, []);
        const next = templates.filter((item) => item.id !== template.id);
        setStorage(STORAGE_KEYS.CONTRACT_TEMPLATES, next);
        this.onShow();
      }
    });
  },
  setActive(e) {
    const template = e.currentTarget.dataset.template;
    const templates = getStorage(STORAGE_KEYS.CONTRACT_TEMPLATES, []);
    const next = templates.map((item) => ({
      ...item,
      status: item.id === template.id ? "active" : "inactive"
    }));
    setStorage(STORAGE_KEYS.CONTRACT_TEMPLATES, next);
    wx.showToast({ title: "已设为生效", icon: "success" });
    this.onShow();
  },
  pushEntranceAssessment() {
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    const assessmentId = this.data.selectedAssessmentId;
    if (!assessmentId) {
      wx.showToast({ title: "请选择测评模板", icon: "none" });
      return;
    }
    setStorage(STORAGE_KEYS.SETTINGS, {
      ...settings,
      assessmentRequired: true,
      activeAssessmentId: assessmentId
    });
    wx.showModal({
      title: "测评已推送",
      content: "已向用户推送入学测评（模拟）。",
      showCancel: false
    });
  },
  pushContractToUser(e) {
    const template = e.currentTarget.dataset.template;
    const userId = this.data.selectedUserId;
    if (!userId) {
      wx.showToast({ title: "请选择用户", icon: "none" });
      return;
    }
    if (!template) {
      wx.showToast({ title: "请选择模板", icon: "none" });
      return;
    }
    const assignments = getStorage(STORAGE_KEYS.CONTRACT_ASSIGNMENTS, []);
    const next = [
      {
        id: createId("contract_assign"),
        userId,
        templateId: template.id,
        templateName: template.templateName,
        status: "pending",
        assignedAt: Date.now()
      },
      ...assignments.filter(
        (item) => !(item.userId === userId && item.status === "pending")
      )
    ];
    setStorage(STORAGE_KEYS.CONTRACT_ASSIGNMENTS, next);
    wx.showToast({ title: "已推送合同", icon: "success" });
  }
});
