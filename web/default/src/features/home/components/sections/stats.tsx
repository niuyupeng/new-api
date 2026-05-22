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
    <section className='border-border bg-background text-foreground border-y px-5 py-8 md:px-8'>
      <div className='mx-auto grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-4'>
        {stats.map((item) => (
          <div
            key={item.label}
            className='border-border bg-card rounded-lg border px-4 py-5'
          >
            <div className='text-2xl font-black text-orange-400'>
              {item.value}
            </div>
            <div className='text-muted-foreground mt-1 text-xs'>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
