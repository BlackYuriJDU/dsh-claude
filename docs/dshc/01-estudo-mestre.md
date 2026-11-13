# DSHC: Estudo Mestre v2

> **Substitui:** `dshc-estudo-mestre.md`, `DSHC-turno6-triple-check.md`, `DSHC-turno3-deepdive.md`, `DSHC-imagens-analise.md`, `DSHC-cowork-study.md`, `DSHC-responsive-analysis.md` e a parte de estudo dos protótipos.
>
> **Base:** `BlackYuriJDU/dsh-claude` @ `c1f0f4ec5` (24/09/2026), lido e compilado nesta sessão; checagem de fatos externos de 11/11/2026 (`05-checagem-de-fatos.md`); auditoria (`02-auditoria.md`).
>
> **Regra deste documento:** toda afirmação sobre o repositório cita **arquivo, pacote ou commit**. Toda afirmação externa cita fonte. O que não foi possível verificar está marcado **[verificar]**.

---

## 0. Como ler

| Se o senhor quer… | Vá para |
|---|---|
| Saber o que o DSHC é e por que existe | §1 |
| Saber o que **já existe** no fork | §2 |
| Comparar com o claude.ai, feature por feature | §3 |
| O estudo de cada gap real (teoria e prática) | §4 |
| Bibliotecas, licenças e versões | §5 |
| Design, motion e responsivo | §6 |
| Segurança | §7 |
| Qual caminho seguir (os A–D do Kimi, reavaliados) | §8 |
| Executar | `PLANO.md` |

---

## 1. Tese e posicionamento

### 1.1 A tese, com a origem correta
- **"Agent = Model + Harness".** O modelo raciocina e o harness dá a ele ferramentas, sessão, sandbox e loop. A fórmula foi popularizada pelo post de Vivek Trivedy no blog da LangChain (10/03/2026). O termo "harness engineering" vem de Mitchell Hashimoto (05/02/2026). A DeepSeek **adotou** a frase, mas ela não é da DeepSeek.
- **O tema chegou à academia de sistemas operacionais.** O 2nd Workshop on Operating Systems Design for AI Agents (AgenticOS) aconteceu junto da SOSP 2026, em Praga, no dia 29/09/2026. A 1ª edição foi na ASPLOS, em março de 2026.
- **Base técnica:** o DeepSeek Harness (`deepseek-ai/deepseek-harness`, MIT, ~278,7k estrelas, preview v0.1 que avisa de quebras de compatibilidade) roda sobre o **Cordis**. O Cordis é um meta-framework de composição de plugins que veio do ecossistema Koishi e tem paper no arXiv (2608.25512; autores Shi, Zhang e Cui; afiliação **não** verificada).

### 1.2 O mercado, com os números corrigidos
| Projeto | O que é | Estrelas (nov/2026) | Licença |
|---|---|---|---|
| deepseek-ai/deepseek-harness | Harness tudo-plugin sobre Cordis (upstream do fork) | ~278,7k | MIT |
| anomalyco/opencode | Agente de código nativo de terminal | ~226k | MIT |
| nexu-io/open-design | Alternativa ao Claude Design, local-first, BYOK | ~107k | **Apache-2.0** |
| lobehub/lobehub | Chat multi-provedor | ~84,7k | ver repo |
| different-ai/openwork | Alternativa ao Claude Cowork, sobre o OpenCode | ~24,5k | MIT (o "Den" é source-available) |
| plannotator/artifact-server | Artifacts self-hosted com MCP | ~262 | MIT OR Apache-2.0 (era AGPL até a v0.1.1) |

### 1.3 Diferencial: o que é defensável
O Kimi dizia que "ninguém combina kernel micro + UI estilo Claude + BYOK + segurança". Parte disso o fork **já entrega**: kernel tudo-plugin, UI estilo Claude (§2) e multiprovedor, porque o `llm-pi-ai` implementa a API `anthropic-messages` em `packages/llm/llm-pi-ai/src/provider.ts`. O que ainda falta para virar diferencial real:

