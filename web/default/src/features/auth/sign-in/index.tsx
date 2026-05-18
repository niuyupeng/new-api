import { Link, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useStatus } from '@/hooks/use-status'
import { AuthLayout } from '../auth-layout'
import { TermsFooter } from '../components/terms-footer'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { t } = useTranslation()
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })
  const { status } = useStatus()

  return (
    <AuthLayout>
      <div className='w-full space-y-8'>
        <div className='space-y-2'>
          <p className='text-xs font-black tracking-[0.18em] text-[#d36f4c] uppercase'>
            {t('Sign in')}
          </p>
          <h2 className='text-center text-3xl font-black tracking-tight sm:text-left'>
            {t('回到你的 API 控制台')}
          </h2>
          {!status?.self_use_mode_enabled && (
            <p className='text-left text-sm text-[#75665b] sm:text-base'>
              {t('还没有账号？')}{' '}
              <Link
                to='/sign-up'
                className='font-bold text-[#d36f4c] underline underline-offset-4 hover:text-[#9f472d]'
              >
                {t('立即注册')}
              </Link>
              .
            </p>
          )}
        </div>

        <UserAuthForm redirectTo={redirect} />

        <TermsFooter
          variant='sign-in'
          status={status}
          className='text-center'
        />
      </div>
    </AuthLayout>
  )
}
