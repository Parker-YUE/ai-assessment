'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Answers } from '@/lib/questions'
import { DIMENSION_NAMES } from '@/lib/scoring'

interface DimensionResult {
  name: string
  score: number
  comment: string
}

interface AnalysisResult {
  dimensions: DimensionResult[]
  transferableSkills: string[]
  mindsetScore: number
  summary: string
  totalScore: number
}

// SVG 雷达图组件
function RadarChart({ dimensions }: { dimensions: DimensionResult[] }) {
  const size = 320
  const center = size / 2
  const radius = 80
  const levels = 4
  const labelR = radius + 14 // 标签贴近顶点

  const angleStep = (2 * Math.PI) / 5
  const startAngle = -Math.PI / 2

  const getPoint = (index: number, r: number) => {
    const angle = startAngle + index * angleStep
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  const dataPoints = dimensions.map((d, i) => {
    const r = (d.score / 100) * radius
    return getPoint(i, r)
  })

  // 5个顶点的角度和方向偏移
  const labelConfigs: { textAnchor: 'start' | 'middle' | 'end'; dx: number; dy: number }[] = [
    { textAnchor: 'middle', dx: 0, dy: -6 },
    { textAnchor: 'start', dx: 6, dy: 2 },
    { textAnchor: 'start', dx: 6, dy: 6 },
    { textAnchor: 'end', dx: -6, dy: 6 },
    { textAnchor: 'end', dx: -6, dy: 2 },
  ]

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} className="mx-auto max-w-[320px]">
      {/* 网格 */}
      {Array.from({ length: levels }, (_, level) => {
        const r = ((level + 1) / levels) * radius
        const points = Array.from({ length: 5 }, (_, i) => {
          const p = getPoint(i, r)
          return `${p.x},${p.y}`
        }).join(' ')
        return (
          <polygon key={level} points={points} fill="none" stroke="#e2e8f0" strokeWidth="1" />
        )
      })}

      {/* 轴线 */}
      {Array.from({ length: 5 }, (_, i) => {
        const p = getPoint(i, radius)
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth="1" />
      })}

      {/* 数据区域 */}
      <polygon
        points={dataPoints.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="rgba(79, 70, 229, 0.15)"
        stroke="#4f46e5"
        strokeWidth="2"
        className="radar-draw"
      />

      {/* 数据点 */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
      ))}

      {/* 维度标签 - 贴近顶点 */}
      {dimensions.map((d, i) => {
        const angle = startAngle + i * angleStep
        const lx = center + labelR * Math.cos(angle)
        const ly = center + labelR * Math.sin(angle)
        const cfg = labelConfigs[i]

        return (
          <text
            key={i}
            x={lx + cfg.dx}
            y={ly + cfg.dy}
            textAnchor={cfg.textAnchor}
            dominantBaseline="central"
            className="fill-foreground font-medium"
            fontSize="11"
          >
            {d.name}
          </text>
        )
      })}
    </svg>
  )
}

// 分数条颜色
function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-success'
  if (score >= 60) return 'bg-primary'
  if (score >= 40) return 'bg-warning'
  return 'bg-danger'
}

function getScoreLabel(score: number): string {
  if (score >= 85) return '优秀'
  if (score >= 70) return '良好'
  if (score >= 55) return '中等'
  return '待提升'
}

