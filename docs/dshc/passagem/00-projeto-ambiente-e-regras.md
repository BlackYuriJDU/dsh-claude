# Passagem 1 de 3: o projeto, o ambiente e as regras

> Escrito em 14/11/2026, a pedido do dono, para que outra pessoa ou outra sessão continue o trabalho sem perder contexto. Os arquivos 2 e 3 estão ao lado: [01-historico-completo.md](01-historico-completo.md) e [02-estado-atual-e-proximos-passos.md](02-estado-atual-e-proximos-passos.md).
>
> A transcrição completa desta conversa, com todo comando e toda saída, fica em `/root/.claude/projects/-home-user/85589361-7da9-5cad-8abe-de2577a6d96c.jsonl` no container da sessão. Esse arquivo some quando o container é reciclado; estes três arquivos ficam no repositório.

## 1. O que é o projeto

**DSHC** é um fork leve do **DeepSeek Harness (DSH)**, o projeto open source `deepseek-ai/deepseek-harness`. O DSH é um "agent harness": um app (web, desktop e CLI) em que um modelo de linguagem conversa com o usuário e usa ferramentas (ler e escrever arquivos, rodar shell, buscar na web, criar entregáveis) dentro de um workspace. Tudo no DSH é plugin: o núcleo é o framework **Cordis** (vendorizado em `vendor/`), e cada capacidade é um pacote `@deepseek-ai/dsh-*` em `packages/<grupo>/<pacote>/`, montado por arquivos `cordis.yml` e patches de perfil.

O fork **DSHC** fica no GitHub em `BlackYuriJDU/dsh-claude`. O objetivo do dono é ter um app no estilo do aplicativo Claude (paleta, layout, modos Chat, Cowork, Code e Design, memórias, projetos, artifacts, citações), mas rodando sobre o DSH e os modelos da DeepSeek, sem usar marcas da Anthropic.

- **Nome visível:** "DSHC" (decisão D4). "DSH Claude" saiu porque contém a marca "Claude"; o aviso "Not affiliated with Anthropic" fica.
- **Paleta:** a original da Anthropic (D5), só com a luminosidade corrigida para contraste AA.
- **Símbolo:** monograma "DSHC" (D12), no lugar do antigo "clay burst".
- **Camada do DSHC:** o bundle `packages/bundle/dshc` (perfil `dshc`), que aplica patches sobre o produto web do upstream, mais pacotes próprios: `ui-brand-dshc`, `web-search-searxng`, `ui-settings-searxng`, `ui-memory`, `ui-projects`, `ui-agent-preset` (seletor segmentado), `sensitive-access-policy` (Onda 2) e, em andamento, `ui-presented-versions` (Onda 3).
- **Presets do DSHC:** Chat, Cowork, Code e Design, com a persona "running in DSHC". O padrão é Chat.

## 2. Como o repositório funciona (o essencial)

