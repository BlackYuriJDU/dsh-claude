/**
 * The bundle's substance is its patch files: the identity layer replaces the
 * official brand, mounts the keyless SearXNG provider, and swaps the upstream
 * standard preset for the DSHC Chat, Cowork, and Code presets.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as yaml from 'js-yaml'
import { entryListSchema } from '@deepseek-ai/cordis-plugin-include'

interface PatchRow {
  id?: string
  name?: string
  disabled?: unknown
  config?: unknown
  insert?: PatchRow[]
}

interface PresetConfig {
  id: string
  name: string
  description: string
  order: number
  plugins: PatchRow[]
}

const root = fileURLToPath(new URL('..', import.meta.url))
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>
  files?: string[]
  dsh?: { bundle?: { patch?: string[] } }
}

function load(path: string): PatchRow[] {
  const parsed = yaml.load(readFileSync(path, 'utf8'), { schema: entryListSchema })
  expect(Array.isArray(parsed)).toBe(true)
  return parsed as PatchRow[]
}

function preset(file: string): PresetConfig {
  const [row] = load(resolve(root, 'presets', `${file}.patch.yml`))
  return row!.insert![0]!.config as PresetConfig
}

function persona(config: PresetConfig): string {
  return (config.plugins.find(row => row.id === 'persona')!.config as { prefix: string }).prefix
}

const identityRows = load(resolve(root, 'cordis.patch.yml'))
const upstreamStandard = (load(resolve(root, '../web-app/presets/standard.patch.yml'))[0]!.insert![0]!.config) as PresetConfig
const presets = { chat: preset('chat'), cowork: preset('cowork'), code: preset('code') }

describe('dsh-dshc bundle identity layer', () => {
  it('lists the identity patch first, then the three presets, all published', () => {
    const patches = ['./cordis.patch.yml', './presets/chat.patch.yml', './presets/cowork.patch.yml', './presets/code.patch.yml']
    expect(manifest.dsh?.bundle?.patch).toEqual(patches)
    for (const patch of patches) expect(manifest.files).toContain(patch.slice(2))
  })

  it('disables the official brand that occupies the same slots', () => {
    expect(identityRows).toContainEqual({ id: 'ui-brand-official', disabled: true })
  })

  it('inserts the DSHC brand, the SearXNG provider, saved memories, and projects, each a declared dependency', () => {
    const inserted = identityRows.flatMap(row => row.insert ?? [])
    expect(inserted.map(row => row.id)).toEqual(['ui-brand-dshc', 'web-search-searxng', 'ui-settings-searxng', 'ui-memory', 'ui-projects'])
    for (const row of inserted) {
      expect(row.disabled).toBeUndefined()
      expect(manifest.dependencies).toHaveProperty(row.name!)
    }
  })

  it('sends no Session log to DeepSeek by default', () => {
    expect(identityRows).toContainEqual({ id: 'session-telemetry-otel', disabled: true })
    expect(identityRows).toContainEqual({ id: 'session-log-deepseek', config: { enabled: false } })
  })

  it('keeps the default Workspace in a DSHC folder', () => {
    expect(identityRows).toContainEqual({ id: 'workspace-controller', config: { productDirectory: 'dsh-claude' } })
  })

  it('starts with the upstream welcome notice acknowledged at its current version', () => {
    const copy = readFileSync(resolve(root, '../../client/ui-settings-models/src/onboarding-copy.ts'), 'utf8')
    const version = /WELCOME_NOTICE_VERSION = '([^']+)'/.exec(copy)?.[1]
    expect(version).toBeDefined()
    expect(identityRows).toContainEqual({ id: 'ui-settings-general', config: { welcomeNoticeVersion: version } })
  })

  it('replaces the standard preset and starts new sessions in Chat', () => {
    expect(identityRows).toContainEqual({ id: 'preset-standard', disabled: true })
    expect(identityRows).toContainEqual({ id: 'preset-ptc', disabled: true })
    expect(identityRows).toContainEqual({ id: 'preset-minimal', disabled: true })
    expect(identityRows).toContainEqual({ id: 'agent-preset-registry', config: { default: 'chat' } })
  })
})

describe('DSHC presets', () => {
  it('declares Chat, Cowork, and Code in that order with display copy', () => {
    expect(Object.values(presets).map(config => [config.id, config.name, config.order]))
      .toEqual([['chat', 'Chat', 1], ['cowork', 'Cowork', 2], ['code', 'Code', 3]])
    for (const config of Object.values(presets)) expect(config.description.length).toBeGreaterThan(0)
  })

  it('opens every persona with the same honest DSHC identity and closes with the same voice', () => {
    const [identity] = persona(presets.chat).split('\n\n')
    expect(identity).toContain('You are DSHC')
    expect(identity).toContain('The {{model}} model powers you')
    expect(identity).toContain('You are not Claude')
    const voice = persona(presets.chat).slice(persona(presets.chat).indexOf('How you communicate:'))
    for (const config of Object.values(presets)) {
      expect(persona(config).startsWith(identity!)).toBe(true)
      expect(persona(config).endsWith(voice)).toBe(true)
    }
  })

  it('keeps Chat conversational: no shell, no file writes, web search on', () => {
    const ids = presets.chat.plugins.map(row => row.id)
    expect(ids).not.toContain('tool-bash')
    expect(ids).not.toContain('tool-pwsh')
    expect(presets.chat.plugins.find(row => row.id === 'tool-fs')?.config)
      .toEqual({ read: true, readImage: true, write: false, edit: false })
    expect(presets.chat.plugins.find(row => row.id === 'tool-web')?.config).toMatchObject({ fetch: true })
  })

  it('gives Cowork and Code the upstream standard rows with their own personas', () => {
    const withoutPersona = (config: PresetConfig) => config.plugins.filter(row => row.id !== 'persona')
    for (const config of [presets.cowork, presets.code]) {
      expect(withoutPersona(config)).toEqual(withoutPersona(upstreamStandard))
    }
    expect(persona(presets.cowork)).toContain('the present tool')
    expect(persona(presets.cowork)).toContain('Ask before deleting or overwriting files')
    expect(persona(presets.code)).not.toContain('{{cwd}}')
    expect(persona(presets.code)).toContain('exit_plan_mode')
  })
})
