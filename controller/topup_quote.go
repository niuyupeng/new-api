package controller

import (
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/shopspring/decimal"
)

type topUpQuote struct {
	RequestedAmount  int64
	NormalizedAmount int64
	OriginalMoney    float64
	PayMoney         float64
	DiscountRate     float64
	DiscountAmount   float64
	DiscountType     string
	QuotaToAdd       int64
}

type topUpDiscount struct {
	Rate         float64
	DiscountType string
	InviteState  inviteeFirstTopupDiscountState
}

type inviteeFirstTopupDiscountState struct {
	Bound          bool
	Eligible       bool
	FirstTopupUsed bool
	HasPending     bool
	Rate           float64
	MinAmount      int
	InviterId      int
}

func getEpayTopUpQuote(userId int, amount int64, group string) (topUpQuote, error) {
	return buildTopUpQuote(userId, amount, group, operation_setting.Price, false)
}

func getStripeTopUpQuote(userId int, amount int64, group string) (topUpQuote, error) {
	return buildTopUpQuote(userId, amount, group, setting.StripeUnitPrice, false)
}

func getWaffoTopUpQuote(userId int, amount int64, group string) (topUpQuote, error) {
	return buildTopUpQuote(userId, amount, group, setting.WaffoUnitPrice, true)
}

func getWaffoPancakeTopUpQuote(userId int, amount int64, group string) (topUpQuote, error) {
	return buildTopUpQuote(userId, amount, group, setting.WaffoPancakeUnitPrice, true)
}

func buildTopUpQuote(userId int, amount int64, group string, unitPrice float64, minNormalizedAmountOne bool) (topUpQuote, error) {
	discount, err := resolveTopUpDiscount(userId, amount)
	if err != nil {
		return topUpQuote{}, err
	}

	dAmount := decimal.NewFromInt(amount)
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		dAmount = dAmount.Div(decimal.NewFromFloat(common.QuotaPerUnit))
	}

	topupGroupRatio := common.GetTopupGroupRatio(group)
	if topupGroupRatio == 0 {
		topupGroupRatio = 1
	}

	originalMoney := dAmount.
		Mul(decimal.NewFromFloat(unitPrice)).
		Mul(decimal.NewFromFloat(topupGroupRatio))
	payMoney := originalMoney.Mul(decimal.NewFromFloat(discount.Rate))
	discountAmount := originalMoney.Sub(payMoney)
	if discountAmount.IsNegative() {
		discountAmount = decimal.Zero
	}

	normalizedAmount := normalizeTopUpAmount(amount, minNormalizedAmountOne)
	quotaToAdd := decimal.NewFromInt(normalizedAmount).
		Mul(decimal.NewFromFloat(common.QuotaPerUnit)).
		IntPart()

	return topUpQuote{
		RequestedAmount:  amount,
		NormalizedAmount: normalizedAmount,
		OriginalMoney:    originalMoney.InexactFloat64(),
		PayMoney:         payMoney.InexactFloat64(),
		DiscountRate:     discount.Rate,
		DiscountAmount:   discountAmount.InexactFloat64(),
		DiscountType:     discount.DiscountType,
		QuotaToAdd:       quotaToAdd,
	}, nil
}

func normalizeTopUpAmount(amount int64, minOne bool) int64 {
	normalized := amount
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		normalized = decimal.NewFromInt(amount).
			Div(decimal.NewFromFloat(common.QuotaPerUnit)).
			IntPart()
	}

	if minOne && normalized < 1 {
		return 1
	}
	return normalized
}

func resolveTopUpDiscount(userId int, amount int64) (topUpDiscount, error) {
	amountRate := getAmountDiscountRate(amount)
	discount := topUpDiscount{
		Rate: amountRate,
	}
	if amountRate > 0 && amountRate < 1 {
		discount.DiscountType = model.TopUpDiscountTypeAmount
	}

	inviteState, err := getInviteeFirstTopupDiscountState(userId)
	if err != nil {
		return discount, err
	}
	discount.InviteState = inviteState

	if inviteState.Eligible &&
		(inviteState.MinAmount <= 0 || amount >= int64(inviteState.MinAmount)) &&
		inviteState.Rate > 0 &&
		inviteState.Rate < discount.Rate {
		discount.Rate = inviteState.Rate
		discount.DiscountType = model.TopUpDiscountTypeInviteeFirstTopup
	}

	if discount.Rate <= 0 {
		discount.Rate = 1
	}

	return discount, nil
}

