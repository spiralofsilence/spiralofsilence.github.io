const { STORAGE_KEYS, getStorage, setStorage } = require("../../utils/storage");
const { requestSubscription } = require("../../utils/subscribe");

Page({
  data: {
    roles: ["父母", "顾问", "管理员"],
    roleIndex: 0,
    nickname: "",
    organization: "",
    aiApiKey: "",
    aiUseProxy: false,
    taskReminderTemplateId: "",
    helpAlertTemplateId: "",
    subscriptionResult: null
  },
  onShow() {
    const profile = getStorage(STORAGE_KEYS.PROFILE, {});
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    const roleIndex = this.data.roles.indexOf(profile.role || "父母");
    this.setData({
      roleIndex: roleIndex === -1 ? 0 : roleIndex,
      nickname: profile.nickname || "",
      organization: profile.organization || "",
      aiApiKey: settings.aiApiKey || "",
      aiUseProxy: settings.aiUseProxy === true,
      taskReminderTemplateId: settings.taskReminderTemplateId || "",
      helpAlertTemplateId: settings.helpAlertTemplateId || "",
      subscriptionResult: settings.subscriptionResult || null
    });
  },
  onRoleChange(e) {
    this.setData({ roleIndex: Number(e.detail.value) });
  },
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },
  onOrgInput(e) {
    this.setData({ organization: e.detail.value });
  },
  onKeyInput(e) {
    this.setData({ aiApiKey: e.detail.value });
  },
  onProxyToggle(e) {
    this.setData({ aiUseProxy: e.detail.value });
  },
  onTaskTemplateInput(e) {
    this.setData({ taskReminderTemplateId: e.detail.value });
  },
  onHelpTemplateInput(e) {
    this.setData({ helpAlertTemplateId: e.detail.value });
  },
  saveProfile() {
    const role = this.data.roles[this.data.roleIndex];
    setStorage(STORAGE_KEYS.PROFILE, {
      role,
      nickname: this.data.nickname,
      organization: this.data.organization
    });
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    setStorage(STORAGE_KEYS.SETTINGS, {
      ...settings,
      aiApiKey: this.data.aiApiKey,
      aiUseProxy: this.data.aiUseProxy,
      taskReminderTemplateId: this.data.taskReminderTemplateId,
      helpAlertTemplateId: this.data.helpAlertTemplateId
    });
    wx.showToast({ title: "已保存", icon: "success" });
  },
  requestSubscribe() {
    requestSubscription()
      .then((res) => {
        this.setData({ subscriptionResult: res });
        wx.showToast({ title: "已订阅", icon: "success" });
      })
      .catch((err) => {
        wx.showToast({ title: err.message || "订阅失败", icon: "none" });
      });
  },
  openContract() {
    wx.navigateTo({ url: "/pages/contract/index" });
  },
  openService() {
    wx.navigateTo({ url: "/pages/service/index" });
  },
  openHomework() {
    wx.navigateTo({ url: "/pages/homework/index" });
  },
  showPrivacy() {
    wx.showModal({
      title: "隐私政策摘要",
      content:
        "我们仅收集您主动填写的任务、情绪、测评与问答数据，用于生成个性化建议。您可以随时清除数据。完整版隐私政策请见项目文档。",
      showCancel: false
    });
  },
  clearData() {
    wx.showModal({
      title: "清空数据",
      content: "将清空本地缓存的数据，是否继续？",
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({ title: "已清空", icon: "success" });
          this.onShow();
        }
      }
    });
  }
});
