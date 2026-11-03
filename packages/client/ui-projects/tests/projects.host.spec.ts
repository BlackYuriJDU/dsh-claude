import { describe, expect, it } from 'vitest'
import { normalizePath, projectContextText, workspaceFor, type KnowledgeRead, type ProjectKnowledgeFile } from '../src/projects.ts'

const HEADER = 'Project context for this workspace, set by the person in Settings. Follow the instructions unless the person says otherwise in this conversation.'
const limits = { maxFileChars: 100, maxTotalChars: 10_000 }
const text = (value: string, truncated = false): KnowledgeRead => ({ kind: 'text', text: value, truncated })

describe('workspaceFor', () => {
  const workspaces = [
    { id: 'root', path: '/work' },
    { id: 'app', path: '/work/app/' },
    { id: 'win', path: 'C:\\Users\\me\\repo' },
  ]

  it('normalizes separators and trailing slashes', () => {
    expect(normalizePath('C:\\a\\b\\')).toBe('C:/a/b')
    expect(normalizePath('/a/b///')).toBe('/a/b')
  })

  it('picks the most specific containing workspace', () => {
    expect(workspaceFor('/work/app/src', workspaces)?.id).toBe('app')
    expect(workspaceFor('/work/app', workspaces)?.id).toBe('app')
    expect(workspaceFor('/work/other', workspaces)?.id).toBe('root')
    expect(workspaceFor('C:\\Users\\me\\repo\\pkg', workspaces)?.id).toBe('win')
  })

  it('does not match a sibling that shares a name prefix', () => {
    expect(workspaceFor('/workshop', workspaces)).toBeUndefined()
  })

  it('keeps the longer match regardless of list order', () => {
    expect(workspaceFor('/work/app/x', [...workspaces].reverse())?.id).toBe('app')
  })
})

describe('projectContextText', () => {
  const never = (): KnowledgeRead => { throw new Error('no files expected') }

  it('contributes nothing without content', () => {
    expect(projectContextText(undefined, never, limits)).toBe('')
    expect(projectContextText({ instructions: '   ', files: [] }, never, limits)).toBe('')
  })

  it('renders instructions under the header', () => {
    expect(projectContextText({ instructions: '  Use British spelling. ' }, never, limits))
      .toBe(`${HEADER}\n\nInstructions:\nUse British spelling.`)
  })

  it('renders each file under its path, marking truncation and read failures', () => {
    const files: ProjectKnowledgeFile[] = [{ id: 'a', path: 'a.md' }, { id: 'b', path: 'b.md' }, { id: 'c', path: '/abs/c.md' }]
    const reads: Record<string, KnowledgeRead> = {
      'a.md': text('alpha'),
      'b.md': text('beta', true),
      '/abs/c.md': { kind: 'error', reason: 'ENOENT' },
    }
    expect(projectContextText({ files }, file => reads[file.path]!, limits)).toBe([
      HEADER,
      'Knowledge file a.md:\nalpha',
      'Knowledge file b.md:\nbeta\n[Truncated to 100 characters.]',
      'Knowledge file /abs/c.md:\n[Could not read this file: ENOENT]',
    ].join('\n\n'))
  })

  it('lists a file that does not fit as omitted, and drops it when even that does not fit', () => {
    const files: ProjectKnowledgeFile[] = [{ id: 'a', path: 'a.md' }]
    const base = `${HEADER}\n\nInstructions:\nI`
    const omitted = '\n\nKnowledge file a.md: [omitted to fit the project context limit]'
    const read = () => text('x'.repeat(500))
    expect(projectContextText({ instructions: 'I', files }, read, { maxFileChars: 500, maxTotalChars: base.length + omitted.length }))
      .toBe(base + omitted)
    expect(projectContextText({ instructions: 'I', files }, read, { maxFileChars: 500, maxTotalChars: base.length + omitted.length - 1 }))
      .toBe(base)
  })

  it('keeps a file block that fits exactly', () => {
    const files: ProjectKnowledgeFile[] = [{ id: 'a', path: 'a.md' }]
    const expected = `${HEADER}\n\nKnowledge file a.md:\nok`
    expect(projectContextText({ files }, () => text('ok'), { maxFileChars: 10, maxTotalChars: expected.length })).toBe(expected)
  })

  it('cuts oversized instructions to the total bound and reads no file', () => {
    const result = projectContextText({ instructions: 'y'.repeat(1000), files: [{ id: 'a', path: 'a.md' }] }, never, { maxFileChars: 10, maxTotalChars: 300 })
    expect(result).toHaveLength(300)
    expect(result.startsWith(HEADER)).toBe(true)
  })
})
