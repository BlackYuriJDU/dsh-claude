/** The Host half: the log-sharing policy Config and the hidden generated settings page. */
import { describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { apply, Config } from '../src/index.ts'

describe('Host half', () => {
  it('declares the sharing policy and hides its generated settings page until unload', async () => {
    expect(Config({}).sharesConversationLog.get()).toBe(true)
    expect(Config({ sharesConversationLog: false }).sharesConversationLog.get()).toBe(false)
    const ctx = new Context()
    const dispose = vi.fn()
    const configure = vi.fn((_options: { auto: boolean }, _owner: object) => dispose)
    ctx.provide('settings', { configure } as never)
    const fiber = ctx.plugin({ apply })
    await fiber.await()
    await vi.waitFor(() => { expect(configure).toHaveBeenCalledOnce() })
    expect(configure.mock.calls[0]?.[0]).toEqual({ auto: false })
    await fiber.dispose()
    expect(dispose).toHaveBeenCalledOnce()
  })
})
