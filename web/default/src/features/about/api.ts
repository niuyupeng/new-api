import { api } from '@/lib/api'
import type { AboutResponse } from './types'

export async function getAboutContent() {
  const res = await api.get<AboutResponse>('/api/about', {
    skipErrorHandler: true,
  } as unknown as Parameters<typeof api.get>[1])
  return res.data
}
