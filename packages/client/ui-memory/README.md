---
description: "Saved memories for every session: the Host half adds the list to each session's runtime context and the Settings Memory section edits it, for users keeping standing facts and maintainers composing the DSHC profile."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-memory

English | [中文](README.zh.md)

## Summary

With `dsh-client-ui-memory`, a person saves facts, preferences, and corrections once in Settings, and the agent follows them in every session. The Host half renders the list into each session's runtime context; the browser half adds a Memory section to Settings that adds, edits, and deletes entries. The list lives in this plugin's Config, so it persists with the profile and every session sees the same version.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount the plugin with the row id `ui-memory`; the Settings section edits that row's Config. The `dsh-dshc` bundle mounts it in the `dshc` profile.

```yaml
- insert:
    - id: ui-memory
      name: '@deepseek-ai/dsh-client-ui-memory'
      config:
        maxChars: 8000
```

| Field | Default | Meaning |
|---|---|---|
| `memories` | `[]` | Ordered saved memories, each `{ id, text }`; edited from Settings and written to the profile patch |
| `maxChars` | `8000` | Bound on the complete rendered memory text, header and omission line included; at least `200` |

Blank entries contribute nothing. When the whole list does not fit in `maxChars`, the earliest memories that fit are kept and a final line states how many were omitted.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The Host half registers one `systemPrompt.context` entry, `memory:saved`, at order `300`, after the upstream runtime-context allocations; its text is evaluated at each assembly from the live Config, with prompt-variable interpolation off so a memory containing braces stays literal. It also calls `settings.configure({ auto: false })` so the generated plugin page does not duplicate the Settings section. The browser half reads and writes the same Config through `ctx.configForms.get('ui-memory')` and shows the section only while the Host serves that entry.

| File | Role |
|---|---|
| [`src/index.ts`](src/index.ts) | Host half: Config schema and the runtime-context registration |
| [`src/memory.ts`](src/memory.ts) | Shared types, the entry id, and the bounded context text |
| [`src/client/index.ts`](src/client/index.ts) | Browser half: dictionaries, the Settings section registration, and its row icon |
| [`src/client/MemorySection.tsx`](src/client/MemorySection.tsx) | The editable list |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [system-prompt](../../core/system-prompt/README.md) — how runtime-context entries become the durable context snapshot.
- [ui-settings](../ui-settings/README.md) — config forms and the Settings sections.
- [dsh-dshc](../../bundle/dshc/README.md) — the profile layer that mounts this plugin.

-----

<a id="model-experience"></a>
## Model Experience

### Saved memories

#### What the model sees

When the list holds at least one non-blank memory, the runtime-context snapshot carries this section among the other active contexts; the omission line appears only when the list exceeds `maxChars`.

##### `memory:saved` context

```markdown
Memories the person saved in Settings. They apply to this and every session; follow them unless the person says otherwise in this conversation:
- <memory>
- <memory>
(<count> more saved memories omitted to fit the limit.)
```

#### Token effect

At most `maxChars` characters per snapshot; an empty list contributes zero tokens.

#### KV Cache effect

Append-only: the snapshot enters derived history as a durable user-role message, so an edit appends a new snapshot at the next request instead of changing the cached prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>


These limits define what the memory list does. They are current package constraints.

- **Memories are written only by the person** — the agent cannot save a memory itself.
- **One list for every session** — there is no per-project memory and no per-session switch to leave memories out.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

#### Future: agent-saved memories and project scope

A tool that lets the agent propose a memory, and project-scoped lists keyed by workspace, would match the Claude products' memory features; both need a review step so the person approves what is saved.

</details>
