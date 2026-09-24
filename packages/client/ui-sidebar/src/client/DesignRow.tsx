/**
 * Design footer row: an additive occupant of the shell's footer-action seat
 * (`sidebar.footer.action`), riding the full-width row above the profile
 * pill. The row mirrors the nav-row geometry (icon + label) and opens the
 * shell's Artefatos modal through the window-event seam (SidebarRoot owns
 * that modal; the seat carries no shell state).
 */
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { SIDEBAR_DESIGN_EVENT } from './SidebarRoot.tsx'
import css from './SidebarRoot.module.css'

/** Line icon geometry shared with the shell's nav rows (16px grid). */
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const fill = { fill: 'currentColor', stroke: 'none' } as const

/** Full component props: runtime owner share ({@link wide}) + locale seat. */
export type DesignRowComponentProps =
  PropsRuntime<'sidebar.footer.action'>
  & PropsLocale<'sidebar'>

/**
 * Render the Design row.
 * @param props - composed slot props (wide owner share + locale seat).
 * @returns the row element tree.
 */
export function DesignRow({ t }: DesignRowComponentProps) {
  return (
    <button
      type="button"
      className={css.navRow}
      onClick={() => { window.dispatchEvent(new CustomEvent(SIDEBAR_DESIGN_EVENT)) }}
    >
      <span className={css.navIcon}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          {/* Palette (the reference's Design row icon): outline ring with the thumb hole. */}
          <path
            {...stroke}
            d="M8 1.8a6.2 6.2 0 0 0 0 12.4c1.4 0 2-.8 2-1.6 0-.9-.7-1.2-.7-2 0-.8.6-1.4 1.5-1.4h1.5A1.9 1.9 0 0 0 14.2 7 6.2 6.2 0 0 0 8 1.8Z"
          />
          <circle {...fill} cx="5.4" cy="5.6" r="1.1" />
          <circle {...fill} cx="9.2" cy="4.4" r="1.1" />
          <circle {...fill} cx="11.6" cy="7.2" r="1.1" />
          <circle {...fill} cx="4.6" cy="9.2" r="1.1" />
        </svg>
      </span>
      <span className={css.navLabel}>{t('design.label')}</span>
    </button>
  )
}
