import { BookOpenCheck, Gauge, ReceiptText, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AnimateInView } from '@/components/animate-in-view'

const promiseItems = [
  {
    icon: ShieldCheck,
    title: '入口固定',
    desc: 'Base URL、Key、模型名按工具分开写清楚，用户换工具时不用重新摸索。',
  },
  {
    icon: ReceiptText,
    title: '账单可查',
    desc: '余额、消耗、日志、模型价格集中展示，充值和调用记录都能回头看。',
  },
  {
    icon: BookOpenCheck,
    title: '教程够细',
    desc: 'Cursor、Claude Code、Codex、CC Switch 都按真实使用动作拆步骤。',
  },
  {
    icon: Gauge,
    title: '少走弯路',
    desc: '把新手最容易卡住的 Key、端点、模型选择和支付入口放在同一条流程里。',
  },
]

const checklist = [
  '先注册，再进控制台拿 Key',
  '购买兑换码，再到钱包页兑换',
  '复制对应工具模板，不混用端点',
  '价格页先看模型单价，再决定用量',
]

export function Trust() {
  const { t } = useTranslation()

  return (
    <section className='bg-muted/30 text-foreground px-5 py-20 md:px-8 md:py-28'>
      <div className='mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch'>
        <AnimateInView className='border-border bg-card text-card-foreground rounded-lg border p-6 shadow-[0_24px_70px_rgba(48,30,19,0.18)] md:p-8'>
          <p className='mb-4 text-xs font-black tracking-[0.18em] text-orange-400 uppercase'>
            {t('ACCESS PROMISE')}
          </p>
          <h2 className='max-w-lg text-3xl leading-tight font-black md:text-5xl'>
            {t('别让用户为接入方式发愁。')}
          </h2>
          <p className='text-muted-foreground mt-5 text-sm leading-7'>
            {t(
              'ccapi 的公共页面会把“我该点哪里、复制什么、填到哪里、怎么充值”讲得直接一点，适合新手，也适合每天切工具的开发者。'
            )}
          </p>

          <div className='border-border bg-muted/40 mt-8 rounded-lg border p-4'>
            <div className='mb-4 flex items-center justify-between gap-3'>
              <span className='text-xs font-black tracking-[0.16em] text-orange-400 uppercase'>
                {t('USER FLOW')}
              </span>
              <span className='rounded-full bg-orange-400 px-3 py-1 text-xs font-black text-black'>
                {t('4 STEPS')}
              </span>
            </div>
            <div className='space-y-3'>
              {checklist.map((item, index) => (
                <div
                  key={item}
                  className='bg-background text-foreground flex items-start gap-3 rounded-md px-4 py-3 text-sm'
                >
                  <span className='mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-400 text-xs font-black text-black'>
                    {index + 1}
                  </span>
                  <span>{t(item)}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimateInView>

        <div className='grid gap-3 sm:grid-cols-2'>
          {promiseItems.map((item, index) => {
            const Icon = item.icon
            return (
              <AnimateInView
                key={item.title}
                delay={index * 90}
                animation='fade-up'
                className='border-border bg-card rounded-lg border p-6 shadow-[0_14px_36px_rgba(93,55,29,0.07)]'
              >
                <div className='mb-5 flex size-11 items-center justify-center rounded-lg bg-orange-400/10 text-orange-400'>
                  <Icon className='size-5' />
                </div>
                <h3 className='text-xl font-black'>{t(item.title)}</h3>
                <p className='text-muted-foreground mt-3 text-sm leading-7'>
                  {t(item.desc)}
                </p>
              </AnimateInView>
            )
          })}
        </div>
      </div>
    </section>
  )
}
