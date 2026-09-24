/**
 * Routines plugin, node half: the recurring-task scheduler. A routine is a
 * durable settings entry (`ui-routines`) naming a prompt, an interval, and an
 * optional workspace; the scheduler arms one timer per enabled routine and,
 * on each fire, creates a fresh Agent through `ctx.agents` (the same path the
 * headless one-shot runner uses), submits the prompt as an ordinary user
 * message, waits for quiescence, and disposes the agent. Routines persist in
 * the settings document, so they survive a Host restart: the scheduler
 * re-derives its timers from the section on boot and on every
 * `settings/updated` for the namespace.
 *
 * The interval model is deliberately simple (every N minutes/hours/days), not
 * cron: a routine fires `intervalMs` after the last fire settled (never
 * overlapping itself), and a routine whose interval elapsed while the Host
 * was down fires once on boot rather than catching up missed runs.
 *
 * @module @deepseek-ai/dsh-client-ui-routines
 */

import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
// Type-only: the Context merges this plugin reads through ctx.get (no value
// import crosses the package boundary).
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-agent-default-model'
import type {} from '@deepseek-ai/dsh-session'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session'

/** Durable settings namespace for the user's scheduled routines. */
export const ROUTINES_SETTINGS_NAMESPACE = 'ui-routines'

/** Interval unit a routine repeats on. */
export type RoutineIntervalUnit = 'minutes' | 'hours' | 'days'

/** One scheduled routine. */
export interface Routine {
  /** Stable identity (uuid). */
  id: string
  /** Display name. */
  name: string
  /** The prompt submitted to the fresh Agent on each fire. */
  prompt: string
  /** Interval magnitude (>= 1). */
  every: number
  /** Interval unit. */
  unit: RoutineIntervalUnit
  /** Optional workspace directory the Agent runs in (defaults to the Host cwd). */
  cwd?: string
  /** Whether the routine fires (a paused routine keeps its entry). */
  enabled: boolean
  /** Epoch ms of the last completed fire; seeds the next fire after a restart. */
  lastRunAt?: number
}

/** The durable `ui-routines` section shape. */
export interface RoutinesSettings {
  routines?: Routine[]
}

const RoutineSchema: z<Routine> = z.object({
  id: z.string().required(),
  name: z.string().required(),
  prompt: z.string().required(),
  every: z.number().step(1).min(1),
  unit: z.union(['minutes', 'hours', 'days'] as const),
  cwd: z.string().required(false),
  enabled: z.boolean(),
  lastRunAt: z.number().required(false),
})

const RoutinesSettingsSchema: z<RoutinesSettings> = z.object({
  routines: z.array(RoutineSchema).required(false),
})

const UNIT_MS: Record<RoutineIntervalUnit, number> = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
}

/**
 * One routine's repeat interval in milliseconds.
 * @param routine - the routine.
 * @returns the interval in ms.
 */
export function routineIntervalMs(routine: Pick<Routine, 'every' | 'unit'>): number {
  return routine.every * UNIT_MS[routine.unit]
}

/**
 * The delay until a routine's next fire, clamped to a non-negative value. A
 * routine that never ran fires one interval from now (creating a routine does
 * not fire it immediately); a routine whose interval already elapsed while the
 * Host was down is due now (one catch-up fire, not one per missed run).
 * @param routine - the routine.
 * @param now - the current epoch ms.
 * @returns ms until the next fire.
 */
export function nextFireDelayMs(routine: Routine, now: number): number {
  const interval = routineIntervalMs(routine)
  // Never ran: schedule from now (first fire after one interval).
  if (routine.lastRunAt === undefined) return interval
  // Ran before: due when the interval since the last run has elapsed.
  return Math.max(0, routine.lastRunAt + interval - now)
}

/** The model selection a routine Agent runs with (the deployment default). */
interface ModelSelection {
  provider: string
  model: string
}

/** Narrow service faces the scheduler reads (kept loose for test fakes). */
interface AgentsFace {
  create(options: {
    sessionId: SessionId
    meta?: { cwd?: string }
    agentOptions?: { provider?: string; model?: string }
  }): Promise<{ agent: RoutineAgent; dispose(): Promise<void> }>
}

interface RoutineAgent {
  followup(message: unknown): void
  whenIdle(): Promise<void>
}

interface DefaultModelFace {
  currentSelection(): ModelSelection
}

interface SettingsFace {
  get(ns: string): unknown
  update(ns: string, section: object): Promise<unknown>
}

/**
 * The routines scheduler. Owns one timer per enabled routine, rebuilt from
 * the durable section on boot and on every namespace update. A fire is
 * serialized per routine (a slow run delays the next, never overlaps).
 */
export class RoutineScheduler {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>()
  private readonly running = new Set<string>()
  private disposed = false

