# claw-os: Guia de contribuição de plugins

> **Substitui:** o `CONTRIBUTING.md` do Kimi, cujos exemplos usavam uma API que não existe (`02-auditoria.md`, A1–A4).
>
> **Princípio:** este guia é uma **camada fina** sobre a documentação que o repositório já tem. Todos os trechos de código abaixo foram **copiados do repositório** @ `c1f0f4ec5`, com o caminho de origem. Se algo aqui divergir do repositório, o repositório vence.

---

## 1. Antes de escrever uma linha
Leia, nesta ordem:
1. `CLAUDE.md`: convenções, gates e postura de pré-release.
2. `docs/architecture.md`: a tabela "Where new behavior goes".
3. `docs/cookbook/extension-cookbook.md`: o mapa feature → mecanismo.
4. Para código cliente, `packages/client/AGENTS.md`: regras de slots, props, stores, exports e camadas.
5. O cookbook específico do que vai fazer: `adding-a-tool.md`, `adding-a-conversation-node.md`, `adding-a-package.md` ou `adding-a-settings-card.md`.

## 2. Onde cada coisa entra
| Quero… | Mecanismo | Referência no repositório |
|---|---|---|
| Dar uma capacidade ao modelo | `ctx.tools.register(defineTool(...))` | `docs/cookbook/adding-a-tool.md` |
| Bloquear, perguntar ou permitir uma tool | listener em `tools/pre-execute` (waterfall: **sempre** `next()`) | `extension-cookbook.md`, "permission gate" |
| Texto no system prompt | `ctx.systemPrompt.section({ name, order, text })` | `packages/client/ui-deliverables/src/index.ts` |
| Estado que sobrevive a reload e replay | evento no `SessionEventMap` + projeção pura | `packages/session/session-stats/src/projection.ts` |
| Um cartão novo no chat | `ConversationNodeDefinition` + renderer em `conversation.chat.node` | `adding-a-conversation-node.md` |
| Um pedaço de UI em outro lugar | `ctx.slots.register({ name, ... }, Component)` | `packages/client/AGENTS.md`, regra 1 |
| Tela de configuração | settings card | `adding-a-settings-card.md` |
| Trabalho em segundo plano | `ctx.jobs` | `docs/architecture.md` |
| Integrar um servidor externo | MCP: um plugin por servidor, descobrir as tools e registrá-las | `extension-cookbook.md` |

## 3. Os quatro padrões, com código real

### 3.1 Tool (de `docs/cookbook/adding-a-tool.md`)
```ts
import { readFile } from 'node:fs/promises'
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'my-tool'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'read_file',
    description: 'Read a file from disk.',
    parameters: {
      path: { type: 'string', required: true, description: 'Absolute path' },
      limit: { type: 'number' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args, exec) {
      return readFile(args.path, { encoding: 'utf8', signal: exec.signal })
    },
  }))
}
```
- **`defineTool` valida os argumentos** contra o schema antes do `execute`. Restrições que o DSL não expressa (string não vazia, por exemplo) você checa à mão.
- **A renderização na UI se decide no desenho** (`generic`, `terminal`, `diff`). Dados de cartão que precisam sobreviver ao replay vão em `output.presentationMeta`.

### 3.2 Gate de política (de `docs/cookbook/extension-cookbook.md`)
```ts
import type { Context } from '@deepseek-ai/cordis'
import type { PreToolDecision, ToolExecution } from '@deepseek-ai/dsh-tools'

declare function isAllowed(exec: ToolExecution): Promise<boolean>

export const name = 'permission-gate'

export function apply(ctx: Context) {
  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
    if (!(await isAllowed(exec))) {
      return { kind: 'deny', reason: 'Denied by policy.' }
    }
    return next()
  })
}
```
- Use `ctx.tools.guard()` para uma negação final que nenhum outro listener desfaz.
- Use `tools/post-execute` para transformar o resultado e `tools/result` só para observar.

