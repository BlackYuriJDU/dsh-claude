# @deepseek-ai/dsh-client-ui-memory

English | [中文](README.zh.md)

Memory plugin: durable across-session memories. The Node half registers the `ui-memory` settings namespace and contributes the stored memory list to every agent session as the `memory:standing` prompt context (order 3), the same mechanism `ui-settings-general` uses for standing instructions. The browser half adds a **Memory** section to Settings where the owner views, adds, edits, and deletes memories; each edit persists through the durable `ui-memory` scope.

The context reads the settings document at prompt-assembly time, so an edit reaches the next model request of every session, including sessions created later, without a restart.

## Model Experience

### Standing memories

#### What the model sees

One `memory:standing` contribution in the runtime-context snapshot of every agent session whose stored memory list has at least one non-blank entry. Each entry is trimmed and rendered as a `- ` list line after this fixed lead-in; an empty or all-blank list contributes nothing.

##### Lead-in

```markdown
The user's memories, saved by them in Settings and applying to this and every session — honor them unless a direct user message supersedes them:
```

#### Token effect

One context block whose size grows with the stored list: the fixed lead-in plus one line per non-blank memory. Requests while the list is unchanged add nothing new.

#### KV Cache effect

The stable system prompt stays byte-identical. Editing the list changes the full runtime-context snapshot, which is appended after retained history and preserves the prior cached prefix; unchanged requests reuse the retained snapshot.

## Known Limitations and Deferred Work

- **No automatic memory extraction** — memories are authored manually in Settings. Detecting corrections in a conversation and proposing memories is deferred.
- **Whole-list rewrite per edit** — add, edit, and delete rewrite the whole `memories` field through the settings scope; concurrent edits from two surfaces serialize through the scope's revision fencing.
