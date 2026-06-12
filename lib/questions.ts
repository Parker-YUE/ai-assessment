export interface QuestionOption {
  label: string
  value: string
}

export interface Question {
  id: number
  title: string
  type: 'choice' | 'text'
  options?: QuestionOption[]
  placeholder?: string
}

export const questions: Question[] = [
  {
    id: 1,
    title: '你目前的工作年限和状态？',
    type: 'choice',
    options: [
      { label: '3年以内，还在探索期', value: 'A' },
      { label: '3-7年，有专业积累', value: 'B' },
      { label: '7年以上，资深但遇天花板', value: 'C' },
      { label: '管理层，带团队但想转型', value: 'D' },
    ],
  },
  {
    id: 2,
    title: '你目前工作中最常做的事？',
    type: 'choice',
    options: [
      { label: '项目统筹与推进（拆任务、排优先级、追进度）', value: 'A' },
      { label: '跨部门沟通协调（对齐需求、解决冲突、推共识）', value: 'B' },
      { label: '深度专业输出（设计/写方案/做分析/写代码）', value: 'C' },
      { label: '执行落地（按流程推进、处理日常事务）', value: 'D' },
    ],
  },
  {
    id: 3,
    title: '你接触AI的程度？',
    type: 'choice',
    options: [
      { label: '没接触过', value: 'A' },
      { label: '偶尔用（豆包、DeepSeek等聊天工具）', value: 'B' },
      { label: '常用大模型，会基本提示词', value: 'C' },
      { label: '使用Coze/Dify等，会搭建简单工作流', value: 'D' },
      { label: '有实操经验，会Vibe Coding（Claude Code/Cursor等）', value: 'E' },
      { label: '精通0-1应用程序开发', value: 'F' },
    ],
  },
  {
    id: 4,
    title: '你想转AI的核心驱动力是什么？',
    type: 'choice',
    options: [
      { label: '旧行业在走下坡路，必须找新出路', value: 'A' },
      { label: 'AI是趋势，不想被时代抛下', value: 'B' },
      { label: '对AI技术本身有好奇心和热情', value: 'C' },
      { label: '身边有人转成功了，想试试', value: 'D' },
    ],
  },
  {
    id: 5,
    title: '你有没有"从零搞定一件事"的经历？',
    type: 'choice',
    options: [
      { label: '多次，从0到1做过完整项目或业务', value: 'A' },
      { label: '有1-2次，负责过新方向或新模块', value: 'B' },
      { label: '主要是接手已有项目，在框架内优化', value: 'C' },
      { label: '基本没有，一直在成熟体系内执行', value: 'D' },
    ],
  },
  {
    id: 6,
    title: '你认为自己转型AI最大的优势是什么？',
    type: 'text',
    placeholder: '比如：行业经验深、沟通能力强、学习速度快...',
  },
  {
    id: 7,
    title: '你认为自己转型AI最大的短板是什么？',
    type: 'text',
    placeholder: '比如：没技术背景、不了解互联网、年纪大...',
  },
  {
    id: 8,
    title: '每周可以投入多少时间学习AI相关内容？',
    type: 'choice',
    options: [
      { label: '10小时以上（每天1.5小时+）', value: 'A' },
      { label: '5-10小时（每天约1小时）', value: 'B' },
      { label: '2-5小时（周末集中学）', value: 'C' },
      { label: '不到2小时（时间很紧）', value: 'D' },
    ],
  },
  {
    id: 9,
    title: '你的财务状况能承受多久的转型期（无收入或降薪）？',
    type: 'choice',
    options: [
      { label: '6个月以上没压力', value: 'A' },
      { label: '3-6个月可以', value: 'B' },
      { label: '最多1-3个月', value: 'C' },
      { label: '基本没有缓冲', value: 'D' },
    ],
  },
]

export type Answers = Record<number, string>
