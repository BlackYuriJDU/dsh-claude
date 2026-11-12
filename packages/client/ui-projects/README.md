# @deepseek-ai/dsh-client-ui-projects

English | [中文](README.zh.md)

Projects plugin: per-workspace instructions and knowledge files. The Node half registers the durable `ui-projects` settings namespace, keyed by workspace id, and contributes the `project:content` prompt context (order 3). At each prompt assembly the context resolves the session's immutable cwd to the registered workspace whose path contains it (the longest matching path prefix wins) and renders that project's instructions and knowledge files. The browser half adds a **Projects** section to Settings with one card per workspace: an instructions text area and a knowledge-file list whose files are picked through the Host.

Knowledge files are read synchronously at assembly time because prompt context providers are synchronous. Each file contributes at most 20,000 characters; a longer file is truncated with a marker, and an unreadable file contributes a one-line notice instead of failing the request.

## Model Experience

### Project content

#### What the model sees

One `project:content` contribution in the runtime-context snapshot when the session cwd lies inside a registered workspace whose project has non-blank instructions or at least one knowledge file. Instructions follow the first lead-in below; each knowledge file follows the second lead-in as a `--- <name> ---` header and its content. Sessions outside every registered workspace, and projects with no content, contribute nothing.

##### Instructions lead-in

```markdown
Instructions for this project, written by the user and applying to every session in it — honor them unless a direct user message supersedes them:
```

##### Knowledge lead-in

```markdown
Knowledge files attached to this project:
```

#### Token effect

Proportional to the project's content: the instructions plus up to 20,000 characters per knowledge file. Requests while the project content and files are unchanged add nothing new.

#### KV Cache effect

The stable system prompt stays byte-identical. Editing the project or changing a knowledge file on disk changes the full runtime-context snapshot, which is appended after retained history and preserves the prior cached prefix; unchanged requests reuse the retained snapshot.

## Known Limitations and Deferred Work

- **No retrieval over knowledge files** — every attached file is injected whole (up to the per-file cap) on each changed snapshot; large knowledge sets spend tokens instead of being searched.
- **The per-file cap is a source constant** — `KNOWLEDGE_FILE_MAX_CHARS` is not yet a `Config` field.
- **Files are re-read on every assembly** — an edit on disk reaches the model without a settings change, and a deleted file degrades to its notice line.
