const {
  STORAGE_KEYS,
  getStorage,
  setStorage,
  appendToList
} = require("../../utils/storage");
const { createId } = require("../../utils/id");
const { isAdminAllowed } = require("../../utils/whitelist");

Page({
  data: {
    step: 0,
    roles: ["父母"],
    selectedRole: "",
    cityOptions: [
      "北京",
      "天津",
      "上海",
      "重庆",
      "河北",
      "山西",
      "辽宁",
      "吉林",
      "黑龙江",
      "江苏",
      "浙江",
      "安徽",
      "福建",
      "江西",
      "山东",
      "河南",
      "湖北",
      "湖南",
      "广东",
      "海南",
      "四川",
      "贵州",
      "云南",
      "陕西",
      "甘肃",
      "青海",
      "内蒙古",
      "广西",
      "西藏",
      "宁夏",
      "新疆",
      "香港",
      "澳门",
      "台湾",
      "海外",
      "其他"
    ],
    cityIndex: 0,
    wechatBound: false,
    wechatNick: "",
    avatarUrl: "",
    fullName: "",
    city: "",
    contact: ""
  },
  onLoad() {
    const profile = getStorage(STORAGE_KEYS.PROFILE, {});
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    if (!settings.pendingUserId) {
      setStorage(STORAGE_KEYS.SETTINGS, {
        ...settings,
        pendingUserId: createId("user")
      });
    }
    const cityOptions = this.data.cityOptions;
    const cityIndex = profile.city
      ? Math.max(cityOptions.indexOf(profile.city), 0)
      : 0;
    this.setData({
      selectedRole: profile.role || "",
      wechatBound: profile.wechatBound || false,
      wechatNick: profile.wechatNick || "",
      avatarUrl: profile.avatarUrl || "",
      fullName: profile.fullName || "",
      city: profile.city || "",
      contact: profile.contact || "",
      cityIndex
    });
    this.refreshRoleOptions();
  },
  nextStep() {
    const { step } = this.data;
    if (step === 1 && !this.data.selectedRole) {
      wx.showToast({ title: "请选择角色", icon: "none" });
      return;
    }
    if (step === 3) {
      const { fullName, city, contact } = this.data;
      if (!fullName || !city || !contact) {
        wx.showToast({ title: "请完善信息", icon: "none" });
        return;
      }
      this.completeOnboarding();
      return;
    }
    this.setData({ step: step + 1 });
  },
  prevStep() {
    const { step } = this.data;
    if (step > 0) {
      this.setData({ step: step - 1 });
    }
  },
  selectRole(e) {
    const role = e.detail;
    if (role !== "父母" && !this.canChooseAdmin()) {
      wx.showToast({ title: "仅白名单可选管理员", icon: "none" });
      return;
    }
    this.setData({ selectedRole: role });
  },
  onRoleCellTap(e) {
    const role = e.currentTarget.dataset.role;
    if (role) {
      if (role !== "父母" && !this.canChooseAdmin()) {
        wx.showToast({ title: "仅白名单可选管理员", icon: "none" });
        return;
      }
      this.setData({ selectedRole: role });
    }
  },
  bindWeChat() {
    wx.getUserProfile({
      desc: "用于绑定微信账号并展示头像昵称",
      success: (res) => {
        const { nickName, avatarUrl } = res.userInfo || {};
        this.setData({
          wechatBound: true,
          wechatNick: nickName || "",
          avatarUrl: avatarUrl || ""
        });
        this.refreshRoleOptions();
        this.nextStep();
      },
      fail: () => {
        wx.showToast({ title: "未完成授权", icon: "none" });
      }
    });
  },
  skipBind() {
    this.nextStep();
  },
  onNameInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ fullName: value });
  },
  onCityChange(e) {
    const index = Number(e.detail.value);
    const city = this.data.cityOptions[index] || "";
    this.setData({ cityIndex: index, city });
  },
  onContactInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ contact: value });
    this.refreshRoleOptions();
  },
  buildProfileForCheck() {
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    const pendingUserId = settings.pendingUserId || "";
    return {
      userId: pendingUserId,
      contact: this.data.contact,
      wechatNick: this.data.wechatNick
    };
  },
  canChooseAdmin() {
    return isAdminAllowed(this.buildProfileForCheck());
  },
  refreshRoleOptions() {
    const roles = this.canChooseAdmin() ? ["父母", "顾问", "管理员"] : ["父母"];
    const selectedRole = roles.includes(this.data.selectedRole)
      ? this.data.selectedRole
      : "父母";
    this.setData({ roles, selectedRole });
  },
  completeOnboarding() {
    const profile = getStorage(STORAGE_KEYS.PROFILE, {});
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    const userId = profile.userId || settings.pendingUserId || createId("user");
    const allowedRole = this.canChooseAdmin() ? this.data.selectedRole : "父母";
    setStorage(STORAGE_KEYS.PROFILE, {
      ...profile,
      userId,
      role: allowedRole,
      fullName: this.data.fullName,
      city: this.data.city,
      contact: this.data.contact,
      wechatBound: this.data.wechatBound,
      wechatNick: this.data.wechatNick,
      avatarUrl: this.data.avatarUrl,
      roleSetAt: Date.now()
    });
    const users = getStorage(STORAGE_KEYS.USERS, []);
    const existing = users.find((item) => item.userId === userId);
    if (!existing) {
      appendToList(STORAGE_KEYS.USERS, {
        userId,
        role: allowedRole,
        fullName: this.data.fullName,
        city: this.data.city,
        contact: this.data.contact,
        createdAt: Date.now()
      });
    }
    setStorage(STORAGE_KEYS.SETTINGS, {
      ...settings,
      onboardingComplete: true,
      activeUserId: userId
    });
    wx.reLaunch({ url: "/pages/home/index" });
  }
});
