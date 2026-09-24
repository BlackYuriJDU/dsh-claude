import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { Session, SessionId } from '@deepseek-ai/dsh-session'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import { SettingsProvider, settingsNamespace, type SettingsNamespace } from '@deepseek-ai/dsh-settings'
import {
  KNOWLEDGE_FILE_MAX_CHARS, PROJECT_CONTEXT, apply, projectContextText, readKnowledge, workspacePathFor,
} from '../src/index.ts'

/** Mirrors the module-local namespace id in src/index.ts. */
const PROJECTS_SETTINGS_NAMESPACE = 'ui-projects'

class MemorySettings extends SettingsProvider {
  readonly writable = true
  protected load(): Promise<Record<string, unknown>> { return Promise.resolve({}) }
  protected persist(_ns: SettingsNamespace, _section: Record<string, unknown>): Promise<void> {
    return Promise.resolve()
  }
}

/** Minimal workspace-registry fake: the cached list() the context resolves against. */
function registryOf(paths: readonly { id: string; path: string }[]) {
  return {
    list: () => paths.map(({ id, path }) => ({ id, path })),
  }
}

function session(id: string, cwd?: string): Session {
  const sessionId = SessionId(id)
  return Session.create(sessionId, undefined, {
    version: 0,
    id: sessionId,
    createdAt: 0,
    ...cwd === undefined ? {} : { cwd },
  })
}

function agentFor(activeSession: Session): Agent {
  return { session: activeSession } as unknown as Agent
}

describe('workspacePathFor', () => {
  it('matches the exact path and nested cwds, preferring the most specific', () => {
    const paths = ['/projects/a', '/projects/a/nested', '/projects/b']
    expect(workspacePathFor('/projects/a', paths)).toBe('/projects/a')
    expect(workspacePathFor('/projects/a/nested/deep', paths)).toBe('/projects/a/nested')
    expect(workspacePathFor('/projects/b/x', paths)).toBe('/projects/b')
  })

  it('does not match a sibling sharing a prefix segment', () => {
    expect(workspacePathFor('/projects/a2', ['/projects/a'])).toBeUndefined()
    expect(workspacePathFor('/elsewhere', ['/projects/a'])).toBeUndefined()
  })

  it('normalizes separators and trailing slashes', () => {
    expect(workspacePathFor('C:\\proj\\app\\sub', ['C:/proj/app'])).toBe('C:/proj/app')
    expect(workspacePathFor('/proj/app/', ['/proj/app'])).toBe('/proj/app')
  })
})

describe('readKnowledge / projectContextText', () => {
  let dir: string
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'dsh-projects-')) })
  afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

  it('reads a file and truncates past the budget', () => {
    const small = join(dir, 'small.txt')
    writeFileSync(small, 'hello project')
    expect(readKnowledge({ id: '1', name: 'small.txt', path: small })).toBe('hello project')

    const big = join(dir, 'big.txt')
    writeFileSync(big, 'x'.repeat(KNOWLEDGE_FILE_MAX_CHARS + 100))
    const truncated = readKnowledge({ id: '2', name: 'big.txt', path: big })
    expect(truncated).toContain('truncated')
    expect(truncated.length).toBeLessThan(KNOWLEDGE_FILE_MAX_CHARS + 200)
  })

  it('returns a notice for an unreadable file instead of throwing', () => {
    const text = readKnowledge({ id: '3', name: 'gone.txt', path: join(dir, 'missing.txt') })
    expect(text).toContain('Could not read knowledge file')
  })

  it('composes instructions and fenced knowledge, empty when blank', () => {
    expect(projectContextText(undefined)).toBe('')
    expect(projectContextText({ instructions: '   ' })).toBe('')
    const file = join(dir, 'notes.md')
    writeFileSync(file, 'project notes body')
    const text = projectContextText({
      instructions: 'Always use strict TypeScript here.',
      files: [{ id: 'f', name: 'notes.md', path: file }],
    })
    expect(text).toContain('Always use strict TypeScript here.')
    expect(text).toContain('--- notes.md ---')
    expect(text).toContain('project notes body')
  })
})

describe('ui-projects host', () => {
  it('registers and disposes the durable projects namespace with its fiber', async () => {
    const ctx = new Context()
    await ctx.plugin(MemorySettings).await()
    ctx.provide('workspaceRegistry', registryOf([]))
    const fiber = ctx.plugin({ apply })
    await fiber.await()
    expect(ctx.settings.describe().map(row => row.ns)).toContain(
      settingsNamespace(PROJECTS_SETTINGS_NAMESPACE),
    )
    await fiber.dispose()
    expect(ctx.settings.describe().map(row => row.ns)).not.toContain(
      settingsNamespace(PROJECTS_SETTINGS_NAMESPACE),
    )
  })

  it('injects the current session project content and nothing for other sessions', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-projects-host-'))
    try {
      const projA = join(dir, 'a')
      const projB = join(dir, 'b')
      mkdirSync(projA)
      mkdirSync(projB)
      writeFileSync(join(projA, 'guide.md'), 'alpha guide body')

      const ctx = new Context()
      await ctx.plugin(MemorySettings).await()
      await ctx.plugin(SystemPrompt, { persona: '' })
      ctx.provide('workspaceRegistry', registryOf([
        { id: 'ws-a', path: projA },
        { id: 'ws-b', path: projB },
      ]))
      const fiber = ctx.plugin({ apply })
      await fiber.await()

      const ns = settingsNamespace(PROJECTS_SETTINGS_NAMESPACE)
      const contextText = async (cwd: string): Promise<string> => {
        const assembly = await ctx.systemPrompt.assemble({ agent: agentFor(session('sess', cwd)) })
        return assembly.contexts.find(c => c.name === PROJECT_CONTEXT)?.text ?? ''
      }

      // No stored content contributes nothing.
      expect(await contextText(projA)).toBe('')

      await ctx.settings.update(ns, {
        projects: {
          'ws-a': {
            instructions: 'Alpha instructions.',
            files: [{ id: 'g', name: 'guide.md', path: join(projA, 'guide.md') }],
          },
        },
      })

      const a = await contextText(projA)
      expect(a).toContain('Alpha instructions.')
      expect(a).toContain('alpha guide body')
      // A nested cwd still resolves to project A.
      expect(await contextText(join(projA, 'sub'))).toContain('Alpha instructions.')
      // Project B has no entry; a session there contributes nothing.
      expect(await contextText(projB)).toBe('')
      // An agentless assembly contributes nothing.
      expect((await ctx.systemPrompt.assemble()).contexts.find(c => c.name === PROJECT_CONTEXT)?.text ?? '').toBe('')

      await fiber.dispose()
      expect((await ctx.systemPrompt.assemble()).contexts.find(c => c.name === PROJECT_CONTEXT)).toBeUndefined()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
