package model

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserHasTopUpWithStatuses(t *testing.T) {
	truncateTables(t)
	insertUserForPaymentGuardTest(t, 201, 0)

	topUp := &TopUp{
		UserId:          201,
		Amount:          10,
		Money:           9,
		TradeNo:         "invite-discount-pending",
		PaymentMethod:   PaymentMethodStripe,
		PaymentProvider: PaymentProviderStripe,
		Status:          common.TopUpStatusPending,
		CreateTime:      time.Now().Unix(),
	}
	require.NoError(t, topUp.Insert())

	hasPending, err := UserHasTopUpWithStatuses(201, []string{common.TopUpStatusPending})
	require.NoError(t, err)
	assert.True(t, hasPending)

	hasSuccessful, err := UserHasTopUpWithStatuses(201, []string{common.TopUpStatusSuccess})
	require.NoError(t, err)
	assert.False(t, hasSuccessful)
}

func TestUserHasPendingTopUpDiscount(t *testing.T) {
	truncateTables(t)
	insertUserForPaymentGuardTest(t, 202, 0)

	require.NoError(t, (&TopUp{
		UserId:          202,
		Amount:          10,
		Money:           9,
		TradeNo:         "invite-discount-pending-claim",
		PaymentMethod:   PaymentMethodStripe,
		PaymentProvider: PaymentProviderStripe,
		Status:          common.TopUpStatusPending,
		DiscountType:    TopUpDiscountTypeInviteeFirstTopup,
		CreateTime:      time.Now().Unix(),
	}).Insert())
	require.NoError(t, (&TopUp{
		UserId:          202,
		Amount:          20,
		Money:           20,
		TradeNo:         "amount-discount-pending-claim",
		PaymentMethod:   PaymentProviderEpay,
		PaymentProvider: PaymentProviderEpay,
		Status:          common.TopUpStatusPending,
		DiscountType:    TopUpDiscountTypeAmount,
		CreateTime:      time.Now().Unix(),
	}).Insert())

	hasInvitePending, err := UserHasPendingTopUpDiscount(202, TopUpDiscountTypeInviteeFirstTopup)
	require.NoError(t, err)
	assert.True(t, hasInvitePending)

	hasUnknownPending, err := UserHasPendingTopUpDiscount(202, "unknown")
	require.NoError(t, err)
	assert.False(t, hasUnknownPending)
}

func TestTopUpResolveQuotaToAddPrefersSnapshot(t *testing.T) {
	originalQuotaPerUnit := common.QuotaPerUnit
	common.QuotaPerUnit = 500000
	t.Cleanup(func() {
		common.QuotaPerUnit = originalQuotaPerUnit
	})

	assert.Equal(t, 123, (&TopUp{
		Amount:     10,
		QuotaToAdd: 123,
	}).ResolveQuotaToAdd())

	assert.Equal(t, 1000000, (&TopUp{
		Amount: 2,
	}).ResolveQuotaToAdd())

	assert.Equal(t, 1500000, (&TopUp{
		Amount:          2,
		Money:           3,
		PaymentProvider: PaymentProviderStripe,
	}).ResolveQuotaToAdd())
}
