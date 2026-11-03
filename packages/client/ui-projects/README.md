---
description: "Per-workspace projects: the Host half adds the instructions and knowledge files of the session's workspace to its runtime context and the Settings Projects section edits them, for users giving each workspace standing context and maintainers composing the DSHC profile."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-projects

English | [中文](README.zh.md)

## Summary

With `dsh-client-ui-projects`, each workspace becomes a project with its own instructions and knowledge files, and the agent follows them in every session that runs in that workspace. The Host half finds the workspace that contains the session's working directory and renders that project into the session's runtime context; the browser half adds a Projects section to Settings with one card per workspace. The projects live in this plugin's Config, keyed by workspace id, so they persist with the profile.

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

Mount the plugin with the row id `ui-projects` in a profile that also mounts `dsh-workspace`; the Settings section edits that row's Config. The `dsh-dshc` bundle mounts it in the `dshc` profile.

```yaml
- insert:
    - id: ui-projects
      name: '@deepseek-ai/dsh-client-ui-projects'
      config:
        maxFileChars: 20000
        maxTotalChars: 60000
```

| Field | Default | Meaning |
|---|---|---|
| `projects` | `{}` | Project content keyed by workspace id, each `{ instructions, files: [{ id, path }] }`; edited from Settings and written to the profile patch |
| `maxFileChars` | `20000` | Characters (UTF-16 code units) kept from one knowledge file; at least `100` |
| `maxTotalChars` | `60000` | Bound on the complete project text, header and file headings included; at least `200` |

A knowledge-file path is absolute or relative to the workspace folder. The section takes typed paths; it has no file picker. A file that cannot be read appears with its error code, and a file that does not fit `maxTotalChars` is listed as omitted.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The Host half registers one `systemPrompt.context` entry, `project:content`, at order `310`, after the saved memories of `ui-memory`. At each assembly it reads the session's current directory from `workingDirectory`, picks the workspace from `workspaceRegistry.list()` whose folder contains it (the longest match wins), and renders that workspace's entry with interpolation off. Knowledge files are read synchronously with a bound of `3 × maxFileChars` bytes, and each read is cached by path until the file's size or modification time changes. It also calls `settings.configure({ auto: false })` so the generated plugin page does not duplicate the Settings section. The browser half reads and writes the same Config through `ctx.configForms.get('ui-projects')` and lists workspaces with `useWorkspaces`.

| File | Role |
|---|---|
| [`src/index.ts`](src/index.ts) | Host half: Config schema and the runtime-context registration |
| [`src/projects.ts`](src/projects.ts) | Shared types, workspace matching, and the bounded context text |
| [`src/knowledge.ts`](src/knowledge.ts) | Bounded, cached knowledge-file reads |
| [`src/client/index.ts`](src/client/index.ts) | Browser half: dictionaries and the Settings section registration |
| [`src/client/ProjectsSection.tsx`](src/client/ProjectsSection.tsx) | The per-workspace cards |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [system-prompt](../../core/system-prompt/README.md) — how runtime-context entries become the durable context snapshot.
- [workspace](../../workspace/workspace/README.md) — the workspace registry and its folders.
- [ui-memory](../ui-memory/README.md) — saved memories that apply to every session.
- [dsh-dshc](../../bundle/dshc/README.md) — the profile layer that mounts this plugin.

-----

<a id="model-experience"></a>
## Model Experience

### Project content

#### What the model sees

When the session runs inside a workspace whose project has instructions or knowledge files, the runtime-context snapshot carries this section among the other active contexts; the truncation, read-failure, and omission lines appear only in those cases.

##### `project:content` context

```markdown
Project context for this workspace, set by the person in Settings. Follow the instructions unless the person says otherwise in this conversation.

Instructions:
<instructions>

Knowledge file <path>:
<file text>
[Truncated to <maxFileChars> characters.]

Knowledge file <path>:
[Could not read this file: <error code>]

Knowledge file <path>: [omitted to fit the project context limit]
```

#### Token effect

At most `maxTotalChars` characters per snapshot; a session outside every workspace, or in a workspace without project content, contributes zero tokens.

#### KV Cache effect

Append-only: the snapshot enters derived history as a durable user-role message, so an edit to the project or a changed knowledge file appends a new snapshot at the next request instead of changing the cached prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>


These limits define what a project does. They are current package constraints.

- **Knowledge files are read as UTF-8 text** — PDFs, images, and other binary files appear as decoded bytes, not as their content.
- **A rewrite that keeps the size and modification time is not seen** — the cache rereads a file only when either changes.
- **A removed workspace keeps its entry** — its project stays in the Config; the section shows only current workspaces and offers no way to delete it.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

#### Future: project memory and file upload

The Claude products give each project its own memory and accept uploaded files; both need a durable owner here, the first in `ui-memory` keyed by workspace and the second through `dsh-attachment`.

</details>
