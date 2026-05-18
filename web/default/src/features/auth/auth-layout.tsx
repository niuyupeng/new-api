import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  getCcapiDisplayName,
  getCcapiLogoForDarkSurface,
} from '@/lib/ccapi-brand'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Skeleton } from '@/components/ui/skeleton'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()
  const brandLabel = getCcapiDisplayName(systemName)
  const brandLogo = getCcapiLogoForDarkSurface(logo)

  return (
    <div className='ccapi-auth-shell relative grid min-h-svh max-w-none overflow-hidden bg-[#11100f] text-[#fff3df] lg:grid-cols-[0.95fr_1.05fr]'>
      <div
        aria-hidden
        className='absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(242,139,97,0.24),transparent_28%),radial-gradient(circle_at_82%_78%,rgba(46,139,157,0.16),transparent_25%)]'
      />
      <div
        aria-hidden
        className='absolute inset-0 [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:38px_38px] opacity-[0.06]'
      />
      <Link
        to='/'
        className='absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-[#171514]/80 px-3 py-2 transition-opacity hover:opacity-80 sm:top-8 sm:left-8'
      >
        <div className='relative h-8 w-8 rounded-xl'>
          {loading ? (
            <Skeleton className='absolute inset-0 rounded-full' />
          ) : (
            <img
              src={brandLogo}
              alt={t('Logo')}
              className='h-full w-full rounded-lg object-contain'
            />
          )}
        </div>
        {loading ? (
          <Skeleton className='h-6 w-24' />
        ) : (
          <div>
            <h1 className='text-sm leading-none font-black'>{brandLabel}</h1>
            <p className='mt-1 text-[10px] leading-none text-[#b9aa98]'>
              {t('OpenAI Compatible')}
            </p>
          </div>
        )}
      </Link>

      <section className='relative hidden min-h-svh flex-col justify-end border-r border-white/10 px-10 py-12 lg:flex'>
        <div className='max-w-xl'>
          <p className='mb-5 inline-flex rounded-full border border-[#f28b61]/35 bg-[#2a1712]/80 px-3 py-1.5 text-xs font-black text-[#f28b61]'>
            CCAPI ACCESS COUNTER
          </p>
          <h2 className='text-6xl leading-[0.95] font-black'>
            进站，
            <br />
            拿 Key，
            <br />
            开跑。
          </h2>
          <p className='mt-6 max-w-md text-sm leading-7 text-[#cbbba7]'>
            Claude Code、Codex、Cursor 和图像模型共用一个 ccapi
            账户。登录后到控制台复制密钥和 Base URL，就能接入你的工具链。
          </p>
        </div>

        <div className='mt-12 grid max-w-xl grid-cols-3 gap-3'>
          {['/v1', 'Claude', 'Codex'].map((item) => (
            <div
              key={item}
              className='rounded-lg border border-white/10 bg-white/[0.04] p-4'
            >
              <div className='text-2xl font-black text-[#f28b61]'>{item}</div>
              <div className='mt-1 text-xs text-[#aa9a88]'>ready</div>
            </div>
          ))}
        </div>
      </section>

      <div className='relative z-10 flex min-h-svh items-center px-5 pt-24 pb-10 sm:px-8 lg:px-12 lg:pt-10'>
        <div className='mx-auto w-full max-w-[480px] rounded-lg border border-white/10 bg-[#fff8ed] p-6 text-[#211712] shadow-[0_30px_90px_rgba(0,0,0,0.36)] sm:p-8'>
          <div className='mb-6 rounded-lg border border-[#ead9c1] bg-white px-4 py-3'>
            <div className='text-xs font-black tracking-[0.18em] text-[#d36f4c] uppercase'>
              account ticket
            </div>
            <div className='mt-1 text-sm text-[#75665b]'>
              ccapi.chat / unified model access
            </div>
          </div>
          <div className='space-y-2'>{children}</div>
        </div>
      </div>
    </div>
  )
}
