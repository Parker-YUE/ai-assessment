# AI转型匹配度测评网站

## 项目简介
非技术背景AI转型匹配度测评工具，用户回答9个问题后，AI分析5维度评分并给出个性化建议，引导用户预约1对1咨询。

## 技术栈
- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- DeepSeek API（AI分析，服务端调用）
- html2canvas（分享卡片生成）
- 部署：Vercel

## 项目结构
```
app/
├── page.tsx              # 落地页
├── assessment/page.tsx   # 答题页（核心交互）
├── result/page.tsx       # 结果页（雷达图+评分+分享）
├── api/analyze/route.ts  # DeepSeek API 路由
lib/
├── questions.ts          # 9道题目数据
├── scoring.ts            # 规则评分算法（fallback）
├── prompt.ts             # DeepSeek prompt 模板
```

## 开发命令
- `npm run dev` — 本地开发服务器
- `npm run build` — 生产构建
- `npm run start` — 生产模式运行

## 环境变量
- `DEEPSEEK_API_KEY` — DeepSeek API密钥（必填）
- `DEEPSEEK_BASE_URL` — API地址，默认 https://api.deepseek.com
- `DEEPSEEK_MODEL` — 模型名，默认 deepseek-chat

## 关键业务规则
- 9题：7道选择题 + 2道简答题
- 5维度评分：赛道适配、能力迁移、学习能力、行业资源、风险评估
- 分数正向偏移+5，范围 55-95，多数人落在 65-85
- API 不可用时自动 fallback 到规则评分
- 分数越低越需要咨询，分数高也要咨询深化路径
