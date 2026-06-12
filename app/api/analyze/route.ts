import { NextRequest } from 'next/server'
import { buildPrompt } from '@/lib/prompt'
import { calculateRuleBasedScores } from '@/lib/scoring'
import type { Answers } from '@/lib/questions'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

interface DimensionResult {
  score: number
  comment: string
}

interface AIAnalysisResult {
  dimensions: Record<string, DimensionResult>
  transferableSkills: string[]
  mindsetScore: number
  summary: string
}

async function callDeepSeek(prompt: string): Promise<AIAnalysisResult> {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('Empty response from DeepSeek API')
  }

  // 提取 JSON（可能被 markdown 代码块包裹）
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from DeepSeek response')
  }

  return JSON.parse(jsonMatch[0]) as AIAnalysisResult
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const answers: Answers = body.answers

    if (!answers || Object.keys(answers).length < 9) {
      return Response.json(
        { error: '请完成所有题目后再提交' },
        { status: 400 }
      )
    }

    // 先计算规则评分作为 fallback
    const ruleScores = calculateRuleBasedScores(answers)

    // 尝试调用 DeepSeek API
    if (!DEEPSEEK_API_KEY) {
      // 没有 API key，直接返回规则评分
      return Response.json({
        source: 'rule',
        dimensions: ruleScores.dimensions,
        transferableSkills: ['综合分析能力', '执行力'],
        mindsetScore: 3,
        summary:
          '基于你的基本信息，你在多个维度都展现出了不错的转型潜力。建议先明确自己最想切入的AI方向，然后有针对性地补齐知识短板。欢迎预约1对1诊断，获取专属转型路径规划。',
      })
    }

    try {
      const prompt = buildPrompt(answers)
      const aiResult = await callDeepSeek(prompt)

      // 用 AI 返回的分数，补充维度名称
      const dimensionNames = ['赛道适配', '能力迁移', '学习能力', '行业资源', '风险评估']
      const dimensions = dimensionNames.map((name) => {
        const aiDim = aiResult.dimensions[name]
        if (aiDim) {
          // 应用正向偏移，确保 AI 分数不会太低
          const score = Math.min(100, Math.max(50, aiDim.score + 8))
          return { name, score, comment: aiDim.comment }
        }
        // AI 没返回某个维度，用规则评分兜底
        const fallback = ruleScores.dimensions.find((d) => d.name === name)
        return {
          name,
          score: fallback?.score ?? 70,
          comment: '',
        }
      })

      const totalScore = Math.round(
        dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
      )

      return Response.json({
        source: 'ai',
        dimensions,
        transferableSkills: aiResult.transferableSkills || [],
        mindsetScore: aiResult.mindsetScore || 3,
        summary: aiResult.summary || '',
        totalScore,
      })
    } catch (aiError) {
      console.error('DeepSeek API failed, using rule-based fallback:', aiError)
      // AI 调用失败，返回规则评分
      return Response.json({
        source: 'rule',
        dimensions: ruleScores.dimensions,
        transferableSkills: ['综合分析能力', '执行力'],
        mindsetScore: 3,
        summary:
          '基于你的基本信息，你在多个维度都展现出了不错的转型潜力。建议先明确自己最想切入的AI方向，然后有针对性地补齐知识短板。欢迎预约1对1诊断，获取专属转型路径规划。',
        totalScore: ruleScores.totalScore,
      })
    }
  } catch (error) {
    console.error('Analyze API error:', error)
    return Response.json({ error: '分析服务暂时不可用，请稍后重试' }, { status: 500 })
  }
}
