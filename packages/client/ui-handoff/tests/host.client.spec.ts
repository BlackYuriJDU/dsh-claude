// The node half is a named no-op: the Hand off surface lives in the browser.
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { apply, name } from '../src/index.ts'

describe('ui-handoff node half', () => {
  it('loads under its plugin name and registers nothing', async () => {
    const ctx = new Context()
    const fiber = ctx.plugin({ name, apply })
    await fiber.await()
    expect(name).toBe('ui-handoff')
    await fiber.dispose()
  })
})
