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
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []

function read(relativeFile) {
  const absoluteFile = path.join(root, relativeFile)
  try {
    return fs.readFileSync(absoluteFile, 'utf8')
  } catch (error) {
    failures.push(`${relativeFile}: cannot read file (${error.message})`)
    return ''
  }
}

function requireFile(relativeFile, options = {}) {
  const absoluteFile = path.join(root, relativeFile)
  if (!fs.existsSync(absoluteFile)) {
    failures.push(`${relativeFile}: missing required file`)
    return
  }

  const stats = fs.statSync(absoluteFile)
  if (options.nonEmpty && stats.size === 0) {
    failures.push(`${relativeFile}: file must not be empty`)
  }
}

function requireTokens(relativeFile, tokens) {
  const text = read(relativeFile)
  for (const token of tokens) {
    if (!text.includes(token)) {
      failures.push(`${relativeFile}: missing required token "${token}"`)
    }
  }
}

function requireAnyToken(relativeFile, tokens, label) {
  const text = read(relativeFile)
  if (!tokens.some((token) => text.includes(token))) {
    failures.push(
      `${relativeFile}: missing one of required ${label}: ${tokens.join(', ')}`
    )
  }
}

const requiredRoutes = [
  'src/routes/(auth)/sign-in.tsx',
  'src/routes/_authenticated/chat/index.tsx',
  'src/routes/_authenticated/chat/image.tsx',
  'src/routes/_authenticated/channels/index.tsx',
  'src/routes/_authenticated/dashboard/$section.tsx',
  'src/routes/_authenticated/keys/index.tsx',
  'src/routes/_authenticated/models/$section.tsx',
  'src/routes/_authenticated/redemption-codes/index.tsx',
  'src/routes/_authenticated/system-settings/site/$section.tsx',
  'src/routes/_authenticated/usage-logs/$section.tsx',
  'src/routes/_authenticated/users/index.tsx',
  'src/routes/_authenticated/wallet/index.tsx',
  'src/routes/docs/index.tsx',
]

for (const route of requiredRoutes) {
  requireFile(route)
}

for (const asset of [
  'public/logo.png',
  'public/logo-dark.png',
  'public/favicon.ico',
]) {
  requireFile(asset, { nonEmpty: true })
}

requireTokens('src/features/ccapi/public-nav.ts', [
  '首页',
  '模型广场',
  '文档',
  '控制台首页',
  '关于',
  '/pricing',
  '/docs',
  '/dashboard/overview',
  '/about',
])

requireTokens('src/hooks/use-top-nav-links.ts', [
  '模型广场',
  '文档',
  '控制台首页',
  '关于',
  '/dashboard/overview',
])

requireTokens('src/hooks/use-sidebar-data.ts', [
  '/chat',
  '/playground',
  '/dashboard/overview',
  '/dashboard/models',
  '/keys',
  '/wallet',
  '/channels',
  '/models/metadata',
  '/users',
  '/redemption-codes',
  '/subscriptions',
  '/system-settings/site',
])

requireTokens('src/lib/ccapi-brand.ts', [
  'CCAPI_LOGO_VERSION',
  'CCAPI_LIGHT_LOGO',
  'CCAPI_DARK_LOGO',
  'getCcapiLogoForDarkSurface',
  'getCcapiLogoForLightSurface',
])

requireTokens('src/components/layout/components/public-header.tsx', [
  'HeaderLogo',
  'getCcapiLogoForDarkSurface',
])

requireTokens('src/components/layout/components/system-brand.tsx', [
  'getCcapiLogoForDarkSurface',
  '<img',
])

requireTokens('src/features/keys/components/api-keys-cells.tsx', [
  'Copy API key',
  'Copy Connection Info',
  'encodeConnectionString',
])

requireTokens('src/features/channels/components/drawers/channel-mutate-drawer.tsx', [
  'Fetch from Upstream',
  'Fetched {{count}} model(s) from upstream',
  'No models fetched from upstream',
  'FetchModelsDialog',
])

requireTokens('src/features/channels/components/model-mapping-editor.tsx', [
  'Add Mapping',
  'No model mappings configured. Click "Add Mapping" to get started.',
])

requireAnyToken(
  'src/features/wallet/components/recharge-form-card.tsx',
  ['Buy redemption code', 'Recharge link', 'external recharge link'],
  'wallet recharge entry'
)

requireTokens('src/features/wallet/components/recharge-form-card.tsx', [
  'Enter your redemption code',
  'Need a redemption code?',
])

requireTokens('src/features/wallet/index.tsx', ['wallet-add-funds'])

requireTokens('src/features/docs/index.tsx', [
  'Claude Code',
  'Codex',
  'Cursor',
  'CC Switch',
  'sk-your-api-key',
])

if (failures.length > 0) {
  console.error('ccapi regression guard failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  console.error(
    '\nDo not remove ccapi logo, public navigation, NewAPI console routes, wallet recharge/redemption, API key copy helpers, channel model-fetch, or model-mapping flows. Additive UI changes must keep these contracts intact.'
  )
  process.exit(1)
}

console.log('ccapi regression guard passed.')
