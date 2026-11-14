# Onda 0 — inventário e baseline

Base: `BlackYuriJDU/dsh-claude` @ `c1f0f4ec5`, branch `ccr-a6886271-p3qfkp`, 11/11/2026. Onda somente leitura: nenhum arquivo em `packages/` ou `apps/` foi alterado.

## Entregue (o que mudou e por quê, 1 linha por PR)

- `docs/dshc/`: `PLANO.md` (= `03-plano-claude-code.md`), `01-estudo-mestre.md`, `02-auditoria.md` e `04-guia-contribuicao.md`, copiados do pacote v2, conforme o passo 1 de "Como usar" do PLANO. Só duas mudanças mecânicas: as referências a `03-plano-claude-code.md` passaram a `PLANO.md`, e linhas consecutivas de citação ou de parágrafo viraram parágrafos separados, porque o `verify-md-wrap` exige um parágrafo por linha física. O texto não mudou.
- `docs/dshc/relatorios/onda-0.md`: este relatório, com a matriz atualizada, o baseline e as duas listas de entrada da Onda 1.

## Gates rodados (comando → resultado; só os que você rodou de fato)

Ambiente: container Linux, Node 22.23.4, pnpm 11.7.0, processo rodando como **root** (uid 0), sem `DEEPSEEK_API_KEY`. Commit `c1f0f4ec5`, sem nenhuma mudança local em código.

| Comando | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ |
| `pnpm run typecheck` | ❌ exit 2. A face host (`tsc -b tsconfig.host.json` + tsdown) passa; a face cliente (`tsc -b tsconfig.client.json`) dá **65 erros**, 8 deles em `src/` |
| `pnpm run lint` | ❌ exit 1, **299 erros** de oxlint |
| `pnpm run test` | ❌ exit 1: 878 arquivos (14 falham, 854 passam, 10 pulados); 14.749 testes (**21 falham**, 14.610 passam, 118 pulados) |
| `pnpm run verify-md-wrap` | ❌ só por falhas já existentes fora de `docs/dshc/` (por exemplo `packages/client/ui-memory/README.md:25,33,36`). Os docs novos passam depois do ajuste descrito acima |
| `pnpm run verify-md-links` | ❌ só por falhas já existentes: `.agents/notes/implemented/architecture/2026-08-08-bounded-session-persistence-write-batching.zh.md:15` e `docs/user/develop/basic/{index,publish}.md` (âncora `#run-from-source`). Nada em `docs/dshc/` |
| `pnpm run verify-doc-budgets` | ✅ |

> **"Parar se" da Onda 0 disparou: o baseline não compila.** Nada nas ondas seguintes deve ser medido contra este baseline antes de ele ficar verde. Proposta abaixo, em "Próximo passo sugerido".

### Typecheck: 65 erros, todos na face cliente

- **Causa raiz dos erros em `src/`:** os quatro pacotes cliente criados pelo fork não estão nas `references` do `tsconfig.client.json`: `ui-handoff`, `ui-memory`, `ui-projects` e `ui-routines` (os outros 40 estão). Isso gera os TS6307 ("not listed within the file list") e deixa sem resolver a declaration merging do `LocaleNamespaceMap`; daí os TS2339 "Property 't' does not exist" em `ui-handoff/src/client/ArtifactsModal.tsx:74,130`, `ui-memory/src/client/MemorySection.tsx:34`, `ui-projects/src/client/ProjectsSection.tsx:48,127` e `ui-routines/src/client/RoutinesSection.tsx:25,43`.
- **Testes defasados em relação a mudanças do fork** (57 erros em `tests/`): `ui-tool` 10, `ui-routines` 10, `ui-memory` 7, `ui-layout` 6 (slot `details` removido, `SessionProvider`, tema só escuro), `ui-projects` 5, `ui-handoff` 5, `ui-sidebar` 4, `ui-workspace` 3, `ui-theme` 3, `ui-user-questions` 2, `locale` 1, `test-support/client-runtime` 1 (`openDetails`).

