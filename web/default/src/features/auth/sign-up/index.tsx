import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useStatus } from '@/hooks/use-status'
import { AuthLayout } from '../auth-layout'
import { TermsFooter } from '../components/terms-footer'
import { SignUpForm } from './components/sign-up-form'

export function SignUp() {
  const { t } = useTranslation()
  const { status } = useStatus()

  return (
    <AuthLayout>
      <div className='w-full space-y-8'>
        <div className='space-y-2'>
          <p className='text-xs font-black tracking-[0.18em] text-[#d36f4c] uppercase'>
            {t('Create an account')}
          </p>
          <h2 className='text-center text-3xl font-black tracking-tight sm:text-left'>
            {t('先领一张接入票')}
          </h2>
          <p className='text-left text-sm text-[#75665b] sm:text-base'>
            {t('已有账号？')}{' '}
            <Link
              to='/sign-in'
              className='font-bold text-[#d36f4c] underline underline-offset-4 hover:text-[#9f472d]'
            >
              {t('直接登录')}
            </Link>
            .
          </p>
        </div>

        <SignUpForm />

        <TermsFooter
          variant='sign-up'
          status={status}
          className='text-center'
        />
      </div>
    </AuthLayout>
  )
}
