import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { KnowledgeReader } from '../src/knowledge.ts'

let dir: string
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'ui-projects-knowledge-')) })
afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

const file = (path: string) => ({ id: path, path })

describe('KnowledgeReader', () => {
  it('reads a relative path from the workspace folder and an absolute path as given', () => {
    writeFileSync(join(dir, 'brief.md'), 'hello')
    const reader = new KnowledgeReader()
    expect(reader.read(file('brief.md'), dir, 100)).toEqual({ kind: 'text', text: 'hello', truncated: false })
    expect(reader.read(file(join(dir, 'brief.md')), '/elsewhere', 100)).toEqual({ kind: 'text', text: 'hello', truncated: false })
  })

  it('keeps maxChars characters and marks the rest truncated', () => {
    writeFileSync(join(dir, 'long.md'), 'abcdef')
    expect(new KnowledgeReader().read(file('long.md'), dir, 4)).toEqual({ kind: 'text', text: 'abcd', truncated: true })
  })

  it('counts UTF-16 code units, reads at most three bytes per unit, and never splits a surrogate pair', () => {
    writeFileSync(join(dir, 'emoji.md'), '😀😀')
    expect(new KnowledgeReader().read(file('emoji.md'), dir, 4)).toEqual({ kind: 'text', text: '😀😀', truncated: false })
    // 3 × 3 = 9 of 12 bytes: two emoji (four units) decode, the third is cut; three units end mid-pair.
    writeFileSync(join(dir, 'emoji3.md'), '😀😀😀')
    expect(new KnowledgeReader().read(file('emoji3.md'), dir, 3)).toEqual({ kind: 'text', text: '😀', truncated: true })
    writeFileSync(join(dir, 'ascii.md'), 'a'.repeat(50))
    expect(new KnowledgeReader().read(file('ascii.md'), dir, 3)).toEqual({ kind: 'text', text: 'aaa', truncated: true })
  })

  it('drops a multibyte character cut by the byte limit', () => {
    // 'a' is 1 byte and '€' 3 bytes: 3 × 2 = 6 bytes hold 'a€' plus 2 bytes of the next '€'.
    writeFileSync(join(dir, 'tail.md'), 'a€€')
    expect(new KnowledgeReader().read(file('tail.md'), dir, 2)).toEqual({ kind: 'text', text: 'a€', truncated: true })
  })

  it('reads an empty file as empty text', () => {
    writeFileSync(join(dir, 'empty.md'), '')
    expect(new KnowledgeReader().read(file('empty.md'), dir, 10)).toEqual({ kind: 'text', text: '', truncated: false })
  })

  it('reports missing files and directories', () => {
    const reader = new KnowledgeReader()
    expect(reader.read(file('missing.md'), dir, 10)).toEqual({ kind: 'error', reason: 'ENOENT' })
    expect(reader.read(file('.'), dir, 10)).toEqual({ kind: 'error', reason: 'not a regular file' })
  })

  it('reuses the read while size and mtime hold, and rereads when either changes', () => {
    const path = join(dir, 'cached.md')
    writeFileSync(path, 'one')
    utimesSync(path, 1_000, 1_000)
    const reader = new KnowledgeReader()
    const first = reader.read(file('cached.md'), dir, 10)
    expect(reader.read(file('cached.md'), dir, 10)).toBe(first)
    expect(reader.read(file('cached.md'), dir, 2)).toEqual({ kind: 'text', text: 'on', truncated: true })
    writeFileSync(path, 'two')
    utimesSync(path, 2_000, 2_000)
    expect(reader.read(file('cached.md'), dir, 10)).toEqual({ kind: 'text', text: 'two', truncated: false })
  })

  it('forgets a cached file once it disappears', () => {
    const path = join(dir, 'gone.md')
    writeFileSync(path, 'here')
    const reader = new KnowledgeReader()
    expect(reader.read(file('gone.md'), dir, 10)).toMatchObject({ kind: 'text' })
    rmSync(path)
    expect(reader.read(file('gone.md'), dir, 10)).toEqual({ kind: 'error', reason: 'ENOENT' })
  })
})
