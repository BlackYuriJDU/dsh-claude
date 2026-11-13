# Inventário do DSHC sobre o upstream 0.2.2

Inventário da M2 do Plano v3, feito sobre a branch `ccr-a6886271-p3qfkp-v022` (upstream 0.2.2-rc.2 com a camada DSHC e as correções da M1.5). Cada linha cita o arquivo e a linha que sustentam a afirmação. Substitui a matriz da seção 3 de `01-estudo-mestre.md`, que descrevia a linha 0.1.1.

## 1. Matriz de paridade: claude.ai × DSHC no 0.2.2

**Legenda.** ✅ existe · 🟡 parcial · ❌ não existe · 🧪 existe como pacote experimental, fora do perfil `dshc`.

| # | Recurso do claude.ai | DSHC no 0.2.2 | Evidência | O que falta | Onda |
|---|---|---|---|---|---|
| 1 | Chat com streaming | ✅ | `packages/client/ui-conversation`, `packages/client/ui-chat` | — | — |
| 2 | Projects | ✅ | `packages/client/ui-projects/src/index.ts:65` (instruções e arquivos de conhecimento no contexto da sessão) | busca nos arquivos (RAG); hoje o texto vai inteiro, até `maxTotalChars` | P2 |
| 3 | Memória | ✅ | `packages/client/ui-memory/src/memory.ts` (perfil e memórias no contexto de toda sessão) | revisão no estilo "Reflect" | 8 |
| 4 | Artifacts: painel lateral e prévia | ✅ | `packages/client/ui-sidebar-right` (painel acoplável); `packages/client/ui-sidebar-documentpreview` (Office, planilhas, Markdown, código, imagens, PDF, HTML e texto) | — | — |
| 5 | Artifacts: entrega de arquivos | ✅ | `packages/deliverables/tool-present/src/index.ts:39` (ferramenta `present`); `packages/client/ui-deliverables` (cartões de entrega e de arquivos alterados) | — | — |
| 6 | Artifacts como objeto durável com versões | ❌ | o `present` entrega arquivos do workspace; não há tipo de artifact com histórico próprio | objeto durável com versões, sobre o painel e a prévia acima | 3 |
| 7 | Comentar um design na prévia | ✅ | `packages/client/ui-sidebar-documentpreview/src/client/html/HtmlBody.tsx` (modo de comentário que cita o elemento no rascunho) | — | — |
| 8 | Sheets, Whiteboard, gráficos inline | 🟡 | a prévia lê planilhas (`xlsx` 0.20.3 pelo CDN, `packages/client/ui-sidebar-documentpreview/package.json:89`) | edição inline, quadro e gráficos | 6 |
| 9 | Tarefas agendadas | ✅ | `packages/client/ui-schedule` (página de tarefas e lembretes da sessão) | — | — |
| 10 | Skills | ✅ | `packages/skill/*`; skills de Office em `packages/document/tool-office` | — | — |
| 11 | Conectores MCP | 🟡 | `packages/mcp/mcp-client`, `packages/mcp/mcp-manager` (frota configurada por settings, com estado e reinício) | catálogo de conectores com OAuth | 8 |
| 12 | Marketplace de plugins | ✅ | `packages/client/ui-plugin-market` (aba Discover dos índices configurados) | — | — |
| 13 | Cowork (arquivos locais) | ✅ | `fs`, `shell`, `terminal`; preset Cowork do bundle `packages/bundle/dshc/presets/cowork.patch.yml` | — | — |
| 14 | Claude Code | ✅ | `packages/subagent/subagent-claude-code`; ponte de hooks e mods em `packages/experimental/hooks-claude-code` e `claude-code-mods` (🧪) | — | — |
| 15 | Pesquisa web com citações | 🟡 | `packages/web/tool-web/src/search.ts:105` manda citar as URLs como links Markdown | citação inline numerada e clicável, com a fonte ao lado | 4 |
| 16 | Raciocínio visível | ✅ | `packages/client/ui-chat/src/client/chat/AssistantMarkdown.tsx:35` (blocos de raciocínio expansíveis) | — | — |
| 17 | Ramificar a conversa | ✅ | `packages/client/ui-chat/src/client/apply.ts:304` (`forkAt`), botão em `packages/client/ui-chat/src/client/chat/TurnTailNodeView.tsx:70`; menu da sessão em `packages/client/ui-workspace/src/client/session-actions/context-menus.tsx:51` | — | — |
| 18 | Editar mensagem enviada | ❌ | nenhuma ação de edição em `packages/client/ui-chat/src/client/chat/MessageItem.tsx` | editar e reenviar como ramo | 7 |
| 19 | Busca de conversas | ✅ | busca da barra lateral em `packages/client/ui-workspace/src/client/contract/slots.ts:260`; busca pelo agente em `packages/experimental/session-search` (🧪) | — | — |
| 20 | Mobile e responsivo | 🟡 | `packages/client/ui-conversation/src/client/skeleton/ConversationRoot.module.css:240` e mais 25 regras `max-width` no cliente; gaveta abaixo de 768 px (seção 3) | seletor de modos em 390 px (defeito A10) e revisão ≤ 600 px | 1 e 5 |
| 21 | Tema claro e escuro | ✅ | `packages/client/ui-theme/src/client/index.ts:4` (claro, escuro e sistema) | — | — |
| 22 | Motion | 🟡 | `packages/client/ui-theme/src/styles/base.css:15` (`--ds-transition-duration` e as variantes rápida e lenta) | tokens de motion por papel | 5 |
| 23 | Exportar e compartilhar | 🟡 | `packages/session-query/session-log-export` (ZIP do log e cópia em Markdown); `packages/experimental/liveshare` (🧪) | exportar um artifact sozinho | 3 |
| 24 | Computer use | 🧪 | `packages/experimental/cua*`, `computer-use-cua-driver-*` | — | fora do escopo |
| 25 | Sandbox e permissões | ✅ | `packages/bundle/base/cordis.patch.yml:239` (sessões com `workspace-write` e pedido de aprovação); `packages/client/ui-permission-presets` | política contra exfiltração | 2 |
| 26 | Voz | 🧪 | `packages/experimental/client-ui-voice-input`, `speech-to-text*` | — | avaliar |

