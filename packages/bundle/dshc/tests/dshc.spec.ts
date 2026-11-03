/**
 * The bundle's substance is its patch file: it replaces the official brand
 * with the DSHC brand and mounts the keyless SearXNG search provider.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as yaml from 'js-yaml'
import { entryListSchema } from '@deepseek-ai/cordis-plugin-include'

interface PatchRow { id?: string; name?: string; disabled?: unknown; insert?: PatchRow[] }

const root = fileURLToPath(new URL('..', import.meta.url))
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>
  dsh?: { bundle?: { patch?: string } }
}

function patchRows(): PatchRow[] {
  const parsed = yaml.load(readFileSync(resolve(root, manifest.dsh!.bundle!.patch!), 'utf8'), { schema: entryListSchema })
  expect(Array.isArray(parsed)).toBe(true)
  return parsed as PatchRow[]
}

describe('dsh-dshc bundle', () => {
  it('declares its patch through the dsh.bundle.patch manifest field', () => {
    expect(manifest.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
  })

  it('disables the official brand that occupies the same slots', () => {
    expect(patchRows()).toContainEqual({ id: 'ui-brand-official', disabled: true })
  })

  it('inserts the DSHC brand and the SearXNG provider, each a declared dependency', () => {
    const inserted = patchRows().flatMap(row => row.insert ?? [])
    expect(inserted.map(row => row.id)).toEqual(['ui-brand-dshc', 'web-search-searxng'])
    for (const row of inserted) {
      expect(row.disabled).toBeUndefined()
      expect(manifest.dependencies).toHaveProperty(row.name!)
    }
  })
})
