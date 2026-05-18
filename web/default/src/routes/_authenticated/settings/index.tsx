import { createFileRoute } from '@tanstack/react-router'
import { LocalSettings } from '@/features/local-settings'

export const Route = createFileRoute('/_authenticated/settings/')({
  component: LocalSettings,
})
