/**
 * The agent-preset chip on the new-session screen, beside the workspace
 * picker.
 *
 * It lives here rather than in the composer because the choice is only
 * available before a conversation starts: once a turn has run, the session's
 * history was produced under that preset's tools and the host refuses to swap
 * them. A control that spends most of its life disabled belongs on the screen
 * where it still works.
 *
 * The menu opens on the staged choice, which starts as the deployment default.
 * Picking stages; the choice reaches a session when one becomes current.
 */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { ObservableSnapshot, SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  IconAgentPresetOutlineRegular, IconChevronDownOutlineRegular, IconWarningOutlineRegular, Menu, Toast,
} from '@deepseek-ai/dsh-client-ui-primitives'
// Type-only: pulls the ui-conversation SlotMap merge (the hero seat).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { SeatPolicy } from '../index.ts'
import type { AgentPresetSeatState } from './seat-store.ts'
import { presetDisplayText } from './locales.ts'
import { requiresCodingTools } from './settings-store.ts'
import css from './AgentPresetSeat.module.css'

/** Registration-side business face for the hero chip. */
export interface AgentPresetSeatInjected {
  hooks: {
    /** Shared Developer tools preference; off hides the PTC and Minimal menu choices. */
    developerTools: ObservableSnapshot<boolean>
    /** Seat snapshot bound by the renderer as useAgentPresetSeat. */
    agentPresetSeat: SnapshotStore<AgentPresetSeatState>
    /** Host picker policy; an unread value keeps the menu with every preset. */
    seatPolicy: ObservableSnapshot<ConfigFormSnapshot<SeatPolicy>>
  }
  /** Read the roster when the chip first renders. */
  load: () => Promise<void>
  /** Stage one preset for the next session; resolves to a refusal, or undefined. */
  select: (id: string) => Promise<string | undefined>
  /** Acknowledge the refusal whose Toast finished. */
  dismissRefusal: (error: AgentPresetSeatState['error']) => void
  /** Clear the one-shot introduce cue once the chip has played it. */
  introduced: () => void
}

/* Introduce timeline: the icon eases in first (the CSS animation shares this
   duration); the name's characters start fading up the moment it lands, each
   taking the fade duration to settle. The cue clears after the last one. The
   stagger is capped twice: per tick for short CJK names, and by one shared
   reveal window so a long Latin name finishes in the same time as its CJK
   counterpart instead of dragging the run out per character. */
const INTRO_TEXT_DELAY_MS = 150
const INTRO_CHAR_STAGGER_MS = 40
const INTRO_TEXT_REVEAL_MS = 200
const INTRO_CHAR_FADE_MS = 400

/** Duration of a selection-refusal banner, including a revision becoming unavailable during a pick. */
const REFUSAL_HOLD_MS = 8000

/**
 * Per-character start offset for the introduce reveal.
 * @param count - character count of the shown preset name.
 * @returns milliseconds between successive character starts.
 */
function introStaggerMs(count: number): number {
  if (count <= 1) return 0
  return Math.min(INTRO_CHAR_STAGGER_MS, INTRO_TEXT_REVEAL_MS / (count - 1))
}

/** Full component props. */
export type AgentPresetSeatProps =
  PropsRuntime<'conversation.hero.agentPreset'>
  & PropsLocale<'settings.agentPreset'>
  & InjectFace<AgentPresetSeatInjected>

/**
 * Render the new-session agent-preset chip.
 * @param props - composed slot props.
 * @returns The chip and any pending selection refusal, or null outside the main view.
 */
const next = (from: number, last: number): number => (from >= last ? 0 : from + 1)
const previous = (from: number, last: number): number => (from <= 0 ? last : from - 1)

/** Segment index each radio-group key moves to, from the checked index (-1 for none) and the last index. */
const SEGMENT_KEYS: Readonly<Partial<Record<string, (from: number, last: number) => number>>> = {
  ArrowRight: next,
  ArrowDown: next,
  ArrowLeft: previous,
  ArrowUp: previous,
  Home: () => 0,
  End: (_from, last) => last,
}