  /**
   * @param ctx - plugin context (for logging and effect-scoped teardown).
   * @param agents - the Agent registry face.
   * @param defaultModel - the deployment default model face.
   * @param settings - the settings service face.
   * @param now - injectable clock for tests (defaults to Date.now).
   */
  constructor(
    private readonly ctx: Context,
    private readonly agents: AgentsFace,
    private readonly defaultModel: DefaultModelFace,
    private readonly settings: SettingsFace,
    private readonly now: () => number = () => Date.now(),
  ) {}

  /** Rebuild every timer from the current durable section. */
  reconcile(): void {
    if (this.disposed) return
    const section = this.settings.get(ROUTINES_SETTINGS_NAMESPACE) as RoutinesSettings | undefined
    const routines = section?.routines ?? []
    const live = new Set<string>()
    for (const routine of routines) {
      if (!routine.enabled) continue
      live.add(routine.id)
      if (!this.timers.has(routine.id)) this.arm(routine)
    }
    for (const [id, timer] of [...this.timers]) {
      if (!live.has(id)) {
        clearTimeout(timer)
        this.timers.delete(id)
      }
    }
  }

  /** Arm one routine's next fire. */
  private arm(routine: Routine): void {
    const delay = nextFireDelayMs(routine, this.now())
    const timer = setTimeout(() => {
      this.timers.delete(routine.id)
      void this.fire(routine.id)
    }, delay)
    // Never keep the Host process alive for a routine.
    if (typeof timer === 'object' && timer !== null && 'unref' in timer) {
      (timer as { unref(): void }).unref()
    }
    this.timers.set(routine.id, timer)
  }

  /**
   * Fire one routine: create a fresh Agent, submit the prompt, wait for
   * quiescence, dispose, record the run, and re-arm. Serialized per routine.
   * @param routineId - the routine to fire.
   */
  async fire(routineId: string): Promise<void> {
    if (this.disposed || this.running.has(routineId)) return
    const section = this.settings.get(ROUTINES_SETTINGS_NAMESPACE) as RoutinesSettings | undefined
    const routine = section?.routines?.find(candidate => candidate.id === routineId)
    if (routine === undefined || !routine.enabled) return
    this.running.add(routineId)
    try {
      const selection = this.defaultModel.currentSelection()
      const handle = await this.agents.create({
        sessionId: SessionId(`routine-${routineId}-${randomUUID()}`),
        meta: routine.cwd === undefined ? {} : { cwd: routine.cwd },
        agentOptions: { provider: selection.provider, model: selection.model },
      })
      try {
        handle.agent.followup(createUserMessage({
          content: [{ type: 'text', text: routine.prompt }],
          source: { kind: 'plugin', plugin: '@deepseek-ai/dsh-client-ui-routines' },
        }))
        await handle.agent.whenIdle()
      } finally {
        await handle.dispose()
      }
      await this.markRun(routineId, this.now())
    } catch (error: unknown) {
      this.ctx.logger.warn(`routine "${routineId}" fire failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      this.running.delete(routineId)
      if (!this.disposed) this.reconcile()
    }
  }

  /** Persist the last-run timestamp without disturbing the other routines. */
  private async markRun(routineId: string, at: number): Promise<void> {
    const section = this.settings.get(ROUTINES_SETTINGS_NAMESPACE) as RoutinesSettings | undefined
    const routines = (section?.routines ?? []).map(candidate =>
      candidate.id === routineId ? { ...candidate, lastRunAt: at } : candidate)
    try {
      await this.settings.update(ROUTINES_SETTINGS_NAMESPACE, { routines })
    } catch (error: unknown) {
      this.ctx.logger.warn(`routine "${routineId}" run stamp failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /** Stop every timer; in-flight fires settle on their own. */
  dispose(): void {
    this.disposed = true
    for (const timer of this.timers.values()) clearTimeout(timer)
    this.timers.clear()
  }
}

/** Services required by the routines plugin. */
export const inject = ['agents', 'agentDefaultModel', 'settings']

/**
 * Register the durable routines namespace and start the scheduler.
 * @param ctx - Host context.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(
      settingsNamespace(ROUTINES_SETTINGS_NAMESPACE),
      RoutinesSettingsSchema,
    )
  })
  ctx.inject(['agents', 'agentDefaultModel', 'settings'], (scope) => {
    const scheduler = new RoutineScheduler(
      ctx,
      scope.agents as unknown as AgentsFace,
      scope.agentDefaultModel as unknown as DefaultModelFace,
      scope.settings as unknown as SettingsFace,
    )
    scheduler.reconcile()
    const off = scope.on('settings/updated', (ns: unknown, _next: unknown, _prev: unknown, _source: unknown) => {
      if (String(ns) === ROUTINES_SETTINGS_NAMESPACE) scheduler.reconcile()
    })
    return () => {
      off()
      scheduler.dispose()
    }
  })
}
