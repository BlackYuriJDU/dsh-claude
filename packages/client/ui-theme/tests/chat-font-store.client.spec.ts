/** Chat-font row store: snapshot-mirror action and the revision guard. */
import { describe, expect, it } from 'vitest'
import { createChatFontRowStore } from '../src/client/chat-font-store.ts'

describe('createChatFontRowStore', () => {
  it('opens on the default font with revision at -1', () => {
    const store = createChatFontRowStore().create()
    expect(store.getSnapshot()).toEqual({ chatFont: 'inter', revision: -1 })
  })

  it('mirrors a newer revision and drops stale or duplicate ones', () => {
    const store = createChatFontRowStore().create()
    store.actions.sync('mono', 2)
    store.actions.sync('serif', 1)
    store.actions.sync('system', 2)
    expect(store.getSnapshot()).toEqual({ chatFont: 'mono', revision: 2 })
  })
})
