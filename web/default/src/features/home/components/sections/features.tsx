import type { ReactNode } from 'react'
import {
  BadgeDollarSign,
  Bot,
  Cable,
  Code2,
  Images,
  KeyRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AnimateInView } from '@/components/animate-in-view'

export function Features() {
  const { t } = useTranslation()

  const features = [
    {
      icon: <Code2 className='size-5' />,
      title: t('Claude Code / Codex 优先'),
      desc: t(
        '把命令、环境变量、Base URL 和 Key 的配置步骤写清楚，开发者不用猜。'
      ),
    },
    {
      icon: <Cable className='size-5' />,
      title: t('一个 Key 连接多模型'),
      desc: t('OpenAI 兼容接口、Claude 兼容入口和图像模型统一走 ccapi 管理。'),
    },
    {
      icon: <BadgeDollarSign className='size-5' />,
      title: t('余额和价格透明'),
      desc: t('控制台查看余额、消耗、日志和套餐，购买兑换码后在钱包兑换到账。'),
    },
    {
      icon: <KeyRound className='size-5' />,
      title: t('密钥集中管理'),
      desc: t('用户只保存自己的 ccapi Key，上游渠道和权限策略在后台统一维护。'),
    },
    {
      icon: <Images className='size-5' />,
      title: t('图像模型可接入'),
      desc: t('为 gpt-image-2 等图像能力预留明确入口，适合内容和开发场景。'),
    },
    {
      icon: <Bot className='size-5' />,
      title: t('新手也能照着做'),
      desc: t('Cursor、Claude Code、Codex、CC Switch 都按工具拆成可复制步骤。'),
    },
  ]

  return (
    <section className='bg-[#fff8ed] px-5 py-20 text-[#211712] md:px-8 md:py-28'>
      <div className='mx-auto max-w-6xl'>
        <AnimateInView className='mb-10 flex flex-col justify-between gap-5 md:mb-14 md:flex-row md:items-end'>
          <div>
            <p className='mb-3 text-xs font-black tracking-[0.18em] text-[#d36f4c] uppercase'>
              {t('WHY CCAPI')}
            </p>
            <h2 className='max-w-2xl text-3xl leading-tight font-black md:text-5xl'>
              {t('不是再给用户一堆参数，而是给一条能跑通的路。')}
            </h2>
          </div>
          <p className='max-w-sm text-sm leading-7 text-[#7a6a5e]'>
            {t(
              '页面会把“注册、充值、复制配置、粘贴到工具、开始调用”讲成一条完整路径，减少用户来回问。'
            )}
          </p>
        </AnimateInView>

        <div className='grid gap-3 md:grid-cols-3'>
          {features.map((feature, index) => (
            <AnimateInView
              key={feature.title}
              delay={index * 80}
              animation='fade-up'
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                desc={feature.desc}
              />
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard(props: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className='h-full rounded-lg border border-[#ead9c1] bg-white p-6 shadow-[0_12px_30px_rgba(93,55,29,0.06)]'>
      <div className='mb-5 flex size-10 items-center justify-center rounded-lg bg-[#1a1715] text-[#f28b61]'>
        {props.icon}
      </div>
      <h3 className='text-lg font-black'>{props.title}</h3>
      <p className='mt-3 text-sm leading-7 text-[#75665b]'>{props.desc}</p>
    </div>
  )
}