### Lint: 299 erros

Quase tudo é formatação em código do fork: `@stylistic(indent)` em `ui-workspace` (166), `ui-conversation` (44, a maior parte em `skeleton/InputBar.tsx:873-890`) e `ui-sidebar` (23), mais `arrow-parens` e `quotes`. Há também regras de tipo: `no-unnecessary-condition` em `ui-theme/src/client/index.ts:249` (efeito do tema só escuro), `no-unnecessary-type-assertion` em `ui-routines`, e `no-unnecessary-type-arguments` e `max-len` em `packages/sandbox/sandbox` (o `danger.ts` do commit `156bc55e8`).

### Testes: 21 falhas em 3 grupos

| Grupo | Falhas | Arquivos | Leitura |
|---|---|---|---|
| **Regressões reais do fork** | 11 | `ui-trajectory/tests/views.client.spec.tsx` (7, "tab switching in ConversationRoot"); `ui-brand-official/tests/browser-plugin.client.spec.tsx` (1); `ui-settings-plugin-inventory/tests/browser-plugin.client.spec.tsx` (1); `ui-workspace/tests/rows.client.spec.tsx:503` (1, "idle hover card"); `scripts/locale-dictionary-parity.spec.ts` (1, chaves zh × en divergentes) | Coerentes com as mudanças de chrome, marca e locale pt do fork. Precisam de correção antes da Onda 1. |
| **Ambiente: processo como root** | 7 | `subagent-acp`, `subagent/out-of-process`, `context/agent-instructions`, `settings-file/local` e `concurrency`, `storage-sqlite`, `shell/bash-sandbox` | Todos testam arquivo ou diretório sem permissão; root ignora `chmod`. Provavelmente passam com usuário comum; o CI é a fonte da verdade. |
| **Ambiente: binários e rede** | 2 + 1 | `subagent-claude-code/tests/real-product.spec.ts:329,468` (há um `claude` real em `/opt/node22/bin/claude` no PATH); `test-support/llm-mock-server/tests/server.spec.ts` ("formats an IPv6 listener") | Dependem do container; não atribuir a mudanças do fork sem rodar fora dele. |

## Desvios do plano e motivo

- Nenhum desvio de escopo. A onda não escreveu código, então não houve plan mode nem revisão por subagente.
- Não adicionei Agent Note: a mudança só acrescenta documentos de planejamento e não altera comportamento.

## Contradições encontradas entre PLANO e regras do repo

1. **G8 parte de um fato errado.** O estudo diz que há "3 media queries em `ui-layout` e `ui-sidebar`". Na verdade, essas duas folhas não têm nenhuma media query de largura; têm só `prefers-reduced-motion` (`packages/client/ui-layout/src/client/AppFrame.module.css`, 2 ocorrências; `packages/client/ui-sidebar/src/client/SidebarRoot.module.css`, 1). O comportamento responsivo do shell está em TypeScript: `computeColumns` e `SIDEBAR_AUTO_COLLAPSE = 1024` (`packages/client/ui-layout/src/client/columns.ts:29,52`). Abaixo de 1024px a sidebar vira um trilho de 56px e o centro absorve o resto: em 390px sobram 334px para a conversa. A Onda 2 precisa mexer no solver e no store (`stores.ts`, `narrowExpanded`), não só no CSS.
2. **`prefers-reduced-motion` já é usado em cerca de 20 folhas** de `packages/client/*`, inclusive no tema (`ui-theme/src/styles/claude-design.css`). O item 3 da Onda 2 deve centralizar tokens, não introduzir a media query.
3. **G7 (raciocínio) e item 19 (busca) já existem**; as ondas 7 e P2 correspondentes encolhem (ver matriz).
4. **Onda 3, "parar se":** o painel lateral de artifacts **exige um slot novo**. O `ui-layout` declara só `sidebar`, `conversation` e `shell.overlay` (`packages/client/ui-layout/src/client/index.ts:33-74`). Precisa de aprovação antes da Onda 3 (proposta abaixo).
5. **Marca visível ao modelo.** A Onda 1 lista só a UI, mas os quatro presets de agente dizem ao modelo "You are DSH Claude" (lista abaixo). Pelo `CLAUDE.md` ("Every non-trivial model-visible behavior change adds or updates a keyless snapshot"), trocar essa frase exige atualizar snapshots.

