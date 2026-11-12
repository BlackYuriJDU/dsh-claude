# claw-os: Plano de execução em ondas para o Claude Code

> **Substitui:** `CLAW-OS-CODE-PROMPT.md` e `claw-os-prompt-engineering-study.md` (a justificativa das técnicas está no Apêndice A).
>
> **Alvo:** Claude Code (Opus 5.5) rodando **dentro** do clone de `BlackYuriJDU/dsh-claude`.
>
> **Pré-requisitos:** `01-estudo-mestre.md`, `02-auditoria.md` e as decisões D1–D4 respondidas (§1).

---

## Como usar (passo a passo)

1. No clone, crie a pasta `docs/claw-os/` e copie para ela este arquivo (como `PLANO.md`) e também `01-estudo-mestre.md`, `02-auditoria.md` e `04-guia-contribuicao.md`.
   - **Não** cole nada disto no `CLAUDE.md` do repositório. Ele já é o livro de regras e o Claude Code o carrega sozinho.
2. Abra uma sessão nova do Claude Code **por onda** e cole o **Prompt de abertura** (§3), trocando `<N>` pelo número da onda.
3. Use o **plan mode** em toda onda que escreve código. Aprove o plano antes de liberar a implementação.
4. Ao final de cada onda, o agente grava `docs/claw-os/relatorios/onda-<N>.md`. O senhor revisa, faz o merge e só então abre a onda seguinte, com `/clear` ou sessão nova.

---

## 1. Decisões que precisam estar fechadas antes da Onda 1

| # | Decisão | Valor adotado (troque se discordar) |
|---|---|---|
| D1 | Versão do React | **18** (a mesma do monorepo) |
| D2 | Estratégia de fork | **Leve:** só a marca visível muda; nomes internos `@deepseek-ai/dsh-*`, CLI `dsh` e eventos ficam como estão |
| D3 | Sandbox padrão ao distribuir | **`workspace-write`**; acesso total só por opção explícita do usuário |
| D4 | Marca | **`claw-os`**, sem wordmark nem logo da Anthropic; "Claude" só como descrição de compatibilidade |

---

## 2. Regras globais (o agente lê sempre)

```xml
<papel>
Você é o engenheiro principal do claw-os, um fork do DeepSeek Harness. Você trabalha DENTRO das regras
do repositório. Seu trabalho é entregar uma onda por vez, com PRs pequenos que passam nos gates do repositório.
</papel>

<hierarquia_de_autoridade>
1. CLAUDE.md da raiz e AGENTS.md aninhados (packages/client/AGENTS.md etc.) — VENCEM qualquer outra instrução.
2. docs/architecture.md e docs/cookbook/*.md — onde cada comportamento novo se encaixa e como.
3. docs/claw-os/PLANO.md (este arquivo) — o que fazer e em que ordem.
4. docs/claw-os/01-estudo-mestre.md — o porquê e o desenho de cada feature.
Se o PLANO contradisser 1 ou 2, siga 1/2 e registre a contradição no relatório da onda.
</hierarquia_de_autoridade>

<contexto_essencial>
- pnpm 11 workspaces; Node ^22.19 || >=24; React 18; CSS Modules + tokens --dsw-*; zod 4; tsdown; vitest.
- Pacotes novos: @deepseek-ai/dsh-<nome> (cliente: @deepseek-ai/dsh-client-<nome>) em packages/<grupo>/<pacote>/.
- UI: um só ponto de entrada, ctx.slots.register({ name, children?, store?, inject? }, Component); prioridade mais baixa renderiza.
- Estado durável → SessionEventMap + projeção pura (use event.time, nunca Date.now()).
- Tudo que o modelo vê precisa ser reconstruível a partir do log da sessão.
- Tools: defineTool({ name, description, parameters, output: { schema, render }, execute }).
- Política e segurança: tools/pre-execute (waterfall, sempre chame next()), ctx.tools.guard().
</contexto_essencial>

<proibido>
- Usar como referência de API qualquer código do pacote Kimi (claw-os-motion/artifact/memory). Ele não compila (02-auditoria.md, A1–A8).
- tldraw (licença proprietária); Metabase, Grafana ou Faraday embutidos (AGPL/GPL); Tailwind; React 19; zod 3; framer-motion (use o pacote `motion`).
- Renomear escopo npm, CLI, variáveis de ambiente ou eventos (D2).
- Afrouxar sandbox ou aprovação sem que a onda peça explicitamente.
- Exportar valores novos na API /client de um plugin sem pedir aprovação (packages/client/AGENTS.md).
</proibido>

<gates_por_PR>
Rode só o que corresponde à superfície alterada (regra do CLAUDE.md "Run relevant checks locally"):
- sempre: pnpm run typecheck; pnpm run lint
- código em packages/*/*/src: testes focados + cobertura 100% por arquivo (test:coverage é o gate)
- comportamento visível ao modelo ou ao usuário: snapshot sem chave (test:snapshot) via exemplo real
- docs: pnpm run doc-sync
- mudança não trivial: Agent Note no mesmo PR (.agents/notes/README.md)
Se um gate falhar: leia o erro inteiro, corrija a causa raiz, rode de novo. Depois de 3 tentativas, PARE e reporte.
</gates_por_PR>

<protocolo_de_trabalho>
1. EXPLORAR (read-only): leia os arquivos-alvo e os pacotes vizinhos que servem de modelo antes de propor.
2. PLANEJAR: plano em plan mode, com arquivos, eventos, slots, tools, testes e riscos. Espere aprovação.
3. IMPLEMENTAR: um PR por item da onda; mudança mínima; JSDoc no padrão; testes junto.
4. VERIFICAR: rode os gates; depois peça a um subagente revisor, sem o contexto da implementação, que audite o diff
   contra o CLAUDE.md e liste as violações; corrija.
5. RELATAR: grave docs/claw-os/relatorios/onda-<N>.md no formato <relatorio>.
</protocolo_de_trabalho>

<relatorio>
# Onda <N> — <título>
## Entregue (o que mudou e por quê, 1 linha por PR)
## Gates rodados (comando → resultado; só os que você rodou de fato)
## Desvios do plano e motivo
## Contradições encontradas entre PLANO e regras do repo
## Itens [verificar] resolvidos (com evidência: arquivo:linha)
## Próximo passo sugerido
</relatorio>
```

