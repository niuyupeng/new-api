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
import fs from 'node:fs/promises'
import path from 'node:path'

const guardedFiles = [
  'src/features/about/index.tsx',
  'src/features/auth/auth-layout.tsx',
  'src/features/auth/sign-in/index.tsx',
  'src/features/auth/sign-up/index.tsx',
  'src/features/chat-console/index.tsx',
  'src/features/ccapi/public-nav.ts',
  'src/features/docs/index.tsx',
  'src/features/pricing/index.tsx',
  'src/components/layout/components/public-header.tsx',
  'src/components/layout/components/system-brand.tsx',
  'src/features/home/components/sections/cta.tsx',
  'src/features/home/components/sections/features.tsx',
  'src/features/home/components/sections/hero.tsx',
  'src/features/home/components/sections/how-it-works.tsx',
  'src/features/home/components/sections/stats.tsx',
  'src/features/home/components/sections/trust.tsx',
]

const requiredTokens = {
  'src/features/auth/auth-layout.tsx': ['ccapi-auth-shell', 'bg-background'],
  'src/features/chat-console/index.tsx': [
    'bg-background',
    'text-foreground',
    'getCcapiLogoForDarkSurface',
    '/wallet#wallet-add-funds',
    '/playground',
    '/redemption-codes',
    '/channels',
    '/models/metadata',
    '/system-settings/site',
    '模型广场',
    '控制台首页',
    '关于',
  ],
  'src/features/ccapi/public-nav.ts': [
    '模型广场',
    '文档',
    '控制台首页',
    '关于',
    '/dashboard/overview',
  ],
  'src/features/docs/index.tsx': ['ccapi-docs-page', 'bg-background', 'text-foreground'],
  'src/features/pricing/index.tsx': [
    'ccapi-pricing-page',
    'bg-background',
    'text-foreground',
  ],
  'src/components/layout/components/public-header.tsx': [
    'getCcapiLogoForDarkSurface',
    'HeaderLogo',
  ],
  'src/components/layout/components/system-brand.tsx': [
    'getCcapiLogoForDarkSurface',
  ],
}

const disallowedNeutralSurfaceUtility =
  /\b(?:bg|text|border|ring|from|via|to)-(?:zinc|neutral|stone|slate|gray)-(?:50|100|200|300|400|500|600|700|800|900|950)(?:\/[0-9.]+)?\b/g

const root = process.cwd()
const failures = []

for (const relativeFile of guardedFiles) {
  const absoluteFile = path.join(root, relativeFile)
  let text

  try {
    text = await fs.readFile(absoluteFile, 'utf8')
  } catch (error) {
    failures.push(`${relativeFile}: cannot read file (${error.message})`)
    continue
  }

  const matches = text.match(disallowedNeutralSurfaceUtility) ?? []
  if (matches.length > 0) {
    const uniqueMatches = [...new Set(matches)].sort()
    failures.push(
      `${relativeFile}: use theme tokens instead of neutral palette utilities: ${uniqueMatches.join(', ')}`
    )
  }

  const tokens = requiredTokens[relativeFile] ?? []
  for (const token of tokens) {
    if (!text.includes(token)) {
      failures.push(`${relativeFile}: missing required theme token "${token}"`)
    }
  }
}

if (failures.length > 0) {
  console.error('ccapi theme / brand consistency check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  console.error(
    '\nUse semantic tokens such as bg-background, text-foreground, bg-card, border-border, text-muted-foreground, bg-muted, and text-card-foreground. Keep ccapi logo and navigation through the shared brand helpers. Brand/status accent colors are allowed when intentional.'
  )
  process.exit(1)
}

console.log('ccapi theme / brand consistency check passed.')
