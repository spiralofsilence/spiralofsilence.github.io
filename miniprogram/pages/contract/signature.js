const {
  STORAGE_KEYS,
  getStorage,
  setStorage,
  appendToList
} = require("../../utils/storage");
const { formatDateTime } = require("../../utils/date");

Page({
  data: {
    tabIndex: 0,
    signerName: "",
    digitalAgreed: false,
    canvasReady: false
  },
  onLoad() {
    const profile = getStorage(STORAGE_KEYS.PROFILE, {});
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    const users = getStorage(STORAGE_KEYS.USERS, []);
    const activeUserId = settings.activeUserId || profile.userId;
    const activeUser = users.find((item) => item.userId === activeUserId);
    const signerName = activeUser ? activeUser.fullName : profile.fullName;
    this.setData({ signerName: signerName || "" });
  },
  onReady() {
    this.ctx = wx.createCanvasContext("signCanvas", this);
    this.ctx.setStrokeStyle("#1f2d3d");
    this.ctx.setLineWidth(4);
    this.ctx.setLineCap("round");
    this.ctx.setLineJoin("round");
    this.setData({ canvasReady: true });
  },
  switchTab(e) {
    this.setData({ tabIndex: Number(e.currentTarget.dataset.index) });
  },
  onNameInput(e) {
    const value = typeof e.detail === "string" ? e.detail : e.detail.value;
    this.setData({ signerName: value });
  },
  toggleDigitalAgreement(e) {
    const agreed = Array.isArray(e.detail.value)
      ? e.detail.value.includes("agree")
      : Boolean(e.detail.value);
    this.setData({ digitalAgreed: agreed });
  },
  startDraw(e) {
    if (this.data.tabIndex !== 0) return;
    const point = e.touches[0];
    this.lastPoint = { x: point.x, y: point.y };
  },
  moveDraw(e) {
    if (this.data.tabIndex !== 0) return;
    const point = e.touches[0];
    this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();
    this.ctx.draw(true);
    this.lastPoint = { x: point.x, y: point.y };
  },
  clearCanvas() {
    if (!this.data.canvasReady) return;
    this.ctx.clearRect(0, 0, 600, 300);
    this.ctx.draw();
  },
  archiveContract(updated) {
    const templates = getStorage(STORAGE_KEYS.CONTRACT_TEMPLATES, []);
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    const profile = getStorage(STORAGE_KEYS.PROFILE, {});
    const activeUserId = settings.activeUserId || profile.userId;
    const template = templates.find((item) => item.id === updated.templateId);
    const record = {
      id: `user_contract_${Date.now()}`,
      userId: activeUserId || "local_user",
      templateId: updated.templateId || "",
      templateName:
        (template && template.templateName) || updated.title || "合同",
      filledData: updated.filledData || {},
      signatureImageUrl: updated.signaturePath || "",
      finalPdfUrl: updated.pdfPath || "mock://contract.pdf",
      status: "signed",
      signedAt: updated.signedAt
    };
    appendToList(STORAGE_KEYS.CONTRACT_RECORDS, record);
  },
  saveSignature() {
    const contract = getStorage(STORAGE_KEYS.CONTRACT, {});
    if (this.data.tabIndex === 1) {
      const signerName = (this.data.signerName || "").trim();
      if (!signerName) {
        wx.showToast({ title: "请输入签署姓名", icon: "none" });
        return;
      }
      if (!this.data.digitalAgreed) {
        wx.showToast({ title: "请勾选同意数字签名", icon: "none" });
        return;
      }
      const updated = {
        ...contract,
        status: "signed",
        signedAt: Date.now(),
        effectiveAt: null,
        signatureType: "digital",
        signerName,
        signaturePath: "",
        pdfStatus: "generated",
        pdfPath: "mock://contract.pdf",
        kickoffPrompted: false
      };
      setStorage(STORAGE_KEYS.CONTRACT, updated);
      this.archiveContract(updated);
      wx.showToast({ title: "签署完成", icon: "success" });
      wx.navigateBack();
      return;
    }
    wx.canvasToTempFilePath({
      canvasId: "signCanvas",
      success: (res) => {
        const updated = {
          ...contract,
          status: "signed",
          signedAt: Date.now(),
          effectiveAt: null,
          signatureType: "hand",
          signerName: `签署于 ${formatDateTime(new Date())}`,
          signaturePath: res.tempFilePath,
          pdfStatus: "generated",
          pdfPath: "mock://contract.pdf",
          kickoffPrompted: false
        };
        setStorage(STORAGE_KEYS.CONTRACT, updated);
        this.archiveContract(updated);
        wx.showToast({ title: "签署完成", icon: "success" });
        wx.navigateBack();
      },
      fail: () => {
        wx.showToast({ title: "签名保存失败", icon: "none" });
      }
    });
  }
});
