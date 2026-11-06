/** Design-comment reports are untrusted page input: only complete, bounded reports pass. */
import { describe, expect, it } from 'vitest'
import { COMMENT_MESSAGE, COMMENT_TEXT_LIMIT, formatHtmlComment, parseHtmlComment } from '../src/client/html/comments.ts'

const valid = { type: COMMENT_MESSAGE, tag: 'section', id: '', classes: ['card', 'wide'], text: '  Two   plans  ' }

describe('parseHtmlComment', () => {
  it('accepts a complete report and normalizes its excerpt', () => {
    expect(parseHtmlComment(valid)).toEqual({ tag: 'section', id: '', classes: ['card', 'wide'], text: 'Two plans' })
  })

  it.each([
    ['null', null],
    ['a string', 'dsh-comment'],
    ['another type', { ...valid, type: 'other' }],
    ['a tag with markup', { ...valid, tag: '<b>' }],
    ['a tag that is not a string', { ...valid, tag: 1 }],
    ['an id with spaces', { ...valid, id: 'a b' }],
    ['an id that is not a string', { ...valid, id: 7 }],
    ['classes that are not a list', { ...valid, classes: 'card' }],
    ['more than three classes', { ...valid, classes: ['a', 'b', 'c', 'd'] }],
    ['a class with a quote', { ...valid, classes: ['a"b'] }],
    ['a class that is not a string', { ...valid, classes: [3] }],
    ['text that is not a string', { ...valid, text: 5 }],
    ['text over the limit', { ...valid, text: 'x'.repeat(COMMENT_TEXT_LIMIT + 1) }],
  ])('rejects %s', (_case, data) => {
    expect(parseHtmlComment(data)).toBeUndefined()
  })

  it('accepts text exactly at the limit', () => {
    expect(parseHtmlComment({ ...valid, text: 'x'.repeat(COMMENT_TEXT_LIMIT) })?.text).toHaveLength(COMMENT_TEXT_LIMIT)
  })
})

describe('formatHtmlComment', () => {
  it('names the file, a selector, and the excerpt', () => {
    expect(formatHtmlComment({ tag: 'h2', id: 'title', classes: ['hero', 'big'], text: 'Pricing' }, 'designs/page.html'))
      .toBe('designs/page.html <h2#title.hero.big> "Pricing"')
  })

  it('leaves out an empty id and excerpt', () => {
    expect(formatHtmlComment({ tag: 'img', id: '', classes: [], text: '' }, 'designs/page.html')).toBe('designs/page.html <img>')
  })
})
