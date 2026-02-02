const { STORAGE_KEYS, getStorage, setStorage } = require("../../utils/storage");
const { ensureOnboarding } = require("../../utils/onboarding");

Page({
  data: {
    roles: ["父母", "顾问", "管理员"],
    roleIndex: 0,
    fullName: "",
    city: "",
    contact: "",
    role: "父母",
    roleSaved: false,
    isStaff: false
  },
  onShow() {
    if (!ensureOnboarding()) return;
    const profile = getStorage(STORAGE_KEYS.PROFILE, {});
    const roleIndex = this.data.roles.indexOf(profile.role || "父母");
    const role = roleIndex === -1 ? "父母" : this.data.roles[roleIndex];
    this.setData({
      roleIndex: roleIndex === -1 ? 0 : roleIndex,
      fullName: profile.fullName || "",
      city: profile.city || "",
      contact: profile.contact || "",
      role,
      roleSaved: Boolean(profile.role),
      isStaff: role !== "父母"
    });
  },
  onRoleChange(e) {
    const roleIndex = Number(e.detail.value);
    const role = this.data.roles[roleIndex];
    this.setData({
      roleIndex,
      role,
      roleSaved: false,
      isStaff: false
    });
  },
  onNicknameInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ fullName: value });
  },
  onOrgInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ city: value });
  },
  onContactInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ contact: value });
  },
  saveProfile() {
    const role = this.data.roles[this.data.roleIndex];
    const existing = getStorage(STORAGE_KEYS.PROFILE, {});
    setStorage(STORAGE_KEYS.PROFILE, {
      ...existing,
      role,
      fullName: this.data.fullName,
      city: this.data.city,
      contact: this.data.contact
    });
    this.setData({
      role,
      roleSaved: true,
      isStaff: role !== "父母"
    });
    wx.showToast({ title: "已保存", icon: "success" });
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
