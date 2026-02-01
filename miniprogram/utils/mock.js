const { createId } = require("./id");

const starterTasks = [
  {
    id: "task_breath",
    title: "情绪暂停一分钟",
    description: "当孩子情绪上来时，先深呼吸3次再回应。",
    tags: ["沟通", "情绪调节"],
    duration: "1分钟"
  },
  {
    id: "task_praise",
    title: "发现一个积极行为",
    description: "今天记录孩子一个值得肯定的小行为。",
    tags: ["正向反馈"],
    duration: "2分钟"
  },
  {
    id: "task_talk",
    title: "共情式倾听",
    description: "用一句话复述孩子的感受，确认理解。",
    tags: ["亲子沟通"],
    duration: "3分钟"
  }
];

const microActions = [
  "对孩子说一句具体的肯定",
  "给自己10秒情绪缓冲",
  "把手机放远5分钟",
  "给孩子一个拥抱",
  "和孩子一起做一次小整理"
];

const assessments = [
  {
    id: "assessment_mood",
    title: "家庭情绪温度计",
    description: "了解近一周家庭的情绪氛围。",
    isPaid: false,
    required: true,
    category: "必做测评",
    questions: [
      {
        id: createId("q"),
        title: "最近一周，家庭整体情绪偏向",
        type: "choice",
        options: [
          { label: "轻松稳定", score: 4 },
          { label: "偶有波动", score: 3 },
          { label: "经常紧张", score: 2 },
          { label: "持续低落", score: 1 }
        ]
      },
      {
        id: createId("q"),
        title: "亲子沟通时，彼此感受到的理解程度",
        type: "choice",
        options: [
          { label: "大多能理解", score: 4 },
          { label: "有时理解", score: 3 },
          { label: "经常误解", score: 2 },
          { label: "几乎无法理解", score: 1 }
        ]
      }
    ]
  },
  {
    id: "assessment_style",
    title: "亲子沟通风格评估",
    description: "了解沟通方式和互动质量。",
    isPaid: false,
    required: true,
    category: "必做测评",
    questions: [
      {
        id: createId("q"),
        title: "当孩子犯错时，我更常",
        type: "choice",
        options: [
          { label: "先了解原因再引导", score: 4 },
          { label: "提醒并提出建议", score: 3 },
          { label: "直接批评", score: 2 },
          { label: "忽视或冷处理", score: 1 }
        ]
      },
      {
        id: createId("q"),
        title: "冲突后修复关系的频率",
        type: "choice",
        options: [
          { label: "几乎都会修复", score: 4 },
          { label: "大多数会修复", score: 3 },
          { label: "偶尔修复", score: 2 },
          { label: "很少修复", score: 1 }
        ]
      }
    ]
  },
  {
    id: "assessment_pressure",
    title: "家庭情绪压力指数",
    description: "识别家庭情绪压力的主要来源。",
    isPaid: false,
    category: "免费测评",
    questions: [
      {
        id: createId("q"),
        title: "最近一周，家人间冲突强度",
        type: "scale",
        scale: { min: 1, max: 5, leftLabel: "很低", rightLabel: "很高" }
      },
      {
        id: createId("q"),
        title: "家庭成员对情绪支持的满意度",
        type: "scale",
        scale: { min: 1, max: 5, leftLabel: "不满意", rightLabel: "很满意" }
      },
      {
        id: createId("q"),
        title: "孩子近期的情绪稳定程度",
        type: "scale",
        scale: { min: 1, max: 5, leftLabel: "波动大", rightLabel: "稳定" }
      }
    ]
  },
  {
    id: "assessment_paid",
    title: "学习动力深度评估",
    description: "付费测评，深入了解学习动力与家庭生态。",
    isPaid: true,
    price: 99,
    category: "进阶测评",
    questions: [
      {
        id: createId("q"),
        title: "孩子对学习的主动性",
        type: "choice",
        options: [
          { label: "非常主动", score: 4 },
          { label: "较主动", score: 3 },
          { label: "需要提醒", score: 2 },
          { label: "强烈抗拒", score: 1 }
        ]
      },
      {
        id: createId("q"),
        title: "家庭支持学习的方式",
        type: "choice",
        options: [
          { label: "稳定且有节奏", score: 4 },
          { label: "偶尔有节奏", score: 3 },
          { label: "常被打断", score: 2 },
          { label: "缺少支持", score: 1 }
        ]
      },
      {
        id: createId("q"),
        title: "学习目标的清晰程度",
        type: "scale",
        scale: { min: 1, max: 5, leftLabel: "不清晰", rightLabel: "很清晰" }
      }
    ]
  },
  {
    id: "assessment_ecosystem",
    title: "家庭生态系统分析",
    description: "付费测评，识别家庭支持系统与关键变量。",
    isPaid: true,
    price: 99,
    category: "进阶测评",
    questions: [
      {
        id: createId("q"),
        title: "家庭规则的清晰度",
        type: "scale",
        scale: { min: 1, max: 5, leftLabel: "混乱", rightLabel: "清晰" }
      },
      {
        id: createId("q"),
        title: "家庭成员分工的稳定性",
        type: "scale",
        scale: { min: 1, max: 5, leftLabel: "不稳定", rightLabel: "稳定" }
      },
      {
        id: createId("q"),
        title: "可调用的外部支持资源",
        type: "choice",
        options: [
          { label: "资源充足", score: 4 },
          { label: "资源较多", score: 3 },
          { label: "资源较少", score: 2 },
          { label: "几乎没有", score: 1 }
        ]
      }
    ]
  }
];

const aiQuickPrompts = [
  "孩子情绪崩溃时我该怎么办？",
  "如何减少亲子冲突？",
  "如何帮助孩子建立学习动力？",
  "孩子厌学时如何沟通？"
];

const contractTemplate = [
  {
    title: "服务范围",
    content:
      "本服务聚焦于家庭教育与亲子沟通支持，不构成医疗或临床诊断建议。"
  },
  {
    title: "服务形式",
    content:
      "服务包含测评、行动计划、阶段性回顾与线上沟通支持。具体服务内容以平台展示为准。"
  },
  {
    title: "用户责任",
    content:
      "请如实填写测评与记录信息，以便生成更准确的服务建议。"
  },
  {
    title: "隐私与数据",
    content:
      "我们将基于隐私政策处理您的数据，并采取合理安全措施进行保护。"
  }
];

function getMockAiReply(userText) {
  const responses = [
    "先稳定情绪，再回应行为。可以用一句话描述孩子的感受，帮助他被理解。",
    "试试用“感受+需要+邀请”的方式表达，比如：我看到你很着急，我们一起想办法。",
    "先从可完成的小任务开始，建立成就感，再逐步增加挑战。"
  ];
  const index = Math.floor(Math.random() * responses.length);
  return {
    content: responses[index],
    tags: ["情绪支持", "沟通技巧"],
    source: "mock",
    matchedTo: userText
  };
}

module.exports = {
  starterTasks,
  microActions,
  assessments,
  contractTemplate,
  aiQuickPrompts,
  getMockAiReply
};