1. **Artifacts e workspaces duráveis no log da sessão.** Replay, fork e auditoria funcionam de graça, porque tudo é evento (§4, G1).
2. **Segurança configurável e explicável**, com política em `tools/pre-execute`, sandbox real e trilha no log (§7). Hoje o padrão é acesso total.
3. **Licença limpa**: só dependências MIT/Apache no núcleo (§5).

### 1.4 Nome e marca (decisão D4)
O fork hoje se apresenta como "DSH Claude" e usa a "serif Claude wordmark" (`apps/web/index.html`, `SidebarRoot.tsx:279`, commit `8a21a329a`). "Claude" e "Anthropic" são marcas de terceiros (**não sou advogado**; ver `02-auditoria.md`, J1). Proposta:
- **Nome público:** `DSHC`.
- **Como citar o Claude:** de forma descritiva, por exemplo "Funciona com modelos Claude, DeepSeek e outros via API". Nunca "o sistema operacional **do** Claude.ai".
- **Visual:** paleta quente própria, inspirada no Claude mas sem copiar, e sem nenhum logo ou wordmark da Anthropic.

---

## 2. Base real: o que o fork já é

### 2.1 Estrutura (fatos do repositório)
- Monorepo **pnpm 11.7** (`package.json`, campo `packageManager`), Node `^22.19 || >=24`, TypeScript 6, build com `tsc` e `tsdown`, testes com Vitest 4 e lint com oxlint.
- **50 grupos** em `packages/`. Os pacotes se chamam `@deepseek-ai/dsh-<nome>`, e os do cliente `dsh-client-<nome>`. O Cordis e o schemastery estão vendorizados em `vendor/`.
- Cliente web: `apps/web` com **44 pacotes** em `packages/client/*`, React **18.2**, CSS Modules e tokens `--dsw-*` (~360 definidos no `ui-theme`). Não há Tailwind.
- O próprio repositório traz um livro de regras rígido: `CLAUDE.md` (= `AGENTS.md`), `packages/client/AGENTS.md`, `docs/architecture.md` e os cookbooks em `docs/cookbook/`. Entre os gates estão 100% de cobertura por arquivo, snapshots, Agent Notes e JSDoc obrigatório.

### 2.2 O que o fork acrescentou ao upstream (git log)
| Área | Entrega | Commit |
|---|---|---|
| Identidade | "DSH Claude": marca coral, wordmark serifada, títulos, favicon | `285197a86` |
| Design system | pacote "warm canvas editorial": fontes, tokens, código escuro, display serifado | `a19ed0024` |
| Tema | só escuro, shimmer coral, personas "Claude charter" | `5d0e5c76c` |
| Conversa | saudação hero no estilo Claude e composer com Chat/Cowork, microfone e menu + | `e3d072939`, `d74e04f68` |
| Sidebar | menu lateral Projetos/Artefatos/Código/Personalizar, rodapé de perfil | `28907228b`, `8a21a329a` |
| Layout | shell de duas colunas | `e37457195` |
| **Memória** | memória durável entre sessões, injetada no system prompt, com tela de configuração (`ui-memory`) | `e37457195` |
| **Projetos** | instruções e arquivos de conhecimento por projeto (`ui-projects`) | `07c83e956` |
| **Rotinas** | tarefas recorrentes agendadas (`ui-routines`) | `3ca29fa02` |
| **Artifacts** | modal agregando os entregáveis de cada turno (`ui-handoff`) | `319f3c118` |
| Idioma | interface em en/pt; o idioma da interface vai para as respostas do modelo | `1e918f87b`, `afc879970` |
| Instância | `DSH_HOME` isolado (`~/.dshc`) e porta 3090 | `5960d3661` |
| Sandbox | **acesso total sempre**, com gate para comandos destrutivos | `156bc55e8` |
| Configurações | perfil, conta, navegação agrupada, instruções permanentes do dono | `56dda7240`, `2599be301` |