### 3.3 Plugin cliente com slot (de `packages/client/ui-deliverables/src/client/index.ts`, resumido)
```ts ignore-check
export const inject = ['slots', 'locale', 'conversationEvents', 'connection']

export function apply(ctx: ClientContext): void {
  const connection = ctx.get('connection') as ConnectionHandle
  ctx.conversationEvents.register(deliverablesDefinition)
  ctx.effect(() => ctx.locale.register(NS, { en }), 'ui-deliverables: dictionaries')
  ctx.slots.inject(
    'conversation.chat.turnTail',
    () => ctx.slots.register({
      name: 'conversation.chat.turnTail',
      select: selectProducedFiles,
      locale: NS,
      inject: () => ({
        isLoopback: connection.isLoopback,
        hooks: { hostDescription: connection.hostDescription },
      }),
    }, ProducedFiles),
  )
}
```
- **Componentes nunca veem o `ctx`.** Tudo chega pelas quatro partes de props: runtime, slots filhos, store e inject.
- **Os `children` do register são a lista de autorização:** você só renderiza os slots que declarou.
- **Prioridade: o número mais baixo renderiza.** Mesma chave com a mesma prioridade lança erro.
- **O `/client` exporta só o que o Cordis precisa** (`apply`, `inject`, `Config`). Qualquer outro valor exportado precisa de aprovação.

### 3.4 Projeção pura (de `packages/session/session-stats/src/projection.ts`, resumido)
```ts ignore-check
declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionStateMap {
    sessionStats: SessionStatsState
  }
}

export const sessionStatsProjectionDefinition = {
  key: 'sessionStats',
  stateVersion: 1,
  stateSchema: sessionStatsStateSchema,   // zod 4
  init: () => ({ turns: 0, steps: 0, /* … */ openStep: null, pendingCalls: {} }),
  apply: (state, event) => {
    switch (event.type) {
      case 'step/start':
        return { ...state, openStep: { turn: event.data.turn, step: event.data.step, startTime: event.time, firstTokenTime: null } }
      // … outros casos
    }
    return state   // evento irrelevante → MESMA referência
  },
}
```
- **`apply` é síncrono e puro.** O tempo vem de `event.time`, nunca de `Date.now()`, para que o replay seja determinístico.
- **O estado é JSON puro**, validado pelo `stateSchema` antes de semear o fold.
- **A chave entra no `SessionProjectionStateMap`** por declaration merging. Sem isso, o `register` não compila (era o erro TS2344 do plugin de memória do Kimi).

## 4. Checklist do PR
- [ ] O pacote se chama `@deepseek-ai/dsh-<nome>` (ou `dsh-client-<nome>`) e fica em `packages/<grupo>/<pacote>/`.
- [ ] O código é ESM, com imports relativos `.ts` e nada de `require`.
- [ ] Todo registro é efeito (`ctx.effect`/`ctx.on`), e o disposer devolvido é respeitado.
- [ ] Tudo que é visível ao modelo pode ser reconstruído a partir do log (evento novo, se preciso).
- [ ] Nenhum valor ajustável fixo no código: ele vira campo de `Config`, configurável no cordis.yml.
- [ ] Ids opacos usam `Branded<B>`, nunca `string`.
- [ ] zod 4 e React 18.
- [ ] Cobertura de 100% por arquivo em `src/`.
- [ ] Snapshot sem chave para comportamento visível ao usuário ou ao modelo.
- [ ] JSDoc em todo export, com `@param`/`@returns` (gate `verify-export-jsdoc`).
- [ ] README do pacote atualizado; `pnpm run doc-sync`.
- [ ] Agent Note no mesmo PR, se a mudança não for trivial.
- [ ] Dependência nova só MIT, Apache, BSD ou ISC. Proibidos tldraw e AGPL/GPL embutidos. `THIRD_PARTY_NOTICES.md` atualizado.
- [ ] Rode só os gates da superfície alterada e reporte só os que rodou.

## 5. Armadilhas que o pacote do Kimi caiu (para não repetir)
| Armadilha | Correto |
|---|---|
| `ctx.get('slots')` + `registerScope` + `ctx.on('ready')` | `inject` + `ctx.slots.register(...)` dentro do `apply` |
| `this.logger` num `Service` | não existe; veja como os pacotes vizinhos registram diagnóstico |
| Tool com `{ parameters, handler }` | `defineTool({ parameters, output, execute })` |
| Estado num `Map` do plugin | evento + projeção |
| `Date.now()` na projeção | `event.time` |
| `import { Schema } from '@deepseek-ai/schemastery'` | `import Schema from '@deepseek-ai/schemastery'` |
| Plugin que "embrulha" nós de outros plugins | slots sombreiam, não embrulham; altere o componente dono ou proponha um slot |
