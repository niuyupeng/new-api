import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import { ccapiPublicNavLinks } from '@/features/ccapi/public-nav'
import {
  LoadingSkeleton,
  EmptyState,
  SearchBar,
  PricingTable,
  PricingSidebar,
  PricingToolbar,
  ModelCardGrid,
  ModelDetailsDrawer,
} from './components'
import { EXCLUDED_GROUPS, VIEW_MODES } from './constants'
import { useFilters } from './hooks/use-filters'
import { usePricingData } from './hooks/use-pricing-data'

export function Pricing() {
  const { t } = useTranslation()
  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    null
  )

  const {
    models,
    vendors,
    groupRatio,
    usableGroup,
    endpointMap,
    autoGroups,
    isLoading,
    priceRate,
    usdExchangeRate,
  } = usePricingData()

  const {
    searchInput,
    sortBy,
    vendorFilter,
    groupFilter,
    quotaTypeFilter,
    endpointTypeFilter,
    tagFilter,
    tokenUnit,
    viewMode,
    showRechargePrice,
    setSearchInput,
    setSortBy,
    setVendorFilter,
    setGroupFilter,
    setQuotaTypeFilter,
    setEndpointTypeFilter,
    setTagFilter,
    setTokenUnit,
    setViewMode,
    setShowRechargePrice,
    filteredModels,
    hasActiveFilters,
    activeFilterCount,
    availableTags,
    clearFilters,
    clearSearch,
  } = useFilters(models || [])

  const handleModelClick = useCallback((modelName: string) => {
    setSelectedModelName(modelName)
  }, [])

  const selectedModel = useMemo(
    () =>
      selectedModelName
        ? (models || []).find(
            (model) => model.model_name === selectedModelName
          ) || null
        : null,
    [models, selectedModelName]
  )

  const availableGroups = useMemo(
    () =>
      Object.keys(usableGroup || {}).filter(
        (g) => !EXCLUDED_GROUPS.includes(g)
      ),
    [usableGroup]
  )

  const handleClearAll = useCallback(() => {
    clearFilters()
    clearSearch()
  }, [clearFilters, clearSearch])

  const renderPricingContent = () => {
    if (filteredModels.length === 0) {
      return (
        <EmptyState
          searchQuery={searchInput}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearAll}
        />
      )
    }

    if (viewMode === VIEW_MODES.CARD) {
      return (
        <ModelCardGrid
          models={filteredModels}
          onModelClick={handleModelClick}
          priceRate={priceRate}
          usdExchangeRate={usdExchangeRate}
          tokenUnit={tokenUnit}
          showRechargePrice={showRechargePrice}
        />
      )
    }

    return (
      <PricingTable
        models={filteredModels}
        priceRate={priceRate}
        usdExchangeRate={usdExchangeRate}
        tokenUnit={tokenUnit}
        showRechargePrice={showRechargePrice}
        onModelClick={handleModelClick}
      />
    )
  }

  if (isLoading) {
    return (
      <PublicLayout
        showMainContainer={false}
        navLinks={ccapiPublicNavLinks}
        siteName='ccapi'
        headerProps={{ className: 'ccapi-public-header' }}
      >
        <div className='bg-background min-h-svh px-3 pt-24 pb-8 sm:px-6 sm:pt-28 sm:pb-10 xl:px-8'>
          <LoadingSkeleton viewMode={viewMode} />
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout
      showMainContainer={false}
      navLinks={ccapiPublicNavLinks}
      siteName='ccapi'
      headerProps={{ className: 'ccapi-public-header' }}
    >
      <div className='ccapi-pricing-page bg-background text-foreground min-h-svh'>
        <PageTransition className='mx-auto w-full max-w-[1800px] px-3 pt-24 pb-8 sm:px-6 sm:pt-28 sm:pb-10 xl:px-8'>
          <header className='mx-auto mb-6 grid max-w-6xl gap-5 pt-4 lg:grid-cols-[1fr_0.72fr] lg:items-end'>
            <div>
              <p className='mb-3 text-sm font-bold text-orange-400'>
                {t('模型价格表')}
              </p>
              <h1 className='text-foreground max-w-3xl text-3xl leading-tight font-black tracking-tight sm:text-4xl md:text-5xl'>
                {t('模型价格')}
              </h1>
              <p className='text-muted-foreground mt-4 max-w-2xl text-sm leading-7 sm:text-base'>
                {t(
                  '当前可用 {{count}} 个模型。搜索模型名、供应商、端点或标签，快速比较输入价、输出价、缓存价和按次价格。',
                  {
                    count: models?.length || 0,
                  }
                )}
              </p>
            </div>
            <div className='ccapi-pricing-search-panel border-border bg-card min-w-0 rounded-xl border p-4 shadow-sm'>
              <div className='text-foreground mb-3 text-sm font-bold'>
                {t('快速搜索')}
              </div>
              <SearchBar
                value={searchInput}
                onChange={setSearchInput}
                onClear={clearSearch}
                placeholder={t(
                  'Search model name, provider, endpoint, or tag...'
                )}
                className='ccapi-pricing-search'
              />
              <div className='mt-4 grid grid-cols-3 gap-2 text-center text-xs'>
                <div className='ccapi-pricing-stat border-border bg-background rounded-md border px-2 py-3'>
                  <div className='text-foreground font-black'>/1M</div>
                  <div className='text-muted-foreground mt-1'>{t('Token')}</div>
                </div>
                <div className='ccapi-pricing-stat border-border bg-background rounded-md border px-2 py-3'>
                  <div className='text-foreground font-black'>CNY</div>
                  <div className='text-muted-foreground mt-1'>
                    {t('Recharge')}
                  </div>
                </div>
                <div className='ccapi-pricing-stat border-border bg-background rounded-md border px-2 py-3'>
                  <div className='text-foreground font-black'>API</div>
                  <div className='text-muted-foreground mt-1'>{t('Ready')}</div>
                </div>
              </div>
            </div>
          </header>

          <div className='grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)] 2xl:grid-cols-[330px_minmax(0,1fr)]'>
            <PricingSidebar
              quotaTypeFilter={quotaTypeFilter}
              endpointTypeFilter={endpointTypeFilter}
              vendorFilter={vendorFilter}
              groupFilter={groupFilter}
              tagFilter={tagFilter}
              onQuotaTypeChange={setQuotaTypeFilter}
              onEndpointTypeChange={setEndpointTypeFilter}
              onVendorChange={setVendorFilter}
              onGroupChange={setGroupFilter}
              onTagChange={setTagFilter}
              vendors={vendors || []}
              groups={availableGroups}
              groupRatios={groupRatio}
              tags={availableTags}
              models={models || []}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              className='sticky top-20 hidden max-h-[calc(100vh-6rem)] overflow-y-auto xl:block'
            />

            <main className='min-w-0 space-y-4'>
              <PricingToolbar
                filteredCount={filteredModels.length}
                totalCount={models?.length}
                sortBy={sortBy}
                onSortChange={setSortBy}
                tokenUnit={tokenUnit}
                onTokenUnitChange={setTokenUnit}
                showRechargePrice={showRechargePrice}
                onRechargePriceChange={setShowRechargePrice}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                quotaTypeFilter={quotaTypeFilter}
                endpointTypeFilter={endpointTypeFilter}
                vendorFilter={vendorFilter}
                groupFilter={groupFilter}
                tagFilter={tagFilter}
                onQuotaTypeChange={setQuotaTypeFilter}
                onEndpointTypeChange={setEndpointTypeFilter}
                onVendorChange={setVendorFilter}
                onGroupChange={setGroupFilter}
                onTagChange={setTagFilter}
                vendors={vendors || []}
                groups={availableGroups}
                groupRatios={groupRatio}
                tags={availableTags}
                models={models || []}
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={activeFilterCount}
                onClearFilters={clearFilters}
              />

              {renderPricingContent()}
            </main>
          </div>

          {selectedModel && (
            <ModelDetailsDrawer
              open={Boolean(selectedModel)}
              onOpenChange={(open) => {
                if (!open) setSelectedModelName(null)
              }}
              model={selectedModel}
              groupRatio={groupRatio || {}}
              usableGroup={usableGroup || {}}
              endpointMap={
                (endpointMap as Record<
                  string,
                  { path?: string; method?: string }
                >) || {}
              }
              autoGroups={autoGroups || []}
              priceRate={priceRate ?? 1}
              usdExchangeRate={usdExchangeRate ?? 1}
              tokenUnit={tokenUnit}
              showRechargePrice={showRechargePrice}
            />
          )}
        </PageTransition>
      </div>
    </PublicLayout>
  )
}