### 2.3 Herdado do upstream e relevante para o DSHC
Skills (`packages/skill/*` e `ui-skill`), subagentes, incluindo **Claude Code e Codex como subagentes** (`subagent-claude-code`, `subagent-codex`), hooks compatíveis com Claude Code (`hooks-claude-code`), modo plano (`ui-plan`), objetivos, workflows, jobs, cliente MCP (`packages/mcp/mcp-client`), web search e fetch com provedores Exa, Perplexity e DeepSeek (`packages/web/*`), anexos, LSP, terminal persistente, E2B, ACP e SDKs em TypeScript e Python.

> **Correção central sobre o Kimi:** o "Cowork" (agente trabalhando nos arquivos reais da máquina) **é o próprio harness**. O dsh já roda localmente, com `fs`, `shell`, `terminal` e o seletor de diretórios. Não falta um "runtime Cowork"; falta, no máximo, polir a interface de arquivos.

---

## 3. Matriz de paridade: claude.ai (nov/2026) × DSHC

**Legenda.** ✅ existe · 🟡 parcial · ❌ não existe · **[verificar]** confirmar na Onda 0 do plano.

**Status do claude.ai:** Docs, Slides e Design saíram em 16/09/2026 e estão fora de beta. Dashboards e Motion saíram em 08/10/2026 e estão em beta. Cowork foi fundido ao chat em 16/09/2026. Visualizações inline estão em beta desde 12/03/2026 (fontes em §9). **Sheets e Whiteboard** aparecem como tipos de artifact no produto, mas **não encontrei anúncio público com data**; a "novidade de 10/nov" do Kimi não foi confirmada.

| # | Feature do claude.ai | DSHC hoje | Evidência | Gap real | Mecanismo no repositório | Prioridade |
|---|---|---|---|---|---|---|
| 1 | Chat com streaming | ✅ | `ui-conversation`, `assistant/chunk` | polimento | — | — |
| 2 | Projects | ✅ | `ui-projects` | busca nos arquivos de conhecimento (RAG) **[verificar]** | `systemPrompt.section` + tool | P2 |
| 3 | Memória | ✅ | `ui-memory` | revisão no estilo "Reflect" | estender `ui-memory` | P2 |
| 4 | Artifacts (painel, versões, publicar) | 🟡 | `ui-handoff`, `ui-deliverables` (só arquivos produzidos) | **artifact como objeto durável com preview e versões** | família de eventos + `ConversationNodeDefinition` + tool | **P0** |
| 5 | Docs / Slides / Design | 🟡 | arquivos no workspace | renderização e edição inline | tipos de artifact (G1) | P2 |
| 6 | Sheets | ❌ | — | planilha inline | artifact `sheet` (Univer) | P1 |
| 7 | Whiteboard / diagramas | ❌ | — | quadro inline | artifact `board` (Excalidraw) | P1 |
| 8 | Dashboards / visualizações inline | ❌ | — | gráficos a partir de dados de tools | artifact `chart` (ECharts) | P1 |
| 9 | Motion (vídeo animado) | ❌ | — | fora do escopo de um harness | — | P3 |
| 10 | Tarefas agendadas | ✅ | `ui-routines` | — | — | — |
| 11 | Skills | ✅ | `packages/skill/*`, `ui-skill` | — | — | — |
| 12 | Conectores (MCP) | 🟡 | `mcp-client` | interface de catálogo e config; OAuth de Google/M365 | MCP + `credentials` | P2 |
| 13 | Conectores interativos (MCP Apps) | ❌ | — | UI de tool em iframe | `conversation.chat.node` + iframe isolado | P3 |
| 14 | Cowork (arquivos locais) | ✅ | `fs`, `shell`, `terminal`, `ui-directory-picker-*` | — | — | — |
| 15 | Claude Code | ✅ | `subagent-claude-code`, `hooks-claude-code` | — | — | — |
| 16 | Pesquisa web com **citações** | 🟡 | `tool-web` + provedores | citação inline clicável na resposta | `presentationMeta` + renderer | **P0** |
| 17 | Raciocínio visível (thinking) | 🟡 | `runtime/.../sessions/partial.ts` trata reasoning | bloco recolhível na UI **[verificar]** | renderer de nó | P1 |
| 18 | Editar mensagem e ramificar | 🟡 | `ctx.sessions.fork` existe; o cliente referencia fork | UI de "editar e ramificar" **[verificar]** | `sessions.fork` | P1 |
| 19 | Busca de conversas | 🟡 | `ui-sidebar` referencia search | **[verificar]** | — | P2 |
| 20 | Mobile / responsivo | 🟡 | 3 media queries no total em `ui-layout` e `ui-sidebar` | gaveta (drawer) no mobile, composer | CSS Modules | **P0** |
| 21 | Tema claro | ❌ (removido) | `5d0e5c76c`, "dark-only" | decidir se volta | `ui-theme` | P2 |
| 22 | Compartilhar e publicar | ❌ | — | exportar artifact (HTML/arquivo) | tool + download | P2 |
| 23 | Colaboração em tempo real | ❌ | — | o harness é para um usuário só | — | P3 |
| 24 | Computer use | ❌ | — | arriscado; adiar | sandbox + subagente | P3 |
| 25 | Segurança e permissões | 🟡 | `sandbox/*`, `user-approval`, `danger.ts` | **padrão em acesso total** (§7) | `tools/pre-execute`, preset de sandbox | **P0** |