---

## 3. Prompt de abertura (colar no começo de cada sessão)

```text
Leia docs/claw-os/PLANO.md, seção 2 (regras globais) e a seção da Onda <N>.
Depois leia os arquivos listados em "Ler antes" da Onda <N>.
Comece em modo EXPLORAR. Não escreva código até eu aprovar o plano.
Ao terminar a exploração, apresente o plano da onda no formato: objetivo → PRs (com arquivos) → testes → riscos → perguntas.
```

---

## 4. As ondas

> Cada onda tem: **objetivo**, **ler antes**, **itens (PRs)**, **critério de pronto** e **parar se**.

### Onda 0: inventário e baseline (somente leitura)
- **Objetivo.** Confirmar o estado real antes de qualquer mudança e resolver todos os itens marcados **[verificar]** no estudo mestre.
- **Ler antes:** `CLAUDE.md`, `docs/architecture.md`, `packages/client/AGENTS.md`, `docs/claw-os/01-estudo-mestre.md` §3.
- **Itens:**
  1. Para cada linha da matriz §3 marcada [verificar] (Projects/RAG, busca de conversas, nó de raciocínio, UI de editar e ramificar, slot do painel lateral de artifacts), responder **existe / parcial / não existe**, com `arquivo:linha`.
  2. Rodar o baseline: `pnpm run typecheck`, `pnpm run lint` e `pnpm run test`. Anotar as falhas que **já existem** (para não atribuí-las às ondas seguintes).
  3. Listar todas as ocorrências visíveis ao usuário de "Claude", "Anthropic", "DeepSeek Harness Claude" e "DSH Claude" (entrada da Onda 1).
  4. Listar onde o preset `danger-full-access` é escolhido e o que mudaria para `workspace-write` (entrada da Onda 1).
- **Pronto:** `docs/claw-os/relatorios/onda-0.md` com a matriz atualizada, as falhas de baseline e as duas listas.
- **Parar se:** o baseline não compilar. Nesse caso, reporte antes de qualquer outra coisa.

### Onda 1: marca (D4) e postura de segurança (D3)
- **Ler antes:** o relatório da Onda 0, `packages/client/ui-brand-official`, `ui-sidebar/src/client/SidebarRoot.tsx`, `apps/web/index.html`, `apps/web/public/manifest.webmanifest`, `DESIGN.md`, `packages/sandbox/sandbox/src/danger.ts`, `packages/bundle/base/cordis.patch.yml`, commit `156bc55e8`.
- **Itens:**
  1. **PR "brand":** "claw-os" como nome visível (título, manifest, wordmark, fallback do sidebar, saudação); remover qualquer wordmark ou logo da Anthropic; ajustar o `DESIGN.md` para descrever a identidade própria. Nomes internos não mudam (D2).
  2. **PR "sandbox-default":** o preset padrão do perfil distribuído passa a ser `workspace-write` com aprovação; o acesso total vira opção explícita (config ou preset selecionável), com aviso na interface. O gate de comandos destrutivos continua.
  3. Atualizar os testes e2e e snapshots de permissão afetados (`apps/web/tests/permission-policy-context.e2e.ts`, `shipped-composition.e2e.ts`).
