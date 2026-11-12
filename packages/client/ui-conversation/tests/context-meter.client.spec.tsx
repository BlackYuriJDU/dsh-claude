// @vitest-environment jsdom
// ContextMeter (composer trailing control): occupancy ring gating, the
// click-open breakdown panel, and its close gestures.

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { en as commonEn } from '@deepseek-ai/dsh-client-locale/src/locales/index.ts'
import { ContextMeter, type ContextMeterProps } from '../src/client/skeleton/ContextMeter.tsx'
import css from '../src/client/skeleton/ContextMeter.module.css'
import { en } from '../src/client/locales.ts'

afterEach(cleanup)

// Mirrors the real lookup chain (conversation namespace, then common).
const t = makeTranslate(en, commonEn) as ContextMeterProps['t']
const tEn = makeTranslate(en, commonEn) as ContextMeterProps['t']

const BREAKDOWN = { systemTokens: 120, toolsTokens: 21_500, messageTokens: 477_000 }

const segmentClass = css.segment
if (segmentClass === undefined) throw new Error('segment class missing from ContextMeter.module.css')

/** A conversation snapshot selector over an empty settled history. */
const noHistory = ((select: (snapshot: { chat: { legacy: { nodes: readonly unknown[] } } }) => unknown) =>
  select({ chat: { legacy: { nodes: [] } } })) as unknown as ContextMeterProps['useSession']

/** Stub the projection seat: a key-addressed table of whole values. */
function projections(values: Record<string, unknown>): ContextMeterProps['useProjection'] {
  return (key: string) => values[key]
}

function meter(values: Record<string, unknown>, translate: ContextMeterProps['t'] = t) {
  return render(<ContextMeter useSession={noHistory} useProjection={projections(values)} t={translate} />)
}

