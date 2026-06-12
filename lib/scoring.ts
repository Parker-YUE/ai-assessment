import type { Answers } from './questions'

// 各维度名称
export const DIMENSION_NAMES = [
  '赛道适配',
  '能力迁移',
  '学习能力',
  '行业资源',
  '风险评估',
] as const

export type DimensionName = (typeof DIMENSION_NAMES)[number]

export interface DimensionScore {
  name: DimensionName
  score: number // 0-100
}

export interface ScoringResult {
  dimensions: DimensionScore[]
  totalScore: number
}

// 选项到分数的映射（选择题）
// Q1: A=2, B=3, C=3, D=4（工作年限，有积累和带团队反而加分）
const Q1_SCORES: Record<string, number> = { A: 2, B: 3, C: 3, D: 4 }
// Q2: A=4, B=4, C=3, D=2（统筹和协调最适配产品经理）
const Q2_SCORES: Record<string, number> = { A: 4, B: 4, C: 3, D: 2 }
// Q3: A=1, B=2, C=3, D=4, E=5, F=6（AI接触程度直接映射）
const Q3_SCORES: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6 }
// Q4: A=4, B=2, C=3, D=1（主动判断赛道下行最强，跟风最弱）
const Q4_SCORES: Record<string, number> = { A: 4, B: 2, C: 3, D: 1 }
// Q5: A=4, B=3, C=2, D=1（从零经历越多越好）
const Q5_SCORES: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 }
// Q8: A=4, B=3, C=2, D=1（投入时间越多越好）
const Q8_SCORES: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 }
// Q9: A=4, B=3, C=2, D=1（缓冲期越长越好）
const Q9_SCORES: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 }

// 将原始分归一化到 50-95 区间（基础分50 + 按比例分配45分）
// 这样满分不会到100，最低分不会太低
function normalize(raw: number, max: number): number {
  return Math.round(50 + (raw / max) * 45)
}

// 正向偏移：+5分，上限95
function applyPositiveBias(score: number): number {
  return Math.min(95, score + 5)
}

/**
 * 纯规则评分（作为 DeepSeek API 不可用时的 fallback）
 * 各维度权重：
 * - 赛道适配: Q1(20%) + Q4(80%)
 * - 能力迁移: Q2(40%) + Q5(40%) + 基础分(20%)
 * - 学习能力: Q3(60%) + Q8(40%)
 * - 行业资源: Q2(40%) + 基础分(60%)  (简答题内容靠AI提取，fallback时给中等偏上基础分)
 * - 风险评估: Q9(60%) + Q8(20%) + 基础分(20%)
 */
export function calculateRuleBasedScores(answers: Answers): ScoringResult {
  const q1 = Q1_SCORES[answers[1]] ?? 2
  const q2 = Q2_SCORES[answers[2]] ?? 2
  const q3 = Q3_SCORES[answers[3]] ?? 1
  const q4 = Q4_SCORES[answers[4]] ?? 2
  const q5 = Q5_SCORES[answers[5]] ?? 2
  const q8 = Q8_SCORES[answers[8]] ?? 2
  const q9 = Q9_SCORES[answers[9]] ?? 2

  // 简答题基础分：有写就给3分（满分5），没写给2分
  const q6Base = (answers[6]?.trim()?.length ?? 0) > 0 ? 3 : 2
  const q7Positive = 3 // fallback时假设心态中等偏上

  const dimensions: DimensionScore[] = [
    {
      name: '赛道适配',
      score: normalize(q1 * 0.2 + q4 * 0.8, 4),
    },
    {
      name: '能力迁移',
      score: normalize(q2 * 0.4 + q5 * 0.4 + q6Base * 0.2 * (4 / 5), 4),
    },
    {
      name: '学习能力',
      score: normalize(q3 * 0.6 * (4 / 6) + q8 * 0.4, 4),
    },
    {
      name: '行业资源',
      score: normalize(q2 * 0.4 + q6Base * 0.6 * (4 / 5), 4),
    },
    {
      name: '风险评估',
      score: normalize(q9 * 0.6 + q8 * 0.2 + q7Positive * 0.2 * (4 / 5), 4),
    },
  ]

  // 应用正向偏移
  dimensions.forEach((d) => {
    d.score = applyPositiveBias(d.score)
  })

  const totalScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
  )

  return { dimensions, totalScore }
}
