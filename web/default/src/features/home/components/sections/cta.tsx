import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AnimateInView } from '@/components/animate-in-view'

interface CTAProps {
  className?: string
  isAuthenticated?: boolean
}

export function CTA(props: CTAProps) {
  const { t } = useTranslation()

  return (
    <section className='bg-[#fff8ed] px-5 py-18 text-[#211712] md:px-8 md:py-24'>
      <AnimateInView
        className='mx-auto max-w-6xl rounded-lg border border-[#ead9c1] bg-white p-7 shadow-[0_18px_45px_rgba(93,55,29,0.08)] md:flex md:items-center md:justify-between md:p-10'
        animation='scale-in'
      >
        <div>
          <p className='mb-3 text-xs font-black tracking-[0.18em] text-[#d36f4c] uppercase'>
            {t('START NOW')}
          </p>
          <h2 className='max-w-2xl text-3xl leading-tight font-black md:text-5xl'>
            {t('把 Key 配好，今天就让工具跑起来。')}
          </h2>
          <p className='mt-4 max-w-xl text-sm leading-7 text-[#75665b]'>
            {t(
              '完成注册后可购买兑换码，再回到钱包页输入兑换码完成到账。'
            )}
          </p>
        </div>
        <div className='mt-7 flex flex-col gap-3 sm:flex-row md:mt-0'>
          <Button
            className='h-12 rounded-lg bg-[#1a1715] px-7 font-bold text-[#fff3df] hover:bg-[#2a2521]'
            asChild
          >
            <Link to={props.isAuthenticated ? '/dashboard' : '/sign-up'}>
              {props.isAuthenticated ? t('进入控制台') : t('注册账号')}
              <ArrowRight className='ml-2 size-4' />
            </Link>
          </Button>
          <Button
            variant='outline'
            className='h-12 rounded-lg border-[#cdb899] px-7 font-bold text-[#211712] hover:bg-[#fff2dc]'
            asChild
          >
            <Link to='/pricing'>{t('查看价格')}</Link>
          </Button>
        </div>
      </AnimateInView>
    </section>
  )
}
