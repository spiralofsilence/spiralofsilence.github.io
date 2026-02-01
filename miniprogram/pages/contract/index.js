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
    progressMap: {}
  },
  onShow() {
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
      progressMap
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