## Itens [verificar] resolvidos (com evidência: arquivo:linha)

| # | Item | Veredito | Evidência | Consequência para o plano |
|---|---|---|---|---|
| 2 | Projects: busca nos arquivos de conhecimento (RAG) | **não existe** | `packages/client/ui-projects/src/index.ts:88-123`: cada arquivo é lido inteiro, truncado em `KNOWLEDGE_FILE_MAX_CHARS = 20000` (`:40`), e injetado via `systemPrompt.context` (`:162`). O contexto entra no histórico como snapshot de runtime-context (`packages/core/system-prompt/README.md:21`), então "Model-visible ⟺ logged" é respeitado. | RAG continua P2. Observação: `KNOWLEDGE_FILE_MAX_CHARS` é um valor ajustável fixo no código, o que a regra "No hardcoded tunables" do `CLAUDE.md` proíbe; vale virar campo de `Config`. |
| 17 | Raciocínio visível (thinking) | **existe** | `packages/client/ui-conversation/src/client/chat/ReasoningRow.tsx:27`: linha "Think" recolhível (`DisclosureRow`), com resumo da última linha durante o streaming; usada em `AssistantMarkdown.tsx:66`. | G7 sai da Onda 7. Resta um polimento: o título `"Think"` está fixo em inglês (`ReasoningRow.tsx:49`), fora do dicionário pt. |
| 18 | Editar mensagem e ramificar | **parcial** | Ramificar existe: o botão de branch no fim de cada turno do assistente chama `forkAt(seq)` (`chat/TurnTailNodeView.tsx:45` → `apply.ts:401-406`, `sessions.fork({ atSeq, increaseTitle: true })`) e abre a sessão filha. Também há fork da sessão inteira pela sidebar (`ui-workspace/src/client/index.ts:89`). **Não existe** "editar mensagem do usuário"; o branch fica só no assistente (`chat/MessageItem.tsx:2`). A sidebar não mostra a linhagem dos ramos (`ui-workspace/src/client/tree.ts:133`, "without projecting session lineage"). | A Onda 7 fica com: editar a mensagem do usuário (fork no `seq` anterior + composer pré-preenchido) e mostrar a linhagem na sidebar. |
| 19 | Busca de conversas | **existe** | `ui-workspace/src/client/WorkspaceBrowser.tsx:34-43,316-370`: busca local por título e workspace, mais a busca de conteúdo no Host (`session.search`, debounce de 250ms, ranking e snippet); merge em `tree.ts:310-388`. O rodapé da sidebar dispara pelo evento `dshc:sidebar-search` (`ui-sidebar/src/client/SidebarRoot.tsx:36,225`). | Item 19 sai do roadmap. |
| G1 | Slot do painel lateral de artifacts | **não existe** | `ui-layout/src/client/index.ts:33-74` declara só `sidebar` (single), `conversation` (single) e `shell.overlay` (list, camada flutuante click-through). O modal de Artifacts do `ui-handoff` ocupa `shell.overlay` e abre pelo evento `dshc:sidebar-design` (`ui-handoff/src/client/index.tsx:29-58`). O solver de colunas só conhece duas (`columns.ts:14`). | **Proposta para aprovação:** o `ui-layout` declara um terceiro filho de `root`, por exemplo `'shell.aside': { kind: 'single'; scope: 'session-maybe' }`, e o `computeColumns` passa a resolver três colunas (aside fechado = 0). Alternativa sem slot novo: painel flutuante em `shell.overlay`, que cobre a conversa em vez de dividir a tela. |

### Matriz §3 atualizada (só as linhas que mudaram)