**Resultado:** dos 10 "faltantes" do Kimi, **Projects, Skills e Claude Code já existem**. Reflect e Version History são **extensões** do que existe. Os gaps reais de P0 são **Artifacts duráveis, Citações, Responsivo e Postura de segurança**.

---

## 4. Estudo de cada gap real

Cada estudo segue o mesmo roteiro: **o que é → como o claude.ai faz → onde entra no repositório → desenho → biblioteca e licença → riscos → critério de pronto.**

### G1 · Artifacts duráveis (P0)
- **O que é.** Um objeto versionado (código, HTML, SVG, markdown, gráfico, planilha, quadro) que aparece ao lado do chat, tem histórico de versões e pode ser exportado.
- **Onde entra.** `docs/architecture.md`, tabela "Where new behavior goes":
  - "Add durable session state → extend `SessionEventMap`"
  - "Add a Web Client Chat node → register a `ConversationNodeDefinition` + keyed renderer"
  - "Add a model-facing capability → `ctx.tools`"
- **Desenho.**
  1. **Eventos:** `artifact/create` e `artifact/update`, este com `version` e o conteúdo inteiro ou um diff, declarados por declaration merging com JSDoc `@mode`, como exige o `CLAUDE.md`.
  2. **Tools:** `artifact_create`, `artifact_update` e `artifact_list`, com `defineTool`, `output.render` e `presentationMeta`, seguindo `docs/cookbook/adding-a-tool.md`. Cada execução emite o evento, então o que o modelo vê fica no log.
  3. **Projeção** `artifacts`: estado `{ id → { kind, title, versions[] } }`, **pura**, com timestamps vindos de `event.time` (o padrão do `session-stats`), nunca de `Date.now()`.
  4. **Nó de conversa** no slot `conversation.chat.node` para o cartão inline. Um **painel lateral** reaproveita o modal do `ui-handoff` ou um slot do shell de duas colunas **[verificar o slot]**.
  5. **Preview de código:** Sandpack só com os templates de browser (`react`, `vanilla`, `vue`, `static`), em iframe isolado.
- **Licenças.** Sandpack é Apache-2.0, mas os templates Nodebox têm EULA restritiva (§5).
- **Riscos.** Conteúdo grande no log: definir limite e guardar o corpo como arquivo do workspace, com o evento apontando para o hash. Executar código gerado: o iframe do Sandpack roda em outra origem.
- **Pronto quando:** um artifact sobrevive a reload, replay e `sessions.fork`; os snapshots de transcrição foram atualizados; a cobertura está em 100%.