**Resultado.** Dos gaps de P0 da linha 0.1.1, o 0.2.2 já fecha o painel lateral, a prévia de documentos, a busca de conversas, o tema claro e a ramificação. Continuam abertos: artifacts duráveis com versões (Onda 3), citações (Onda 4), responsivo em 390 px (Ondas 1 e 5), editar mensagem (Onda 7) e a política contra exfiltração (Onda 2).

## 2. Catálogo dos 63 pacotes experimentais

`packages/experimental/` tem 63 pacotes. Os que o perfil `dshc` liga ficam listados em `packages/util/official-bundles/src/bundles.ts`. A coluna "Para o DSHC" é a recomendação da N8 do estudo de melhorias.

| Grupo | Pacotes | Para o DSHC |
|---|---|---|
| Busca e histórico de sessões | `session-search`, `tool-session-query`, `session-inspector`, `session-title-all-prompts-llm`, `session-titles-bundle` | ligar `session-search` primeiro, depois do teste de privacidade (N4) |
| Estatísticas da conversa | `client-ui-stats` | ligar: cobre os números da sessão que a linha 0.1.1 mostrava no anel de uso |
| Navegador | `browser-use-runtime`, `browser-use-playwright-mcp`, `browser-use-chrome-devtools-mcp`, `browser-use-stagehand-native` | avaliar `browser-use-playwright-mcp` na Onda 8, no lugar do Playwright MCP do patch P2 |
| Computer use | `cua`, `cua-bundle`, `cua-macos`, `cua-windows`, `computer-use-cua-driver-mcp`, `computer-use-cua-driver-native` | fora do escopo |
| Ecossistema Claude Code e Codex | `hook-protocol`, `hooks-claude-code`, `hooks-codex`, `claude-code-mods`, `client-ui-claude-code-mods` | avaliar na Onda 8: é parte do diferencial |
| Voz | `speech-to-text`, `speech-to-text-sensevoice`, `api-speech-to-text`, `voice-input-bundle`, `client-ui-voice-input` | avaliar; o modelo local é baixado no primeiro uso |
| Recomendações e cartões de ação | `action-cards`, `client-ui-action-cards`, `creation-recommendations`, `client-ui-creation-recommendations`, `personalized-recommendations`, `plugin-recommendations`, `client-ui-plugin-recommendations`, `plugin-market-bundle` | avaliar depois da Onda 8 |
| Tradução | `translator`, `cot-translation-bundle`, `client-ui-cot-translation` | avaliar para o raciocínio em inglês |
| Git e revisão | `forge`, `forge-bundle`, `forge-github`, `forge-session`, `client-ui-forge`, `worktree`, `tool-worktree`, `webhook`, `webhook-github` | avaliar no preset Code |
| Terminal | `terminal-bundle`, `terminal-panel`, `tool-terminal` | avaliar no preset Code |
| Subagentes e loops | `subagent-oar`, `tool-subagent-oar`, `ralph-bundle`, `tool-ralph` | não ligar por padrão |
| Compartilhamento | `liveshare`, `liveshare-protocol` | fora do escopo (uso de uma pessoa) |
| Execução no navegador e PTC | `webworker-runtime`, `webworker-packer`, `ptc-runtime-python` | não ligar por padrão |
| Inspeção e depuração | `inspector`, `inspector-profile` | só para desenvolvimento |
| Selo | `badge-skill-bundle`, `skill-badge` | não ligar: o selo diz "powered by dsh" |
| Revisão automática | `auto-review` | avaliar com a Onda 2 |

