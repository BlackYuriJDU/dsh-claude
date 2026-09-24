/**
 * Hand off plugin, browser half: occupies the frame-wide `shell.overlay`
 * seat with the Artifacts modal — the Hand off surface where the files a
 * delegated turn produced are listed and opened. The modal opens on the
 * sidebar's design event (`dshc:sidebar-design`, the same seam the shell's
 * own Artefatos row uses), reads the current session's deliverables turn
 * data, and opens files through the Host's path opener.
 */
import { useEffect, useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls ui-layout's SlotMap merge (the 'shell.overlay' seat) into
// this program so PropsRuntime<'shell.overlay'> and the register call resolve.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { ArtifactsModalHost } from './ArtifactsModal.tsx'
import type { ArtifactsModalComponentProps, ArtifactsModalInjected } from './ArtifactsModal.tsx'
import { en, pt, NS, type HandoffKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Artifacts modal copy. */
    'handoff': HandoffKey
  }
}

export { ArtifactsModal, ArtifactsModalHost } from './ArtifactsModal.tsx'
export type { ArtifactsModalComponentProps, ArtifactsModalInjected } from './ArtifactsModal.tsx'

/** Window event the sidebar's Artefatos row dispatches to open the modal. */
const SIDEBAR_DESIGN_EVENT = 'dshc:sidebar-design'

/** Required services: slots for the overlay seat, locale for copy, sessions + workspaces for data/opener. */
export const inject = ['slots', 'locale', 'sessions', 'workspaces']

/**
 * The shell.overlay occupant: a host that opens the Artifacts modal on the
 * sidebar's design event. It renders nothing until the event fires.
 * @param props - composed slot props (runtime + locale + injected face).
 * @returns the modal host element.
 */
function ArtifactsOverlay(props: ArtifactsModalComponentProps) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onDesign = (): void => { setOpen(true) }
    window.addEventListener(SIDEBAR_DESIGN_EVENT, onDesign)
    return () => { window.removeEventListener(SIDEBAR_DESIGN_EVENT, onDesign) }
  }, [])
  if (!open) return null
  return <ArtifactsModalHost {...props} open={open} onClose={() => { setOpen(false) }} />
}

/**
 * Client plugin body: register the dictionaries and the shell.overlay entry.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, pt }), 'ui-handoff: dictionaries')
  const sessions = ctx.sessions
  const workspaces = ctx.workspaces
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'artifacts',
    locale: NS,
    inject: (): ArtifactsModalInjected => ({
      sessions,
      openPath: (path) => { void workspaces.openPath(path).catch(() => {}) },
    }),
  }, ArtifactsOverlay))
}
