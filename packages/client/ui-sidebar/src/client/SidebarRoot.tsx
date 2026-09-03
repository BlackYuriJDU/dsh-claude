/**
 * Sidebar shell (Claude layout): serif wordmark, the "Novo" pill, the four
 * feature nav rows, the browsing region (Projetos + Conversas e tarefas), the
 * Design row, and the profile foot whose popover carries Configurações /
 * Idioma / Receber ajuda. Collapse reduces the column to a single panel
 * toggle — nothing else rides the rail.
 *
 * Collapse is a slide plus crossfade: content freezes at its expanded width
 * (inline style) and fades out in place while the sliding column (AppFrame
 * grid tracks) clips it — nothing reflows mid-slide. The column also owns
 * whether nested scroll regions draw a scrollbar: rebinding ui-theme's
 * scrollbar indirection away while the pointer is elsewhere.
 */
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import clsx from 'clsx'
import {
  IconNewChatOutline16, IconPanelLeftOutline16, Menu, Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { SidebarRootComponentProps } from './contract/slots.ts'
import css from './SidebarRoot.module.css'

/** Wide-content unmount delay; matches the 150ms wide-content fade-out. */
const COLLAPSE_SETTLE_MS = 150

/**
 * How long the column's scrollbars stay drawn after the pointer leaves it.
 */
const SCROLLBAR_LINGER_MS = 2000

/** Line icons for the feature nav rows and the profile popover (16px grid). */
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const IconProjects = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <rect {...stroke} x="2" y="2.5" width="12" height="3.4" rx="0.9" />
    <path {...stroke} d="M3.2 5.9v6.6A1.5 1.5 0 0 0 4.7 14h6.6a1.5 1.5 0 0 0 1.5-1.5V5.9" />
    <path {...stroke} d="M6.3 8.6h3.4" />
  </svg>
)

const IconArtifacts = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <path {...stroke} d="M8 2.2 9.6 6 13.4 7.6 9.6 9.2 8 13 6.4 9.2 2.6 7.6 6.4 6 8 2.2Z" />
    <path {...stroke} d="M12.6 11.2l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7.7-1.7Z" />
  </svg>
)

const IconCode = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <path {...stroke} d="m5.4 4.6-3.4 3.4 3.4 3.4M10.6 4.6 14 8l-3.4 3.4" />
  </svg>
)

const IconCustomize = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <circle {...stroke} cx="8" cy="5.2" r="2.6" />
    <path {...stroke} d="M2.8 13.6c.6-2.6 2.7-4 5.2-4s4.6 1.4 5.2 4" />
  </svg>
)

const IconDesign = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <path {...stroke} d="M8 1.8a6.2 6.2 0 1 0 0 12.4c.9 0 1.4-.6 1.4-1.3 0-.4-.2-.7-.4-1-.2-.3-.4-.6-.4-1 0-.7.6-1.3 1.4-1.3h1.6a2.6 2.6 0 0 0 2.6-2.6A6.2 6.2 0 0 0 8 1.8Z" />
    <path {...stroke} d="M4.8 7.4h.01M7.2 4.6h.01M10.4 5.4h.01" strokeWidth="1.7" />
  </svg>
)

const IconLanguage = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <circle {...stroke} cx="8" cy="8" r="6.2" />
    <path {...stroke} d="M1.8 8h12.4M8 1.8c1.8 1.7 2.8 3.9 2.8 6.2S9.8 12.5 8 14.2C6.2 12.5 5.2 10.3 5.2 8S6.2 3.5 8 1.8Z" />
  </svg>
)

const IconHelp = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <circle {...stroke} cx="8" cy="8" r="6.2" />
    <path {...stroke} d="M6.2 6.2A1.9 1.9 0 0 1 8 4.8c1 0 1.9.7 1.9 1.7 0 1.1-1 1.4-1.6 1.9-.3.3-.3.6-.3 1" />
    <path {...stroke} d="M8 11.4h.01" strokeWidth="1.7" />
  </svg>
)

