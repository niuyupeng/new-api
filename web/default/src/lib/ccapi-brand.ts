import { DEFAULT_LOGO, DEFAULT_SYSTEM_NAME } from './constants'

export const CCAPI_BRAND_NAME = 'ccapi'
export const CCAPI_LOGO_VERSION = 'ccapi-logo-20260523'
export const CCAPI_LIGHT_LOGO = `/logo.png?v=${CCAPI_LOGO_VERSION}`
export const CCAPI_DARK_LOGO = `/logo-dark.png?v=${CCAPI_LOGO_VERSION}`

type LogoOptions = {
  /**
   * Public ccapi surfaces should always use the product logo asset instead of
   * an older system-logo value persisted in the NewAPI database.
   */
  forceBrand?: boolean
}

export function isDefaultSystemName(systemName?: string): boolean {
  const normalizedName = systemName?.trim()
  return !normalizedName || normalizedName === DEFAULT_SYSTEM_NAME
}

export function getCcapiDisplayName(systemName?: string): string {
  const normalizedName = systemName?.trim()
  if (isDefaultSystemName(normalizedName)) return CCAPI_BRAND_NAME
  return normalizedName ?? CCAPI_BRAND_NAME
}

export function getCcapiLogoForLightSurface(
  logo?: string,
  options: LogoOptions = {}
): string {
  if (options.forceBrand || !logo || logo === DEFAULT_LOGO) {
    return CCAPI_LIGHT_LOGO
  }
  return logo
}

export function getCcapiLogoForDarkSurface(
  logo?: string,
  options: LogoOptions = {}
): string {
  if (options.forceBrand || !logo || logo === DEFAULT_LOGO) {
    return CCAPI_DARK_LOGO
  }
  return logo
}
