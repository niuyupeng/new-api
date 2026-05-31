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
import {
  PAYMENT_TYPES,
  DEFAULT_PRESET_MULTIPLIERS,
  DEFAULT_PAYMENT_TYPE,
  DEFAULT_MIN_TOPUP,
} from '../constants'
import type {
  InviteDiscountInfo,
  PresetAmount,
  TopupDiscountType,
  TopupInfo,
} from '../types'

// ============================================================================
// Payment Processing Functions
// ============================================================================

/**
 * Check if browser is Safari
 */
function isSafariBrowser(): boolean {
  return (
    navigator.userAgent.indexOf('Safari') > -1 &&
    navigator.userAgent.indexOf('Chrome') < 1
  )
}

/**
 * Submit payment form (for non-Stripe payments)
 */
export function submitPaymentForm(
  url: string,
  params: Record<string, unknown>
): void {
  const form = document.createElement('form')
  form.action = url
  form.method = 'POST'

  // Don't open in new tab for Safari
  if (!isSafariBrowser()) {
    form.target = '_blank'
  }

  // Add form parameters
  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = String(value)
    form.appendChild(input)
  })

  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

/**
 * Check if payment method is Stripe
 */
export function isStripePayment(paymentType: string): boolean {
  return paymentType === PAYMENT_TYPES.STRIPE
}

/**
 * Check if payment method is Waffo Pancake
 *
 * Pancake is a metered-style payment that goes through a dedicated checkout
 * URL flow rather than the generic epay form submission, so it must be
 * special-cased in payment dispatch logic.
 */
export function isWaffoPancakePayment(paymentType: string): boolean {
  return paymentType === PAYMENT_TYPES.WAFFO_PANCAKE
}

/**
 * Get default payment type from topup info
 */
export function getDefaultPaymentType(topupInfo: TopupInfo | null): string {
  if (!topupInfo) {
    return DEFAULT_PAYMENT_TYPE
  }

  // Return first available payment method or default
  if (topupInfo.pay_methods?.length > 0) {
    return topupInfo.pay_methods[0].type
  }

  if (topupInfo.enable_stripe_topup) {
    return PAYMENT_TYPES.STRIPE
  }

  if (topupInfo.enable_waffo_topup) {
    return PAYMENT_TYPES.WAFFO
  }

  if (topupInfo.enable_waffo_pancake_topup) {
    return PAYMENT_TYPES.WAFFO_PANCAKE
  }

  return DEFAULT_PAYMENT_TYPE
}

/**
 * Get minimum topup amount from topup info
 */
export function getMinTopupAmount(topupInfo: TopupInfo | null): number {
  if (!topupInfo) {
    return DEFAULT_MIN_TOPUP
  }

  if (topupInfo.enable_online_topup) {
    return topupInfo.min_topup
  }

  if (topupInfo.enable_stripe_topup) {
    return topupInfo.stripe_min_topup
  }

  if (topupInfo.enable_waffo_topup) {
    return topupInfo.waffo_min_topup || DEFAULT_MIN_TOPUP
  }

  if (topupInfo.enable_waffo_pancake_topup) {
    return topupInfo.waffo_pancake_min_topup || DEFAULT_MIN_TOPUP
  }

  return DEFAULT_MIN_TOPUP
}

/**
 * Generate preset amounts based on minimum topup
 */
export function generatePresetAmounts(minAmount: number): PresetAmount[] {
  return DEFAULT_PRESET_MULTIPLIERS.map((multiplier) => ({
    value: minAmount * multiplier,
  }))
}

/**
 * Merge custom preset amounts with discounts
 */
export function mergePresetAmounts(
  amountOptions: number[],
  discounts: Record<number, number>
): PresetAmount[] {
  if (!amountOptions || amountOptions.length === 0) {
    return []
  }

  return amountOptions.map((amount) => ({
    value: amount,
    discount: discounts[amount] || 1.0,
  }))
}

