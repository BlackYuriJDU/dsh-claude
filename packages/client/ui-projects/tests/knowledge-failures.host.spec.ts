import { describe, expect, it, vi } from 'vitest'

const failure: { open?: unknown; stat?: unknown } = vi.hoisted(() => ({}))

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    statSync: (...args: Parameters<typeof actual.statSync>) => {
      if (failure.stat !== undefined) throw failure.stat
      return actual.statSync(...args)
    },
    openSync: (...args: Parameters<typeof actual.openSync>) => {
      if (failure.open !== undefined) throw failure.open
      return actual.openSync(...args)
    },
  }
})

const { KnowledgeReader } = await import('../src/knowledge.ts')

describe('KnowledgeReader failure reasons', () => {
  const read = () => new KnowledgeReader().read({ id: 'a', path: import.meta.filename }, '/', 10)

  it('reports an open failure by its code', () => {
    failure.open = Object.assign(new Error('denied'), { code: 'EACCES' })
    expect(read()).toEqual({ kind: 'error', reason: 'EACCES' })
    failure.open = undefined
  })

  it('reports an error without a code by its message, and other thrown values as strings', () => {
    failure.stat = new Error('stat broke')
    expect(read()).toEqual({ kind: 'error', reason: 'stat broke' })
    failure.stat = 'plain'
    expect(read()).toEqual({ kind: 'error', reason: 'plain' })
    failure.stat = undefined
  })
})