export default function ResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const shareCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const stored = sessionStorage.getItem('assessment_answers')
        if (!stored) {
          router.push('/assessment')
          return
        }
        const answers: Answers = JSON.parse(stored)

        // 客户端直接调用 DeepSeek API（GitHub Pages 无服务端）
        const { calculateRuleBasedScores } = await import('@/lib/scoring')
        const { analyzeWithAI } = await import('@/lib/deepseek')
        const ruleScores = calculateRuleBasedScores(answers)
        const data = await analyzeWithAI(answers, ruleScores)
        setResult(data)
      } catch (err) {
        console.error(err)
        setError('分析服务暂时不可用，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [router])

  const handleShare = useCallback(async () => {
    if (!shareCardRef.current) return

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        backgroundColor: '#f8f9fb',
        useCORS: true,
      })

      // 移动端：尝试用 Web Share API
      if (navigator.share && canvas.toBlob) {
        canvas.toBlob(async (blob) => {
          if (!blob) return
          const file = new File([blob], 'ai-assessment-result.png', { type: 'image/png' })
          try {
            await navigator.share({
              title: 'AI转型匹配度测评',
              text: '测一测，你适合转AI吗？',
              files: [file],
            })
            return
          } catch {
            // 用户取消或不支持文件分享，走下载逻辑
          }
        }, 'image/png')
      }

      // fallback：下载图片
      const link = document.createElement('a')
      link.download = 'ai-assessment-result.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('分享失败:', err)
      alert('生成分享图片失败，请截图分享')
    }
  }, [])

  // Loading 状态
  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center">
          {/* 动画圆点 */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-primary pulse-dot" />
            <div className="w-3 h-3 rounded-full bg-primary pulse-dot" />
            <div className="w-3 h-3 rounded-full bg-primary pulse-dot" />
          </div>
          <h2 className="text-lg font-semibold mb-2">AI 正在分析你的转型潜力</h2>
          <p className="text-text-secondary text-sm">预计需要 5-8 秒...</p>
        </div>
      </main>
    )
  }

  // 错误状态
  if (error || !result) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">分析遇到了问题</h2>
          <p className="text-text-secondary text-sm mb-6">{error || '未知错误'}</p>
          <button
            onClick={() => router.push('/assessment')}
            className="px-6 py-3 rounded-xl bg-primary text-white font-medium"
          >
            重新测评
          </button>
        </div>
      </main>
    )
  }

  const totalScore = result.totalScore || Math.round(result.dimensions.reduce((s, d) => s + d.score, 0) / 5)

  return (
    <main className="min-h-screen bg-background pb-52">
      {/* 分享卡片区域（可截图） */}
      <div ref={shareCardRef} className="bg-background">
        {/* 头部：总分 */}
        <div className="bg-gradient-to-br from-primary to-accent text-white px-6 pt-12 pb-10 rounded-b-3xl">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-white/80 text-sm mb-1">你的AI转型匹配度</p>
            <div className="text-6xl font-bold mb-2">{totalScore}</div>
            <p className="text-white/80 text-sm">
              {totalScore >= 80
                ? '你具备很好的AI转型潜力！'
                : totalScore >= 65
                ? '你有不错的转型基础，方向对了就能成！'
                : '转型有挑战，但找准路径一样可以！'}
            </p>

            {/* 可迁移技能标签 */}
            {result.transferableSkills.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {result.transferableSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 雷达图 */}
        <div className="max-w-lg mx-auto px-6 -mt-6">
          <div className="bg-surface rounded-2xl shadow-lg p-6">
            <RadarChart dimensions={result.dimensions} />
          </div>
        </div>

        {/* 各维度详情 */}
        <div className="max-w-lg mx-auto px-6 mt-6 space-y-4">
          {result.dimensions.map((dim) => (
            <div key={dim.name} className="bg-surface rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{dim.name}</h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      dim.score >= 80
                        ? 'bg-success/10 text-success'
                        : dim.score >= 60
                        ? 'bg-primary/10 text-primary'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {getScoreLabel(dim.score)}
                  </span>
                  <span className="text-lg font-bold">{dim.score}</span>
                </div>
              </div>

              {/* 分数条 */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full score-bar-fill ${getScoreColor(dim.score)}`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>

              {/* AI 点评 */}
              {dim.comment && (
                <p className="text-sm text-text-secondary leading-relaxed">
                  {dim.comment}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* 综合建议 */}
        {result.summary && (
          <div className="max-w-lg mx-auto px-6 mt-6">
            <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
              <h3 className="font-semibold text-primary mb-2">💡 专属建议</h3>
              <p className="text-sm leading-relaxed text-foreground/80">
                {result.summary}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t border-gray-100 z-20">
        <div className="max-w-lg mx-auto px-6 py-4 space-y-3">
          {/* 咨询 CTA */}
          <button
            onClick={() => {
              // 复制微信号到剪贴板，提示用户去微信添加
              navigator.clipboard.writeText('allen20255').then(() => {
                alert('微信号已复制：allen20255\n请打开微信搜索添加，备注"AI转型咨询"')
              }).catch(() => {
                alert('添加微信：allen20255\n备注"AI转型咨询"')
              })
            }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-lg shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
          >
            添加微信，预约1对1转型诊断
          </button>

          {/* 分享按钮 */}
          <button
            onClick={handleShare}
            className="w-full py-3 rounded-xl border-2 border-primary/20 text-primary font-medium hover:bg-primary/5 active:scale-[0.98] transition-all"
          >
            分享给朋友测一测
          </button>
        </div>
      </div>
    </main>
  )
}
