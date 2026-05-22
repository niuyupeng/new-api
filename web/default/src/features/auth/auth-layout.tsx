/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
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
  const brandLogo = getCcapiLogoForDarkSurface(logo, { forceBrand: true })

  return (
    <div className='ccapi-auth-shell bg-background text-foreground relative grid min-h-svh max-w-none overflow-hidden lg:grid-cols-[0.95fr_1.05fr]'>
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
        className='border-border bg-card/80 absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full border px-3 py-2 transition-opacity hover:opacity-80 sm:top-8 sm:left-8'
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
            <p className='text-muted-foreground mt-1 text-[10px] leading-none'>
              {t('OpenAI Compatible')}
            </p>
          </div>
        )}
      </Link>

      <section className='border-border relative hidden min-h-svh flex-col justify-end border-r px-10 py-12 lg:flex'>
        <div className='max-w-xl'>
          <p className='mb-5 inline-flex rounded-full border border-orange-400/35 bg-orange-400/10 px-3 py-1.5 text-xs font-black text-orange-400'>
            CCAPI ACCESS COUNTER
          </p>
          <h2 className='text-6xl leading-[0.95] font-black'>
            进站，
            <br />
            拿 Key，
            <br />
            开跑。
          </h2>
          <p className='text-muted-foreground mt-6 max-w-md text-sm leading-7'>
            Claude Code、Codex、Cursor 和图像模型共用一个 ccapi
            账户。登录后到控制台复制密钥和 Base URL，就能接入你的工具链。
          </p>
        </div>

        <div className='mt-12 grid max-w-xl grid-cols-3 gap-3'>
          {['/v1', 'Claude', 'Codex'].map((item) => (
            <div
              key={item}
              className='border-border bg-card rounded-lg border p-4'
            >
              <div className='text-2xl font-black text-orange-400'>{item}</div>
              <div className='text-muted-foreground mt-1 text-xs'>ready</div>
            </div>
          ))}
        </div>
      </section>

      <div className='relative z-10 flex min-h-svh items-center px-5 pt-24 pb-10 sm:px-8 lg:px-12 lg:pt-10'>
        <div className='border-border bg-card text-card-foreground mx-auto w-full max-w-[480px] rounded-lg border p-6 shadow-[0_30px_90px_rgba(0,0,0,0.24)] sm:p-8'>
          <div className='border-border bg-muted mb-6 rounded-lg border px-4 py-3'>
            <div className='text-xs font-black tracking-[0.18em] text-orange-400 uppercase'>
              account ticket
            </div>
            <div className='text-muted-foreground mt-1 text-sm'>
              ccapi.chat / unified model access
            </div>
          </div>
          <div className='space-y-2'>{children}</div>
        </div>
      </div>
    </div>
  )
}
