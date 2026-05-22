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
    <section className='bg-background text-foreground px-5 py-18 md:px-8 md:py-24'>
      <AnimateInView
        className='border-border bg-card mx-auto max-w-6xl rounded-lg border p-7 shadow-[0_18px_45px_rgba(93,55,29,0.08)] md:flex md:items-center md:justify-between md:p-10'
        animation='scale-in'
      >
        <div>
          <p className='mb-3 text-xs font-black tracking-[0.18em] text-orange-400 uppercase'>
            {t('START NOW')}
          </p>
          <h2 className='max-w-2xl text-3xl leading-tight font-black md:text-5xl'>
            {t('把 Key 配好，今天就让工具跑起来。')}
          </h2>
          <p className='text-muted-foreground mt-4 max-w-xl text-sm leading-7'>
            {t('完成注册后可购买兑换码，再回到钱包页输入兑换码完成到账。')}
          </p>
        </div>
        <div className='mt-7 flex flex-col gap-3 sm:flex-row md:mt-0'>
          <Button
            className='bg-foreground text-background hover:bg-foreground/90 h-12 rounded-lg px-7 font-bold'
            asChild
          >
            <Link to={props.isAuthenticated ? '/dashboard' : '/sign-up'}>
              {props.isAuthenticated ? t('进入控制台') : t('注册账号')}
              <ArrowRight className='ml-2 size-4' />
            </Link>
          </Button>
          <Button
            variant='outline'
            className='border-border text-foreground hover:bg-accent h-12 rounded-lg px-7 font-bold'
            asChild
          >
            <Link to='/pricing'>{t('查看价格')}</Link>
          </Button>
        </div>
      </AnimateInView>
    </section>
  )
}
