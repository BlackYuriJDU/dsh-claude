// The dshc "+" menu (Claude-style): attachments, screenshot, project,
// GitHub, skills, connectors, plugins, web search, memory. Icons are
// hand-drawn 16px line glyphs matching the reference design.

import { IconPlusOutline16, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import type { MenuItem } from '@deepseek-ai/dsh-client-ui-primitives'
import type { MouseEvent } from 'react'
import type { ComposerBarProps } from '../contract/slots.ts'
import inputCss from './InputBar.module.css'
import css from './PlusMenu.module.css'

/** The owner's locale seat, passed down as a plain prop. */
type MenuTranslate = ComposerBarProps['t']

export interface PlusMenuProps {
  /** Menu visibility (owner-controlled). */
  open: boolean
  /** Toggle the menu (the anchor button's click). */
  onToggle: () => void
  /** Close the menu (outside click / Escape / selection that navigates). */
  onClose: () => void
  /** The bar's chrome disable state (locks the trigger). */
  disabled: boolean
  /** Suppress focus steal on trigger press (the bar's own helper). */
  keepFocus: (event: MouseEvent<HTMLButtonElement>) => void
  /** Open the file picker (Adicionar arquivos ou fotos). */
  onFiles: () => void
  /** Capture a screen frame and attach it (Fazer captura de tela). */
  onScreenshot: () => void
  /** Open the slash/skills menu (Habilidades). */
  onSkills: () => void
  /** Workspaces for the add-to-project submenu. */
  workspaces: ReadonlyArray<{ readonly id: string; readonly title: string }>
  /** Move the new-session flow to the picked workspace. */
  onPickWorkspace: (workspaceId: string) => void
  /** Web-search toggle state. */
  webSearch: boolean
  /** Memory toggle state. */
  memory: boolean
  onToggleWebSearch: () => void
  onToggleMemory: () => void
  t: MenuTranslate
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.3,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Pencil-in-square — add files or photos. */
const IconFiles = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <path {...stroke} d="M9.5 2.5H3.5A1.5 1.5 0 0 0 2 4v8.5A1.5 1.5 0 0 0 3.5 14H12a1.5 1.5 0 0 0 1.5-1.5V6.5" />
    <path {...stroke} d="M11.9 2.1a1.32 1.32 0 0 1 1.87 1.87l-5.44 5.44-2.44.57.57-2.44 5.44-5.44Z" />
  </svg>
)

/** Camera — screenshot capture. */
const IconCamera = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <path {...stroke} d="M2 5.5A1.5 1.5 0 0 1 3.5 4h1.6l1.2-1.6h3.4L10.9 4h1.6A1.5 1.5 0 0 1 14 5.5v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5v-6Z" />
    <circle {...stroke} cx="8" cy="8.4" r="2.4" />
  </svg>
)

/** Archive box — add to project. */
const IconProject = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <rect {...stroke} x="2" y="2.5" width="12" height="3.4" rx="0.9" />
    <path {...stroke} d="M3.2 5.9v6.6A1.5 1.5 0 0 0 4.7 14h6.6a1.5 1.5 0 0 0 1.5-1.5V5.9" />
    <path {...stroke} d="M6.3 8.6h3.4" />
  </svg>
)

/** GitHub mark — add from GitHub. */
const IconGitHub = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <path
      fill="currentColor"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
    />
  </svg>
)

/** Open book — skills. */
const IconSkills = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <path {...stroke} d="M8 3.6C6.9 2.6 5.2 2.2 2.5 2.2v10.4c2.7 0 4.4.4 5.5 1.4 1.1-1 2.8-1.4 5.5-1.4V2.2c-2.7 0-4.4.4-5.5 1.4Z" />
    <path {...stroke} d="M8 3.6v10.4" />
  </svg>
)

/** Four-square grid — connectors. */
const IconConnectors = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <rect {...stroke} x="2" y="2" width="5" height="5" rx="1.2" />
    <rect {...stroke} x="9" y="2" width="5" height="5" rx="1.2" />
    <rect {...stroke} x="2" y="9" width="5" height="5" rx="1.2" />
    <rect {...stroke} x="9" y="9" width="5" height="5" rx="1.2" />
  </svg>
)

