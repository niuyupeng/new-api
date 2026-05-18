import { api } from '@/lib/api'
import type { PricingData } from './types'

// ----------------------------------------------------------------------------
// Pricing APIs
// ----------------------------------------------------------------------------

// Get model pricing data
export async function getPricing(): Promise<PricingData> {
  const res = await api.get('/api/pricing', {
    skipErrorHandler: true,
  } as unknown as Parameters<typeof api.get>[1])
  return res.data
}
