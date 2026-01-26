# MVP 说明（育儿陪伴小程序）

## 目标
- 将“感觉”转化为可量化的数据点：任务、情绪、互动评分、测评结果。
- 通过AI问答与测评引导用户行动，积累高质量标签数据。

## 核心模块
1. 每日积极任务与完成记录
2. 家庭情绪记录（评分 + 标签 + 记录）
3. “微行动”极简打卡
4. 深度记录与反馈（亲子互动评分、执行后反馈）
5. 求助信号可视化（规则+命中情况）
6. AI育儿问答（含反馈）
7. 轻测评 + 报告 + 行动召唤

## 数据模型（本地演示版）
- tasks
  - id, title, description, tags, duration
- taskLogs
  - id, taskId, taskTitle, dateKey, createdAt
- moodLogs
  - id, dateKey, score, tags[], note, createdAt
- microCheckins
  - id, dateKey, action, note, createdAt
- deepRecords
  - id, dateKey, taskId, taskTitle, interactionScore, moodChange, reflection, keywords[], createdAt
- aiChats
  - id, role, content, tags?, createdAt
- aiFeedback
  - messageId, rating?, like?, updatedAt
- assessments
  - id, title, description, isPaid, price?, questions[]
- assessmentReports
  - id, assessmentId, title, scene, totalScore, avgScore, level, riskFlag, summary, actionText, createdAt
- triggerEvents
  - id, type, message, createdAt
- userProfile
  - role, nickname, organization
- settings
  - aiApiKey, consecutiveMissedDays, lowMoodScore, keywordList

## AI 提示词框架（简版）
system:
你是一位家庭教育顾问，遵循共情、尊重与可执行建议的原则。回答要避免诊断式表述，使用建议与引导式表达，鼓励记录可量化的行动与反馈。

## 求助信号触发（可视化阶段）
- 连续未打卡天数 >= 阈值
- 低心情评分 <= 阈值
- 关键词命中（厌学/情绪崩溃/焦虑等）

## 后端接口预留（下一阶段）
- POST /api/ai/chat
- POST /api/records
- POST /api/moods
- POST /api/checkins
- POST /api/assessments/submit
- GET /api/reports
- POST /api/triggers

## 付费测评与支付
当前仅模拟支付流程。正式上线需接入微信支付 + 商户号。