| # | Feature | Antes | Agora | Prioridade |
|---|---|---|---|---|
| 2 | Projects | ✅ + RAG [verificar] | ✅; RAG não existe | P2 |
| 17 | Raciocínio visível | 🟡 [verificar] | ✅ (falta só i18n do título) | P3 |
| 18 | Editar e ramificar | 🟡 [verificar] | 🟡: branch por turno existe; editar mensagem e linhagem na sidebar não | P1 |
| 19 | Busca de conversas | 🟡 [verificar] | ✅ (título + conteúdo via Host) | — |
| 20 | Mobile / responsivo | 🟡 "3 media queries" | 🟡: abaixo de 1024px, trilho de 56px que abre uma gaveta não modal com scrim e Escape (`AppFrame.tsx:111-183`), em JS; sem media query de largura no shell e sem layout de celular (≤ 600px). *Corrigido na Onda 0.5: a primeira versão deste relatório dizia que não havia gaveta.* | P0 |
| 4 | Artifacts (painel) | 🟡 | 🟡; painel lateral exige slot novo | P0 |

## Lista 1 — ocorrências visíveis de "Claude", "Anthropic", "DSH Claude" e "DeepSeek Harness Claude" (entrada da Onda 1)

Busca em `apps/web`, `apps/cli/config` e `packages/client/*/src`, excluindo testes, `lib/` e as referências legítimas a Claude Code (`subagent-claude-code`, `hooks-claude-code`).

**Visíveis ao usuário**

| Arquivo:linha | Texto |
|---|---|
| `apps/web/index.html:8` | `<title>DSH Claude</title>` |
| `apps/web/public/manifest.webmanifest:3` | `"name": "DSH Claude"` |
| `packages/client/ui-renderer/src/client/DocumentTitle.tsx:3` | `DEFAULT_CLIENT_TITLE = 'DSH Claude'` |
| `packages/client/ui-primitives/src/BrandWordmark.tsx:42` | wordmark "DeepSeek Harness Claude" |
| `packages/client/ui-sidebar/src/client/SidebarRoot.tsx:279` | fallback "DeepSeek Harness Claude" |
| `packages/client/ui-settings-models/src/client/locales.ts:90` | `profileTitle: 'Boas-vindas ao DSH Claude'` |
| `apps/web/public/favicon.svg` e `packages/client/ui-primitives/src/CoralBurst.tsx` | marca radial de 8 raios em coral; não é o glifo da Anthropic (4 raios, preto, segundo o próprio `DESIGN.md:320`), mas coral + radial lembra a identidade dela. Rever na Onda 1. |

**Visíveis ao modelo (identidade no system prompt)**

| Arquivo:linha | Texto |
|---|---|
| `apps/cli/config/agent-presets/standard/agent.cordis.yml:28` | "You are DSH Claude, a coding agent…" |
| `apps/cli/config/agent-presets/code/agent.cordis.yml:35` | idem |
| `apps/cli/config/agent-presets/cordis/agent.cordis.yml:21` | idem |
| `apps/cli/config/agent-presets/minimal/agent.cordis.yml:12` | "You are DSH Claude, a precise software engineer assistant…" |

**Documentação e comentários (não aparecem na UI, mas vão a público)**

- `DESIGN.md`: o frontmatter (`name: Claude-design-analysis`, linha 3) e as linhas 4, 303-531 e 584-585 descrevem a marca da Anthropic (spike-mark, "Try Claude", fontes licenciadas Copernicus/StyreneB).
- `packages/client/ui-theme/src/styles/claude-design.css:2,568` (nome do arquivo e cabeçalho), `ui-theme/src/styles/fonts.css:2`, `ui-theme/src/theme-settings.ts:6`, `ui-theme/src/boot-theme.ts:12`, `ui-theme/src/client/AppearanceRow.tsx:28`.
- Comentários "Claude layout"/"Claude-style": `ui-sidebar/src/client/SidebarRoot.tsx:2`, `SidebarRoot.module.css:310`, `ui-workspace/src/client/WorkspaceBrowser.tsx:657`, `WorkspaceBrowser.module.css:41`, `ui-conversation/src/client/skeleton/PlusMenu.tsx:1`, `EmptyHero.tsx:1`.
- `docs/dshc/pesquisa/claude-behavior-research.md` e `docs/dshc/pesquisa/claude-behavior-applied.md` (movidos para `docs/dshc/pesquisa/` na Onda 0.5).