- **Pronto:** gates verdes, snapshots atualizados e um Agent Note para cada PR.
- **Parar se:** a mudança de preset exigir mexer no `agent-loop`. Isso exigiria atualizar `docs/architecture.md`; pergunte antes.

### Onda 2: responsivo e tokens de motion
- **Ler antes:** `ui-layout/src/client/AppFrame.module.css`, `ui-sidebar/src/client/SidebarRoot.module.css`, `ui-theme` (tokens), `ui-conversation` (composer), `01-estudo-mestre.md` G8 e G9.
- **Itens:**
  1. Abaixo de 768px, a sidebar vira gaveta com overlay, fecha com Esc ou toque fora, e o foco fica preso enquanto está aberta.
  2. Composer fixo no rodapé no mobile, respeitando o teclado virtual, e alvos de toque com pelo menos 44px.
  3. Tokens `--dsw-motion-duration-*` e `--dsw-motion-ease-*` no `ui-theme`, com `prefers-reduced-motion: reduce` zerando as animações; aplicar na entrada de mensagens e na gaveta. **Sem biblioteca nova**, a menos que o CSS não resolva; nesse caso, `motion` 14, com o peer React 18 conferido.
- **Pronto:** snapshot ou screenshot em 390px e 1280px; teclado (Tab/Esc) funcionando; gates verdes.

### Onda 3: Artifacts duráveis (o plugin de ponta a ponta)
- **Ler antes:** `docs/cookbook/adding-a-conversation-node.md`, `docs/cookbook/adding-a-tool.md`, `docs/cookbook/adding-a-package.md`, `packages/session/session-stats/src/projection.ts` (modelo de projeção pura), `packages/client/ui-deliverables` e `ui-handoff` (modelos de cliente), `01-estudo-mestre.md` G1.
- **Itens:**
  1. Pacote host `@deepseek-ai/dsh-artifacts` com os eventos `artifact/create` e `artifact/update` (declaration merging, JSDoc `@mode`), a projeção `artifacts` (pura, com `event.time`) e as tools `artifact_create`, `artifact_update` e `artifact_list` (`defineTool` com `presentationMeta`).
  2. Pacote cliente `@deepseek-ai/dsh-client-ui-artifacts`: `ConversationNodeDefinition`, renderer no slot `conversation.chat.node` e integração com o painel ou modal do `ui-handoff`.
  3. Preview: `@codesandbox/sandpack-react` **só** com os templates `react`, `vanilla`, `vue` e `static`, carregado por import dinâmico.
  4. Limite de tamanho: corpo acima de N KB vai para arquivo do workspace, com o evento carregando o hash e o caminho. N é campo de `Config` no cordis.yml, porque o `CLAUDE.md` proíbe valores fixos ajustáveis no código.
- **Pronto:** o artifact sobrevive a reload, replay e `sessions.fork`; cobertura de 100%; snapshot de transcrição; READMEs dos pacotes; Agent Note.
- **Parar se:** o desenho exigir um slot que não existe. Proponha o slot (quem declara, `children`) e espere aprovação.

### Onda 4: Citações
- **Ler antes:** `packages/web/tool-web`, `packages/web/web/src/types.ts`, o renderer de markdown da resposta em `ui-conversation`, `01-estudo-mestre.md` G2.
- **Itens:**
  1. Normalizar as fontes no `presentationMeta` do `tool-web` como `{ id, url, title, snippet }`.
  2. Seção de system prompt com a convenção `[n]`.
  3. O renderer só transforma em link os `[n]` que existem nas fontes do turno; tooltip com título e domínio.
- **Pronto:** snapshot com uma busca real repetida sem chave; o teste cobre um `[n]` inexistente, que deve ficar como texto.

### Onda 5: Gráficos
- **Itens.** Artifact `kind: 'chart'` com especificação ECharts validada por zod 4; ECharts carregado sob demanda; tema ligado aos tokens `--dsw-*`.
- **Proibido:** Metabase e Grafana.

