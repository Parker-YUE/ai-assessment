import type { Answers } from './questions'

const OPTION_LABELS: Record<number, Record<string, string>> = {
  1: { A: '3年以内探索期', B: '3-7年有积累', C: '7年+遇天花板', D: '管理层想转型' },
  2: { A: '项目统筹推进', B: '跨部门协调', C: '深度专业输出', D: '执行落地' },
  3: { A: '没接触过', B: '偶尔用聊天工具', C: '常用+基本提示词', D: 'Coze/Dify搭工作流', E: 'Vibe Coding', F: '精通0-1开发' },
  4: { A: '旧行业下行必须转', B: '不想被时代抛下', C: '对AI有热情', D: '身边有人成功想试' },
  5: { A: '多次0-1', B: '1-2次', C: '框架内优化', D: '基本没有' },
  8: { A: '10h+/周', B: '5-10h/周', C: '2-5h/周', D: '不到2h/周' },
  9: { A: '6月+缓冲', B: '3-6月缓冲', C: '1-3月缓冲', D: '基本没缓冲' },
}

function getAnswerText(qId: number, value: string): string {
  const labels = OPTION_LABELS[qId]
  if (labels && labels[value]) return labels[value]
  return value // 简答题直接返回原文
}

export function buildPrompt(answers: Answers): string {
  const q1 = getAnswerText(1, answers[1])
  const q2 = getAnswerText(2, answers[2])
  const q3 = getAnswerText(3, answers[3])
  const q4 = getAnswerText(4, answers[4])
  const q5 = getAnswerText(5, answers[5])
  const q6 = getAnswerText(6, answers[6])
  const q7 = getAnswerText(7, answers[7])
  const q8 = getAnswerText(8, answers[8])
  const q9 = getAnswerText(9, answers[9])

  return `你是一位资深AI行业职业转型顾问，正在为一位非技术背景的职场人做AI转型匹配度评估。请基于以下用户信息，给出专业且有温度的分析。

用户信息：
- 工作年限和状态：${q1}
- 最常做的事：${q2}
- AI接触程度：${q3}
- 转型驱动力：${q4}
- 从零搞定事情的经历：${q5}
- 自述最大优势：${q6}
- 自述最大短板：${q7}
- 每周可投入学习时间：${q8}
- 财务缓冲期：${q9}

请严格按以下JSON格式输出（不要输出任何其他内容）：
{
  "dimensions": {
    "赛道适配": {
      "score": <0-100的整数，偏积极鼓励，多数人应落在60-90区间>,
      "comment": "<2-3句个性化点评，先肯定亮点，再温和指出可改进方向>"
    },
    "能力迁移": {
      "score": <0-100的整数>,
      "comment": "<2-3句个性化点评>"
    },
    "学习能力": {
      "score": <0-100的整数>,
      "comment": "<2-3句个性化点评>"
    },
    "行业资源": {
      "score": <0-100的整数>,
      "comment": "<2-3句个性化点评>"
    },
    "风险评估": {
      "score": <0-100的整数，分数越高代表风险越可控>,
      "comment": "<2-3句个性化点评>"
    }
  },
  "transferableSkills": ["<从用户自述优势中提取的可迁移能力关键词，2-3个>"],
  "mindsetScore": <1-5的整数，从用户自述短板中判断心态积极程度，5为最积极>,
  "summary": "<200字以内的综合建议，鼓励为主，给出1-2个具体行动方向>"
}

评分原则：
- 整体偏积极鼓励，分数略高于纯客观计算结果
- 有明确转型动力（非跟风）的加分
- 有行业经验、统筹协调能力的加分
- 有从零经历、学习能力强的加分
- 短板描述越具体、越有自知之明的，心态分越高
- 避免给极低分（一般不低于50），避免给满分（一般不高于95）`
}
