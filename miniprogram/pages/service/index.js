const { formatDateTime } = require("../../utils/date");
const { ensureServicePlan, startServicePlan, updateStageStatus, maybeCompleteService } = require("../../utils/service");
const { areRequiredCompleted } = require("../../utils/assessment");
const { STORAGE_KEYS, appendToList } = require("../../utils/storage");
const { ensureAssessment } = require("../../utils/gate");

Page({
  data: {
    plan: null,
    progressPercent: 0,
    requiredCompleted: false
  },
  onShow() {
    if (!ensureAssessment()) return;
    const requiredCompleted = areRequiredCompleted();
    let plan = ensureServicePlan();
    if (requiredCompleted && plan.status === "pending") {
      plan = startServicePlan();
    }
    plan = maybeCompleteService() || plan;
    this.setData({
      plan: this.decoratePlan(plan),
      progressPercent: this.calculateProgress(plan),
      requiredCompleted
    });
  },
  decoratePlan(plan) {
    if (!plan) return null;
    const statusMap = {
      pending: "待启动",
      in_progress: "进行中",
      completed: "已完成",
      paused: "已暂停"
    };
    const stageStatusMap = {
      todo: "待开始",
      doing: "进行中",
      done: "已完成"
    };
    return {
      ...plan,
      statusLabel: statusMap[plan.status] || plan.status,
      stages: plan.stages.map((stage) => ({
        ...stage,
        statusLabel: stageStatusMap[stage.status] || stage.status,
        completedAtLabel: stage.completedAt ? formatDateTime(new Date(stage.completedAt)) : ""
      }))
    };
  },
  calculateProgress(plan) {
    if (!plan || !plan.stages.length) return 0;
    const doneCount = plan.stages.filter((stage) => stage.status === "done").length;
    return Math.round((doneCount / plan.stages.length) * 100);
  },
  setStageStatus(e) {
    const { id, status } = e.currentTarget.dataset;
    updateStageStatus(id, status);
    if (status === "done") {
      appendToList(STORAGE_KEYS.NOTIFICATIONS, {
        id: `notify_${Date.now()}`,
        type: "service_stage",
        message: "服务阶段完成提醒",
        status: "pending",
        createdAt: Date.now()
      });
    }
    this.onShow();
  }
});