## Lista 2 — onde `danger-full-access` é escolhido e o que muda para `workspace-write` (entrada da Onda 1)

**Onde é escolhido hoje**

| Arquivo:linha | O que faz |
|---|---|
| `packages/bundle/base/cordis.patch.yml:176` | `sandbox-policy.mode: !!js process.env.DSH_PERMISSION_MODE ?? 'danger-full-access'`: o padrão de toda sessão |
| `packages/bundle/base/cordis.patch.yml:190-193` | `approval.policy: 'ask'` fixo |
| `packages/bundle/base/cordis.patch.yml:196-205` | tabela de presets com uma entrada só: `danger-full-access` (sandbox total + `ask`) |
| `examples/jsonrpc-agent/minimal.cordis.yml:26` | exemplo com `mode: danger-full-access` |

**O que já existe e não precisa ser escrito**

- Os modos `read-only` e `workspace-write` continuam implementados: `packages/sandbox/sandbox/src/index.ts:35`, `sandbox-policy/src/session-mode.ts:42`, a escada de escalonamento em `sandbox/src/escalation.ts:29-41`, e os sandboxes `bash-sandbox`, `pwsh-sandbox` e `fs-sandbox`, que só pulam a confinação quando o modo é `danger-full-access`.
- O padrão do próprio serviço de presets já é `workspace-write` + `ask` (`packages/interaction/permission-presets/src/index.ts:177-190`); o bundle base é que sobrescreve.
- A UI já tem os ícones dos três níveis e um gate de risco para o acesso total: `ui-conversation/src/client/skeleton/PermissionSelect.tsx:10-40` (`RiskConfirmation`) e `ui-permission-presets/src/client/presentation.ts:2`.
- O gate de comandos destrutivos (`packages/sandbox/sandbox/src/danger.ts`) é independente do modo e continua valendo.

**O que muda (essencialmente reverter a parte de configuração do commit `156bc55e8`)**

1. `cordis.patch.yml:176`: padrão `'workspace-write'`, mantendo `DSH_PERMISSION_MODE` como escape explícito.
2. `cordis.patch.yml:196-205`: voltar a tabela com `read-only`, `workspace-write` (padrão) e `danger-full-access` selecionável, com `approval: ask` também no acesso total, para preservar o gate destrutivo.
3. Comentários das linhas 166-169, 189 e 195-196, que hoje descrevem a postura "always full access".
4. Testes do commit `156bc55e8`: `apps/web/tests/permission-policy-context.e2e.ts` e `apps/web/tests/shipped-composition.e2e.ts`, mais `apps/cli/reference/README.md` e `README.zh.md`.
5. Nenhuma mudança no `agent-loop`, então o "parar se" da Onda 1 não dispara.

## Próximo passo sugerido

1. **Antes da Onda 1, uma "Onda 0.5: baseline verde"**, com PRs pequenos e só correções:
   - adicionar `ui-handoff`, `ui-memory`, `ui-projects` e `ui-routines` às `references` do `tsconfig.client.json` e corrigir o que sobrar em `src/`;
   - atualizar os testes defasados (typecheck de `tests/` e as 11 regressões reais);
   - `oxlint --fix` nas regras de formatação e correção manual das regras de tipo;
   - confirmar no CI que as 10 falhas de ambiente não se reproduzem fora do container.
2. Aprovar ou ajustar a proposta de slot `shell.aside` (contradição 4) antes da Onda 3.
3. Decidir se a troca da identidade "You are DSH Claude" nos presets entra na Onda 1 (recomendo que sim, com os snapshots).
4. Depois do baseline verde, abrir a Onda 1 com os dois PRs ("brand" e "sandbox-default") a partir das listas acima.
