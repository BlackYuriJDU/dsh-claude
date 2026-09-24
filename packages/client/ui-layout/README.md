# @deepseek-ai/dsh-client-ui-layout

English | [中文](README.zh.md)

Shell plugin: two-column AppFrame (drag handle and column solve) plus the `ctx.layout` panel-geometry service; it registers into the runtime-owned `root` slot and declares `sidebar`, `conversation`, and `shell.overlay`. The sidebar resize boundary is an invisible hit strip, and a closed sidebar retains a 56px control rail. The package also seats the theme presenter: it consumes resolved `ctx.theme` snapshots and projects them onto the document (`html { color-scheme }` for native UA chrome, `body[data-ds-dark-theme]` from the active color scheme, the theme's alias tokens as inline variables on body, and one owned `<meta name="theme-color">` whose content follows the computed body background). Measuring after palette and token application keeps the rendered background as the single color authority; disposing the presenter removes its metadata node with its other global writes.

AppFrame always mounts the conversation column; a connected Session renders through `SessionProvider`. The transient layout store starts the sidebar at 260px (draggable from 240px to 420px) and never reads or writes `localStorage`. The conversation owner share is empty, while the sidebar owner share contains only `collapsed` and `width`; registrants obtain business data from standard hooks and actions from their own inject faces.

Below 1024px, navigation starts as a compact rail and expands into a non-modal drawer over the conversation. Its grid track stays at 56px; the drawer receives the default sidebar width without modifying the desktop preference. The sidebar slot retains one mounted instance across desktop, rail, and drawer states. Opening focuses the navigation region; Escape inside it or a click on the scrim closes it, while nested dialogs retain their own Escape handling. Keyboard users may leave navigation for the conversation. Shell overlays remain above navigation.

The `/client` exports are the plugin body (`apply`/`inject`), `LayoutController`, and the owner-share interfaces. AppFrame, the panel store, and the column solver remain package-internal.

## Model Experience

None, as the layout shell manages browser viewing state; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Panel geometry is transient** — reload restores the sidebar default; closing the sidebar forgets its dragged width.
- **No scroll anchoring during squeeze reflow** — layout changes may move the reader's viewport.