export interface EffectiveTopupDiscount {
  rate: number
  type?: TopupDiscountType
  hasDiscount: boolean
  isInviteDiscount: boolean
}

function normalizeAmountDiscount(rate: number | undefined): number {
  return typeof rate === 'number' && rate > 0 ? rate : 1.0
}

function normalizeInviteDiscount(rate: number | undefined): number {
  return typeof rate === 'number' && rate > 0 && rate < 1 ? rate : 1.0
}

export function getEffectiveTopupDiscount(
  topupInfo: TopupInfo | null,
  amount: number
): EffectiveTopupDiscount {
  const amountDiscount = normalizeAmountDiscount(topupInfo?.discount?.[amount])
  const inviteDiscount = topupInfo?.invite_discount
  const inviteRate = normalizeInviteDiscount(inviteDiscount?.discount_rate)
  const inviteMeetsMinAmount =
    !inviteDiscount?.min_amount || amount >= inviteDiscount.min_amount

  let rate = amountDiscount
  let type: TopupDiscountType | undefined =
    amountDiscount > 0 && amountDiscount < 1 ? 'amount' : undefined

  if (inviteDiscount?.eligible && inviteMeetsMinAmount && inviteRate < rate) {
    rate = inviteRate
    type = 'invitee_first_topup'
  }

  return {
    rate,
    type,
    hasDiscount: rate > 0 && rate < 1,
    isInviteDiscount: type === 'invitee_first_topup',
  }
}

function isInviteDiscountUsable(inviteDiscount?: InviteDiscountInfo): boolean {
  return (
    Boolean(inviteDiscount?.eligible) &&
    normalizeInviteDiscount(inviteDiscount?.discount_rate) < 1
  )
}

function getInviteDiscountPercent(inviteDiscount: InviteDiscountInfo): number {
  if (inviteDiscount.discount_percent && inviteDiscount.discount_percent > 0) {
    return inviteDiscount.discount_percent
  }

  return Math.round((1 - inviteDiscount.discount_rate) * 100)
}

function replacePlaceholder(
  value: string,
  placeholder: string,
  replacement: string
): string {
  return value.split(`{${placeholder}}`).join(encodeURIComponent(replacement))
}

export function buildExternalTopupLink(
  topupLink: string | undefined,
  inviteDiscount?: InviteDiscountInfo
): string {
  const trimmedLink = topupLink?.trim() ?? ''
  if (
    !trimmedLink ||
    !inviteDiscount ||
    !isInviteDiscountUsable(inviteDiscount)
  ) {
    return trimmedLink
  }

  const inviteCode = inviteDiscount.invite_code ?? ''
  const discountType = inviteDiscount.discount_type || 'invitee_first_topup'
  const values: Record<string, string> = {
    aff: inviteCode,
    invite_code: inviteCode,
    invite_discount: '1',
    discount_type: discountType,
    discount_rate: String(inviteDiscount.discount_rate),
    discount_percent: String(getInviteDiscountPercent(inviteDiscount)),
    min_amount: String(inviteDiscount.min_amount ?? 0),
  }

  const templatedLink = Object.entries(values).reduce(
    (result, [key, value]) => replacePlaceholder(result, key, value),
    trimmedLink
  )
  if (templatedLink !== trimmedLink) {
    return templatedLink
  }

  try {
    const origin =
      typeof window === 'undefined'
        ? 'http://localhost'
        : window.location.origin
    const isAbsolute = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(templatedLink)
    const isProtocolRelative = templatedLink.startsWith('//')
    const url = new URL(templatedLink, origin)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return templatedLink
    }

    Object.entries(values).forEach(([key, value]) => {
      if (!value || url.searchParams.has(key)) {
        return
      }
      url.searchParams.set(key, value)
    })

    if (isAbsolute || isProtocolRelative) {
      return url.toString()
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return templatedLink
  }
}
