# Onda 0.7 (M0 do Plano v3): migração para o upstream 0.2.2

Branch `ccr-a6886271-p3qfkp-v022`, PR #17 contra `dshc/base`. `dshc/base` é o upstream `deepseek-ai/deepseek-harness` na 0.2.2-rc.2, sem nenhuma mudança. A branch parte da festive (`claude/festive-euler-vb8psi`) e recebe o upstream por merge, no mesmo sentido do merge anterior da própria festive ("Merge upstream master (0.2.2-alpha.3) into the DSHC branch").

## Entregue

| Commit (assunto) | O que mudou |
|---|---|
| Merge upstream master (0.2.2-rc.2) into the DSHC branch | Merge do upstream 0.2.2-rc.2 na festive, com os 29 conflitos resolvidos (tabela abaixo) |
| fit DSHC specs to the merged 0.2.2 slots | Dois specs da festive ajustados aos slots do 0.2.2: o mock de `renderSlot` do hero e a busca do badge do launcher pela chave |
| put the DSHC packages on the family version | Os seis pacotes DSHC passam a usar a versão da família, `0.2.2-rc.2` (exigência do `release:verify --family dsh`) |
| publish source maps and sources like every 0.2.2 package | Lista `files` padrão do 0.2.2 nos seis pacotes DSHC (exigência do gate `constraints`) |
| satisfy the 0.2.2 static gates on the DSHC packages | Entradas de plugin sem exports extras; `issue-policy.yml` de volta ao texto do upstream; Summary do README do `ui-memory` dentro de 100 palavras; baseline de casts sem a entrada aposentada |
| create the card controller before the dictionaries | `ui-settings-searxng` cria o controlador antes dos dicionários, para não repetir o `ui-settings-shell` linha a linha (gate `duplication`) |
| regenerate source lines for the DSHC plugin entries | `docs/config-catalog` com as linhas novas das entradas sem exports extras |
| restore and align the tests the 0.2.2 suite caught | As seis correções de teste e de preset descritas em "Falhas do `test` que vinham da migração" |

## Conflitos do merge (29)

| Tipo | Arquivos | Resolução |
|---|---|---|
| Gerados (13) | `docs/config-catalog{,.zh}.md`, `docs/module-graph{,.zh}.md`, `docs/capability-seams.i18n.yaml`, sete `README.i18n.yaml`, `slot-catalog.ts` | Lado do upstream, regenerados com `gen-config-catalog`, `gen-module-graph`, `gen-client-catalog` e `verify-translation-pairing --write` (os pares en e zh mudaram juntos) |
| READMEs (6) | `ui-conversation`, `ui-settings`, `ui-settings-account` (en e zh) | Texto do upstream com os parágrafos DSHC reaplicados: placeholder e sugestões do hero, slot `settings.launcher.badge`, rótulo "Back to {product}" |
| Código e testes (10) | `tsconfig.base.json`, `AssistantMarkdown.module.css`, `ui-message-feedback/package.json`, `ui-conversation/src/client/index.ts`, `ModelSelect.tsx`, `AccountMenu.tsx`, `ui-settings-account/src/client/index.ts`, `skeleton.client.spec.tsx`, `account.client.spec.tsx`, `dsh-doc/references/packages.md` | Os dois lados convivem: slots `hero.headline` e `hero.frame`, slots filhos `settings.launcher.badge` e `settings.launcher.notifications`, nomes de esforço localizados (sem o `MEASURE_STYLE`, que o upstream removeu), variável de fonte da resposta ao lado do `--dsh-assistant-block-gap`, dependência de `schemastery` ao lado da lista `files` nova |

Divergência depois do merge: 339 arquivos diferem de `dshc/base`. Fora dos arquivos que a festive já alterava, só `packages/preset/agent-preset/skills/dsh-doc/references/packages.md` difere, porque o upstream mudou o caminho dele.

## Gates rodados (comando → resultado)

