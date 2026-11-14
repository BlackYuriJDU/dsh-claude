import { describe, expect, it } from 'vitest'
import { inspectDependencyLicenses, LICENSE_EXCEPTIONS, parseLicenseListing } from './verify-dependency-licenses.ts'
import type { LicenseException } from './verify-dependency-licenses.ts'

const mpl: LicenseException = { pattern: 'mpl-lib*', scope: 'runtime', reason: 'reviewed' }
const tool: LicenseException = { pattern: 'lgpl-tool', scope: 'development', reason: 'reviewed' }

describe('dependency license gate', () => {
  it('accepts permissive licenses, permissive choices, development MPL, and reasoned exceptions', () => {
    expect(inspectDependencyLicenses(
      [{ name: 'a', license: 'MIT' }, { name: 'b', license: '(MIT OR GPL-3.0-or-later)' }, { name: 'mpl-lib-linux-x64', license: 'MPL-2.0' }],
      [{ name: 'axe', license: 'MPL-2.0' }, { name: 'lgpl-tool', license: 'LGPL-3.0-only' }, { name: 'mpl-lib', license: 'MPL-2.0' }],
      [mpl, tool],
    )).toEqual([])
  })

  it('refuses GPL and AGPL without a permissive alternative, and tldraw, even when an exception matches', () => {
    expect(inspectDependencyLicenses(
      [{ name: 'gpl-lib', license: 'GPL-3.0-only' }, { name: '@tldraw/editor', license: 'MIT' }],
      [{ name: 'agpl-tool', license: 'AGPL-3.0-or-later' }, { name: 'tldraw', license: 'MIT' }],
      [{ pattern: 'gpl-lib', scope: 'runtime', reason: 'wrongly excepted' }],
    )).toEqual([
      'gpl-lib (GPL-3.0-only): refused license',
      '@tldraw/editor (MIT): refused package',
      'agpl-tool (AGPL-3.0-or-later): refused license',
      'tldraw (MIT): refused package',
      'exception gpl-lib matches no installed package that needs it; remove it',
    ])
  })

  it('requires a runtime exception for runtime copyleft and unknown licenses', () => {
    expect(inspectDependencyLicenses(
      [{ name: 'lgpl-tool', license: 'LGPL-3.0-only' }, { name: 'mystery', license: 'Unknown' }],
      [],
      [tool],
    )).toEqual([
      'lgpl-tool (LGPL-3.0-only): runtime license outside the policy; review the terms and add a reasoned exception',
      'mystery (Unknown): runtime license outside the policy; review the terms and add a reasoned exception',
      'exception lgpl-tool matches no installed package that needs it; remove it',
    ])
  })

  it('judges a package installed for both scopes by the runtime policy', () => {
    expect(inspectDependencyLicenses([{ name: 'shared', license: 'MPL-2.0' }], [{ name: 'shared', license: 'MPL-2.0' }], []))
      .toEqual(['shared (MPL-2.0): runtime license outside the policy; review the terms and add a reasoned exception'])
  })

  it('gives every shipped exception a reason', () => {
    for (const exception of LICENSE_EXCEPTIONS) expect(exception.reason.length).toBeGreaterThan(10)
  })

  it('flattens the pnpm listing into one entry per package', () => {
    expect(parseLicenseListing(JSON.stringify({ MIT: [{ name: 'a' }, { name: 'b' }], 'MPL-2.0': [{ name: 'c' }] })))
      .toEqual([{ name: 'a', license: 'MIT' }, { name: 'b', license: 'MIT' }, { name: 'c', license: 'MPL-2.0' }])
  })
})
