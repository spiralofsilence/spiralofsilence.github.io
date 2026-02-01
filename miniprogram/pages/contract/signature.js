const { STORAGE_KEYS, getStorage, setStorage } = require("../../utils/storage");
const { formatDateTime } = require("../../utils/date");

Page({
  data: {
    tabIndex: 0,
    typedName: "",
    canvasReady: false
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
    this.setData({ typedName: e.detail.value });
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
  saveSignature() {
    const contract = getStorage(STORAGE_KEYS.CONTRACT, {});
    if (this.data.tabIndex === 1) {
      const typedName = (this.data.typedName || "").trim();
      if (!typedName) {
        wx.showToast({ title: "请输入签名姓名", icon: "none" });
        return;
      }
      const updated = {
        ...contract,
        status: "signed",
        signedAt: Date.now(),
        effectiveAt: null,
        signatureType: "typed",
        signerName: typedName,
        signaturePath: "",
        kickoffPrompted: false
      };
      setStorage(STORAGE_KEYS.CONTRACT, updated);
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
          kickoffPrompted: false
        };
        setStorage(STORAGE_KEYS.CONTRACT, updated);
        wx.showToast({ title: "签署完成", icon: "success" });
        wx.navigateBack();
      },
      fail: () => {
        wx.showToast({ title: "签名保存失败", icon: "none" });
      }
    });
  }
});