- **Monorepo pnpm**, Node 24.9 ou mais novo, ESM em todo lugar. Pacotes em `packages/<grupo>/<pacote>/` com `src/`, `tests/`, `README.md` e `README.zh.md` (par bilíngue com registro `README.i18n.yaml`), `locale/*.json` (título e descrição do plugin em 8 idiomas) e `tsconfig.json`.
- **Plugins Cordis** exportam `name`, `inject`, `Config` (schemastery) e `apply(ctx, config)`, ou uma classe de serviço como default. Contribuições passam por `ctx.effect()` ou `ctx.on()`, e todo registro devolve um disposer.
- **Pacotes com duas partes** (Host e cliente): `src/index.ts` é o Host (Node), `src/client/index.ts` é o navegador; há `tsconfig.host.json` e `tsconfig.client.json` mais um `tsconfig.json` só de solução. Exemplos: `packages/client/ui-deliverables` e `packages/experimental/client-ui-forge`.
- **Log de sessão:** tudo que o modelo vê precisa poder ser reconstruído do log. Os eventos são declarados por *declaration merging* em `SessionEventMap` (`@deepseek-ai/dsh-session/types`). Um evento novo é "required-on-read" por padrão: um leitor que não conhece o tipo recusa a sessão. Os "registros de plugin" (`appendPluginRecord`, tipos `plugin:<pacote>/...`) são ignoráveis, mas só código de `packages/experimental/` pode gravá-los.
- **Pipeline de ferramentas** (`packages/core/tools`): `tools/pre-execute` é um waterfall que devolve `allow`, `deny`, `cancel` ou `ask`; o `ask` vai ao serviço de aprovação e vira negação `APPROVAL_UNAVAILABLE` quando não há canal. `tools/result` é um *emit* depois do resultado final e não espera promises.
- **Slots de UI** (`ctx.slots`): os componentes React se registram em slots nomeados (`deliverables.file.actions`, `conversation.chat.turnTail` etc.). O painel direito é `ui-sidebar-right` (`ctx.sidebarRight.openResource(address)`), e a prévia de arquivos é `ui-sidebar-documentpreview`.
- **Gates:** `pnpm run lint` (oxlint via `scripts/run-oxlint.ts`), `typecheck`, `test`, `test:coverage` (100% por arquivo em `packages/*/*/src`), `test:snapshot`, `doc-sync` (cerca de 43 gates de documentação), `hygiene` (manifestos, dependências, licenças, isolamento do produto padrão), `build:artifacts` seguido de `build:check`, e a suíte web (`vitest.web.config.ts` com Playwright).
- **Regras do `AGENTS.md`/`CLAUDE.md` raiz** que mais pesaram: nada de `as unknown`; um `catch` vazio precisa nomear o erro e o motivo; JSDoc em todo export; "configuração, não constantes"; misconfiguração falha na carga; teste de composição REAL para plugin visível ao produto; README com Model Experience no formato canônico e seção "Known Limitations"; Agent Note para decisão durável; o arquivo termina com uma única quebra de linha; um parágrafo por linha física no Markdown.

## 3. Ambiente desta sessão (container na nuvem)

- **Repositório:** `/home/user/dsh-claude`. Branch de trabalho: `ccr-a6886271-p3qfkp-v022`. A PR **#17** (rascunho) aponta para `dshc/base`, que contém o upstream puro (0.2.2-rc.2, `e8f7b93a`).
- **Node:** `export PATH=/opt/node24/bin:$PATH`. Memória: `NODE_OPTIONS=--max-old-space-size=10240`. Gates em paralelo: `DSH_GATE_CONCURRENCY=1` ou `2`; o typecheck agregado já morreu por falta de memória com mais.
- **Playwright:** a suíte web precisa de `NODE_PATH=/opt/node22/lib/node_modules`. O comando: `DSH_SNAPSHOT=replay npx vitest run --config vitest.web.config.ts <arquivo>`. `refresh` regrava goldens sem chave.
- **O que falta no container:** bubblewrap, WebKit e `xdg-user-dir`; tudo roda como root. Por isso os testes do sandbox bwrap só rodam no CI.
- **CI:** falta o secret `DEEPSEEK_API_KEY_EXTERNAL`, o que derruba `e2e`, `python runtime` (Linux e Windows) e `python checks passed`; falta o GitHub App, o que derruba `Issue policy`. As duas coisas são pendências do dono e já estão explicadas em comentário no PR #17.
- **Ferramentas de GitHub:** só o MCP do GitHub (`mcp__github__*`); `gh` serve só para busca.

## 4. Restrições permanentes do dono

1. O e-mail do dono é privado e nunca vai para serviço externo.
2. Sem `--force` em push. Sem mexer em `main`, `master` nem na branch festive (`claude/festive-euler-vb8psi`).
3. Nunca usar `--no-verify`. Os hooks do lefthook rodam lint e whitespace no commit e typecheck no push.
4. Nenhum identificador de modelo em commits, PRs ou código.
5. Os commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` e `Claude-Session: https://claude.ai/code/session_012fbGqkPAuNzByBj95sWuGV`.
6. Comentários no GitHub terminam com `---` e `_Generated by [Claude Code](https://claude.ai/code)_`.
7. Uma falha de CI já explicada em comentário não ganha um segundo comentário.
8. Um hook de parada exige commitar e enviar mudanças pendentes. Não envie código que não compila: termine primeiro.
9. O dono fala português; os relatórios e os planos ficam em português, e o código e os READMEs em inglês, com par em chinês.

