# Passagem 2 de 3: tudo o que já foi feito, os erros e as soluções

> Ordem cronológica. Cada etapa tem o resultado, os commits (pelo assunto) e cada erro encontrado com a solução. O detalhe das etapas antigas está em `docs/dshc/relatorios/onda-0.md`, `onda-0.5.md`, `onda-0.6.md` e `onda-0.7.md`.

## Antes da migração: Ondas 0, 0.5 e 0.6 (PRs #14 a #16, sobre a linha 0.1.1)

- Estudo do repositório e de todos os gates de CI. Baseline corrigida até ficar verde, com push.
- Capturas de referência do app e das referências externas (`docs/dshc/referencias/atual/`).
- Plano de implementação e PR 2 em rascunho.
- Onda 0.6: runners do CI passaram a ser os hospedados pelo GitHub (patch P1); defeito da visão Trajectory sem volta; dívidas pequenas e cobertura; duplicação PlusMenu/SidebarRoot; `test:snapshot`, `doc-typecheck` e smoke do binário; e2e, Issue policy e coverage; goldens web.
- Auditoria profunda do 0.2.2 (produto, segurança e design), que gerou o Plano v3.

## M0: base nova e medição

- `dshc/base` criada em `e8f7b93a` (upstream 0.2.2-rc.2). A branch `ccr-a6886271-p3qfkp-v022` nasceu da festive e recebeu o merge do upstream (commit `Merge upstream master (0.2.2-rc.2) into the DSHC branch`).
- **29 conflitos:** 12 gerados (resolvidos pelo lado do upstream e depois pelos geradores), 6 READMEs (texto da festive reaplicado), 11 de código (upstream primeiro, depois a intenção do commit DSHC). A lista está no relatório.
- Workflows do upstream que não servem ao fork desligados com `gh workflow disable`, sem editar os arquivos.
- Gates locais todos rodados; a PR #17 foi aberta em rascunho para `dshc/base`.
- Correções do merge: os gates estáticos do 0.2.2 nos pacotes DSHC, a versão de família 0.2.2-rc.2, source maps e fontes publicados, e testes restaurados.

## M1: porte da linha 0.1.1

- `docs/claw-os` virou `docs/dshc`, com a isenção de tradução no manifesto.
- Itens avaliados um a um: anel de uso, seletor de acesso, rotinas, handoff, settings-general, `ChatFontRow`, `knowledgeFileMaxChars`, Trajectory, `conversation-column-overflow`. O que o 0.2.2 já fazia foi descartado; o resto foi portado.
- Suíte web alinhada ao 0.2.2: goldens "N failed", esforço localizado, título do herói e o timeout de models-settings no WebKit.

## M1.5: os 17 achados da revisão e da auditoria

Cada correção virou um commit com teste focado, por exemplo:
- o rascunho do cartão de projeto;
- o aviso de privacidade do feedback;
- relatórios HTML aceitos só no modo de comentário;
- confirmação de salvamento pelo Host em memórias e projetos;
- cancelamento do SearXNG;
- ordem das opções do launcher;
- limites de contexto;
- posições na tabela central de contexto;
- campos com nome acessível;
- teclas de rádio no seletor;
- as faces Host e cliente separadas.

O item 8 virou teste de composição nas Ondas 1 e 2.

## M2: inventário e documentos

`inventario-0.2.2.md`, a errata do Plano v2, a medição do layout em 1280, 1024, 768 e 390 px, e os gates de documentação.

## Onda 1: identidade DSHC e acessibilidade (commits de `628feb9a` a `7997d448`)

**O que foi feito:**
- **Nome e onboarding:** "DSH Claude" virou "DSHC" nas personas e no README; o texto do onboarding passou a falar em escolher modelo.
- **Contraste e símbolo:** os tokens de cor passaram a cumprir WCAG AA; o clay burst virou monograma (D12).
- **Acessibilidade estrutural:** o composer ganhou papel de botão e anel de foco; o seletor estreito ficou alcançável por teclado; a árvore vazia deixou de ter papel; entraram o `<main>` e o `h1` do herói; os rótulos da barra lateral deixaram de truncar e de repetir.
- **Testes:** gate axe na composição DSHC (`apps/web/tests/accessibility.e2e.ts`); captura em 390 px com `scrollLeft = 0`; GIF do teclado.

**Erros e soluções:**

