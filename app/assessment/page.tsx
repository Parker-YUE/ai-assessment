'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { questions, type Answers } from '@/lib/questions'

export default function AssessmentPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [autoAdvance, setAutoAdvance] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const isLastQuestion = currentIndex === totalQuestions - 1

  // 选择题选中后，触发自动跳题
  useEffect(() => {
    if (autoAdvance && !isLastQuestion) {
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
        setAutoAdvance(false)
      }, 400)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [autoAdvance, isLastQuestion])

  function handleSelect(value: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
    if (!isLastQuestion) {
      setAutoAdvance(true)
    }
  }

  function handleTextChange(value: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
  }

  function goToNext() {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  function goToPrev() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  function handleSubmit() {
    const unanswered = questions.filter(
      (q) => !answers[q.id] || (q.type === 'text' && !answers[q.id].trim())
    )
    if (unanswered.length > 0) {
      alert(`还有 ${unanswered.length} 题未完成，请回答后再提交`)
      return
    }
    sessionStorage.setItem('assessment_answers', JSON.stringify(answers))
    router.push('/result')
  }

  const isSelected = (value: string) => answers[currentQuestion.id] === value
  const canGoNext = !!answers[currentQuestion.id]
  const canSubmit = questions.every(
    (q) => answers[q.id] && (q.type !== 'text' || answers[q.id].trim())
  )

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* 顶部进度条 */}
      <div className="sticky top-0 z-20 bg-surface/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-lg mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            {currentIndex > 0 ? (
              <button
                onClick={goToPrev}
                className="text-sm text-text-secondary hover:text-foreground transition-opacity"
              >
                ← 上一题
              </button>
            ) : (
              <a
                href="/ai-assessment/"
                className="text-sm text-text-secondary hover:text-foreground transition-opacity"
              >
                ← 返回首页
              </a>
            )}
            <span className="text-sm text-text-secondary">
              {currentIndex + 1} / {totalQuestions}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 题目区域 */}
      <div className="flex-1 flex items-start justify-center px-6 pt-12 pb-24">
        <div className="max-w-lg w-full" key={currentIndex}>
          <h2 className="text-xl font-bold mb-6 leading-relaxed">
            {currentQuestion.title}
          </h2>

          {currentQuestion.type === 'choice' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                    isSelected(option.value)
                      ? 'border-primary bg-primary/5 text-primary font-medium shadow-sm shadow-primary/10'
                      : 'border-gray-200 bg-surface hover:border-primary/30 hover:bg-primary/[0.02]'
                  }`}
                >
                  <span className="text-base">{option.label}</span>
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'text' && (
            <div>
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={currentQuestion.placeholder}
                rows={4}
                className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 bg-surface text-base leading-relaxed placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none"
              />
              <p className="mt-2 text-xs text-text-secondary">
                写得越具体，AI分析越精准
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-sm border-t border-gray-100 z-20">
        <div className="max-w-lg mx-auto px-6 py-4">
          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-lg shadow-lg shadow-primary/25 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
            >
              查看AI分析结果
            </button>
          ) : (
            <button
              onClick={goToNext}
              disabled={!canGoNext}
              className="w-full py-4 rounded-xl bg-primary text-white font-semibold text-base hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一题
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