Ambiente: container Linux com 4 vCPUs e 15 GB, Node 24.22.1 (`/opt/node24`) e pnpm 11.28.5. A rede precisa liberar `cdn.sheetjs.com`, de onde o lockfile baixa o SheetJS 0.20.3. Aqui isso exigiu um ambiente próprio da sessão.

| Comando | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` | ok |
| `DSH_GATE_CONCURRENCY=1 pnpm run typecheck` | 4 de 5 gates na primeira execução; o client aggregate falhou num spec, que foi corrigido. Depois, `tsc -b tsconfig.client.json` saiu com 0, e o typecheck completo passou no pre-push de cada envio |
| `pnpm run lint` | exit 0 |
| `pnpm run build` | 10 gates, 0 falhas |
| `pnpm run check:ci:static` | primeira execução: 63 passaram e 4 falharam (unknown casts, plugin entry exports, issue management, README Summaries); os 4 foram corrigidos e cada um passou isolado |
| `pnpm run constraints`, `release:verify --family dsh`, `duplication` | cada um reproduzido com falha e depois verde |
| `pnpm run verify-translation-pairing` | 1.271 pares consistentes |
| Specs dos arquivos em conflito e dos pacotes DSHC alterados | 105 + 92 + 12 testes passaram |
| `pnpm run test` | 2.741 arquivos, 57.014 testes: 34 falhas em 18 arquivos. Oito falhas eram da migração e foram corrigidas (tabela abaixo); os specs afetados passam isolados. As outras 26 são do container: roda como root (testes de `chmod` e permissão em `agent-instructions`, `storage-sqlite`, `subagent/out-of-process` e `cordis-include-journal`), não tem bubblewrap (`ptc-runtime-node`, `bash-sandbox`, `workflow-ptc`), tem um `claude` real no PATH (`subagent-claude-code`), não alcança os hosts de rede do teste (`plugin-market`) e não formata o listener IPv6 (`llm-mock-server`). Nenhum desses pacotes difere de `dshc/base` |
| `pnpm run test:snapshot` | 267 casos: 17 falhas, todas `sandbox-unavailable` (cenários PTC, `workflow-confinement`, `worktree` e `bash-tool` do SDK), porque o container não tem bubblewrap; o CI instala com `scripts/prepare-ci-bubblewrap.sh` |

Falhas do `test` que vinham da migração:

| Teste | Causa | Correção |
|---|---|---|
| `ui-agent-preset/tests/components.client.spec.tsx` (sem suíte) | O commit dos presets ocultos da festive esvaziou o arquivo por acidente | Spec recuperado da versão anterior, ajustado à prop `useSeatPolicy`, com um caso novo para presets ocultos; o baseline de casts volta à entrada do upstream |
| `scripts/rescope-vendor.spec.ts` | O mesmo arquivo vazio | Mesma correção |
| `scripts/ci-workflow.spec.ts` | A festive esperava `if` no job `Issue policy` | Volta à expectativa do upstream (job sem condição) |
| `ui-theme/tests/corner-shape-styles.client.spec.ts` | O `.avatar` do `ProfileBadge` usava raio cheio sem `corner-shape: round` | Declaração acrescentada |
| `bundle/dshc/tests/dshc.spec.ts` | Os presets Cowork, Code e Design copiavam as linhas do preset `standard` da 0.2.2-alpha.3 | As três linhas novas do upstream: `customSkillDirs` do `skill-filesystem`, `interrupt: false` do `tool-subagent-control` e `tool-office` |
| `apps/cli/tests/profile-mcp.spec.ts` | O teste do upstream espera o `mcp-manager` só no perfil `web` | O perfil `dshc` compõe o bundle Web, então o teste o trata como `web` |

## CI da PR #17

| Check | Classificação | Situação |
|---|---|---|
| `e2e` e `python runtime / release-shaped matrix` | ambiente do fork | Falta o secret `DEEPSEEK_API_KEY_EXTERNAL` (pendência do dono). No job Python, os 83 testes do pytest passam; só o passo do teste real de API para |
| `Issue policy` | ambiente do fork | O fork não tem o GitHub App do upstream. O teste do upstream exige o job sem condição, então o workflow deve ser desabilitado nas configurações |
| `Pack npm tarballs` | festive | Versões `0.2.2-alpha.3`; corrigido pelo commit de versão da família |
| `static` (`constraints`, casts, exports, issue management, Summary) | festive | Corrigido pelos commits de `files` e de gates estáticos |
| `lint` (`duplication`) | festive | Corrigido pelo commit do `ui-settings-searxng` |

## Desvios do plano e motivo

- **Passo 4 (`gh workflow disable`) não executado.** Nesta sessão, o `gh` só pode ser usado para busca, e o GitHub MCP não tem operação para desabilitar workflows. O plano proíbe editar os `.yml`, então a desativação fica com o dono, pela interface do GitHub. A lista: `ci-master.yml`, `ci-python.yml`, `pr-check-after-approve.yml`, `pr-check-on-head-branch.yml`, `pr-check-on-base-branch.yml`, `sandbox.yml` e, por causa do teste do upstream, também `issue-policy.yml`.
- **`issue-policy.yml` sem a condição da festive.** O teste `keeps trusted preflight before token minting and required policy unconditional` do upstream proíbe `if:` no job e no preflight. Voltar ao texto do upstream elimina uma divergência; o fork desabilita o workflow em vez de editá-lo.
- **`docs/dshc/` fora do pareamento de tradução** (`scripts/translation-pairing.manifest.json`), como a M1 prevê para os documentos do DSHC.

## M1: porte da linha 0.1.1

Cada item da tabela M1 do Plano v3, conferido no 0.2.2 com a festive:

| Item | Situação no 0.2.2 | Decisão |
|---|---|---|
| `docs/claw-os/*` | não existia | Portado para `docs/dshc/`, com "claw-os" trocado por "DSHC", junto do Plano v3 e do estudo de melhorias. Os checks de referências de commit e de caminhos de pacote pulam `docs/dshc/`, como pulam as Agent Notes arquivadas, porque estes registros citam commits da linha anterior e caminhos planejados. Os blocos de código propostos no estudo são `ts ignore-check` |
| `conversation-column-overflow.e2e.ts` | já existe em `apps/web/tests/` | Nada a portar |
| Anel de uso | O `ContextMeter` do upstream fica abaixo do card do composer: anel com a porcentagem e painel com a barra de composição do contexto (system prompt, ferramentas, conversa) | Mantido o do upstream. A seção de sessão da linha antiga (tokens, cache, entrada e saída, velocidade) não foi portada, porque exigiria alterar o `ContextMeter` do upstream. Os mesmos números por turno estão na aba Statistics do `experimental/client-ui-stats` (ver N8 e N9 do estudo) |
| Seletor de acesso sob o composer | `ui-permission-presets` ocupa o slot `conversation.input.permission` e vem no bundle Web | Nada a portar |
| `ui-routines` | `ui-schedule` agenda instruções recorrentes (`every`, `daily`, `weekly`, `cron`, `rrule`) | Descartado |
| `ui-handoff` | `ui-sidebar-right`, `deliverables` e `documentpreview` | Descartado |
| Perfil e conta do `ui-settings-general` | "Your {product}" do `ui-memory` (nome e instruções) e o launcher de conta | Descartado |
| `ChatFontRow` | `ui-theme` tem `textFontFamily` configurável, e a camada DSHC aplica a fonte escolhida às respostas | Descartado |
| `knowledgeFileMaxChars` | `ui-projects` já tem `maxFileChars` e `maxTotalChars` como `Config` | Nada a reaplicar |
| Trajectory sem volta | O header só esconde as abas numa sessão em branco (`hideChrome` vem de `blank` em `ConversationHeader.tsx`) | O defeito não existe no 0.2.2 |
| MCP de busca DuckDuckGo, instruções no prompt, gaveta compacta, remoção do `zh`, P1 e workflows de issue | — | Descartados, como o plano prevê |

## Próximo passo

M2: refazer a matriz de paridade sobre o 0.2.2, aplicar a errata, medir o layout em 1280, 1024, 768 e 390 px e escrever o relatório de inventário.
