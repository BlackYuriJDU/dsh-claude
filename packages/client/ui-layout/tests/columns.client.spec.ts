import { describe, expect, it } from 'vitest'
import { clampWidth, computeColumns, SIDEBAR_COLLAPSED, SIDEBAR_DEFAULT, SIDEBAR_MIN } from '@deepseek-ai/dsh-client-ui-layout/src/client/columns.ts'

// Numeric preference form (0 = closed); helpers keep the scenario names readable.
const open = (width: number) => width
const closed = (_width: number) => 0

describe('clampWidth', () => {
  it('clamps into the range and rounds', () => {
    expect(clampWidth(250.4, 240, 420)).toBe(250)
    expect(clampWidth(100, 240, 420)).toBe(240)
    expect(clampWidth(9999, 240, 420)).toBe(420)
  })
})

describe('computeColumns', () => {
  it('open sidebar holds its preference; center takes the rest', () => {
    expect(computeColumns(1280, open(SIDEBAR_DEFAULT)))
      .toEqual({ sidebar: SIDEBAR_DEFAULT, center: 1280 - SIDEBAR_DEFAULT })
  })

  it('closed sidebar keeps its compact rail while center takes the rest', () => {
    expect(computeColumns(1920, closed(300)))
      .toEqual({ sidebar: SIDEBAR_COLLAPSED, center: 1920 - SIDEBAR_COLLAPSED })
  })

  it('preferences beyond the clamp range are clamped before solving', () => {
    expect(computeColumns(1920, open(9999)).sidebar).toBe(420)
    expect(computeColumns(1920, open(1)).sidebar).toBe(SIDEBAR_MIN)
  })

  it('the sidebar never concedes: center absorbs the deficit below CENTER_MIN', () => {
    expect(computeColumns(700, open(SIDEBAR_DEFAULT)))
      .toEqual({ sidebar: SIDEBAR_DEFAULT, center: 700 - SIDEBAR_DEFAULT })
  })

  it('tiny viewport: sidebar holds, center takes the remainder (never negative)', () => {
    expect(computeColumns(200, open(SIDEBAR_DEFAULT)))
      .toEqual({ sidebar: SIDEBAR_DEFAULT, center: 0 })
  })

  it('recovery is pure: re-widening restores the preferred width untouched', () => {
    expect(computeColumns(700, open(SIDEBAR_DEFAULT)).center).toBe(700 - SIDEBAR_DEFAULT)
    expect(computeColumns(1920, open(SIDEBAR_DEFAULT)))
      .toEqual({ sidebar: SIDEBAR_DEFAULT, center: 1920 - SIDEBAR_DEFAULT })
  })
})

describe('computeColumns — degenerate viewports', () => {
  it('sidebar closed and viewport below the rail: center clamps at zero', () => {
    expect(computeColumns(40, closed(300)))
      .toEqual({ sidebar: SIDEBAR_COLLAPSED, center: 0 })
  })
})
