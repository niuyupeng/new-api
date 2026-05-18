import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Check,
  ClipboardList,
  Code2,
  KeyRound,
  Sparkles,
  WalletCards,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

const toolLabels = ['Claude Code', 'Codex', 'Cursor', 'CC Switch']

export function Hero(props: HeroProps) {
  const { t } = useTranslation()

  return (
    <section className='relative overflow-hidden bg-[#11100f] px-5 pt-24 pb-20 text-[#fff3df] md:px-8 md:pt-32 md:pb-28'>
      <div
        aria-hidden
        className='absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(236,124,76,0.22),transparent_28%),radial-gradient(circle_at_18%_12%,rgba(49,156,184,0.14),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_42%)]'
      />
      <div
        aria-hidden
        className='absolute inset-0 [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:42px_42px] opacity-[0.07]'
      />

      <div className='relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]'>
        <div>
          <div className='landing-animate-fade-up mb-7 inline-flex items-center gap-2 rounded-full border border-[#e9865f]/35 bg-[#2a1712]/80 px-3 py-2 text-xs font-semibold text-[#f3a17c] shadow-[0_0_30px_rgba(233,134,95,0.13)]'>
            <Sparkles className='size-3.5' />
            {t('注册送体验额度，Claude / OpenAI / 图像模型一站接入')}
          </div>

          <h1 className='landing-animate-fade-up max-w-3xl text-[clamp(2.6rem,7vw,5.9rem)] leading-[0.98] font-black tracking-normal'>
            {t('让 AI API')}
            <br />
            {t('像点单一样')}
            <br />
            <span className='text-[#f28b61]'>{t('简单上手')}</span>
          </h1>

          <p
            className='landing-animate-fade-up mt-7 max-w-xl text-base leading-8 text-[#c8bbaa] md:text-lg'
            style={{ animationDelay: '80ms' }}
          >
            {t(
              'ccapi 把 Claude Code、Codex、Cursor、图像模型和统一密钥管理放在一个控制台里。复制 Base URL 和 Key，常用工具几分钟就能跑起来。'
            )}
          </p>

          <div
            className='landing-animate-fade-up mt-9 flex flex-col gap-3 sm:flex-row'
            style={{ animationDelay: '140ms' }}
          >
            <Button
              className='h-12 rounded-lg bg-[#f28b61] px-7 text-sm font-bold text-[#22110d] shadow-[0_14px_30px_rgba(242,139,97,0.28)] hover:bg-[#ff9d73]'
              asChild
            >
              <Link to={props.isAuthenticated ? '/dashboard' : '/sign-up'}>
                {props.isAuthenticated ? t('进入控制台') : t('立即注册体验')}
                <ArrowRight className='ml-2 size-4' />
              </Link>
            </Button>
            <Button
              variant='outline'
              className='h-12 rounded-lg border-[#f6e7cc]/80 bg-transparent px-7 text-sm font-bold text-[#fff3df] hover:bg-[#fff3df] hover:text-[#1b1511]'
              asChild
            >
              <a href='/docs/'>{t('查看接入教程')}</a>
            </Button>
          </div>

          <div className='mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4'>
            {toolLabels.map((label) => (
              <div
                key={label}
                className='rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs font-semibold text-[#eadcc8]'
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div
          className='landing-animate-fade-up relative'
          style={{ animationDelay: '220ms' }}
        >
          <div className='absolute -inset-10 rounded-full bg-[#f28b61]/10 blur-3xl' />
          <div className='relative rounded-lg border border-white/10 bg-[#171514] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.45)]'>
            <div className='mb-4 flex items-center justify-between border-b border-white/10 pb-3'>
              <div className='flex items-center gap-2'>
                <span className='size-2.5 rounded-full bg-[#ff6b5d]' />
                <span className='size-2.5 rounded-full bg-[#f4b35c]' />
                <span className='size-2.5 rounded-full bg-[#4ccf8f]' />
              </div>
              <span className='rounded-md bg-[#22362d] px-2 py-1 font-mono text-[10px] text-[#78d79c]'>
                200 OK
              </span>
            </div>

            <div className='space-y-3'>
              <RouteCard
                icon={<Code2 className='size-4' />}
                title='OpenAI Compatible'
                value='https://ccapi.chat/v1'
              />
              <RouteCard
                icon={<KeyRound className='size-4' />}
                title='Claude / Codex Gateway'
                value='https://ccapi.chat'
              />
              <RouteCard
                icon={<WalletCards className='size-4' />}
                title={t('账户充值')}
                value={t('购买兑换码 / 钱包兑换到账')}
              />
            </div>

            <div className='mt-4 rounded-lg border border-[#f28b61]/25 bg-[#27160f] p-4'>
              <div className='mb-3 flex items-center gap-2 text-sm font-bold text-[#ffd1b8]'>
                <ClipboardList className='size-4' />
                {t('三步开用')}
              </div>
              <div className='space-y-2 text-sm text-[#d7c8b6]'>
                {[
                  t('注册账号并进入控制台'),
                  t('复制 API Key 与 Base URL'),
                  t('粘贴到 Claude Code / Codex / Cursor'),
                ].map((item) => (
                  <div key={item} className='flex items-center gap-2'>
                    <Check className='size-4 text-[#f28b61]' />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function RouteCard(props: { icon: ReactNode; title: string; value: string }) {
  return (
    <div className='rounded-lg border border-white/10 bg-white/[0.045] p-4'>
      <div className='mb-2 flex items-center gap-2 text-xs font-semibold text-[#f28b61] uppercase'>
        {props.icon}
        {props.title}
      </div>
      <code className='font-mono text-sm break-all text-[#fff3df]'>
        {props.value}
      </code>
    </div>
  )
}
