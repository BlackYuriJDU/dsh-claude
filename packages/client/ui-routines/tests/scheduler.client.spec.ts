// RoutineScheduler behavior: interval math, next-fire delay, arming from the
// durable section, firing through the Agent registry, and per-routine
// serialization. Uses fakes for agents/defaultModel/settings (the scheduler
// reads them through narrow faces, so no real Agent or settings service is
// needed). Timers are faked so fires are driven manually.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import {
  nextFireDelayMs, ROUTINES_SETTINGS_NAMESPACE, RoutineScheduler, routineIntervalMs,
  type Routine, type RoutinesSettings,
} from '../src/index.ts'

function routine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'r1', name: 'Daily review', prompt: 'review the repo', every: 1, unit: 'days',
    enabled: true, ...overrides,
  }
}

function makeBench(initial: RoutinesSettings = {}) {
  const state: { section: RoutinesSettings } = { section: initial }
  const created: { options: unknown; followup: unknown }[] = []
  const settings = {
    get: (ns: string) => (ns === ROUTINES_SETTINGS_NAMESPACE ? state.section : undefined),
    update: vi.fn(async (ns: string, section: object) => {
      if (ns === ROUTINES_SETTINGS_NAMESPACE) state.section = section as RoutinesSettings
      return {}
    }),
  }
  const defaultModel = { currentSelection: () => ({ provider: 'p', model: 'm' }) }
  const agents = {
    create: vi.fn(async (options: unknown) => {
      const record: { options: unknown; followup: unknown } = { options, followup: undefined }
      created.push(record)
      return {
        agent: {
          followup: (message: unknown) => { record.followup = message },
          whenIdle: () => Promise.resolve(),
        },
        dispose: () => Promise.resolve(),
      }
    }),
  }
  let now = 1_000_000
  const ctx = new Context()
  const scheduler = new RoutineScheduler(ctx, agents, defaultModel, settings, () => now)
  return { state, created, settings, agents, scheduler, setNow: (value: number) => { now = value }, getNow: () => now }
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('routineIntervalMs', () => {
  it('maps each unit to its millisecond length', () => {
    expect(routineIntervalMs({ every: 5, unit: 'minutes' })).toBe(300_000)
    expect(routineIntervalMs({ every: 2, unit: 'hours' })).toBe(7_200_000)
    expect(routineIntervalMs({ every: 1, unit: 'days' })).toBe(86_400_000)
  })
})

describe('nextFireDelayMs', () => {
  it('schedules a routine that never ran one interval out (no immediate fire on create)', () => {
    expect(nextFireDelayMs(routine({ lastRunAt: undefined }), 1_000_000)).toBe(86_400_000)
  })

  it('computes the remaining delay from the last run', () => {
    const lastRunAt = 1_000_000
    expect(nextFireDelayMs(routine({ lastRunAt }), lastRunAt + 1_000)).toBe(86_400_000 - 1_000)
  })

  it('clamps an overdue routine to zero (one catch-up fire, not catch-up per miss)', () => {
    const lastRunAt = 1_000_000
    expect(nextFireDelayMs(routine({ lastRunAt }), lastRunAt + 86_400_000 + 5_000)).toBe(0)
  })
})

describe('RoutineScheduler', () => {
  it('arms only enabled routines and fires them through the Agent registry', async () => {
    const b = makeBench({ routines: [routine({ lastRunAt: undefined }), routine({ id: 'r2', enabled: false })] })
    b.scheduler.reconcile()
    // r1 (daily, never ran) fires after one interval; r2 is disabled.
    await vi.advanceTimersByTimeAsync(86_400_000)
    expect(b.agents.create).toHaveBeenCalledTimes(1)
    const options = b.agents.create.mock.calls[0]![0] as { sessionId: string; agentOptions: { provider: string; model: string } }
    expect(options.sessionId).toContain('routine-r1-')
    expect(options.agentOptions).toEqual({ provider: 'p', model: 'm' })
    expect(b.created[0]!.followup).toBeTruthy()
  })

  it('stamps lastRunAt after a successful fire', async () => {
    const b = makeBench({ routines: [routine({ lastRunAt: undefined })] })
    b.scheduler.reconcile()
    await vi.advanceTimersByTimeAsync(86_400_000)
    expect(b.settings.update).toHaveBeenCalled()
    const written = b.state.section.routines?.find(candidate => candidate.id === 'r1')
    expect(written?.lastRunAt).toBeTypeOf('number')
  })

  it('re-arms after firing (recurring, not one-shot)', async () => {
    const b = makeBench({ routines: [routine({ every: 1, unit: 'minutes', lastRunAt: undefined })] })
    b.scheduler.reconcile()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(b.agents.create).toHaveBeenCalledTimes(1)
    // After the fire, the routine is re-armed one interval out.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(b.agents.create).toHaveBeenCalledTimes(2)
  })

  it('drops a routine disarmed by a settings update', async () => {
    const b = makeBench({ routines: [routine({ every: 1, unit: 'hours', lastRunAt: 0 })] })
    b.scheduler.reconcile()
    b.state.section = { routines: [routine({ every: 1, unit: 'hours', lastRunAt: 0, enabled: false })] }
    b.scheduler.reconcile()
    await vi.advanceTimersByTimeAsync(3_600_000)
    expect(b.agents.create).not.toHaveBeenCalled()
  })

  it('does not overlap a routine with itself while a fire is in flight', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => { release = resolve })
    const b = makeBench({ routines: [routine({ every: 1, unit: 'minutes', lastRunAt: undefined })] })
    b.agents.create.mockImplementationOnce(async () => {
      await gate
      return {
        agent: { followup: () => {}, whenIdle: () => Promise.resolve() },
        dispose: () => Promise.resolve(),
      }
    })
    b.scheduler.reconcile()
    // Start one fire (it blocks inside agents.create on the gate), then a
    // second concurrent fire for the same routine must be a no-op.
    const first = b.scheduler.fire('r1')
    await b.scheduler.fire('r1')
    release()
    await first
    expect(b.agents.create).toHaveBeenCalledTimes(1)
  })

  it('stops firing after dispose', async () => {
    const b = makeBench({ routines: [routine({ every: 1, unit: 'minutes', lastRunAt: 0 })] })
    b.scheduler.reconcile()
    b.scheduler.dispose()
    await vi.advanceTimersByTimeAsync(120_000)
    expect(b.agents.create).not.toHaveBeenCalled()
  })
})