### G2 · Citações (P0)
- **Como o claude.ai faz.** A resposta traz marcadores clicáveis que apontam para as fontes buscadas.
- **Onde entra.** O `tool-web` já devolve resultados dos provedores (`packages/web/*`). `presentationMeta` persiste os dados do cartão para o replay (cookbook de tools). O renderer da resposta recebe os marcadores.
- **Desenho.** (a) Normalizar as fontes num formato único `{ id, url, title, snippet }` no `presentationMeta` do `tool-web`. (b) Uma seção de system prompt (`ctx.systemPrompt.section`) instrui o modelo a citar com `[n]`. (c) O renderer de markdown transforma `[n]` em link com tooltip, usando as fontes do turno.
- **Riscos.** O modelo pode inventar número de fonte. O renderer só liga marcadores que existem no turno e deixa o resto como texto.

### G3 · Visualizações e gráficos (P1)
- **Desenho.** Artifact do tipo `chart` com especificação ECharts (JSON validado com zod 4) gerada pelo modelo a partir de dados de tools ou anexos. Renderizado com ECharts (Apache-2.0) e carregado por import dinâmico, para não pesar o bundle.
- **Fora:** Metabase e Grafana (AGPL). Só podem entrar como serviço externo.

### G4 · Planilhas (P1)
- **Biblioteca.** Univer, cujo núcleo é Apache-2.0. O Luckysheet foi arquivado em 30/10/2025, e o x-spreadsheet está parado. Colaboração e importação/exportação avançada são do Univer Pro, que é comercial: **não usar**.
- **Desenho.** Artifact `sheet`: o snapshot JSON do Univer vai em `artifact/update`. A exportação para .xlsx usa SheetJS CE (Apache-2.0) **[confirmar a versão no npm]**. O modelo edita por uma tool `sheet_apply` com operações de célula e fórmula.
- **Risco.** O bundle do Univer é grande; carregar sob demanda.

### G5 · Whiteboard (P1)
- **Biblioteca.** Excalidraw (MIT, ~135,5k estrelas), com `@excalidraw/mermaid-to-excalidraw` para o modelo gerar diagramas em Mermaid. **Proibido tldraw**, que exige chave de licença em produção.
- **Desenho.** Artifact `board`: o JSON da cena vai em `artifact/update`. Exportação em PNG/SVG pelo próprio Excalidraw.

### G6 · Ramificação e histórico de versões (P1)
- **Onde entra.** `ctx.sessions.fork(source, boundary?, childSessionId?)` (`docs/architecture.md`). O cliente já referencia fork (`runtime/.../sessions/service.ts`).
- **Desenho.** Um botão "editar mensagem" cria um fork na fronteira daquela mensagem, e a sidebar mostra o ramo. As versões de artifact vêm de G1.

### G7 · Raciocínio visível (P1)
- **Onde entra.** O runtime do cliente já trata reasoning (`runtime/src/client/sessions/partial.ts`). Falta confirmar se existe um nó recolhível **[verificar]**. Se não existir, entra como renderer de nó.

### G8 · Responsivo e mobile (P0)
- **Fato.** Há só 3 media queries em `ui-layout` e `ui-sidebar`.
- **Desenho.** Abaixo de 768px a sidebar vira gaveta com overlay e o composer fica fixo no rodapé, respeitando o teclado virtual (`visualViewport`). Alvos de toque com no mínimo 44px. Tudo em CSS Modules com os tokens `--dsw-*`, sem biblioteca nova.

### G9 · Motion (P1, dentro do G8 e do G1)
- **Por que não ser um plugin:** o sistema de slots **sombreia** em vez de embrulhar (prioridade mais baixa renderiza, e prioridade repetida lança erro, conforme `ui-slots/src/index.ts`). Um plugin "motion" que embrulha os nós dos outros, como o Kimi propôs, não cabe nesse modelo.
- **Desenho.** Primeiro, tokens de duração e easing em CSS (`--dsw-motion-*`) no `ui-theme`, com `@media (prefers-reduced-motion: reduce)`. A biblioteca `motion` (14.x; `framer-motion` é só um alias) entra apenas em componentes específicos, como a entrada de mensagens e a gaveta, se o CSS não bastar. Antes de adotar, conferir o peerDependency com React 18.

