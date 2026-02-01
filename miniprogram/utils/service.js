const { STORAGE_KEYS, getStorage, setStorage } = require("./storage");

function getDefaultStages() {
  return [
    {
      id: "stage_1",
      title: "基线评估与目标确定",
      status: "todo",
      completedAt: null,
      todos: ["确认关注点", "建立目标指标"]
    },
    {
      id: "stage_2",
      title: "21天焦点陪跑",
      status: "todo",
      completedAt: null,
      todos: ["每周反馈", "微行动复盘"]
    },
    {
      id: "stage_3",
      title: "效果评估与复盘",
      status: "todo",
      completedAt: null,
      todos: ["生成成长报告", "制定下阶段建议"]
    }
  ];
}

function ensureServicePlan() {
  const existing = getStorage(STORAGE_KEYS.SERVICE_PLAN);
  if (existing) return existing;
  const plan = {
    id: `service_${Date.now()}`,
    status: "pending",
    stages: getDefaultStages(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  setStorage(STORAGE_KEYS.SERVICE_PLAN, plan);
  return plan;
}

function startServicePlan() {
  const plan = ensureServicePlan();
  if (plan.status !== "in_progress") {
    plan.status = "in_progress";
    if (plan.stages[0] && plan.stages[0].status === "todo") {
      plan.stages[0].status = "doing";
    }
    plan.updatedAt = Date.now();
    setStorage(STORAGE_KEYS.SERVICE_PLAN, plan);
  }
  return plan;
}

function updateStageStatus(stageId, status) {
  const plan = ensureServicePlan();
  const stage = plan.stages.find((item) => item.id === stageId);
  if (!stage) return plan;
  stage.status = status;
  stage.completedAt = status === "done" ? Date.now() : null;
  plan.updatedAt = Date.now();
  setStorage(STORAGE_KEYS.SERVICE_PLAN, plan);
  return plan;
}

function maybeCompleteService() {
  const plan = getStorage(STORAGE_KEYS.SERVICE_PLAN);
  if (!plan) return null;
  const allDone = plan.stages.every((stage) => stage.status === "done");
  if (allDone && plan.status !== "completed") {
    plan.status = "completed";
    plan.updatedAt = Date.now();
    setStorage(STORAGE_KEYS.SERVICE_PLAN, plan);
  }
  return plan;
}

module.exports = {
  ensureServicePlan,
  startServicePlan,
  updateStageStatus,
  maybeCompleteService
};