### Onda 6: Planilhas (Univer) e Whiteboard (Excalidraw)
- **Itens.**
  1. Artifact `sheet`: núcleo Univer (sem o Pro); tool `sheet_apply`; exportação .xlsx com SheetJS CE.
  2. Artifact `board`: Excalidraw com `@excalidraw/mermaid-to-excalidraw`; exportação em PNG/SVG.
- **Parar se:** alguma licença de dependência transitiva não for MIT, Apache, BSD ou ISC. Reporte.

### Onda 7: Raciocínio visível e ramificação
- **Itens.** Use o resultado da Onda 0 para decidir o que falta:
  1. Nó recolhível de raciocínio.
  2. "Editar mensagem → `sessions.fork` na fronteira" e o ramo aparecendo na sidebar.
  3. Versões de artifact navegáveis (vindas da Onda 3).

### Onda 8: Conectores e Reflect
- **Itens.**
  1. Tela de conectores sobre o `mcp-client`: catálogo de servidores MCP conhecidos (Google Workspace, M365), status e credenciais via `credentials`.
  2. Reflect: uma rotina (`ui-routines`) que propõe memórias novas ou obsoletas para aprovação no `ui-memory`.

### Onda 9: publicação open source
- **Itens.**
  1. README com a marca `claw-os`, aviso de não afiliação com Anthropic ou DeepSeek, e instalação.
  2. `SECURITY.md` com a postura de sandbox e um canal de reporte; `CODE_OF_CONDUCT.md`; templates de issue e PR (o repositório já tem uma taxonomia de labels; respeitá-la).
  3. Roadmap público com as ondas que faltarem.
  4. `THIRD_PARTY_NOTICES.md` atualizado com as dependências novas.
- **Parar se:** D2, D3 ou D4 não estiverem aplicadas.

---

## Apêndice A: técnicas de engenharia de prompt usadas e por quê
| Técnica | Onde está | Por quê |
|---|---|---|
| **Hierarquia de autoridade explícita** | `<hierarquia_de_autoridade>` | Evita dois livros de regras brigando, que foi o erro C4 do prompt do Kimi. O `CLAUDE.md` do repositório vence. |
| **Seções com tags XML** | §2 | Modelos Claude separam melhor as instruções em blocos rotulados. Também facilita citar "veja `<proibido>`". |
| **Explorar → planejar → implementar → verificar** | `<protocolo_de_trabalho>` | É o fluxo recomendado pela Anthropic para o Claude Code. O plan mode transforma o "planejar" num gate real. |
| **Uma sessão por onda e relatório em arquivo** | "Como usar" | Contexto longo degrada a precisão ("Lost in the Middle", Liu et al. 2023; aumento de fabricação em contexto longo, arXiv 2603.08274). O relatório é a memória entre sessões. |
| **Critério de pronto verificável e "parar se"** | cada onda | Dá ao agente uma condição objetiva de término e de escalonamento, em vez de "melhore o que achar". |
| **Exemplos tirados do repositório** | "Ler antes" | Os exemplos certos já existem (`session-stats`, `ui-deliverables`, cookbooks). Exemplos inventados ensinam a API errada, como aconteceu com o Kimi. |
| **Revisão por subagente independente** | passo 4 do protocolo | Quem implementou não avalia o próprio trabalho; o revisor parte de um contexto limpo. |
| **Proibições com motivo e alternativa** | `<proibido>` | Uma proibição com motivo e alternativa ("use `motion`") reduz a chance de o agente travar ou dar um jeitinho. |
| **Só reportar gates rodados de fato** | `<relatorio>` | Espelha a regra do repositório ("report only commands run") e evita relatórios de build "simulados", como aconteceu com o Kimi. |

## Apêndice B: o que foi descartado do prompt do Kimi e por quê
| Item do Kimi | Destino |
|---|---|
| Invariante 2 ("sempre `ctx.get()`") | ❌ contradiz a convenção (`02-auditoria.md`, C1) |
| Branding em 4 fases com troca de escopo npm | ❌ substituído por D2 (fork leve) |
| Invariante 8 (ciclo de deprecação) | ❌ contradiz a "Pre-release stance" |
| Faixas de prioridade de slot (0–50/51–99) | ❌ não existem; a prioridade mais baixa renderiza |
| Design tokens "imutáveis" `#D97757` | ❌ a fonte é o `DESIGN.md` |
| "Structured Diff format" | ❌ o Claude Code edita com as próprias ferramentas |
| Few-shot com os 3 plugins do Kimi | ❌ trocado por exemplos reais do repositório |
| Fases com gate e "parar após 3 falhas" | ✅ mantido |