### G10 · Conectores (P2)
- **Desenho.** Não escrever conectores próprios. Usar servidores MCP já existentes para Google Workspace e M365, configurados pelo usuário, com credenciais pelo pacote `credentials`. A entrega real é uma **tela de conectores** (catálogo, status, autenticação) sobre o `mcp-client`.

### G11 · Revisão de memória ("Reflect") (P2)
- **Desenho.** Estender o `ui-memory` com um resumo periódico via `ui-routines` (que já agenda agentes): a rotina propõe memórias novas ou obsoletas e o usuário aprova na tela de configuração.
- **Por que não a regex do Kimi:** só funciona em inglês e é impura.

### G12 · Marketplace de plugins (P3)
- **Fato.** Já existem o inventário de plugins (`ui-settings-plugin-inventory`) e o `dsh plugin --profile <p> add <pacote>`.
- **Desenho.** Um índice JSON de bundles com nome, descrição, licença e permissões, lido pela tela de inventário. Nada de servidor próprio.

### Adiados de propósito (P3)
- **Colaboração em tempo real (Yjs):** o produto é de um usuário só, local.
- **Computer use:** alto risco, e o Open Interpreter mudou de stack (agora agente em Rust, Apache-2.0).
- **Motion em vídeo:** fora do escopo de um harness.

---

## 5. Bibliotecas: veredito único
| Biblioteca | Uso | Licença | Versão de referência | Veredito |
|---|---|---|---|---|
| `motion` (= `framer-motion`) | animação pontual | MIT | 14.12.0 | ✅ só onde CSS não basta; checar peer React 18 |
| `@codesandbox/sandpack-react` | preview de código | Apache-2.0 (Nodebox com EULA) | 2.x | ✅ só templates de browser |
| ECharts | gráficos | Apache-2.0 | 5.x/6.x **[conferir latest]** | ✅ import dinâmico |
| Univer (núcleo) | planilha | Apache-2.0 | latest | ✅ sem o Pro |
| SheetJS CE | exportar xlsx | Apache-2.0 | **[conferir]** | ✅ |
| Excalidraw | whiteboard | MIT | latest | ✅ |
| tldraw | whiteboard | proprietária | — | ❌ proibido |
| Luckysheet / x-spreadsheet | planilha | MIT | — | ❌ arquivado / parado |
| Metabase / Grafana | BI | AGPL | — | ❌ no núcleo; só como serviço externo |
| Faraday | segurança | GPL-3.0 | — | ❌ no núcleo |
| Semgrep | SAST | LGPL-2.1 | — | ⚠️ só como binário externo |
| Yjs | CRDT | MIT (o GitHub marca NOASSERTION) | — | ⏸ adiado |
| zod | schemas | MIT | **4.x** (padrão do repositório) | ✅ nunca 3.x |
| Tailwind / shadcn | estilo | MIT | — | ❌ o repositório usa CSS Modules |

---

## 6. Design, motion e responsivo
- **Fonte de verdade:** `DESIGN.md`, com primária `#cc785c` e canvas `#faf9f5`, e os tokens `--dsw-*` do `ui-theme`. **Os tokens do Kimi (`#D97757`, `#FAFAF8`) não entram.**
- **Decisão pendente:** o tema hoje é só escuro (`5d0e5c76c`). Recomendo reabrir o claro como opção, porque a paleta "warm canvas" do `DESIGN.md` é clara por natureza.
- **Ajuste de marca (D4):** trocar a wordmark "Claude" e o texto "DeepSeek Harness Claude" por "DSHC", e revisar o `DESIGN.md` para não descrever nem reproduzir a marca da Anthropic.
- **Protótipo `app/` do Kimi:** referência visual apenas (Tailwind 3 + React 19, incompatível com a base).