/** Crossed tools — plugins. */
const IconPlugins = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <path {...stroke} d="m2.6 13.4 6.5-6.5" />
    <path {...stroke} d="M11.2 1.9 14 4.7l-1.9 1.9a2.4 2.4 0 0 1-3.3.1L6.9 4.8l2.4-2.4a2.4 2.4 0 0 1 1.9-.5Z" />
    <path {...stroke} d="m9.1 9.1 4.3 4.3-1.4 1.4-4.3-4.3" />
    <path {...stroke} d="M4.8 2 2 4.8l2.1 2.1 2.8-2.8L4.8 2Z" />
  </svg>
)

/** Globe — web search. */
const IconGlobe = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <circle {...stroke} cx="8" cy="8" r="6.2" />
    <path {...stroke} d="M1.8 8h12.4M8 1.8c1.8 1.7 2.8 3.9 2.8 6.2S9.8 12.5 8 14.2C6.2 12.5 5.2 10.3 5.2 8S6.2 3.5 8 1.8Z" />
  </svg>
)

/** Smiley — memory. */
const IconMemory = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <circle {...stroke} cx="8" cy="8" r="6.2" />
    <path {...stroke} d="M5.6 9.4a3 3 0 0 0 4.8 0" />
    <path {...stroke} d="M5.9 6.2h.01M10.1 6.2h.01" strokeWidth="1.6" />
  </svg>
)

/**
 * Build the menu entries. Submenu parents open their nested card on
 * hover/focus; toggles ride the Menu's selectedIds check marks.
 * @param props - the PlusMenu props.
 * @returns the entry list.
 */
function entriesOf(props: PlusMenuProps): readonly MenuItem[] {
  const { t, workspaces } = props
  const soon = (id: string, label: string): MenuItem => ({ id, label, disabled: true })
  const projectSubmenu: readonly MenuItem[] = [
    ...workspaces.map(workspace => ({ id: `ws:${workspace.id}`, label: workspace.title })),
    { type: 'separator', id: 'ws-sep' },
    soon('ws-manage', t('menu.manageWorkspaces')),
  ]
  return [
    { id: 'files', label: <span className={css.label}>{t('menu.addFiles')}<span className={css.hint}>Ctrl U</span></span>, icon: IconFiles },
    { id: 'screenshot', label: t('menu.screenshot'), icon: IconCamera },
    { type: 'separator', id: 'sep-1' },
    { id: 'project', label: t('menu.addToProject'), icon: IconProject, submenu: projectSubmenu },
    { id: 'github', label: t('menu.github'), icon: IconGitHub, submenu: [soon('gh-connect', t('menu.comingSoon'))] },
    { id: 'skills', label: t('menu.skills'), icon: IconSkills },
    { id: 'connectors', label: t('menu.connectors'), icon: IconConnectors, submenu: [soon('cn-manage', t('menu.comingSoon'))] },
    { id: 'plugins', label: t('menu.plugins'), icon: IconPlugins, submenu: [soon('pg-manage', t('menu.comingSoon'))] },
    { type: 'separator', id: 'sep-2' },
    { id: 'websearch', label: t('menu.webSearch'), icon: IconGlobe },
    { id: 'memory', label: t('menu.memory'), icon: IconMemory },
  ]
}

/**
 * The anchored "+" menu. Selection routes back to the owner; toggle rows are
 * mirrored through `selectedIds` so the check marks read as state.
 * @param props - see {@link PlusMenuProps}.
 * @returns the menu element.
 */
export function PlusMenu(props: PlusMenuProps) {
  const { open, onToggle, disabled, keepFocus, t } = props
  return (
    <Menu
      open={open}
      anchor={
        <button
          type="button"
          className={inputCss.add}
          aria-label={t('input.add')}
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={disabled}
          onMouseDown={keepFocus}
          onClick={onToggle}
        >
          <IconPlusOutline16 size={14} />
        </button>
      }
      items={entriesOf(props)}
      selectedIds={[...(props.webSearch ? ['websearch'] : []), ...(props.memory ? ['memory'] : [])]}
      onSelect={(id) => {
        if (id === 'files') props.onFiles()
        else if (id === 'screenshot') props.onScreenshot()
        else if (id === 'skills') props.onSkills()
        else if (id === 'websearch') props.onToggleWebSearch()
        else if (id === 'memory') props.onToggleMemory()
        else if (id.startsWith('ws:')) props.onPickWorkspace(id.slice(3))
      }}
      onClose={props.onClose}
    />
  )
}
