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
  return value
}

export interface AnalysisResult {
  dimensions: { name: string; score: number; comment: string }[]
  transferableSkills: string[]
  mindsetScore: number
  summary: string
  totalScore: number
}

const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || ''
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com'

export async function analyzeWithAI(answers: Answers, ruleScores: { dimensions: { name: string; score: number }[]; totalScore: number }): Promise<AnalysisResult> {
  // 如果没有 API Key，直接返回规则评分
  if (!DEEPSEEK_API_KEY) {
    return {
      dimensions: ruleScores.dimensions.map((d) => ({ ...d, comment: '' })),
      transferableSkills: ['综合分析能力', '执行力'],
      mindsetScore: 3,
      summary: '基于你的基本信息，你在多个维度都展现出了不错的转型潜力。建议先明确自己最想切入的AI方向，然后有针对性地补齐知识短板。欢迎添加微信 allen20255 预约1对1诊断，获取专属转型路径规划。',
      totalScore: ruleScores.totalScore,
    }
  }

  const q1 = getAnswerText(1, answers[1])
  const q2 = getAnswerText(2, answers[2])
  const q3 = getAnswerText(3, answers[3])
  const q4 = getAnswerText(4, answers[4])
  const q5 = getAnswerText(5, answers[5])
  const q6 = getAnswerText(6, answers[6])
  const q7 = getAnswerText(7, answers[7])
  const q8 = getAnswerText(8, answers[8])
  const q9 = getAnswerText(9, answers[9])

  const prompt = `你是一位资深AI行业职业转型顾问，正在为一位非技术背景的职场人做AI转型匹配度评估。请基于以下用户信息，给出专业且有温度的分析。

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
- 避免给极低分（一般不低于50），避免给满分（一般不高于95）

评分一致性要求（非常重要，必须严格遵守）：
- 对于相同或高度相似的用户输入，各维度的分数必须高度一致，差异不超过3分
- 不同维度之间的分数差异应反映真实的能力差异，不要随机波动
- 相同选择题组合的用户，即使简答题表述略有不同，对应维度的分数差距也不应超过5分
- 评分必须有明确的计算逻辑，不要凭感觉随意打分，参考以下对照表：
  * Q4选A(旧行业下行)→赛道适配基础分80，选C(对AI有热情)→75，选B(不想被抛下)→65，选D(跟风)→55
  * Q2选A/B(统筹协调)→能力迁移基础分80，选C(专业输出)→70，选D(执行落地)→60
  * Q3选A→学习能力基础分50，B→60，C→70，D→78，E→85，F→90
  * Q5选A→能力迁移+8分，B→+5分，C→+0分，D→-5分
  * Q8选A→学习能力+8分，B→+5分，C→+0分，D→-5分
  * Q9选A→风险评估基础分85，B→75，C→60，D→45
  * 在基础分上根据简答题内容微调（±5分以内），简答题相同含义不同表述不应导致分数差异`

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty response')

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not parse JSON')

    const aiResult = JSON.parse(jsonMatch[0])

    // AI 分数与规则分数交叉校准
    const dimensionNames = ['赛道适配', '能力迁移', '学习能力', '行业资源', '风险评估']
    const dimensions = dimensionNames.map((name) => {
      const aiDim = aiResult.dimensions[name]
      const ruleDim = ruleScores.dimensions.find((d) => d.name === name)
      const ruleScore = ruleDim?.score ?? 70

      if (aiDim) {
        let score = aiDim.score
        const diff = score - ruleScore
        if (Math.abs(diff) > 10) {
          score = ruleScore + Math.sign(diff) * 10
        }
        score = Math.min(95, Math.max(50, score))
        return { name, score, comment: aiDim.comment || '' }
      }
      return { name, score: ruleScore, comment: '' }
    })

    const totalScore = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length)

    return {
      dimensions,
      transferableSkills: aiResult.transferableSkills || [],
      mindsetScore: aiResult.mindsetScore || 3,
      summary: aiResult.summary || '',
      totalScore,
    }
  } catch (err) {
    console.error('DeepSeek API failed, using rule-based fallback:', err)
    return {
      dimensions: ruleScores.dimensions.map((d) => ({ ...d, comment: '' })),
      transferableSkills: ['综合分析能力', '执行力'],
      mindsetScore: 3,
      summary: '基于你的基本信息，你在多个维度都展现出了不错的转型潜力。建议先明确自己最想切入的AI方向，然后有针对性地补齐知识短板。欢迎添加微信 allen20255 预约1对1诊断，获取专属转型路径规划。',
      totalScore: ruleScores.totalScore,
    }
  }
}
