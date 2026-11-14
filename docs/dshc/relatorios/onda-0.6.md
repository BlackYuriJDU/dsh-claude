# Onda 0.6 — CI vivo, bug da Trajectory e dívidas (parcial)

Branch `ccr-a6886271-p3qfkp-DSHC` (PR #16), empilhado sobre o PR #15.

## Entregue

| Item | Commit | O que mudou |
|---|---|---|
| 0.6.1 CI | `f7a91e898` | Patch P1 do dono: o `ci.yml` usa `vars.DSH_CI_LINUX_RUNNER` / `vars.DSH_CI_WINDOWS_RUNNER` com fallback para `ubuntu-latest` / `windows-latest`. O PR #16 ganhou a primeira execução de CI em runners que existem. |
| 0.6.2 Trajectory | `8ca55dc41` | O header da sessão continua oculto no Chat e mostra as abas de visão quando outra visão está ativa. O botão "inspecionar" deixa de prender o usuário. Inclui Agent Note (en + zh). |
| 0.6.3 dívidas | `c570f9289` | O limite de caracteres dos arquivos de conhecimento do `ui-projects` virou `Config` (`knowledgeFileMaxChars`, padrão 20.000, catálogo en/zh). O título "Think" foi para o dicionário (pt "Raciocínio"). O README do `ui-settings-general` documenta o contexto `profile:instructions`, e a entrada errada da allowlist saiu. |
| 0.6.4 cobertura | `16ca8c862`… `34969f1f3` | `ui-memory`, `ui-projects` e `ui-routines` chegaram a 100% por arquivo. Guards inalcançáveis (por exemplo, atrás de botão desabilitado) foram removidos em vez de testados artificialmente. |
| CI bubblewrap | `4f01e0155` | O Ubuntu tirou do pool o `bubblewrap_0.9.0-1ubuntu0.1`, e o `curl --fail` saía com código 22 nos jobs de cobertura e snapshots. O pin foi para `0.9.0-1ubuntu0.3`, com o SHA-256 conferido contra o índice `noble-updates`. O passo passou no run 42. |
| 0.6.4 cobertura (2) | `8c23e8cd0`, `b2e57728d` | `locale`, `ui-agent-preset`, `ui-theme` e `ui-workspace` a 100% por arquivo. Saiu código morto: a ligação da linha de idioma que o `locale` montava e nunca exibia, e o `groupBy` do `ui-workspace`, cujo seletor sumiu no rework da sidebar. O README do `ui-workspace` foi corrigido em en e zh. A linha de fonte do chat (`ChatFontRow`), que não tinha nenhum teste, ganhou specs de store, componente e `apply`. |
| CI do fork | `d1fe5194c`, `6d4111175`, `8fbcc2022` | O primeiro run completo no `ubuntu-latest` revelou dívidas que os runners enterprise escondiam. O ícone de projeto duplicado entre `PlusMenu` e a sidebar foi para o `ui-primitives` (`IconProjectOutline16`). A spec de workflow passou a fixar os fallbacks `windows-latest` e `ubuntu-latest`. Issue policy e issue lifecycle só agem no dono upstream (`deepseek-harness`). Os dois trechos resumidos do guia de contribuição viraram `ts ignore-check`. |
| 0.6.4 cobertura (3) | `1ee101c3c`… `16fdc68ef` | Os 15 arquivos que o job de cobertura reprovou chegaram a 100%: `ui-handoff`, `ui-settings-models`, `ui-settings-general`, `SidebarRoot`, o picker de diretório, `CoralBurst` e `SubagentHeaderLineage`. O picker ganhou o dicionário pt que o fork tinha esquecido. O menu de idioma da sidebar aceita qualquer locale publicado. O selo "em breve" deixou de cair num texto pt fixo. O teste de redimensionamento do `SubagentHeaderLineage` corria contra o efeito passivo em runners lentos e agora espera o efeito. |
| Análise dos patches | `25b34ca6c` | `pesquisa/analise-patches-p1-p2-p3.md`: P2 e P3 revisados com dupla checagem e gates rodados; os dois precisam de correções antes de entrar (Onda 8). |

## Gates rodados
- `npx tsc -b tsconfig.client.json` → 0 erros. O hook de pre-push rodou o typecheck completo nos dois pushes.
- `oxlint` nos pacotes alterados → 0 erros.
- Vitest com cobertura focada: `ui-memory` (13 testes), `ui-projects` (19) e `ui-routines` (27), todos com 100% em `src/`. `ui-trajectory/views` e `ui-conversation` passam: 56 testes, e depois 502 no conjunto do `ui-conversation`.
- `verify-package-readme-model-experience`, `verify-translation-pairing`, `verify-agent-note-format`, `verify-agent-note-classification`, `verify-config-catalog`, `verify-md-wrap` e `verify-md-links` → ok.
- CI do PR #16 em `ubuntu-latest`: static, node 22.19, node 26, Python e wine passaram no run 40. Cobertura e snapshots falhavam na instalação do bubblewrap, corrigida em `4f01e0155`. Os runs seguintes foram cancelados por pushes novos; o resultado completo sai no próprio PR.

## Desvios e observações
- **GIF de interface (regra do repositório para mudança visível na GUI):** não gravado para a 0.6.2. Reproduzir o fluxo real exige uma chamada de ferramenta de verdade, e esta sessão não tem chave de API. Fica pendente para quando houver uma chave, ou no ambiente do dono.
- **Concorrência do CI:** ver a §2 da análise dos patches. Se o primeiro run ficar sem memória, reduzir `DSH_GATE_CONCURRENCY`.

## Falta na Onda 0.6
- **0.6.5:** a suíte de navegador (`test:web`). Entre as falhas está o snapshot do preset `minimal`, que ainda espera o prompt antigo.
- **0.6.3:** o modal de provedor que volta e o modo `?fixture` que não passa do onboarding.
- **Fixtures pwsh do `test:snapshot`:** o `ubuntu-latest` traz `pwsh`, então os cenários `pwsh-tool-turn` e `persistent-pwsh-tool-turn` passaram a rodar. As fixtures são anteriores à troca "tasks" → "jobs" do upstream e não têm a mensagem de runtime-context do Linux. Regravar exige um `pwsh` local, e o download foi bloqueado nesta sessão.
- **Workflow `e2e`:** falha de propósito sem o secret `DEEPSEEK_API_KEY_EXTERNAL`. Ele precisa ser configurado no repositório.
- **Opt-out do `doc-typecheck`:** com os dois trechos do guia, a proporção de blocos ignorados está em 49%, e o gate falha acima de 50%. O próximo trecho ilustrativo precisa compilar.