## 5. Decisões do dono (tabela em `docs/dshc/PLANO-V3.md`, seção 0)

| # | Decisão |
|---|---|
| D2 | Fork leve, nomes internos `@deepseek-ai/dsh-*`, pacotes `private` |
| D3, D6, D7 | `workspace-write` por padrão, temas e idiomas: já vêm do upstream |
| D4 | Nome visível DSHC |
| D5 | Paleta original da Anthropic, com contraste corrigido |
| D8 | Migrar para o upstream 0.2.2 |
| D9 | PR de migração para a branch `dshc/base` |
| D10 | Publicar o app desktop: **em aberto**, decidir antes da Onda 9 |
| D11 | Texto neutro no login do onboarding |
| D12 | Monograma DSHC no lugar do clay burst |
| D13 | `web_fetch` pede aprovação só quando o endereço leva dados (query, fragmento, credenciais ou caminho longo) a um site fora da lista |
| D14 | Licenças fora de MIT, Apache, BSD e ISC entram como exceções nomeadas por pacote, com motivo |
| D15 | O artifact durável (G1) é a versão só de leitura do arquivo entregue pelo `present` |
| D15-b | Índice das versões guardado como **evento de sessão próprio** (`deliverables/snapshotted`), escolhido em 14/11 depois do conflito de gates descrito no arquivo 3 |

## 6. Documentos do projeto (em `docs/dshc/`)

- `PLANO-V3.md` — o plano em vigor: decisões (seção 0), pendências do dono (seção 1), etapas M0, M1, M1.5, M2, Ondas 1 a 9 e a etapa final (seção 2), e os prompts por etapa (seção 3). Ondas restantes: 4 citações (G2); 5 responsivo em 600 px ou menos e motion por tokens CSS; 6 gráficos (ECharts 6.1), planilhas (Univer) e quadro; 7 editar mensagem e ramificar; 8 conectores, carregador de plugins e Reflect; 9 publicação (SECURITY, CoC, aviso, THIRD_PARTY_NOTICES, nada publicado sob `@deepseek-ai`, desktop conforme D10). Etapa final: `merge -s ours origin/main` em `dshc/base` e PR para `main`.
- `relatorios/onda-0.7.md` — o relatório vivo da migração: conflitos do M0, gates rodados, classificação do CI, M1, M1.5, M2, Onda 1, Onda 2 e Onda 3 (seção já escrita, mas descreve a primeira forma da Onda 3 e precisa ser atualizada; veja o arquivo 3).
- `inventario-0.2.2.md` — a matriz de paridade sobre o 0.2.2, com arquivo e linha: o que o upstream já entrega e o que falta, por onda.
- `01-estudo-mestre.md` — o estudo original dos gaps G1 a G12 e o desenho de cada um.
- `ESTUDO-MELHORIAS-POS-PLANO.md` — os itens N1 a N18: código de referência para acessibilidade, contraste, axe e teste de privacidade.
- `PLANO.md` e `plano-implementacao.md` — os planos anteriores (v1 e v2), mantidos como histórico.
- `02-auditoria.md` — a auditoria de produto, segurança e design.
- `04-guia-contribuicao.md` e `pesquisa/` — guia e pesquisas (o comportamento do app Claude, análise do Ateliê, os patches P1 a P3).
- `referencias/` — capturas de tela: `atual/` e `0.2.2/` antes das ondas, `onda-1/` (1280 e 390 px, claro e escuro, GIF do teclado) e `onda-3/` (menu de versões, prévia, GIF do fluxo).

Arquivos enviados pelo dono nesta conversa: nenhum anexo. O trabalho partiu do `PLANO-V3.md` e dos documentos acima, que já estavam no repositório.
