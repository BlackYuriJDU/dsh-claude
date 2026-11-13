/** The Host half: the seat policy Config and the hidden generated settings page. */
import { describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { apply, Config } from '../src/index.ts'

describe('Host half', () => {
  it('declares the seat presentation and hides its generated settings page until unload', async () => {
    expect(Config({}).seatPresentation.get()).toBe('menu')
    expect(Config({ seatPresentation: 'segmented' }).seatPresentation.get()).toBe('segmented')
    expect(() => Config({ seatPresentation: 'tabs' as never })).toThrow()
    expect(Config({}).seatHiddenPresets.get()).toEqual([])
    expect(Config({ seatHiddenPresets: ['cordis'] }).seatHiddenPresets.get()).toEqual(['cordis'])
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
