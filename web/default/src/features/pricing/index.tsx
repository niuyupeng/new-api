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
        <div className='min-h-svh bg-[#11100f] px-3 pt-24 pb-8 sm:px-6 sm:pt-28 sm:pb-10 xl:px-8'>
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
      <div className='ccapi-pricing-page relative min-h-svh overflow-hidden bg-[#0f0f0e] text-[#fff6e8]'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(242,139,97,0.16),transparent_28%),radial-gradient(circle_at_10%_18%,rgba(45,142,156,0.1),transparent_25%)]'
        />
        <div
          aria-hidden
          className='absolute inset-0 [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:42px_42px] opacity-[0.025]'
        />
        <PageTransition className='relative mx-auto w-full max-w-[1800px] px-3 pt-24 pb-8 sm:px-6 sm:pt-28 sm:pb-10 xl:px-8'>
          <header className='mx-auto mb-8 grid max-w-6xl gap-6 pt-4 lg:grid-cols-[1fr_0.68fr] lg:items-end'>
            <div>
              <p className='mb-4 inline-flex rounded-full border border-[#f28b61]/35 bg-[#2a1712]/80 px-3 py-1.5 text-xs font-black tracking-[0.16em] text-[#f28b61] uppercase'>
                {t('MODEL MENU')}
              </p>
              <h1 className='max-w-3xl text-[clamp(2.7rem,6.2vw,5.35rem)] leading-[0.95] font-black tracking-normal text-[#fff6e8]'>
                {t('模型价格')}
                <br />
                <span className='text-[#f28b61]'>{t('明码标价')}</span>
              </h1>
              <p className='mt-5 max-w-2xl text-sm leading-7 text-[#f0dfc8] sm:text-base'>
                {t(
                  '当前可用 {{count}} 个模型。搜索模型、供应商、端点或标签，像看菜单一样快速比较输入、输出和请求价格。',
                  {
                    count: models?.length || 0,
                  }
                )}
              </p>
            </div>
            <div className='ccapi-pricing-search-panel rounded-xl border border-[#4c3930] bg-[#1b1714]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)]'>
              <div className='mb-3 text-xs font-black tracking-[0.16em] text-[#ff9b70] uppercase'>
                quick search
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
                <div className='ccapi-pricing-stat rounded-md bg-[#090807] px-2 py-3'>
                  <div className='font-black text-[#ff9b70]'>/1M</div>
                  <div className='mt-1 text-[#ead7bf]'>{t('Token')}</div>
                </div>
                <div className='ccapi-pricing-stat rounded-md bg-[#090807] px-2 py-3'>
                  <div className='font-black text-[#ff9b70]'>CNY</div>
                  <div className='mt-1 text-[#ead7bf]'>{t('Recharge')}</div>
                </div>
                <div className='ccapi-pricing-stat rounded-md bg-[#090807] px-2 py-3'>
                  <div className='font-black text-[#ff9b70]'>API</div>
                  <div className='mt-1 text-[#ead7bf]'>{t('Ready')}</div>
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
