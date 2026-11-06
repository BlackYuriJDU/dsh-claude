// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { stubConfigForm } from '@deepseek-ai/dsh-client-test-runtime'
import { initialsOf, ProfileBadge } from '../src/client/ProfileBadge.tsx'
import type { MemoryFormValue } from '../src/memory.ts'

afterEach(() => { cleanup() })

function mount(wide: boolean, profileName?: string) {
  const form = stubConfigForm<MemoryFormValue>()
  if (profileName !== undefined) form.publish({ status: 'ready', value: { memories: [], profileName } })
  return render(<ProfileBadge wide={wide} memory={form.scope} />)
}

describe('ProfileBadge', () => {
  it.each([
    ['Ana', 'A'], ['ana paula souza', 'AS'], ['  Émile   Zola ', 'ÉZ'], ['😀 smile', '😀S'], ['   ', ''],
  ])('takes the initials of %j', (name, initials) => {
    expect(initialsOf(name)).toBe(initials)
  })

  it('shows the initials and, when wide, the trimmed name', () => {
    const view = mount(true, ' Ana Paula ')
    expect(view.container.textContent).toBe('APAna Paula')
    cleanup()
    expect(mount(false, 'Ana Paula').container.textContent).toBe('AP')
  })

  it('renders nothing while the name is blank or unread', () => {
    expect(mount(true, '  ').container.textContent).toBe('')
    cleanup()
    expect(mount(true).container.textContent).toBe('')
  })
})
