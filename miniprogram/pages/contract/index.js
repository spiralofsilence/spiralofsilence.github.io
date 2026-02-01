const config = require("../../config");
const { contractTemplate } = require("../../utils/mock");
const { formatDateTime } = require("../../utils/date");
const { STORAGE_KEYS, getStorage, setStorage } = require("../../utils/storage");
const {
  getAssessmentProgress,
  getRequiredAssessmentIds,
  areRequiredCompleted,
  getAssessments
} = require("../../utils/assessment");

function buildDefaultContract() {
  return {
    id: `contract_${Date.now()}`,
    title: config.contract.title,
    templateVersion: config.contract.templateVersion,
    status: "unsigned",
    signedAt: null,
    effectiveAt: null,
    signatureType: null,
    signerName: "",
    signaturePath: "",
    pdfStatus: "not_generated",
    pdfPath: "",
    kickoffPrompted: false
  };
}

Page({
  data: {
    template: contractTemplate,
    contract: null,
    signedAtLabel: "",
    effectiveAtLabel: "",
    requiredItems: [],
    requiredCompleted: false,
    progressMap: {},
    role: "父母",
    isStaff: false,
    templateFile: null
  },
  onShow() {
    const profile = getStorage(STORAGE_KEYS.PROFILE, {});
    const role = profile.role || "父母";
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    const contract = getStorage(STORAGE_KEYS.CONTRACT);
    const record = contract || buildDefaultContract();
    if (!contract) {
      setStorage(STORAGE_KEYS.CONTRACT, record);
    }
    const requiredIds = getRequiredAssessmentIds();
    const requiredCompleted = areRequiredCompleted();
    const progressMap = getAssessmentProgress();
    const assessmentList = getAssessments();
    const requiredItems = requiredIds.map((id) => {
      const target = assessmentList.find((item) => item.id === id);
      return {
        id,
        title: target ? target.title : id,
        status: progressMap[id] ? progressMap[id].status : "未开始"
      };
    });
    this.setData({
      contract: record,
      signedAtLabel: record.signedAt ? formatDateTime(new Date(record.signedAt)) : "",
      effectiveAtLabel: record.effectiveAt
        ? formatDateTime(new Date(record.effectiveAt))
        : "",
      requiredItems,
      requiredCompleted,
      progressMap,
      role,
      isStaff: role !== "父母",
      templateFile: settings.contractTemplateFile || null
    });
    if (record.status !== "unsigned" && !requiredCompleted && !record.kickoffPrompted) {
      wx.showModal({
        title: "必做测评",
        content: "合同签署完成，请先完成2个必做测评。",
        confirmText: "立即开始",
        success: (res) => {
          if (res.confirm) {
            this.openAssessments();
          }
        }
      });
      record.kickoffPrompted = true;
      setStorage(STORAGE_KEYS.CONTRACT, record);
    }
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
            const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
            const templateFile = {
              name: file.name,
              path: saveRes.savedFilePath,
              updatedAt: Date.now()
            };
            setStorage(STORAGE_KEYS.SETTINGS, {
              ...settings,
              contractTemplateFile: templateFile
            });
            this.setData({ templateFile });
            wx.showToast({ title: "已上传", icon: "success" });
          },
          fail: () => {
            wx.showToast({ title: "保存失败", icon: "none" });
          }
        });
      }
    });
  },
  openTemplateFile() {
    const templateFile = this.data.templateFile;
    if (!templateFile) {
      wx.showToast({ title: "未上传合同", icon: "none" });
      return;
    }
    wx.openDocument({
      filePath: templateFile.path,
      showMenu: true,
      fail: () => {
        wx.showToast({ title: "无法打开文件", icon: "none" });
      }
    });
  },
  removeTemplateFile() {
    const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
    setStorage(STORAGE_KEYS.SETTINGS, {
      ...settings,
      contractTemplateFile: null
    });
    this.setData({ templateFile: null });
    wx.showToast({ title: "已移除", icon: "success" });
  },
  startSign() {
    wx.navigateTo({ url: "/pages/contract/signature" });
  },
  openAssessments() {
    wx.navigateTo({ url: "/pages/assessments/index?required=1" });
  },
  generatePdf() {
    const contract = this.data.contract;
    contract.pdfStatus = "generated";
    contract.pdfPath = "mock://contract.pdf";
    setStorage(STORAGE_KEYS.CONTRACT, contract);
    this.setData({ contract });
    wx.showToast({ title: "已生成PDF", icon: "success" });
  },
  promoteToEffective() {
    const contract = this.data.contract;
    if (contract.status === "signed") {
      contract.status = "effective";
      contract.effectiveAt = Date.now();
      setStorage(STORAGE_KEYS.CONTRACT, contract);
      this.setData({
        contract,
        effectiveAtLabel: formatDateTime(new Date(contract.effectiveAt))
      });
    }
  }
});