func getAmountDiscountRate(amount int64) float64 {
	discount := 1.0
	if ds, ok := operation_setting.GetPaymentSetting().AmountDiscount[int(amount)]; ok && ds > 0 {
		discount = ds
	}
	return discount
}

func getInviteeFirstTopupDiscountState(userId int) (inviteeFirstTopupDiscountState, error) {
	setting := operation_setting.GetPaymentSetting()
	state := inviteeFirstTopupDiscountState{
		Rate:      normalizeInviteeFirstTopupDiscount(setting.InviteeFirstTopupDiscount),
		MinAmount: setting.InviteeFirstTopupDiscountMin,
	}
	if userId == 0 {
		return state, nil
	}

	user, err := model.GetUserById(userId, false)
	if err != nil {
		return state, err
	}
	state.Bound = user.InviterId > 0
	state.InviterId = user.InviterId
	if !state.Bound || state.Rate >= 1 || !operation_setting.IsPaymentComplianceConfirmed() {
		return state, nil
	}

	hasSuccessfulTopup, err := model.UserHasTopUpWithStatuses(userId, []string{common.TopUpStatusSuccess})
	if err != nil {
		return state, err
	}
	state.FirstTopupUsed = hasSuccessfulTopup
	if hasSuccessfulTopup {
		return state, nil
	}

	hasPendingTopup, err := model.UserHasPendingTopUpDiscount(userId, model.TopUpDiscountTypeInviteeFirstTopup)
	if err != nil {
		return state, err
	}
	state.HasPending = hasPendingTopup
	state.Eligible = !hasPendingTopup
	return state, nil
}

func normalizeInviteeFirstTopupDiscount(rate float64) float64 {
	if rate <= 0 || rate >= 1 {
		return 1
	}
	return rate
}

func applyTopUpQuoteSnapshot(topUp *model.TopUp, quote topUpQuote) {
	topUp.OriginalMoney = quote.OriginalMoney
	topUp.DiscountRate = quote.DiscountRate
	topUp.DiscountAmount = quote.DiscountAmount
	topUp.DiscountType = quote.DiscountType
	topUp.QuotaToAdd = quote.QuotaToAdd
}

func inviteeFirstTopupDiscountInfo(userId int) map[string]any {
	state, err := getInviteeFirstTopupDiscountState(userId)
	if err != nil {
		return map[string]any{
			"bound":            false,
			"eligible":         false,
			"discount_rate":    1,
			"discount_type":    model.TopUpDiscountTypeInviteeFirstTopup,
			"first_topup_used": false,
			"has_pending":      false,
			"min_amount":       0,
			"invite_code":      "",
		}
	}

	inviteCode := ""
	if state.InviterId > 0 {
		if inviter, err := model.GetUserById(state.InviterId, false); err == nil && inviter != nil {
			inviteCode = inviter.AffCode
		}
	}
	discountPercent := 0
	if state.Rate > 0 && state.Rate < 1 {
		discountPercent = int(decimal.NewFromFloat(1).Sub(decimal.NewFromFloat(state.Rate)).Mul(decimal.NewFromInt(100)).Round(0).IntPart())
	}

	return map[string]any{
		"bound":            state.Bound,
		"eligible":         state.Eligible,
		"discount_rate":    state.Rate,
		"discount_percent": discountPercent,
		"discount_type":    model.TopUpDiscountTypeInviteeFirstTopup,
		"first_topup_used": state.FirstTopupUsed,
		"has_pending":      state.HasPending,
		"min_amount":       state.MinAmount,
		"invite_code":      inviteCode,
	}
}