## 3. Layout medido em 1280, 1024, 768 e 390 px

Medido no perfil `dshc` servido por `bin/dshc`, sem provedor configurado, na tela inicial, com Playwright e Chromium. As capturas estão em `referencias/0.2.2/`.

| Largura | Barra lateral | Coluna do herói | Cartão do composer | Rolagem horizontal | Observação |
|---|---|---|---|---|---|
| 1280 × 800 | 280 px, aberta | x 280, largura 1000 | x 421, largura 712 | 0 | diálogo "Get started" (login DeepSeek ou chave de API) na primeira abertura |
| 1024 × 768 | 280 px, aberta | x 280, largura 744 | x 296, largura 705 | 0 | — |
| 768 × 1024 | trilho de 56 px | x 56, largura 712 | x 72, largura 673 | 0 | — |
| 390 × 844 | gaveta fechada | largura total | x 16, largura 351 | 0 | o seletor de modos vai de x 196 a x 463: "Code" fica cortado e "Design" fica fora da tela, sem rolagem (A10) |

Em todas as larguras aparece o aviso "Unable to create default workspace". Neste container não existe a pasta Documents onde o workspace padrão seria criado; numa máquina comum o aviso não deve aparecer, e a M2 não o investigou.

Conclusões para as ondas:

- A geometria de 1024 a 1280 px funciona; a Onda 5 não precisa mexer em `columns.ts`.
- O defeito de 390 px é o seletor de modos (A10), corrigido na Onda 1.
- O texto do diálogo inicial fala de conta DeepSeek; a Onda 1 troca por uma escolha de provedor (D11).

## 4. O que o 0.2.2 já entrega da lista A.4

| Item da A.4 | No 0.2.2 | Evidência |
|---|---|---|
| Foco por `outline` de 2 px | entregue | `packages/client/ui-theme/src/styles/focus.css:3` (`--dsw-focus-ring-width: 2px`) e `:10` (`:focus-visible`) |
| SheetJS só pelo CDN, 0.20.3 ou mais nova | entregue | `packages/client/ui-sidebar-documentpreview/package.json:89` |
| Skills de Office (docx, pdf, pptx, xlsx) | entregue | `packages/document/tool-office`, montadas no perfil Web |

Saem da lista. Continuam nela: a cor do anel de foco (Onda 1, tokens AA), o teste de contraste, as triplas de status, as sombras no tema escuro, os tokens de desabilitado e as alturas de linha.

## 5. Errata aplicada

| Onde | Antes | Agora |
|---|---|---|
| `pesquisa/analise-patches-p1-p2-p3.md` | a skill `deep-research` esperava resultados com `job_output` | o subagente é esperado com `wait_agent` (`packages/subagent/tool-subagent-control/src/wait-agent.ts`) |
| `01-estudo-mestre.md` §1.1 | Cordis sem versão | Cordis 4.1.0, vendorizado em `vendor/cordis` |
| `plano-implementacao.md` | `apps/web/tests/plan-narrow-viewport.e2e.ts` como modelo | o cenário `plan-narrow-viewport` de `apps/web/tests/plan-control-row.e2e.ts` |
| `plano-implementacao.md` | D3, D6 e D7 como decisões a implementar | creditadas ao upstream 0.2.2: `workspace-write`, tema claro/escuro/sistema e os oito idiomas do cliente já vêm dele |
| `01-estudo-mestre.md` §3 | matriz da linha 0.1.1 | aponta para este inventário |

No 0.2.2, a skill que o agente usa para documentar o próprio harness é `packages/preset/agent-preset/skills/dsh-doc`; as referências de pacotes dela ficam em `packages/preset/agent-preset/skills/dsh-doc/references/packages.md`.