export function AgentPresetSeat({
  sessionId, useSessionRetainInfo, load, select, dismissRefusal, introduced, useAgentPresetSeat, useDeveloperTools,
  useSeatPolicy, t,
}: AgentPresetSeatProps) {
  const developerTools = useDeveloperTools(value => value)
  const segmented = useSeatPolicy(snapshot => snapshot.value?.seatPresentation === 'segmented')
  const hidden = useSeatPolicy(snapshot => snapshot.value?.seatHiddenPresets)
  const state = useAgentPresetSeat(snapshot => snapshot)
  const main = useSessionRetainInfo(info => sessionId === undefined
    || (info?.retainedBy.mainView ?? 0) > 0)
  const [open, setOpen] = useState(false)
  // The seq keys the banner, so picking the same broken preset twice replays
  // it rather than leaving the first one silently in place.
  const toastSeq = useRef(0)
  const [toast, setToast] = useState<{ seq: number; error: Exclude<AgentPresetSeatState['error'], string | null> } | null>(null)

  useEffect(() => {
    if (state.error !== null && typeof state.error === 'object') {
      toastSeq.current += 1
      setToast({ seq: toastSeq.current, error: state.error })
    } else setToast(null)
  }, [state.error])

  useEffect(() => {
    void load()
  }, [load])

  const options = useMemo(
    () => state.options.filter(option => (developerTools || !requiresCodingTools(option))
      && (option.id === state.current || hidden?.includes(option.id) !== true)),
    [state.options, state.current, developerTools, hidden],
  )

  useEffect(() => {
    setOpen(false)
  }, [developerTools, options.length])

  const chosen = state.options.find(option => option.id === state.current)
  const chosenText = chosen === undefined ? undefined : presetDisplayText(chosen, t)
  const label = chosenText?.name ?? state.current
  const ready = state.options.length > 0 && state.current !== ''

  // The introduce cue: the pick was staged from another screen (the settings
  // creator entry), so the chip announces it — the icon eases in and each
  // character of the name fades up on a stagger (CSS owns the motion; this
  // effect only arms it and acknowledges the cue once the run is over).
  const [introducing, setIntroducing] = useState(false)
  useEffect(() => {
    if (!state.introduce || !ready) return
    const characters = Array.from(label)
    if (characters.length === 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      introduced()
      return
    }
    setIntroducing(true)
    const done = window.setTimeout(() => {
      setIntroducing(false)
      introduced()
    }, INTRO_TEXT_DELAY_MS + (characters.length - 1) * introStaggerMs(characters.length) + INTRO_CHAR_FADE_MS)
    return () => { window.clearTimeout(done) }
  }, [state.introduce, ready, label, introduced])

  // A refused initial composition still needs its Toast when there is no chip to show.
  if (!main) return null

  // One wrapper span: the chip is a flex row with a gap, so loose character
  // spans would each pick up the gap between them.
  const characters = Array.from(label)
  const stagger = introStaggerMs(characters.length)
  const shownLabel = introducing
    ? (
      <span className={css.introText}>
        {characters.map((character, index) => (
          <span
            key={index}
            className={css.introChar}
            style={{ animationDelay: `${INTRO_TEXT_DELAY_MS + index * stagger}ms` }}
          >
            {character}
          </span>
        ))}
      </span>
    )
    : label

  const refusal = toast !== null && (
    <Toast
      key={toast.seq}
      text={t('switchRefused', { name: presetDisplayText(toast.error.preset, t).name, reason: toast.error.reason })}
      icon={<IconWarningOutlineRegular />}
      holdMs={REFUSAL_HOLD_MS}
      // The composer card, which is the content column this chip sits
      // above rather than inside — hence a page query, not `closest`.
      // Absent, the banner centers on the window, which is off-center
      // whenever the sidebar is open.
      anchor={document.querySelector<HTMLElement>('[data-composer-card]')}
      onDone={() => { dismissRefusal(toast.error) }}
    />
  )

  // Radio-group keys: the arrows, Home, and End move to a segment and select it.
  const moveSegment = (event: KeyboardEvent<HTMLDivElement>): void => {
    const move = SEGMENT_KEYS[event.key]
    const to = move === undefined ? -1 : move(options.findIndex(option => option.id === state.current), options.length - 1)
    const target = options[to]
    if (target === undefined || state.busy) return
    event.preventDefault()
    // The segments render in roster order, one radio per option.
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]').item(to).focus()
    if (target.id !== state.current) void select(target.id)
  }

  if (segmented) {
    return (
      <>
        {ready && (
          <div className={css.segments} role="radiogroup" aria-label={t('seatHint')} onKeyDown={moveSegment}>
            {options.map((option, index) => {
              const text = presetDisplayText(option, t)
              const checked = option.id === state.current
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  // One Tab stop for the group: the checked segment, or the first one.
                  tabIndex={checked || index === 0 && !options.some(other => other.id === state.current) ? 0 : -1}
                  className={css.segment}
                  title={text.description ?? t('noDescription')}
                  disabled={state.busy}
                  onClick={() => { if (!checked) void select(option.id) }}
                >
                  {text.name}
                </button>
              )
            })}
          </div>
        )}
        {refusal}
      </>
    )
  }

  return (
    <>
      {ready && <Menu
        open={open && options.length > 0}
        onClose={() => { setOpen(false) }}
        items={options.map((option) => {
          const text = presetDisplayText(option, t)
          return {
            id: option.id,
            // Name and description together: the id alone never says what a
            // preset does, which is why the roster carries display copy.
            label: (
              <span className={css.item}>
                <span className={css.itemName}>{text.name}</span>
                <span className={css.itemDesc}>{text.description ?? t('noDescription')}</span>
              </span>
            ),
          }
        })}
        selectedId={state.current}
        onSelect={(id) => {
          setOpen(false)
          void select(id)
        }}
        align="start"
        portal
        className={css.menuAnchor}
        anchor={(
          <button
            type="button"
            className={css.seat}
            aria-haspopup="menu"
            aria-expanded={open && options.length > 0}
            title={(typeof state.error === 'object' ? state.error?.reason : state.error) ?? t('seatHint')}
            disabled={state.busy || options.length === 0}
            onClick={() => { setOpen(value => !value) }}
          >
            <IconAgentPresetOutlineRegular className={introducing ? `${css.seatIcon} ${css.introIcon}` : css.seatIcon} />
            <span className={css.seatLabel}>{shownLabel}</span>
            <IconChevronDownOutlineRegular className={css.chevron} />
          </button>
        )}
      />}
      {refusal}
    </>
  )
}