| Erro | Solução |
|---|---|
| Import errado de `connectFreshWorkspace` | Importar de `apps/web/tests/support.ts` |
| Cast `as unknown` proibido | `declare global` |
| O axe 4.14 passou a tratar `label-content-name-mismatch` como regra estável e a reprovar | Regra desligada com documentação dos três controles do upstream |
| A scaffold forçava o preset `standard`, desligado no DSHC | `agentPresets: { default: 'chat' }` |
| O placeholder do composer é outro no DSHC | Parâmetro novo em `connectFreshWorkspace` |
| O foco se perdia quando o segmento ficava `disabled` | `aria-disabled`, mais a guarda no `onClick` |
| Os testes que buscavam o banner quebraram: um header dentro de `main` não é banner | Seletor novo para o header |
| `default-product-isolation` esgotava o tempo, porque a árvore vazia não tem mais papel | Esperar pelo botão "Add workspace" |
| Violação de strict mode no `h1` | Seletor mais específico |
| Refresh de golden contaminado pela falta do sandbox | Revertido e transformado à mão |
| `__pycache__` e saída do compilador vazando em `src/` | Arquivos removidos |

## Onda 2: segurança e licenças (commits de `94aaad36` a `12b77505`)

**Camada 1, sandbox** (`packages/sandbox/sandbox-local`):
- `Config` ganhou `denyReadPaths` (absolutos ou `~/`; caminho relativo falha na carga; cada um passa por `realpath`, e os inexistentes são pulados) e `network: on | off`.
- **bwrap:** depois das montagens graváveis, `--tmpfs` com `--remount-ro` esconde um diretório e `--ro-bind /dev/null` esconde um arquivo; `--unshare-net` tira a rede.
- **Seatbelt:** `deny file-read*` e `deny network*`.
- **Landlock e ACL do Windows:** não conseguem expressar as restrições e reportam `partial`.

**Camada 2, ferramentas** (`packages/guard/sensitive-access-policy`):
- O listener de `tools/pre-execute` chama `next()` primeiro e só transforma `allow` em `ask`.
- `read` e `read_image` são verificados pelo `file_path`; `grep` e `glob`, pelo `path`, inclusive quando o caminho é a raiz de uma árvore protegida.
- `web_fetch` pede aprovação quando leva dados a um site fora de `fetchAllowedDomains` (que vale também para subdomínios).
- Os prompts existem em 8 idiomas; 26 testes, com 100% de cobertura.

**Padrões do DSHC:**
- protegidos na camada 2: `~/.ssh/**`, `~/.aws/**`, `~/.config/gh/**`, `~/.gnupg/**` e `**/.env*`;
- `fetchApproval: with-data`;
- os quatro diretórios escondidos também na camada 1.

**Privacidade:**
- `apps/web/tests/dshc-privacy.e2e.ts`: nenhum host externo é contatado na inicialização nem em 5 s ociosos, conferido pelo navegador e pelos canais de diagnóstico do Host.
- Ler o `.env` do workspace e fazer um fetch com dados param na aprovação.

**Licenças, Dependabot e registro:**
- `scripts/verify-dependency-licenses.ts`: todo o fecho de dependências (469 de runtime e 1.154 de desenvolvimento), com exceções nomeadas por motivo (D14).
- Dependabot agrupado, no fuso `America/Sao_Paulo`.
- Agent Note `2026-11-14-dshc-two-layer-exfiltration-policy`.

**Erros e soluções:**

| Erro | Solução |
|---|---|
| As funções de perfil tinham outros chamadores (TS2554) | Passar `NO_RESTRICTIONS` |
| `gen-tsconfig-paths` não gera alias quando o nome do diretório difere do pacote | Diretório renomeado para `sensitive-access-policy` |
| Lint `no-unsafe-assignment` | Helper `askReason` e tipo `Agent` derivado |
| `ctx.set` sem `provide` | `ctx.provide('workingDirectory')` antes |
| Dispose pelo registry não funcionava | `fiber.dispose()` |
| O compilador do cliente emitiu saída em `src` | e2e excluído em `apps/web/tsconfig.json` e saída removida com `git clean` |
| A raiz não tem `read` global | Ferramentas substitutas no teste |
| Licença dupla (`MIT OR GPL`) era recusada | Testar `isPermissive` primeiro; exceção para MIT-0 |
| Gates estáticos no CI: grafos de documentação velhos, resumo acima de 100 palavras, orçamento de palavras do `packages/README`, falta de Dev Note e `gen-plugin-packages` desatualizado | Tudo corrigido no commit `2c8e22dd` |
| CI Windows: o teste de symlink falhava porque `realpathSync` mantém o nome curto `RUNNER~1` enquanto `fs.promises.realpath` o expande | `realpathSync.native` no fixture (commit `12b77505`). Confirmado: no CI seguinte o pacote passou |

