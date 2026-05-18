import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AnimateInView } from '@/components/animate-in-view'

export function HowItWorks() {
  const { t } = useTranslation()

  const tools = [
    {
      name: 'Cursor',
      lines: [
        'Base URL: https://ccapi.chat/v1',
        'API Key: sk-xxxx',
        'Model: 按控制台可用模型填写',
      ],
    },
    {
      name: 'Claude Code',
      lines: [
        'ANTHROPIC_BASE_URL=https://ccapi.chat',
        'ANTHROPIC_AUTH_TOKEN=sk-xxxx',
        'claude',
      ],
    },
    {
      name: 'Codex',
      lines: [
        'OPENAI_BASE_URL=https://ccapi.chat/v1',
        'OPENAI_API_KEY=sk-xxxx',
        'codex',
      ],
    },
    {
      name: 'CC Switch',
      lines: [
        '选择 Claude / Codex 模板',
        '填入 ccapi Base URL',
        '保存后切换使用',
      ],
    },
  ]

  return (
    <section className='bg-[#11100f] px-5 py-20 text-[#fff3df] md:px-8 md:py-28'>
      <div className='mx-auto max-w-6xl'>
        <AnimateInView className='mb-12 text-center'>
          <p className='mb-3 text-xs font-black tracking-[0.18em] text-[#f28b61] uppercase'>
            {t('CONNECT GUIDE')}
          </p>
          <h2 className='text-3xl leading-tight font-black md:text-5xl'>
            {t('常用工具，直接按模板接。')}
          </h2>
          <p className='mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#c8bbaa]'>
            {t(
              '用户不需要理解一堆协议差异，只要选择自己的工具，复制对应配置即可开始调用。'
            )}
          </p>
        </AnimateInView>

        <div className='grid gap-3 md:grid-cols-2'>
          {tools.map((tool, index) => (
            <AnimateInView
              key={tool.name}
              delay={index * 90}
              animation='fade-up'
            >
              <div className='rounded-lg border border-white/10 bg-white/[0.045] p-5'>
                <div className='mb-4 flex items-center justify-between gap-3'>
                  <h3 className='text-xl font-black'>{tool.name}</h3>
                  <span className='rounded-full bg-[#f28b61]/15 px-3 py-1 text-xs font-bold text-[#f28b61]'>
                    {t('可复制')}
                  </span>
                </div>
                <div className='space-y-2 rounded-lg bg-[#090807] p-4 font-mono text-xs leading-6 text-[#e9dcc9]'>
                  {tool.lines.map((line) => (
                    <div key={line} className='flex gap-2'>
                      <span className='text-[#f28b61]'>$</span>
                      <span className='break-all'>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateInView>
          ))}
        </div>

        <AnimateInView className='mt-10 rounded-lg border border-[#f28b61]/25 bg-[#27160f] p-6 md:flex md:items-center md:justify-between'>
          <div>
            <h3 className='text-xl font-black'>{t('从零开始也能走完')}</h3>
            <div className='mt-4 grid gap-3 text-sm text-[#d8c8b5] sm:grid-cols-3'>
              {[t('注册账号'), t('充值或兑换'), t('复制配置')].map((item) => (
                <div key={item} className='flex items-center gap-2'>
                  <CheckCircle2 className='size-4 text-[#f28b61]' />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <Button
            className='mt-6 h-11 rounded-lg bg-[#f28b61] px-6 font-bold text-[#22110d] hover:bg-[#ff9d73] md:mt-0'
            asChild
          >
            <a href='/docs/'>
              {t('打开完整教程')}
              <ArrowRight className='ml-2 size-4' />
            </a>
          </Button>
        </AnimateInView>
      </div>
    </section>
  )
}
