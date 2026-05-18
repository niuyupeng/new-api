import { useQuery } from '@tanstack/react-query'
import { Construction } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Markdown } from '@/components/ui/markdown'
import { Skeleton } from '@/components/ui/skeleton'
import { PublicLayout } from '@/components/layout'
import { ccapiPublicNavLinks } from '@/features/ccapi/public-nav'
import { getAboutContent } from './api'

function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isLikelyHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function EmptyAboutState() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <div className='flex min-h-svh items-center justify-center bg-[#11100f] p-8 pt-28 text-[#fff3df]'>
      <div className='grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center'>
        <div>
          <p className='mb-4 inline-flex rounded-full border border-[#f28b61]/35 bg-[#2a1712]/80 px-3 py-1.5 text-xs font-black tracking-[0.16em] text-[#f28b61] uppercase'>
            {t('ABOUT CCAPI')}
          </p>
          <h2 className='text-5xl leading-[0.98] font-black md:text-7xl'>
            {t('一个给开发者的')}
            <br />
            <span className='text-[#f28b61]'>{t('模型接入柜台')}</span>
          </h2>
          <p className='mt-6 max-w-xl text-sm leading-7 text-[#c8bbaa]'>
            {t(
              '管理员还没有配置自定义关于页。当前站点可作为 AI API 中转、密钥管理、余额计费和模型路由入口使用。'
            )}
          </p>
        </div>
        <div className='rounded-lg border border-white/10 bg-white/[0.045] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)]'>
          <div className='mb-6 flex items-center gap-3'>
            <div className='flex size-12 items-center justify-center rounded-lg bg-[#2a1712] text-[#f28b61]'>
              <Construction className='h-6 w-6' />
            </div>
            <div>
              <h3 className='text-xl font-black'>{t('站点说明待配置')}</h3>
              <p className='text-sm text-[#a99886]'>
                ccapi.chat / {t('OpenAI Compatible')}
              </p>
            </div>
          </div>
          <div className='space-y-4 rounded-lg bg-[#090807] p-5 text-sm leading-7 text-[#d8c8b5]'>
            <p>
              {t('New API Project Repository:')}{' '}
              <a
                href='https://github.com/QuantumNous/new-api'
                target='_blank'
                rel='noopener noreferrer'
                className='font-bold text-[#f28b61] hover:underline'
              >
                {t('https://github.com/QuantumNous/new-api')}
              </a>
            </p>
            <p>
              <a
                href='https://github.com/QuantumNous/new-api'
                target='_blank'
                rel='noopener noreferrer'
                className='font-bold text-[#f28b61] hover:underline'
              >
                {t('NewAPI')}
              </a>{' '}
              © {currentYear}{' '}
              <a
                href='https://github.com/QuantumNous'
                target='_blank'
                rel='noopener noreferrer'
                className='font-bold text-[#f28b61] hover:underline'
              >
                {t('QuantumNous')}
              </a>{' '}
              {t('| Based on')}{' '}
              <a
                href='https://github.com/songquanpeng/one-api'
                target='_blank'
                rel='noopener noreferrer'
                className='font-bold text-[#f28b61] hover:underline'
              >
                {t('One API')}
              </a>
            </p>
            <p>
              {t('This project must be used in compliance with the')}{' '}
              <a
                href='https://github.com/QuantumNous/new-api/blob/main/LICENSE'
                target='_blank'
                rel='noopener noreferrer'
                className='font-bold text-[#f28b61] hover:underline'
              >
                {t('AGPL v3.0 License')}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function About() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['about-content'],
    queryFn: getAboutContent,
    retry: false,
  })

  const rawContent = data?.data?.trim() ?? ''
  const hasContent = rawContent.length > 0
  const isUrl = hasContent && isValidUrl(rawContent)
  const isHtml = hasContent && !isUrl && isLikelyHtml(rawContent)

  if (isLoading) {
    return (
      <PublicLayout
        navLinks={ccapiPublicNavLinks}
        siteName='ccapi'
        headerProps={{ className: 'ccapi-public-header' }}
      >
        <div className='mx-auto flex max-w-4xl flex-col gap-4 py-24'>
          <Skeleton className='h-8 w-[45%]' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-[90%]' />
          <Skeleton className='h-4 w-[80%]' />
        </div>
      </PublicLayout>
    )
  }

  if (!hasContent) {
    return (
      <PublicLayout
        showMainContainer={false}
        navLinks={ccapiPublicNavLinks}
        siteName='ccapi'
        headerProps={{ className: 'ccapi-public-header' }}
      >
        <EmptyAboutState />
      </PublicLayout>
    )
  }

  if (isUrl) {
    return (
      <PublicLayout
        showMainContainer={false}
        navLinks={ccapiPublicNavLinks}
        siteName='ccapi'
        headerProps={{ className: 'ccapi-public-header' }}
      >
        <iframe
          src={rawContent}
          className='h-[calc(100svh-3.5rem)] w-full border-0'
          title={t('About')}
        />
      </PublicLayout>
    )
  }

  return (
    <PublicLayout
      navLinks={ccapiPublicNavLinks}
      siteName='ccapi'
      headerProps={{ className: 'ccapi-public-header' }}
    >
      <div className='mx-auto max-w-6xl px-4 py-24'>
        {isHtml ? (
          <div
            className='prose prose-neutral dark:prose-invert max-w-none'
            dangerouslySetInnerHTML={{ __html: rawContent }}
          />
        ) : (
          <Markdown className='prose-neutral dark:prose-invert max-w-none'>
            {rawContent}
          </Markdown>
        )}
      </div>
    </PublicLayout>
  )
}