describe('ContextMeter', () => {
  it('renders nothing until both pressure and capacity are known', () => {
    expect(meter({}).container.textContent).toBe('')
    expect(meter({ contextPressure: { pressureTokens: 32_000 } }).container.textContent).toBe('')
    expect(meter({ contextPressure: { contextWindow: 128_000 } }).container.textContent).toBe('')
  })

  it('shows the occupancy ring and opens the breakdown panel on click', () => {
    const view = meter({
      contextPressure: { pressureTokens: 32_000, contextWindow: 128_000 },
      contextBreakdown: BREAKDOWN,
    })
    const trigger = view.getByRole('button', { name: '25% of context used' })
    expect(view.container.querySelector('[role="dialog"]')).toBeNull()
    fireEvent.click(trigger)
    const panel = view.container.querySelector('[role="dialog"]')!
    expect(panel.textContent).toContain('~32K / 128K')
    expect(panel.textContent).toContain('25%')
    expect(panel.textContent).toContain('of context used')
    expect(panel.textContent).toContain('System prompt~120')
    expect(panel.textContent).toContain('Tools~21.5K')
    expect(panel.textContent).toContain('Messages~477K')
    // The occupancy bar splits into one colored segment per composition row.
    expect(panel.getElementsByClassName(segmentClass)).toHaveLength(3)
    // Clicking the trigger again toggles the panel shut.
    fireEvent.click(trigger)
    expect(view.container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('reads the headline as one sentence around the percentage', () => {
    const values = {
      contextPressure: { pressureTokens: 32_000, contextWindow: 128_000 },
      contextBreakdown: BREAKDOWN,
    }
    const view = meter(values, tEn)
    fireEvent.click(view.getByRole('button', { name: '25% of context used' }))
    // The reading leads the label; the header reads as one sentence rather
    // than a concatenated fragment.
    expect(view.container.querySelector('[role="dialog"]')!.textContent)
      .toMatch(/^25%of context used/)
  })

  it('draws no bar segment at zero occupancy', () => {
    const view = meter({
      contextPressure: { pressureTokens: 0, contextWindow: 128_000 },
      contextBreakdown: BREAKDOWN,
    })
    fireEvent.click(view.getByRole('button', { name: '0% of context used' }))
    const panel = view.container.querySelector('[role="dialog"]')!
    // `.segment` carries a min-width, so a zero-width part would still paint a
    // filled sliver over an empty context.
    expect(panel.getElementsByClassName(segmentClass)).toHaveLength(0)
    expect(panel.textContent).toContain('~0 / 128K')
  })

  it('reads the ring from the projected figure so a compaction shows at once', () => {
    // Same provider sample, a surface a compaction just shrank: the ring must
    // follow the projection rather than the sample it is anchored to.
    const view = meter({
      contextPressure: { pressureTokens: 32_000, projectedTokens: 3_000, contextWindow: 128_000 },
      contextBreakdown: BREAKDOWN,
    })
    const trigger = view.getByRole('button', { name: '2% of context used' })
    fireEvent.click(trigger)
    expect(view.container.querySelector('[role="dialog"]')!.textContent).toContain('~3K / 128K')
  })

  it('omits the composition rows while the contextBreakdown projection is absent', () => {
    const view = meter({ contextPressure: { pressureTokens: 32_000, contextWindow: 128_000 } })
    fireEvent.click(view.getByRole('button', { name: '25% of context used' }))
    const panel = view.container.querySelector('[role="dialog"]')!
    expect(panel.textContent).toContain('~32K / 128K')
    expect(panel.textContent).not.toContain('System prompt')
    expect(panel.textContent).not.toContain('Messages')
    // Without composition shares, the bar falls back to one plain segment.
    expect(panel.getElementsByClassName(segmentClass)).toHaveLength(1)
  })

  it('closes when capacity disappears and stays closed when it returns', () => {
    let values: Record<string, unknown> = {
      contextPressure: { pressureTokens: 32_000, contextWindow: 128_000 },
      contextBreakdown: BREAKDOWN,
    }
    const view = render(<ContextMeter useSession={noHistory} useProjection={(key: string) => values[key]} t={t} />)
    fireEvent.click(view.getByRole('button', { name: '25% of context used' }))
    expect(view.container.querySelector('[role="dialog"]')).not.toBeNull()

    values = { contextPressure: { pressureTokens: 32_000 }, contextBreakdown: BREAKDOWN }
    view.rerender(<ContextMeter useSession={noHistory} useProjection={(key: string) => values[key]} t={t} />)
    expect(view.container.textContent).toBe('')

    values = {
      contextPressure: { pressureTokens: 32_000, contextWindow: 128_000 },
      contextBreakdown: BREAKDOWN,
    }
    view.rerender(<ContextMeter useSession={noHistory} useProjection={(key: string) => values[key]} t={t} />)
    expect(view.getByRole('button', { name: '25% of context used' }).getAttribute('aria-expanded')).toBe('false')
    expect(view.container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('closes on outside pointerdown and Escape — but not inside clicks', () => {
    const view = meter({
      contextPressure: { pressureTokens: 32_000, contextWindow: 128_000 },
      contextBreakdown: BREAKDOWN,
    })
    const trigger = view.getByRole('button', { name: '25% of context used' })
    const openPanel = () => {
      fireEvent.click(trigger)
      return view.container.querySelector('[role="dialog"]')!
    }
    // A pointerdown inside the panel keeps it open; outside closes it.
    const again = openPanel()
    fireEvent.pointerDown(again)
    expect(view.container.querySelector('[role="dialog"]')).not.toBeNull()
    fireEvent.pointerDown(document.body)
    expect(view.container.querySelector('[role="dialog"]')).toBeNull()
    // Escape.
    openPanel()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(view.container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('adds the session figures under the context window, with cache and token bars', () => {
    const view = meter({
      contextPressure: { pressureTokens: 32_000, contextWindow: 128_000 },
      sessionStats: { turns: 3, steps: 7, llmMs: 9_000, toolMs: 1_000, ttftMs: 2_400, ttftSteps: 2, decodeMs: 4_000, decodeTokens: 200 },
      tokenUsage: { uncachedInputTokens: 1_000, cacheReadTokens: 3_000, cacheWriteTokens: 0, outputTokens: 1_000 },
    })
    fireEvent.click(view.getByRole('button', { name: '25% of context used' }))
    const session = view.getByRole('region', { name: 'Session' })
    expect(session.textContent).toContain('3 turns · 7 steps')
    expect(session.textContent).toContain('Cache hit 75%')
    expect(session.textContent).toContain('Input 4K tok · Output 1K tok')
    expect(session.textContent).toContain('TTFT avg')
    expect(session.textContent).toContain('50 tok/s')
    const fills = [...session.querySelectorAll<HTMLElement>(`.${css.miniFill}`)]
    expect(fills.map(fill => fill.style.width)).toEqual(['75%', '80%', ''])
  })

  it('shows a session-only ring while no route capacity is known', () => {
    const view = meter({ tokenUsage: { uncachedInputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 12 } })
    fireEvent.click(view.getByRole('button', { name: 'Session' }))
    const panel = view.getByRole('dialog', { name: 'Session' })
    expect(panel.textContent).toContain('Input 0 tok · Output 12 tok')
    expect(panel.textContent).not.toContain('of context used')
    expect(panel.textContent).not.toContain('Cache hit')
  })

  it('folds settled history when the session-stats projection is absent', () => {
    const missingNodes = ((select: (snapshot: { chat: { legacy: { nodes?: readonly unknown[] } } }) => unknown) =>
      select({ chat: { legacy: {} } })) as unknown as ContextMeterProps['useSession']
    const view = render(<ContextMeter useSession={missingNodes} useProjection={projections({})} t={t} />)
    expect(view.container.textContent).toBe('')
  })
})
