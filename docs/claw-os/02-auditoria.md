# claw-os: Auditoria do pacote Kimi × repositório real `dsh-claude`

> **Auditado:** `Kimi_Agent_Claude.ai_Harness_Open_Source.zip` (124 arquivos; 16 estudos `.md`, o prompt `CLAW-OS-CODE-PROMPT.md`, 3 plugins e o protótipo `app/`)
>
> **Contra:** `BlackYuriJDU/dsh-claude` @ `c1f0f4ec5` (merge do PR #14, 24/09/2026)
>
> **Data:** 11/11/2026
>
> **Método:** cada achado foi confirmado por **duas evidências independentes**: **E1** é o código ou a saída de ferramenta (tsc, grep, git), e **E2** é a regra documentada no repositório ou a pesquisa externa. Achados sem duas evidências ficaram de fora.
>
> **Fases:** **Fase 1** bloqueia ou leva a código errado. **Fase 2** precisa ser corrigida antes de mesclar. **Fase 3** é melhoria.

---

## Resumo executivo

1. **Nenhum dos três plugins compila.** Contra o monorepo real, o `motion` dá 19 erros próprios, o `artifact` 21 e o `memory` 6. O mesmo harness aplicado a três pacotes reais do repo (controle) deu 0 erros próprios. O "build com sucesso" do relatório do Kimi era do protótipo `app/`, não dos plugins.
2. **O plano parte de um baseline errado.** Projects, memória entre sessões, Artifacts, Routines, Skills, ponte com o Claude Code e o design system Claude **já existem no fork**. O Kimi classificou vários deles como "NÃO TEMOS, P0".
3. **O prompt para o Claude Code contradiz o `CLAUDE.md` do repositório** em pontos centrais, como o acesso ao `ctx`, a política de compatibilidade e os gates de teste. Se for usado como está, o agente vai escrever código que o próprio repo rejeita.
4. **Segurança:** o fork inicia toda sessão em `danger-full-access`, com um gate apenas para comandos destrutivos. A spec de segurança do Kimi não trata disso e se pendura em hooks que não existem.
5. **Jurídico:** um dos estudos ainda recomenda **tldraw** (licença proprietária) e o produto usa a marca **Claude** na interface. Ambos são riscos para distribuição pública.

**O que dá para aproveitar:** a estrutura de fases com gate do prompt, as escolhas de **Univer** (planilha) e **Excalidraw** (whiteboard), os nomes de slot reais que o Kimi acertou (`conversation.chat.node`) e o mapeamento de UX do claude.ai como referência visual.

---

## 1. Arquitetura e convenções do repositório

### A1 · Fase 1: os plugins usam uma API de slots e serviços que não existe
- **Erro:** `motion` e `artifact` importam `ScopedSlotRegistry`, chamam `ctx.get('slots')`, `slots.registerScope?.(...)`, `ctx.on('ready')` e `this.logger`.
- **Porquê:** nada disso existe no repositório. A API real é uma só: `ctx.slots.register({ name, children?, store?, inject? }, Component)`, com dependências declaradas em `inject`, e os componentes nunca veem o `ctx`.
- **Evidências:** **E1** tsc acusa TS2305 (`ScopedSlotRegistry` não exportado), TS2345 (`'ready'` não é chave de `Events`) e TS2339 (`logger` inexistente). **E2** `packages/client/AGENTS.md`, "Slot and props discipline", regra 1 ("One API").
- **Como corrigir:** reescrever os dois plugins seguindo um pacote real como referência: `packages/client/ui-deliverables` ou o cookbook `docs/cookbook/adding-a-conversation-node.md`.

### A2 · Fase 1: Artifacts guardados num `Map` em memória, com tools visíveis ao modelo
- **Erro:** `artifact` grava os artifacts num `Map` local e expõe `artifact__create_*` e `artifact__list` ao modelo.
- **Porquê:** o repositório exige que tudo que o modelo vê possa ser reconstruído a partir do log da sessão ("Model-visible ⟺ logged"), e que estado durável estenda o `SessionEventMap`. Do jeito que está, os artifacts somem no reload e não aparecem no replay.
- **Evidências:** **E1** `claw-os-artifact/src/index.ts` (`artifacts: new Map()`). **E2** `CLAUDE.md` (Conventions) e `docs/architecture.md` ("Add durable session state → extend SessionEventMap").
- **Como corrigir:** registrar cada artifact como evento de sessão e derivar a lista por projeção. Antes disso, verificar se o `ui-handoff` (modal de Artifacts, commit `319f3c118`) já cobre a parte de interface.

### A3 · Fase 1: a projeção de memória é impura, só entende inglês e duplica o que já existe
- **Erro:** `memory` chama `Date.now()` dentro do `apply()`, extrai "memórias" com regex em inglês (`i like`, `my goal is to`) e promete persistência **entre sessões** usando uma projeção, que só enxerga o log de **uma** sessão.
- **Porquê:** o contrato exige `apply` como "Pure transition", e o `Date.now()` faz o replay gerar um estado diferente a cada vez. Um usuário que escreve em português não dispara nenhuma regex. E a memória entre sessões já existe no `ui-memory`.
- **Evidências:** **E1** `projection.ts` linhas 52, 75 e 97, mais tsc TS2344 e TS2769 (a chave `clawOsMemory` não foi mesclada no `SessionProjectionStateMap`). **E2** JSDoc de `ProjectionDefinition.apply` em `packages/session/session-projection/src/index.ts`, e a descrição do `ui-memory` ("durable across-session memories injected into the system prompt").
- **Como corrigir:** **descartar** o plugin. Qualquer evolução da memória (revisão no estilo "Reflect", por exemplo) entra como extensão do `ui-memory`.

### A4 · Fase 1: as tools seguem um formato que não é o do repositório
- **Erro:** as tools do `artifact` usam `{ parameters, handler }`.
- **Porquê:** o `ToolDefinition` real exige `output` e `execute(args, exec)`. O cookbook também pede que a intenção de renderização (`generic`/`terminal`/`diff`) seja decidida no desenho da tool.
- **Evidências:** **E1** tsc TS7006 nos `params` e `packages/core/tools/src/index.ts:222`. **E2** `CLAUDE.md` ("A tool's UI render intent is part of its design") e `docs/cookbook/adding-a-tool.md`.
- **Como corrigir:** reescrever seguindo o cookbook de tools.

### A5 · Fase 2: CommonJS dentro de código ESM
- **Erro:** `require('./client/...tsx')` em `motion` e `artifact`, e `React.createElement` sem importar o `React`.
- **Porquê:** o repositório é "ESM everywhere", e o código cliente roda no browser.
- **Evidências:** **E1** tsc TS2591 (`require`) e TS2686 (`React` como global UMD). **E2** `CLAUDE.md` ("ESM everywhere… modules it reaches must stay ESM").

### A6 · Fase 2: nome do pacote, ferramenta de build e gerenciador fora do padrão
- **Erro:** pacotes chamados `@claw-os/*`, o `memory` construído com `tsup`, e o relatório de build do Kimi mandando usar Yarn Berry.
- **Porquê:** o repositório exige o nome `@deepseek-ai/dsh-<nome>` (e `dsh-client-<nome>` no cliente), constrói com `tsdown` e usa `pnpm@11.7.0`. Os gates `verify-client-packages` e `hygiene` (knip, publint) reprovam o resto.
- **Evidências:** **E1** `package.json` dos plugins e `package.json` raiz (`"packageManager": "pnpm@11.7.0"`). **E2** `CLAUDE.md` ("Every npm package is `@deepseek-ai/dsh-<name>`") e `packages/client/AGENTS.md` (nome dos pacotes cliente).

### A7 · Fase 2: versões de dependência divergentes do monorepo
- **Erro:** o `memory` usa `zod ^3.23` e importa `{ Schema }` nomeado do `@deepseek-ai/schemastery`.
- **Porquê:** 26 pacotes do repositório usam `zod ^4.4.3`, e o `ProjectionDefinition` espera o `ZodType` da v4. O schemastery exporta `Schema` como default.
- **Evidências:** **E1** tsc TS2740/TS2322 (tipos do zod) e TS2614 (`Schema`). **E2** contagem de `"zod"` nos `package.json` do repositório.

### A8 · Fase 2: nenhum teste, nenhuma Agent Note, nenhum JSDoc no padrão
- **Erro:** os três plugins chegam sem testes.
- **Porquê:** o gate de CI cobra **100% de cobertura por arquivo** em `packages/*/*/src`. Mudança não trivial exige Agent Note no mesmo PR, e `verify-export-jsdoc` cobra JSDoc com `@param`/`@returns` em todo export.
- **Evidências:** **E1** não há pasta `tests/` nos plugins. **E2** `CLAUDE.md` (Commands: "per-file 100%"; Conventions: Agent Note; "Type safety and documentation").

### A9 · Fase 3: a semântica de prioridade de slot está invertida
- **Erro:** o código comenta "priority 90 = after default renderers", e o prompt inventa faixas (core 0–50, plugins 51–99).
- **Porquê:** no repositório, **o número mais baixo é o que renderiza**, e registrar duas vezes com a mesma prioridade lança erro. As faixas não existem.
- **Evidências:** **E1** `motion/src/index.ts:100`. **E2** `packages/client/ui-slots/src/index.ts` ("lowest renders; same key + same priority throws").

---

## 2. Escopo e baseline

### B1 · Fase 1: features dadas como "faltantes" já existem no fork
| O Kimi diz | O que existe no repositório (E1) | Commit (E2) |
|---|---|---|
| F1 Projects: "NÃO TEMOS", P0 | `ui-projects`: instruções e arquivos de conhecimento por projeto, injetados no system prompt | `07c83e956` |
| Memória (plugin novo) | `ui-memory`: memória durável entre sessões, com tela de configuração | `e37457195` |
| Artifacts (plugin novo) | `ui-handoff` (modal de Artifacts) e `ui-deliverables` | `319f3c118` |
| F3 Skills: "NÃO TEMOS" | `packages/skill/*` (registry, filesystem, tool) e `ui-skill` | upstream |
| F6 Claude Code: P0 | `subagent-claude-code` e `hooks-claude-code` | upstream |
| Design system Claude | `ui-theme`, com ~360 tokens `--dsw-*`, e `DESIGN.md` | `a19ed0024`, `5d0e5c76c` |
| Tarefas agendadas | `ui-routines` | `3ca29fa02` |

- **Como corrigir:** o plano começa por uma **Onda 0 de inventário** e só depois prioriza o que realmente falta, como Citations, Version History e conectores.

### B2 · Fase 2: o protótipo `app/` é incompatível com a base
- **Erro:** é um app Vite isolado, com shadcn, **Tailwind 3** e **React 19**.
- **Porquê:** o cliente real é `apps/web` com `packages/client/*`, usa **CSS Modules** com tokens `--dsw-*`, **React 18** em 44 pacotes e não tem Tailwind.
- **Evidências:** **E1** `app/package.json` e `app/info.md`. **E2** grep no repositório (`"react": "^18.2.0"` em 44 `package.json`; nenhuma ocorrência de `tailwind` em `packages/client` ou `apps/web`).
- **Como corrigir:** usar o `app/` só como referência visual. Nenhum arquivo dele entra no monorepo.

### B3 · Fase 2: os tokens de design "IMUTÁVEIS" do Kimi brigam com o design system atual
- **Erro:** o Kimi fixa `#D97757` como primária e `#FAFAF8` como fundo (canvas).
- **Porquê:** o repositório já define `#cc785c` como primária e `#faf9f5` como canvas no `DESIGN.md`, e há um commit que deixa o tema escuro como único (`5d0e5c76c`). Os tokens do Kimi sobrescreveriam o sistema existente.
- **Evidências:** **E1** `claw-os-design-tokens.md:15,23` e `CLAW-OS-CODE-PROMPT.md:526`. **E2** `DESIGN.md` (frontmatter) e `ui-theme` (~360 tokens).
- **Como corrigir:** a fonte de verdade passa a ser `DESIGN.md` com `ui-theme`. O documento do Kimi vira apenas referência.

---

## 3. Prompt para o Claude Code (`CLAW-OS-CODE-PROMPT.md`)

### C1 · Fase 1: o invariante 2 ensina o padrão errado
- **Erro:** "NEVER access ctx properties directly. ALWAYS use `ctx.get()` or `ctx.reflect.provide()`."
- **Porquê:** a convenção do repositório é o oposto: declarar `inject` e usar `ctx.<serviço>` (por exemplo, `ctx.slots.register`, `ctx.sessionProjections.register`), com registros feitos via `ctx.effect()` ou `ctx.on()`.
- **Evidências:** **E1** `CLAW-OS-CODE-PROMPT.md:630`. **E2** `CLAUDE.md` ("Registrations are effects") e `packages/client/AGENTS.md` (regra 7 de inject).

### C2 · Fase 1: renomear tudo para `claw-os` tem um raio de impacto que o prompt ignora
- **Erro:** a Fase A troca `@deepseek-ai/*` por `@claw-os/*`, `dsh` por `claw`, `DSH_*` por `CLAW_*` e os eventos `dsh/*`.
- **Porquê:** o repositório tem 50 grupos de pacotes, 154 aliases `@deepseek-ai/*` no `tsconfig.base.json`, pacotes vendorizados com escopo trocado (`vendor/cordis`, `vendor/schemastery`) e gates que validam esses nomes. O upstream é um preview v0.1 que avisa de quebras de compatibilidade, então renomear tudo encarece **cada** sincronização futura.
- **Evidências:** **E1** `tsconfig.base.json` (154 entradas) e `vendor/`. **E2** `CLAUDE.md` (Conventions, Vendoring policy) e pesquisa (README do upstream: "THERE WILL BE COMPATIBILITY-BREAKING CHANGES").
- **Como corrigir:** ver a decisão **D2**. Minha recomendação é trocar só a **marca visível** (UI, título, CLI de cara pública) e manter os nomes internos.

### C3 · Fase 2: o invariante 8 contradiz a postura do repositório
- **Erro:** "NEVER break public APIs without deprecation cycle."
- **Porquê:** o repositório declara "Pre-release stance: foundation over blast radius… rename or repackage freely".
- **Evidências:** **E1** `CLAW-OS-CODE-PROMPT.md:637`. **E2** `CLAUDE.md`, seção "Pre-release stance".

### C4 · Fase 2: o prompt cria um segundo livro de regras e ignora o primeiro
- **Erro:** não cita o `CLAUDE.md` do repositório nem os gates dele: cobertura 100%, snapshots, Agent Notes, `doc-sync`, `verify-export-jsdoc` e limites de tamanho dos docs.
- **Porquê:** o Claude Code carrega o `CLAUDE.md` automaticamente. Com dois livros de regras conflitantes, o agente para ou escolhe errado.
- **Evidências:** **E1** nenhuma menção a `CLAUDE.md` no prompt. **E2** boas práticas da Anthropic (pesquisa, seção D): CLAUDE.md curto, uma fonte de regras.
- **Como corrigir:** o plano novo se declara **subordinado** ao `CLAUDE.md` do repositório.

### C5 · Fase 3: detalhes operacionais errados
- Pede edições no formato "Structured Diff", mas o Claude Code edita com as próprias ferramentas.
- Manda rodar `npm run build` por pacote, mas o repositório constrói pela raiz com pnpm e tem os scripts `typecheck`, `lint` e `test:coverage`.
- Fixa a janela de contexto em "200K".

### C6 · Ponto positivo
- As fases com gate e aprovação explícita, e o "parar após 3 falhas de build", seguem o fluxo recomendado pela Anthropic (explorar → planejar → implementar → verificar). **Mantenho no plano novo.**

---

## 4. Segurança

### S1 · Fase 1: o padrão do fork é acesso total
- **Erro:** desde o commit `156bc55e8`, toda sessão inicia no preset `danger-full-access`. Só comandos **destrutivos** pedem aprovação (rm recursivo, force push, etc.).
- **Porquê:** para um produto distribuído, os vetores principais de prompt injection não são destrutivos: ler `~/.ssh` ou `.env` e mandar o conteúdo para fora com `curl` passa pelo gate sem pedir aprovação. Os níveis `read-only` e `workspace-write` foram removidos.
- **Evidências:** **E1** mensagem do commit `156bc55e8` e `packages/sandbox/sandbox/src/danger.ts`. **E2** a skill embarcada no próprio repositório ainda descreve o "default `workspace-write` policy" (`apps/web/tests/snapshots/skill-tool-row/ui.expected.md`), ou seja, a documentação e a postura divergem.
- **Como corrigir:** ver a decisão **D3**.

### S2 · Fase 2: a spec de segurança do Kimi se pendura em hooks inexistentes
- **Erro:** propõe os hooks `beforeToolCall()` e `beforeLLMRequest()`.
- **Porquê:** os pontos de extensão reais são os eventos `tools/pre-execute` e `tools/post-execute`, os eventos `agent/*`, e os pacotes `packages/sandbox/*`, `interaction/user-approval` e `guard/*`.
- **Evidências:** **E1** `claw-os-security-spec.md:46-48`. **E2** `packages/core/tools/src/index.ts` (eventos `tools/*`) e `docs/architecture.md` ("Intercept a request, tool, or turn → `agent/*` or `tools/*` event").

### S3 · Fase 2: o invariante 7 descreve um sandbox que não está ligado
- O prompt afirma que todo processo passa por Landlock. Pelo S1, a postura atual é acesso total. O plano precisa partir do estado real.

### S4 · Fase 3: Semgrep
- É LGPL-2.1 (pesquisa). Usar como binário externo, sem vendorizar.

---

## 5. Jurídico e licenças
> Não sou advogado. São riscos técnicos para o senhor validar.

### J1 · Fase 1: marca e identidade visual da Anthropic e do Claude em produto público
- **Erro:** a interface usa "DSH Claude" (`apps/web/index.html`, manifest), "DeepSeek Harness Claude" (`SidebarRoot.tsx:279`) e uma "serif Claude wordmark" (commit `8a21a329a`). O `DESIGN.md` descreve a marca da Anthropic. O posicionamento do Kimi é "Sistema Operacional do Claude.ai" com "UI visualmente idêntica".
- **Porquê:** "Claude" e "Anthropic" são marcas de terceiros. Um projeto público com nome, marca e identidade visual que imitam o produto pode sugerir afiliação. Também há o nome "DeepSeek" do upstream.
- **Evidências:** **E1** os arquivos citados. **E2** `estudo-mestre` §1.2 ("UI visualmente idêntica/semelhante ao Claude.ai").
- **Como corrigir:** ver a decisão **D4**. Recomendo marca própria ("claw-os"), citar "Claude" só para descrever compatibilidade ("funciona com modelos Claude via API"), nenhuma marca da Anthropic, e uma paleta inspirada mas própria.

### J2 · Fase 2: um estudo do Kimi ainda recomenda tldraw
- **Erro:** `claw-os-imagens-analise.md:324` chama o tldraw de "ESCOLHA PRINCIPAL". O protótipo de whiteboard, mais recente, já corrigiu para Excalidraw.
- **Porquê:** o tldraw tem licença proprietária e exige chave em produção desde o SDK 4.0. Se o Claude Code ler o doc antigo, o plugin nasce com essa dependência.
- **Evidências:** **E1** o arquivo citado. **E2** pesquisa (licença do tldraw).
- **Como corrigir:** o plano proíbe tldraw explicitamente e só o `claw-os-whiteboard-prototype.md` vai para o contexto do agente.

### J3 · Fase 2: dependências AGPL/GPL
- Metabase e Grafana (AGPL) e Faraday (GPL-3.0) só podem entrar como serviços externos, nunca embutidos no código MIT.

### J4 · Fase 3: Sandpack
- O núcleo é Apache-2.0, mas os templates baseados em Nodebox (Next.js, Vite, Node) seguem uma EULA que restringe uso comercial. Ficar nos templates de browser (react, vanilla, vue).

### J5 · Fase 3: planilha
- O Luckysheet foi arquivado em 30/10/2025. Usar Univer: o núcleo é Apache-2.0, e colaboração e importação/exportação são do Univer Pro, que é comercial.

---

## 6. Fatos e pesquisa
Os detalhes e as fontes estão no relatório de checagem desta conversa. Os que afetam decisões:

| Afirmação do Kimi | Correto (nov/2026) |
|---|---|
| dsh com 164k estrelas | ~278,7k |
| LobeHub com 107k | os 107k são do OpenDesign (Apache-2.0); o LobeHub tem ~84,7k |
| Mem0 ~20k / xyflow ~25k / Excalidraw ~97k | ~68,8k / ~39k / ~135,5k |
| framer-motion v12 "beta" | estável desde jan/2025; usar `motion` 14.12 |
| Vite 7 | Vite 8 (Rolldown) |
| "Agent = Model + Harness" é frase da DeepSeek | popularizada pela LangChain (V. Trivedy, 10/03/2026) |
| Paper do Cordis: "Peking University + DeepSeek" | afiliação não verificável; citar só autores e arXiv 2608.25512 |
| Alucinação sobe "13–33 pp" | blog de fornecedor (Hexaware), n=30; complementar com arXiv 2603.08274 |
| Relatório de build: "Yarn", `import … from 'schemastery'`, "pronto para integração" | pnpm; o código importa `@deepseek-ai/schemastery`; não compila (A1–A8) |

---

## 7. Decisões pendentes (do senhor)

| # | Decisão | Opções | Minha recomendação |
|---|---|---|---|
| D1 | Versão do React | ficar no 18 / migrar para o 19 | **Ficar no 18** (44 pacotes e o upstream estão no 18). *Já adotada.* |
| D2 | Estratégia de fork | **Fork leve:** só a marca visível muda, os nomes internos `@deepseek-ai/dsh-*` ficam / **Fork total:** renomear escopo, CLI, env e eventos | **Fork leve** agora. A renomeação total vira uma onda opcional, depois que o upstream estabilizar. |
| D3 | Postura de sandbox ao distribuir | manter acesso total / voltar `workspace-write` como padrão público e deixar acesso total como opção explícita | **`workspace-write` como padrão de distribuição**, e acesso total só por opção explícita do usuário. |
| D4 | Marca | manter "DSH Claude" / marca própria "claw-os" | **Marca própria**, sem marcas da Anthropic. |

---

## Apêndice: como o teste de compilação foi feito
1. `git clone --depth 1` do `dsh-claude` e `pnpm install --frozen-lockfile` (pnpm 11.7.0, Node 22.23) terminaram sem erro.
2. Cada plugin foi copiado sem alterações para `packages/claw-os/<nome>/`. O `tsconfig.check.json` estende `tsconfig.base.client.json` (motion, artifact) ou `tsconfig.base.json` (memory), com `noEmit` e os `paths` do repositório apontando para `src`.
3. Dependências externas foram instaladas como o Kimi declarou: `framer-motion@12`, `@codesandbox/sandpack-react@2.20`, `echarts@5.6`, `zod@3`, `react@18`.
4. Rodei `tsc -p`. Só foram contados os erros **dentro de `packages/claw-os/`**. Os erros em `vendor/` são ruído do harness, e o controle com `ui-memory`, `ui-deliverables` e `session-projection` no mesmo harness deu **0 erros próprios**.

| Plugin | Erros próprios | Principais códigos |
|---|---|---|
| motion | 19 | TS2305, TS2339 ×3, TS7006 ×3, TS2591 ×2, TS2614, TS2345, TS2307 ×3 (falta `css-modules.d.ts`) |
| artifact | 21 | TS2305, TS2614 ×2, TS2339, TS7006 ×5, TS2686, TS2820 ×2 (`vue3` não existe no Sandpack), TS2561 (`bundlerTimeout` inexistente) |
| memory | 6 | TS2769, TS2344, TS2740, TS2322, TS6133 ×2 |
