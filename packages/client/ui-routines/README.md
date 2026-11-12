# @deepseek-ai/dsh-client-ui-routines

English | [中文](README.zh.md)

Routines plugin: recurring scheduled tasks. A routine is a durable `ui-routines` settings entry naming a prompt, an interval of N minutes, hours, or days, an enabled flag, and an optional workspace cwd. The Node half registers the namespace and runs a scheduler that arms one timer per enabled routine. Each fire creates a fresh Agent through `ctx.agents` with the default model selection, submits the prompt as an ordinary user message, waits for quiescence, disposes the Agent, and stamps `lastRunAt`. The browser half adds a **Routines** section to Settings for creating, toggling, editing, and deleting routines.

The scheduler rebuilds its timers from the settings section on boot and on every change to it. A routine fires one interval after its last run settled and never overlaps itself; a routine whose interval elapsed while the Host was down fires once on the next boot rather than catching up every missed run. A routine that never ran fires one interval after it was saved. Timers are `unref`'d, so a pending routine never keeps the Host process alive.

## Model Experience

### Routine prompt

#### What the model sees

Each fire starts a new session whose first user message is the routine's stored prompt text, with plugin source `@deepseek-ai/dsh-client-ui-routines`. The session runs under the deployment's default agent composition and default model; its cwd is the routine's workspace when one is set.

#### Token effect

One user message per fire, sized by the stored prompt; the rest of the request is the ordinary prompt of a fresh session.

#### KV Cache effect

Each fire is an independent model request sequence in a new session; it neither extends nor invalidates the prefix of any other session.

## Known Limitations and Deferred Work

- **No cron expressions** — intervals are fixed N minutes, hours, or days; calendar schedules such as weekdays at 09:00 are not expressible.
- **Missed runs are not replayed** — downtime collapses every elapsed interval into one fire on the next boot.
- **Results are not surfaced** — a fire leaves a session in the session list but sends no notification, and a failed fire is only logged on the Host.
