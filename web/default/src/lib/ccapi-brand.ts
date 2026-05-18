import { DEFAULT_LOGO, DEFAULT_SYSTEM_NAME } from './constants'

export const CCAPI_BRAND_NAME = 'ccapi'
export const CCAPI_DARK_LOGO = '/logo-dark.png'

export function isDefaultSystemName(systemName?: string): boolean {
  const normalizedName = systemName?.trim()
  return !normalizedName || normalizedName === DEFAULT_SYSTEM_NAME
}

export function getCcapiDisplayName(systemName?: string): string {
  const normalizedName = systemName?.trim()
  if (isDefaultSystemName(normalizedName)) return CCAPI_BRAND_NAME
  return normalizedName ?? CCAPI_BRAND_NAME
}

export function getCcapiLogoForDarkSurface(logo?: string): string {
  if (!logo || logo === DEFAULT_LOGO) return CCAPI_DARK_LOGO
  return logo
}