/** localStorage key holding the displayed owner name (shared with the hero). */
const USER_NAME_STORE_KEY = 'dshc:user-name'
const DEFAULT_USER_NAME = 'Arthur'

/**
 * The displayed owner name: the localStorage override when present, else the
 * built-in default.
 * @returns the profile row name.
 */
function ownerNameOf(): string {
  try {
    const stored = window.localStorage.getItem(USER_NAME_STORE_KEY)?.trim()
    return stored !== undefined && stored !== '' ? stored : DEFAULT_USER_NAME
  } catch {
    return DEFAULT_USER_NAME
  }
}

/**
 * Render the sidebar column shell.
 * @param props - composed slot props (runtime share + injected callbacks, contract/slots.ts).
 * @returns the sidebar element tree.
 */
export function SidebarRoot({
  collapsed,
  width,
  startSession,
  toggleSidebar,
  t,
  renderSlot,
}: SidebarRootComponentProps) {
  // Wide content stays mounted while the collapse animates (fading via
  // .collapsed .wide), unmounts at settle, and remounts right away on expand.
  const [settled, setSettled] = useState(collapsed)
  useEffect(() => {
    if (!collapsed) { setSettled(false); return }
    const timer = window.setTimeout(() => { setSettled(true) }, COLLAPSE_SETTLE_MS)
    return () => { window.clearTimeout(timer) }
  }, [collapsed])
  const wide = !collapsed || !settled

  // Freeze the content at its expanded width while it fades out.
  const lastWideWidth = useRef(width)
  if (!collapsed) lastWideWidth.current = width

  // Rail-in only crossfades a live collapse: a refresh straight into the
  // collapsed state renders the rail statically.
  const everWide = useRef(!collapsed)
  if (!collapsed) everWide.current = true

  // Scrollbars in the column follow the pointer (.quietBars rebinds them
  // away): drawn while it is inside, and for SCROLLBAR_LINGER_MS after it
  // leaves.
  const column = useRef<HTMLDivElement>(null)
  const [pointerInside, setPointerInside] = useState(false)
  const lingerTimer = useRef<number | undefined>(undefined)
  const armLinger = (): void => {
    if (lingerTimer.current !== undefined) return
    lingerTimer.current = window.setTimeout(() => {
      lingerTimer.current = undefined
      setPointerInside(false)
    }, SCROLLBAR_LINGER_MS)
  }
  const cancelLinger = (): void => {
    window.clearTimeout(lingerTimer.current)
    lingerTimer.current = undefined
  }
  useEffect(() => {
    if (!pointerInside) return
    const onMove = (event: PointerEvent): void => {
      const rect = column.current?.getBoundingClientRect()
      /* v8 ignore next -- the listener only exists while the column is mounted and revealed. */
      if (rect === undefined) return
      const inside = event.clientX >= rect.left && event.clientX < rect.right
        && event.clientY >= rect.top && event.clientY < rect.bottom
      if (inside) cancelLinger()
      else armLinger()
    }
    document.addEventListener('pointermove', onMove)
    return () => {
      document.removeEventListener('pointermove', onMove)
      cancelLinger()
    }
  }, [pointerInside])

  // Profile foot popover.
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLButtonElement | null>(null)
  const hiddenSettings = useRef<HTMLDivElement | null>(null)
  const openSettings = (): void => {
    hiddenSettings.current?.querySelector('button')?.click()
  }

  const navRows: readonly { id: string; label: string; icon: ReactNode }[] = [
    { id: 'projects', label: t('nav.projects'), icon: IconProjects },
    { id: 'artifacts', label: t('nav.artifacts'), icon: IconArtifacts },
    { id: 'code', label: t('nav.code'), icon: IconCode },
    { id: 'customize', label: t('nav.customize'), icon: IconCustomize },
  ]

  return (
    <div
      ref={column}
      className={clsx(
        css.root, !wide && css.collapsed, !wide && everWide.current && css.railIn,
        collapsed && wide && css.fading, !pointerInside && css.quietBars,
      )}
      style={wide ? { width: collapsed ? lastWideWidth.current : width } : undefined}
      onPointerEnter={() => {
        cancelLinger()
        setPointerInside(true)
      }}
      onPointerLeave={() => { armLinger() }}
    >
      {wide && (
        <div className={css.logoRow}>
          <span className={css.brandIdentity} aria-hidden="true">
            <span className={css.brandName}>
              {renderSlot('sidebar.brand.name', {}, {
                fallback: <span className={css.fallbackBrandName}>DSH Claude</span>,
              })}
            </span>
          </span>
          <Tooltip label={t('toggle.collapse')} delayMs={500}>
            <button
              type="button"
              className={clsx(css.iconButton, css.toggle)}
              aria-label={t('toggle.collapse')}
              onClick={() => { toggleSidebar() }}
            >
              <IconPanelLeftOutline16 size={16} />
            </button>
          </Tooltip>
        </div>
      )}
      {/* Collapsed rail: the panel toggle alone (reference behavior). */}
      {!wide && (
        <div className={css.logoRow}>
          <Tooltip label={t('toggle.open')} delayMs={500}>
            <button
              type="button"
              className={clsx(css.iconButton, css.toggle)}
              aria-label={t('toggle.open')}
              onClick={() => { toggleSidebar() }}
            >
              <IconPanelLeftOutline16 size={18} />
            </button>
          </Tooltip>
        </div>
      )}

      {wide && (
        <button
          type="button"
          className={css.newSession}
          aria-label={t('session.new.label')}
          onClick={() => { startSession() }}
        >
          <IconNewChatOutline16 size={14} />
          <span className={clsx(css.newSessionLabel, css.wide)}>{t('session.new')}</span>
        </button>
      )}

      {wide && (
        <nav className={css.navRows} aria-label={t('nav.label')}>
          {navRows.map(row => (
            <button key={row.id} type="button" className={css.navRow} disabled>
              <span className={css.navIcon}>{row.icon}</span>
              <span className={css.navLabel}>{row.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* The browsing region fills the column between the controls and the
          foot in the wide state; the rail carries nothing but the toggle. */}
      {wide && (
        <div className={css.regionArea}>
          {renderSlot('sidebar.workspaces', { wide, expandSidebar: () => { if (collapsed) toggleSidebar() } })}
        </div>
      )}

      {wide && (
        <button type="button" className={css.designRow}>
          <span className={css.navIcon}>{IconDesign}</span>
          <span className={css.navLabel}>{t('nav.design')}</span>
        </button>
      )}

      {wide && (
        <div className={css.footArea}>
          {/* The real settings trigger stays mounted, visually hidden: the
              profile popover's Configurações row clicks it through. */}
          <div ref={hiddenSettings} className={css.hiddenSettings} aria-hidden="true">
            <div className={css.settingsArea}>
              {renderSlot('sidebar.settings', { wide })}
            </div>
          </div>
          <Menu
            open={profileOpen}
            anchor={(
              <button
                ref={profileRef}
                type="button"
                className={css.profileRow}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                onClick={() => { setProfileOpen(open => !open) }}
              >
                <span className={css.avatar} aria-hidden="true">
                  {ownerNameOf().charAt(0).toUpperCase()}
                </span>
                <span className={css.profileName}>{ownerNameOf()}</span>
                <span className={css.profileChevron} aria-hidden>⌄</span>
              </button>
            )}
            items={[
              { id: 'settings', label: t('profile.settings') },
              { id: 'language', label: t('profile.language'), icon: IconLanguage },
              { id: 'help', label: t('profile.help'), icon: IconHelp },
            ]}
            onSelect={(id) => {
              setProfileOpen(false)
              if (id === 'settings') openSettings()
            }}
            onClose={() => { setProfileOpen(false) }}
            align="start"
            side="top"
          />
        </div>
      )}
    </div>
  )
}
