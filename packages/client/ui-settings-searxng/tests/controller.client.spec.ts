import { describe, expect, it, vi } from 'vitest'
import type { SettingsPathOpView } from '@deepseek-ai/dsh-api-remotes/client'
import { stubConfigForm, type StubConfigForm } from '@deepseek-ai/dsh-client-test-runtime'
import { SearxngCardController, type SearxngSettings } from '../src/client/searxng-card-controller.ts'

/** Make the stub behave like a Host that accepts every write. */
function acceptWrites<T>(host: StubConfigForm<T>): void {
  const section = (): Record<string, unknown> => ({ ...host.scope.getSnapshot().value as object })
  const layer = (): Record<string, unknown> => ({ ...host.scope.getSnapshot().user as object })
  host.set.mockImplementation((field: string, value: unknown) => {
    host.publish({ value: { ...section(), [field]: value } as T, user: { ...layer(), [field]: value } })
  })
  host.mutate.mockImplementation((ops: readonly SettingsPathOpView[]) => {
    const value = { ...section() }
    const user = { ...layer() }
    for (const op of ops) {
      const field = op.path[0]!
      if (op.op === 'set') {
        value[field] = op.value
        user[field] = op.value
      } else {
        Reflect.deleteProperty(user, field)
        value[field] = (host.scope.getSnapshot().base as Record<string, unknown> | undefined)?.[field]
      }
    }
    host.publish({ value: value as T, user })
    return Promise.resolve(true)
  })
  host.unset.mockImplementation((field: string) => {
    const user = Object.fromEntries(Object.entries(layer()).filter(([key]) => key !== field))
    const base = host.scope.getSnapshot().base as Record<string, unknown> | undefined
    host.publish({ value: { ...section(), [field]: base?.[field] } as T, user })
  })
}

describe('SearxngCardController', () => {
  it('projects all four fields and saves edits in one write pass', async () => {
    const host = stubConfigForm<SearxngSettings>()
    acceptWrites(host)
    const controller = new SearxngCardController(host.scope)
    host.publish({
      status: 'ready',
      writable: true,
      value: { baseURL: 'http://127.0.0.1:8888', language: 'pt-BR', safeSearch: 1 },
      base: {},
      user: { baseURL: 'http://127.0.0.1:8888' },
    })
    const face = controller.inject()

    expect(face.hooks.searxngCard.getSnapshot()).toMatchObject({
      available: true,
      dirty: false,
      baseURL: { text: 'http://127.0.0.1:8888', overridden: true },
      language: { text: 'pt-BR', overridden: false },
      categories: { text: '' },
      safeSearch: { text: '1' },
    })

    face.edit('baseURL', 'https://searx.example')
    face.edit('safeSearch', '2')
    face.save()
    await vi.waitFor(() => { expect(host.mutate).toHaveBeenCalledTimes(1) })

    expect(host.mutate.mock.calls[0]![0]).toEqual([
      { op: 'set', path: ['baseURL'], value: 'https://searx.example' },
      { op: 'set', path: ['safeSearch'], value: 2 },
    ])
    expect(face.hooks.searxngCard.getSnapshot().dirty).toBe(false)
    controller.dispose()
  })

  it('stages a reset of the instance URL and applies it on save', async () => {
    const host = stubConfigForm<SearxngSettings>()
    acceptWrites(host)
    const controller = new SearxngCardController(host.scope)
    host.publish({ status: 'ready', writable: true, value: { baseURL: 'http://a' }, base: {}, user: { baseURL: 'http://a' } })
    const face = controller.inject()

    face.resetField('baseURL')
    face.save()
    await vi.waitFor(() => { expect(host.mutate).toHaveBeenCalledWith([{ op: 'unset', path: ['baseURL'] }], undefined) })
    expect(face.hooks.searxngCard.getSnapshot().baseURL.overridden).toBe(false)
  })
})
