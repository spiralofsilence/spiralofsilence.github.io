const { createId } = require("../../../utils/id");
const {
  STORAGE_KEYS,
  getStorage,
  setStorage,
  loadOrInit
} = require("../../../utils/storage");

function isPaidUser(paymentLogs, userId) {
  return paymentLogs.some(
    (item) =>
      item.userId === userId &&
      (item.status === "success" || item.status === "mock_success")
  );
}

function getLatestContractStatus(assignments, records, userId) {
  const signed = records.find(
    (item) => item.userId === userId && item.status === "signed"
  );
  if (signed) return "已签署";
  const pending = assignments.find(
    (item) => item.userId === userId && item.status === "pending"
  );
  if (pending) return "待签署";
  return "未推送";
}

function getAssessmentStatus(userAssessments, userId) {
  const completed = userAssessments.find(
    (item) => item.userId === userId && item.status === "completed"
  );
  return completed ? "已完成" : "未完成";
}

Page({
  data: {
    users: [],
    searchText: "",
    filterPaid: false,
    activeTemplate: null
  },
  onShow() {
    const profile = getStorage(STORAGE_KEYS.PROFILE, {});
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    if (profile.role === "父母" || settings.adminLoggedIn !== true) {
      wx.showToast({ title: "请先登录管理员", icon: "none" });
      wx.redirectTo({ url: "/pages/profile/index" });
      return;
    }
    this.refresh();
  },
  refresh() {
    const users = loadOrInit(STORAGE_KEYS.USERS, []);
    const payments = getStorage(STORAGE_KEYS.PAYMENT_LOGS, []);
    const assignments = getStorage(STORAGE_KEYS.CONTRACT_ASSIGNMENTS, []);
    const records = getStorage(STORAGE_KEYS.CONTRACT_RECORDS, []);
    const userAssessments = getStorage(STORAGE_KEYS.USER_ASSESSMENTS, []);
    const templates = loadOrInit(STORAGE_KEYS.CONTRACT_TEMPLATES, []);
    const activeTemplate =
      templates.find((item) => item.status === "active") || null;

    const enriched = users.map((user) => ({
      ...user,
      paid: isPaidUser(payments, user.userId),
      contractStatus: getLatestContractStatus(assignments, records, user.userId),
      assessmentStatus: getAssessmentStatus(userAssessments, user.userId)
    }));

    this.setData({
      users: this.applyFilter(enriched),
      activeTemplate
    });
  },
  applyFilter(list) {
    const keyword = (this.data.searchText || "").trim();
    const paidOnly = this.data.filterPaid;
    return list.filter((user) => {
      const matchKeyword = keyword
        ? `${user.fullName || ""}${user.contact || ""}${user.city || ""}`.includes(keyword)
        : true;
      const matchPaid = paidOnly ? user.paid : true;
      return matchKeyword && matchPaid;
    });
  },
  onSearchInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ searchText: value }, () => this.refresh());
  },
  togglePaidFilter(e) {
    this.setData({ filterPaid: e.detail.value }, () => this.refresh());
  },
  pushContract(e) {
    const user = e.currentTarget.dataset.user;
    if (!user) return;
    if (!user.paid) {
      wx.showToast({ title: "用户未付费", icon: "none" });
      return;
    }
    const template = this.data.activeTemplate;
    if (!template) {
      wx.showToast({ title: "暂无生效模板", icon: "none" });
      return;
    }
    const assignments = getStorage(STORAGE_KEYS.CONTRACT_ASSIGNMENTS, []);
    const next = [
      {
        id: createId("contract_assign"),
        userId: user.userId,
        templateId: template.id,
        templateName: template.templateName,
        status: "pending",
        assignedAt: Date.now()
      },
      ...assignments.filter(
        (item) => !(item.userId === user.userId && item.status === "pending")
      )
    ];
    setStorage(STORAGE_KEYS.CONTRACT_ASSIGNMENTS, next);
    wx.showToast({ title: "已推送合同", icon: "success" });
    this.refresh();
  },
  setActiveUser(e) {
    const user = e.currentTarget.dataset.user;
    if (!user) return;
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    setStorage(STORAGE_KEYS.SETTINGS, {
      ...settings,
      activeUserId: user.userId
    });
    wx.showToast({ title: "已切换查看用户", icon: "success" });
  }
});
