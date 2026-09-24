# @deepseek-ai/dsh-client-ui-memory

English

Memory plugin: durable across-session memories. The node half registers the
`ui-memory` settings namespace and projects the stored memory list into the
system prompt of **every** session as a standing prompt context (the same
mechanism `ui-settings-general` uses for standing instructions). The browser
half adds a **Memory** section to Settings where the owner views, adds, edits,
and deletes memories; each row persists through the durable `ui-memory` scope.

Because memories travel as a standing system-prompt context rather than a
per-message injection, the agent honors them in the current session and in
every new session — this is the "memory across conversations" surface.

## Model Experience

The stored memory list is rendered into the system prompt as a standing
context (`memory:standing`, order 3) on every assembly, so the model sees the
owner's saved facts and preferences on every request. An empty list (or only
blank entries) contributes nothing.

#### KV Cache effect

The memory context sits near the head of the prompt (order 3, after the
harness identity and persona). Editing the memory list changes the rendered
context text and therefore invalidates the provider prefix cache from that
point on the next request; an unchanged list renders identically and preserves
reuse.

## Known Limitations and Deferred Work

- **No automatic memory extraction (P1.2)** — memories are authored manually
  in Settings. Detecting corrections from the conversation and saving them
  automatically (as the reference product does with an LLM pass) is deferred.
- **Whole-list rewrite per edit** — add/edit/delete rewrites the `memories`
  field through the settings scope; concurrent edits from two surfaces
  serialize through the scope's revision fencing.