**Classificação do CI depois da Onda 2** (tudo comentado no PR #17):

| Verificação | Situação |
|---|---|
| `e2e`, `python runtime`, `python checks passed` | Ambiente: falta o secret |
| `Issue policy` | Ambiente: falta o GitHub App |
| `windows coverage` | `sandbox-windows-acl` (8 casos do `diagnose-script` e 1 do `runner`) e 2 timeouts do `liveshare` (`owner-credential-horizon`). Já falhavam antes, no `7997d448` |
| `node 24 / coverage` | Os mesmos 2 do `liveshare` e o `tool-pwsh-persistent` `loader-composition.spec.ts:256` (saída cortada). Já falhavam antes |
| `benchmarks` | Variação de tempo do runner: 4 a 6% acima do limite em `conversation-fold` e `long-session-browser`; passou no commit anterior |
| `all checks passed` | Agrega as falhas acima |
| Passaram | `static`, `lint`, `snapshots and artifacts`, `node 26`, `node 24.9`, builds nativos e pacotes |

## Onda 3: versões duráveis dos arquivos entregues (G1), em andamento

**Exploração:**
- O upstream já tem o painel direito (`ui-sidebar-right`), a prévia de documentos (`ui-sidebar-documentpreview`), a ferramenta `present` (grava só o caminho, no evento `deliverables/presented`) e os cartões (`ui-deliverables`).
- O upstream recusou guardar cópias "sem requisito de produto". Ver `.agents/notes/implemented/feature/2026-09-08-present-workspace-source-files.md`.

**Pergunta ao dono:** "versões do arquivo" (recomendado), "artifact de conteúdo" no estilo claude.ai, ou os dois. **Resposta: versões do arquivo (D15).**

**Plano aprovado no plan mode** (`/root/.claude/plans/lucky-twirling-sunrise.md`):
- cópia nos anexos depois de cada `present`;
- registro de plugin no log;
- espera no `pre-execute`;
- rota `/api/presented.versions`;
- botão de versões no slot do cartão;
- e2e, capturas, Agent Note, PLANO e relatório.

**Implementação feita** (detalhe técnico no arquivo 3):
- Pacote de duas partes, Host e cliente. Mudou de dois pacotes para um porque assim o cliente usa a validação da rota sem duplicá-la, como no `ui-deliverables`.
- 34 testes com 100% de cobertura. Prova de mutação: sem a espera no `pre-execute`, o teste da edição logo depois do `present` reprova.
- Bundle DSHC atualizado e e2e web `apps/web/tests/dshc-presented-versions.e2e.ts` com 3 casos passando: os dois cartões, `v1/2` e `v2/2`, a prévia da versão 1 com o texto entregue, o recarregamento e um fork pela API.
- Capturas em `docs/dshc/referencias/onda-3/`, READMEs en e zh, Agent Note, linha nas tabelas de grupo, geradores rodados, D15 no PLANO e seção no relatório.

**Erros e soluções durante a implementação:**

| Erro | Solução |
|---|---|
| `JsonValue` não é exportado por `dsh-llm` | Importar de `@deepseek-ai/dsh-util-values` |
| `deliverables/presented` não era conhecido pelo TypeScript | `import type {} from '@deepseek-ai/dsh-tool-present/types'` |
| `ctx.slots` sem tipo | `import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'` |
| Alias de caminho ausente (nome de pacote diferente do diretório) | Entradas escritas à mão em `tsconfig.base.json` (com o pacote em `packages/client`, o gerador passa a resolver sozinho) |
| Esquema de saída sem `additionalProperties` | Declarado `false` em todo objeto |
| `defineTool` sem `output` não funciona para ferramenta que devolve conteúdo | `defineContentToolFixture` do `dsh-tool-testkit` |
| "no agent factory registered" | `mountAgentLoopTestHarness(ctx)` |
| Parâmetro padrão engolia `undefined` | `null` como valor de "sem agente" |
| "tool already registered" | Registrar a variante em `agent.ctx.tools` |
| Seq errado: `session.seq` é a próxima posição | O seq do evento é `session.seq - 1` |
| Ramos sem cobertura: a condição de limpeza era redundante; faltava o caso concorrente; os testes de dispose não eram determinísticos (`release` era um no-op) | Condição simplificada; caso de duas entregas concorrentes; promise `entered` nos testes de dispose. Diagnóstico feito com um arquivo de trace temporário, porque o `console.log` era suprimido |
| Ramo inalcançável no menu (item desabilitado nunca chama `onSelect`) | Handler escolhido por ternário; teste de Escape |
| Linhas acima de 140 colunas | Quebradas |
| Corrida no build: o `build:artifacts` começou antes da exclusão do e2e no `tsconfig` do web | Saída vazada removida com `git clean` e build refeito |
| `acknowledgeReloadConnectionLoss` tem outra assinatura (é para tripwire de console) | Removido do e2e |
| A sessão semeada aparece como "Untitled" em Ungrouped | Abrir o último item da árvore |
| Strict mode com dois botões no e2e | `.last()` |
| A captura em 390 px ficou coberta pelo painel em tela cheia | Página nova para a captura |
| `doc-sync`: `docs/a.md` no teste parecia link quebrado | Trocado por `notes/a.md` |
| `doc-sync`: Model Experience fora do formato | Forma curta, mais a entrada auditada em `scripts/verify-package-readme-model-experience.ts` |
| **`hygiene` reprovou a ideia em si** (detalhe no arquivo 3) | Pergunta ao dono; resposta: evento de sessão (D15-b) |
