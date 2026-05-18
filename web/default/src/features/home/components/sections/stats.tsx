import { useTranslation } from 'react-i18next'

export function Stats() {
  const { t } = useTranslation()

  const stats = [
    {
      value: '2 min',
      label: t('从注册到首个请求'),
    },
    {
      value: '/v1',
      label: t('OpenAI 兼容入口'),
    },
    {
      value: 'Claude',
      label: t('Claude Code 友好'),
    },
    {
      value: 'Pay',
      label: t('余额与充值集中管理'),
    },
  ]

  return (
    <section className='border-y border-[#2b241d] bg-[#151312] px-5 py-8 text-[#fff3df] md:px-8'>
      <div className='mx-auto grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-4'>
        {stats.map((item) => (
          <div
            key={item.label}
            className='rounded-lg border border-white/10 bg-white/[0.035] px-4 py-5'
          >
            <div className='text-2xl font-black text-[#f28b61]'>
              {item.value}
            </div>
            <div className='mt-1 text-xs text-[#b9aa99]'>{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
