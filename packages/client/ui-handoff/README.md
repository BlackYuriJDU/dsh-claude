# @deepseek-ai/dsh-client-ui-handoff

English | [中文](README.zh.md)

Hand-off plugin: the **Artifacts** modal. The browser half occupies the frame-wide `shell.overlay` slot with a host that stays empty until the sidebar's **Artefatos** row dispatches the `dshc:sidebar-design` window event. The modal then reads the current session's `deliverables` turn data, which `ui-deliverables` publishes, and lists the files each turn produced, newest turn first and deduplicated within a turn. Clicking a file opens it through the Host path opener after resolving a relative path against the session cwd. With no current session or no produced files the modal shows its empty state.

The Node half is a no-op: the modal reads only browser-side conversation data, and the model-facing file-reference guidance belongs to `ui-deliverables`.

## Model Experience

None, as the package presents files that other plugins already recorded; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Files only, no artifact objects** — the modal lists produced workspace files; it has no preview, version history, or export, and content that never became a file is absent.
- **Current session only** — files from other sessions or projects are not aggregated.