---

## 7. Segurança
- **Estado atual.** Sessões em `danger-full-access` com gate de comandos destrutivos (`156bc55e8`, `packages/sandbox/sandbox/src/danger.ts`). Ler segredos e mandá-los para fora não é "destrutivo" e passa sem pedir aprovação.
- **Modelo de ameaças mínimo:**
  1. Prompt injection vindo de web, arquivos ou MCP.
  2. Exfiltração de segredos (`~/.ssh`, `.env`, tokens).
  3. Comando destrutivo.
  4. Dependência maliciosa num plugin.
- **Desenho, usando só pontos de extensão que existem:**
  - **Postura (D3):** padrão público `workspace-write`; acesso total só por opção explícita, com aviso na tela.
  - **Política:** um plugin em `tools/pre-execute` que devolve `ask` para leitura fora do workspace, para rede de saída (curl/wget/fetch) com dados locais e para caminhos sensíveis. `ctx.tools.guard()` para negações finais. O exemplo de "permission gate" está em `docs/cookbook/extension-cookbook.md`.
  - **Trilha de auditoria:** o log da sessão já é append-only e registra as tools. O "ledger com hash" do Kimi só faz sentido como hash encadeado opcional por cima do log, sem um segundo log.
  - **Supply chain:** `pnpm` com lockfile congelado no CI (já usado) e o índice de plugins com campo de permissões (G12).
- Os hooks `beforeToolCall` e `beforeLLMRequest` da spec do Kimi **não existem**; os equivalentes são `tools/pre-execute` e `agent/request`.

---

## 8. Os caminhos A–D do Kimi, reavaliados
| Caminho do Kimi | Veredito | Por quê |
|---|---|---|
| A. Evoluir o protótipo `app/` para demo | ❌ | O protótipo é incompatível com a base (B2). A demo deve ser o próprio `apps/web`. |
| B. Um plugin real de ponta a ponta | ✅ **primeiro** | Fazer **G1 Artifacts** dentro das regras do repositório. Valida eventos, projeção, tool, nó e testes de uma vez. |
| C. Preparar a publicação open source | ✅ depois de D2, D3 e D4 | Publicar antes de resolver marca e postura de segurança expõe os dois riscos. |
| D. Viabilidade comercial | ⏸ | Fora do escopo técnico. Se for feito, usar os números corrigidos da §1.2. |

**Sequência recomendada** (detalhada em `PLANO.md`):

**Onda 0** inventário → **1** marca e postura de segurança → **2** responsivo e tokens de motion → **3** Artifacts → **4** Citações → **5** Gráficos → **6** Planilhas e Whiteboard → **7** Raciocínio visível e ramificação → **8** Conectores e Reflect → **9** publicação.

---

## 9. Fontes
- Repositório: `BlackYuriJDU/dsh-claude` @ `c1f0f4ec5`, arquivos e commits citados no texto.
- Checagem de fatos com todas as URLs: `05-checagem-de-fatos.md`.
- Produtos do claude.ai:
  - [What are artifacts and how do I use them? (Claude Help Center)](https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them)
  - [Anthropic launches Claude Dashboards and Motion, Docs out of beta (Unite.AI)](https://unite.ai/anthropic-launches-claude-dashboards-and-motion-takes-docs-out-of-beta)
  - [Anthropic combines Claude Cowork and chat, adding Docs and Slides (Let's Data Science)](https://letsdatascience.com/news/anthropic-combines-claude-cowork-and-chat-adding-docs-and-sl-10a03b85)
  - [Anthropic gave Claude a whiteboard, not a canvas (Implicator)](https://www.implicator.ai/anthropic-gave-claude-a-whiteboard-not-a-canvas/), sobre as visualizações inline
- AgenticOS @ SOSP 2026: <https://sigops.org/s/conferences/sosp/2026/workshops.html>
