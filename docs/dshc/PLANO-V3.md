# Plano v3: migração para o upstream 0.2.2 e ondas do DSHC

> **Substitui** o "Plano v2" e a seção 4 de `REVISAO-PLANO-V2.md`, que continua valendo como fonte das evidências (achados A1 a A20).
>
> **Data:** 12/11/2026.
>
> **Base:** upstream `deepseek-ai/deepseek-harness` `e8f7b93a` (0.2.2-rc.2) e a branch `claude/festive-euler-vb8psi` `64e5cd79`.
>
> **Para quem:** o dono (decisões) e o Claude Code (execução, uma etapa por sessão).
>
> **Itens novos** (melhorias atuais e pós-plano): `ESTUDO-MELHORIAS-POS-PLANO.md`. As referências N1 a N18 apontam para ele.

---

## 0. Decisões

| # | Decisão | Situação | Efeito no plano |
|---|---|---|---|
| D2 | Fork leve, nomes internos `@deepseek-ai/dsh-*` | mantida | Pacotes sempre `private: true`; nada é publicado no npm sob `@deepseek-ai` |
| D3 | `workspace-write` por padrão | já vem do upstream | Nenhum trabalho |
| D4 | **Nome: DSHC** (dono escolheu "DSHC ou dsh-claude") | **decidida, ver 0.1** | Some a renomeação para "DSHC" |
| D5 | Paleta: **a original da Anthropic** | **decidida** | Some a troca de paleta e o gate de ΔE. A Onda 1 só corrige contraste (0.2) |
| D6 e D7 | Temas e idiomas | já vêm do upstream | Nenhum trabalho |
| D8 | Migrar para o upstream 0.2.2 | mantida | M0 a M2 |
| D9 | Destino da PR de migração | **recomendação aplicada, ver 0.3** | Branch `dshc/base` |
| D10 | Publicar app desktop | em aberto, não bloqueia | Decidir antes da Onda 9 |
| D11 | Texto do login DeepSeek no onboarding | aplicada a recomendação: texto neutro | Onda 1 |
| D12 | Símbolo "clay burst" | **decidida: monograma DSHC** | Onda 1 |
| D13 | `web_fetch` e exfiltração pela URL | **decidida: pedir aprovação só quando o endereço leva dados** | Onda 2 |
| D14 | Licenças fora de MIT, Apache, BSD e ISC | **decidida: exceções nomeadas por pacote, com motivo** | Onda 2 |

### 0.1 Nome: "DSHC", não "dsh-claude"

Recomendo usar **"DSHC" como nome visível** e deixar de exibir "DSH Claude".

- **Diretriz da Anthropic.** As [Trademark Guidelines](https://www.anthropic.com/legal/trademark-guidelines) dizem que suas marcas ("nossos nomes, logos e elementos de marca") só podem ser usadas com aprovação prévia, e proíbem sugerir afiliação.
- **Precedente.** No caso Clawdbot, a Anthropic objetou **só ao nome**, porque "Clawd" soava como "Claude". Nem a variante "Clawbot" foi aceita ([análise](https://secureyourtrademark.com/blog/anthropic-forces-clawdbot-to-rebrand-as-moltbot/)). "DSH Claude" contém a palavra inteira. "DSHC" não contém.
- **Diretriz da DeepSeek.** O `BRAND_GUIDELINES.md` do upstream recomenda o prefixo "DSH" para projetos derivados, então "DSHC" atende às duas marcas.

*Não sou advogado; isto é leitura das diretrizes públicas e do precedente.*

O que muda:
- Persona nos quatro presets (linha 17): de "running in DSH Claude" para "running in DSHC".
- `README.md`: título e linhas 1, 5, 7 e 24.

O que pode ficar:
- O nome do repositório (`dsh-claude`). Se um dia for renomeado, o GitHub redireciona.
- A pasta padrão `Documents/dsh-claude` (`workspace-controller.productDirectory`). Trocar para `dshc` é opcional.
- O aviso "Not affiliated with Anthropic" fica, obrigatoriamente.

### 0.2 Paleta original mantida, com contraste corrigido

A paleta continua a da Anthropic, como decidido. A Onda 1 só ajusta a luminosidade dos tokens que reprovam em AA (4,5:1), mantendo matiz e croma. Valores calculados contra a pior superfície onde cada token aparece:

| Token (`ui-brand-dshc/src/client/tokens.ts`) | Linha | Claro: atual → novo | Escuro: atual → novo | Mudança visual (ΔE) |
|---|---|---|---|---|
| `--dsw-alias-label-tertiary` | 67 | `#73726c` → `#686761` (3,86 → 4,53) | `#9c9a92` → `#a5a39b` (4,05 → 4,52) | 4,3 / 2,8 |
| `--dsw-alias-label-caption` | 68 | `#73726c` → `#686761` | `#9c9a92` → `#a5a39b` | 4,3 / 2,8 |
| `--dsw-alias-link` | 74 | `#c6613f` → `#ab4926` (3,24 → 4,52) | `#d97757` → `#ec8868` (3,66 → 4,50) | 9,2 / 5,4 |
| `--dsw-alias-state-error-primary` | 134 | mantém (4,98) | `#cd5c58` → `#f6817b` (2,86 → 4,53) | — / 12,1 |
| `--dsw-alias-state-success-primary` | 136 | `#437426` → `#427325` (4,46 → 4,52) | `#599130` → `#78b252` (3,00 → 4,50) | 0,4 / 10,6 |
| `--dsw-alias-state-warn-primary` | 139 | mantém (4,84) | `#a87829` → `#cc9a4f` (2,93 → 4,51) | — / 11,4 |
| `--dsw-alias-state-business-primary` (texto e anel de foco) | 143 | `#ad5230` → `#a64c2a` (4,17 → 4,55) | `#e08b6d` → `#e38d6f` (4,39 → 4,51) | 2,3 / 0,7 |

Notas:
- `--dsw-alias-link` hoje aponta para `DSHC_CLAY` e `DSHC_CLAY_HOVER`. Troque por literais próprios do link e **mantenha** `DSHC_CLAY` (`#c6613f`) no preenchimento do botão de envio. O branco sobre ele dá 4,05:1, o que basta para ícone (mínimo de 3:1).
- Os neutros mudam pouco: ΔE 2,8 a 4,3 só se percebe lado a lado. Os status do tema escuro mudam mais, porque hoje estão bem abaixo do mínimo.
- Corrija o comentário de `tokens.ts` que afirma "WCAG AA (4.5:1) on every surface": hoje ele não é verdadeiro.

**D12, o símbolo (decisão sua).** O "clay burst" de `ui-brand-dshc/src/client/Brand.tsx` é o elemento mais próximo de um **logo**, e as diretrizes citam "logos" e "elementos de marca" explicitamente. Recomendo trocá-lo por um símbolo próprio (por exemplo, o monograma "DSHC" na serifa do wordmark), mantendo a paleta. Se mantiver o símbolo, registre a decisão na *Agent Note* da Onda 1.

### 0.3 Destino da PR: `dshc/base` (recomendado e adotado)

O senhor disse que não sabe. Em termos simples:

| Opção | O que a PR mostra | Risco | Veredito |
|---|---|---|---|
| **A. Nova branch `dshc/base`** com o upstream puro, PR de migração apontando para ela | Só as mudanças do DSHC (festive, resolução de 29 conflitos e portes) | Nenhum: a `main` não muda até o fim | **Recomendada** |
| B. PR direto para `main` com `merge -s ours` (Plano v2) | 13.624 commits do upstream misturados às nossas mudanças | Um clique em "Merge" antes da hora apaga o que não foi portado | Não |
| C. Substituir a `main` à força (`force-push`) | — | Apaga o histórico das PRs #14 a #16 | Não |

Com a opção A, a `main` continua igual durante todo o trabalho. Na Etapa final, um único merge troca o conteúdo da `main` pelo de `dshc/base`, preservando o histórico.

---

## 1. Pendências que são suas

1. Configurar o secret `DEEPSEEK_API_KEY_EXTERNAL` (workflow e2e), ou aceitar que o e2e fique vermelho.
2. Proteger ou apagar a branch `master` do fork (o `ci-master.yml` dispara nela).
3. Decidir D12 (símbolo) antes da Onda 1, e D10 (desktop) antes da Onda 9.
4. Depois que `dshc/base` estiver verde: confirmar o fechamento das PRs #15 e #16.

---

## 2. Etapas

O protocolo não muda: explorar → plan mode → implementar → verificar com subagente revisor → relatório. Só se reportam comandos que rodaram de fato.

### M0 · Base nova e medição

1. `git push origin e8f7b93a:refs/heads/dshc/base`
2. `git switch -c ccr-a6886271-p3qfkp-v022 origin/claude/festive-euler-vb8psi && git merge upstream/master`. É o mesmo sentido do merge `904bf6d1` da própria festive.
3. Resolver os 29 conflitos:
   - **12 gerados:** lado do upstream, depois os geradores do `doc-sync`.
   - **6 READMEs:** reaplicar o texto da festive.
   - **11 de código:** upstream primeiro, depois reaplicar a intenção do commit dshc.

   A lista está em `REVISAO-PLANO-V2.md` A3. Anotar cada um no relatório.

4. `gh workflow disable --repo BlackYuriJDU/dsh-claude` em `ci-master.yml`, `ci-python.yml`, `pr-check-after-approve.yml`, `pr-check-on-head-branch.yml`, `pr-check-on-base-branch.yml` e `sandbox.yml`, sem editar os arquivos.

5. Gates: `pnpm install --frozen-lockfile`, `typecheck`, `lint`, `build`, `test`, `test:snapshot`, `doc-sync` e uma amostra de `test:web`.

   - Em máquina com menos de 16 GB, use `DSH_GATE_CONCURRENCY=1`: a checagem agregada de tipos foi morta por falta de memória com 7 GB.

   - Em rede restrita, `cdn.sheetjs.com` precisa estar liberado.

6. PR em rascunho de `v022` para **`dshc/base`**, sempre com `--repo BlackYuriJDU/dsh-claude --base dshc/base`. Classificar cada vermelho do CI: upstream, festive ou ambiente do fork.

7. Parar depois de 3 rodadas sem compilar e reportar a lista de erros.

### M1 · Porte da linha 0.1.1

| Item | Ação |
|---|---|
| `docs/dshc/*` | Portar como `docs/dshc/`, com a isenção em `scripts/translation-pairing.manifest.json` |
| `conversation-column-overflow.e2e.ts` | Portar (não existe no 0.2.2) |
| Anel de uso e seletor de acesso sob o composer | Ver os slots do composer no 0.2.2 e reimplementar só se não houver equivalente (o 0.2.2 tem `client-ui-stats`, ver N9) |
| `ui-routines` | Descartar se o `ui-schedule` cobrir rotinas recorrentes |
| `ui-handoff` | Descartar a favor de `ui-sidebar-right` + `documentpreview` |
| `ui-settings-general` (perfil e conta), `ChatFontRow` | Comparar com "Your {product}" da festive (`423b3abe`) e portar só o que faltar |
| `knowledgeFileMaxChars` como `Config` | Reaplicar se a festive ainda tiver a constante fixa |
| Correção da Trajectory sem volta | Portar só se o defeito existir no 0.2.2 |
| MCP de busca DuckDuckGo | Descartar (a festive tem SearXNG) |
| Instruções do usuário no prompt | Descartar (`ui-memory/src/index.ts:62` já faz) |
| Gaveta compacta | Descartar (o 0.2.2 tem gaveta em 768 px e recolhimento em 1024 px) |
| Remoção dos dicionários `zh` | Descartar (contradiz D7) |
| P1 e correção dos workflows de issue | Descartar (resolvidos no 0.2.2) |
| Docs `DSHC` → `dshc` | Trocar o nome nos documentos portados |

### M1.5 · Correções da revisão de código e da auditoria

Corrigir os defeitos comprovados pela revisão de código e pela auditoria de `origin/dshc/base...HEAD`, que cobre só o código próprio do fork. Cada correção vai em um commit, com um teste focado que falha antes da correção e passa depois. Ficam de fora o que a PR #17 já corrigiu, as falhas só de ambiente e o que a Onda 1 e a Onda 2 já preveem.

| # | Severidade | Arquivo:linha | Defeito | Cenário de falha | Correção proposta |
|---|---|---|---|---|---|
| 1 | alta | `packages/client/ui-projects/src/client/ProjectsSection.tsx:47` | `ProjectCard` copia `entry.instructions` para `useState` só na montagem e nunca a atualiza; ao perder o foco, `commitInstructions` (linha 52) grava o rascunho local se ele difere do valor salvo | O cartão está montado e as instruções mudam em outro lugar (outra aba, o app desktop, a recarga do patch do perfil). O usuário clica no campo e sai sem digitar, e o texto antigo sobrescreve o novo. Se o cartão montou antes do primeiro valor, o campo vazio apaga as instruções salvas | Guardar só o rascunho editado, como `ProfileSection` faz (`drafts[field] ?? stored`), e limpar o rascunho depois do commit; teste que troca o snapshot com o cartão montado e confere que o blur não grava |
| 2 | média | `packages/client/ui-message-feedback/src/client/FeedbackDialog.tsx:49` e `packages/bundle/dshc/cordis.patch.yml:81` | O diálogo afirma "Your feedback stays in the conversation log on this computer and is not sent" a partir do valor fixo `sharesConversationLog: false`, sem olhar o envio do log de sessão | O usuário liga Settings → General → envio do log de sessão (`session-log-deepseek.enabled`). A nota de feedback fica no log de sessão, e o próximo pedido à API oficial envia esse trecho do log, inclusive os eventos gravados enquanto o envio estava desligado. O texto de privacidade passa a ser falso | Derivar o texto do estado real: ler a config de `session-log-deepseek` (como `ui-settings-session-log/upload-preference.ts`) e só mostrar `dialog.hintLocal` quando nenhum exportador estiver ativo; teste com envio ligado e desligado |
| 3 | média | `packages/client/ui-sidebar-documentpreview/src/client/html/HtmlBody.tsx:55` | O ouvinte de `message` aceita relatórios `dsh-comment` mesmo com o modo de comentário desligado; os scripts da própria página rodam no `contentWindow` do iframe e passam no teste de `event.source` | Um HTML na prévia interativa (escrito pelo modelo ou baixado) faz `parent.postMessage({type:'dsh-comment',…})` em laço: insere citações de até 160 caracteres no rascunho do composer e rouba o foco a cada mensagem, sem nenhum clique do usuário | Ignorar relatórios enquanto `commenting` for falso (ref atualizada no efeito), limitar a um relatório por clique de usuário e desligar o modo depois de cada citação; teste que posta um relatório com o modo desligado e confere o rascunho intacto |
| 4 | média | `packages/client/ui-memory/src/client/ProfileSection.tsx:37`, `MemorySection.tsx:34` e `packages/client/ui-projects/src/client/ProjectsSection.tsx:56` e `:143` | `void form.set(...)` descarta o `Promise<boolean>`: recusa do Host e falha de transporte são ignoradas, e "Saved" aparece antes da resposta | O Host recusa a escrita (perfil somente leitura, revisão em conflito) e a tela mostra "Saved" com o rascunho já descartado; uma falha de transporte vira rejeição de promise não tratada no navegador | Aguardar o resultado, mostrar "Saved" só com `true`, manter o rascunho e mostrar erro localizado com `false` ou exceção (padrão de `upload-preference.ts`), e desabilitar os campos quando `writable` for falso; teste com `set` resolvendo `false` e rejeitando |
| 5 | média | `packages/client/ui-memory/src/client/MemorySection.tsx:34` e `packages/client/ui-projects/src/client/ProjectsSection.tsx:143` | Cada escrita substitui a coleção inteira (`memories`, `projects`) montada a partir do último snapshot renderizado, que só muda depois da confirmação do Host | O usuário apaga a memória A e, antes da volta do Host, apaga a B: a segunda escrita é a lista antiga menos B, e A reaparece. O mesmo vale para dois cartões de projeto ou para remover dois arquivos de conhecimento seguidos | Usar `mutate` com operações por caminho (`['projects', workspaceId, 'files']`, item por id) ou serializar as edições sobre o último valor enfileirado; teste com duas remoções antes do snapshot novo |
| 6 | média | `packages/web/web-search-searxng/src/provider.ts:137` e `:151` | O cancelamento só é reconhecido quando o erro é `DOMException` `AbortError`; `signal.aborted` não é consultado | O loop aborta com um `Error` como motivo (`agent.ts:199`, `tool-web/src/search.ts:282`) e o `fetch` rejeita com esse motivo: a busca cancelada sai como `WEB_PROVIDER_ERROR` "SearXNG search request failed", contra o contrato do seam que os provedores irmãos seguem | Testar `signal?.aborted === true \|\| isAbortError(error)` nos dois `catch`, como `web-search-deepseek/src/provider.ts:275`; teste com `controller.abort(new Error('x'))` |
| 7 | média | `bin/dshc:35` | O launcher põe `--port` antes de `"$@"`; o `dsh` encerra as próprias opções no primeiro token desconhecido (`apps/cli/src/args.ts:164`) | `bin/dshc --patch apps/web/tests/pin-browse-picker.overlay.yml` (ou `--dump-config`) vira `dsh dshc --port 3090 --patch …`: o `--patch` vai para o app web em vez do launcher e o overlay não é aplicado | Passar `--port "$DSHC_PORT"` depois de `"$@"`, ou separar as opções do launcher antes de inserir a porta; teste de shell que confere o argv montado |
| 8 | média | `packages/web/web-search-searxng/tests/` e `packages/client/{ui-brand-dshc,ui-settings-searxng,ui-agent-preset}` | Falta teste de composição REAL: o provedor SearXNG, visível ao modelo pelo `web_search`, só tem specs com `ctx.plugin` e um e2e ao vivo que pula sem `$SEARXNG_URL`; as sugestões do herói, a página do SearXNG e o seletor segmentado não têm e2e web no perfil `dshc` | Uma quebra no `cordis.patch.yml` do DSHC, na ordem dos patches ou no registro do provedor passa em todos os specs e só aparece no app (contra `packages/AGENTS.md`, "Product-visible plugins require a non-unit REAL-composition test") | Smoke com `runLoaderSmoke` e patch de teste: servidor SearXNG falso local mais LLM falso, conferindo o resultado de `web_search` no log de sessão; um e2e web no perfil `dshc` que preenche uma sugestão, troca o preset segmentado e salva a URL do SearXNG |
| 9 | baixa | `packages/client/ui-memory/src/memory.ts:87` e `packages/client/ui-projects/src/projects.ts:97` | `memoryContextText` para no primeiro item que não cabe; se for o primeiro, retorna `''`. `projectContextText` corta as instruções em `maxTotalChars` sem aviso | Uma primeira memória maior que `maxChars` (8000) faz sumir todas as memórias do contexto sem a linha "omitted"; instruções de projeto longas chegam ao modelo cortadas no meio, sem marca de corte | Pular só o item grande e contá-lo como omitido (ou encurtá-lo com aviso, como `profileContextText`), e marcar o corte das instruções; testes no limite exato |
| 10 | baixa | `packages/client/ui-chat/src/client/conversation-nodes/turn-process.ts:230` | A contagem de falhas do Turn soma só `tool/result` de primeiro nível; a do grupo (`process-activity.ts`) inclui as chamadas aninhadas do PTC (`tool/ptc-dispatch`) | Um `run_code` termina bem, mas uma chamada aninhada falha: o grupo mostra "1 failed" e o controle do Turn não mostra nada; com o Turn recolhido a falha some, contra o README de `conversation-nodes` | Contar também os `tool/ptc-dispatch` com erro no estado do Turn, ou derivar as duas contagens da mesma árvore; teste com subchamada falhando |
| 11 | baixa | `packages/web/web-search-searxng/src/provider.ts:141` | Em status não OK o provedor lança o erro sem ler nem cancelar o corpo da resposta | Uma instância sem o formato JSON responde 403 com HTML a cada busca; cada corpo não lido segura uma conexão do pool do undici até a coleta de lixo | `await response.body?.cancel()` antes de lançar; teste que confere o cancelamento do stream |
| 12 | baixa | `packages/client/ui-projects/src/knowledge.ts:37` | Os arquivos de conhecimento passam por `statSync`/`openSync`/`readSync` dentro do callback de contexto do prompt, a cada montagem; o cache por caminho nunca remove entradas | Vários arquivos em disco lento ou de rede bloqueiam o event loop do Host a cada passo do modelo, travando todas as sessões e o RPC; entradas de arquivos removidos da config ficam na memória | Ler de forma assíncrona fora da montagem (na mudança de config ou de mtime) e servir o texto já lido; podar o cache às entradas configuradas |
| 13 | baixa | `packages/client/ui-memory/src/memory.ts:14` e `:28`, `packages/client/ui-projects/src/projects.ts:14` | As posições 295, 300 e 310 são literais locais, fora da tabela central `CONTEXT_ORDERS` de `system-prompt` (`src/index.ts:178`); todos os outros contribuintes usam `getContextOrder()` | Uma alocação futura do upstream na faixa 295–310 colide ou intercala com a memória e o projeto sem nenhum gate falhar; o comentário "after the upstream allocations (100–210)" fica velho em silêncio | Registrar os nomes em `CONTEXT_ORDERS` (entra na lista de divergência, N5) ou adicionar um teste que afirma a ordem relativa às alocações centrais |
| 14 | baixa | `packages/client/ui-agent-preset/tsconfig.json` e `src/client/AgentPresetSeat.tsx:24`; `packages/client/ui-message-feedback/tsconfig.json` | Os dois pacotes ganharam metade Host (Config com schemastery e o merge de `@deepseek-ai/dsh-settings`), mas continuam num único `tsconfig` de cliente, e o código do navegador importa `../index.ts` | O merge de Context do Host entra no programa do navegador, contra "Keep compiler faces explicit" (`AGENTS.md`) e a regra de `tsconfig.host.json`/`tsconfig.client.json` de `packages/AGENTS.md` | Mover os tipos compartilhados para um módulo sem efeitos (como `ui-memory/src/memory.ts`) e dividir em `tsconfig.host.json` e `tsconfig.client.json` com raiz só de solução |
| 15 | baixa | `packages/client/ui-agent-preset/src/client/AgentPresetSeat.tsx:189` | O seletor segmentado declara `role="radiogroup"`/`role="radio"`, mas cada segmento é um botão com Tab próprio, sem setas nem `tabindex` móvel | O leitor de tela anuncia um grupo de rádio; o usuário de teclado aperta as setas e nada muda, e o Tab para nos quatro segmentos (Chat, Cowork, Code, Design) na tela de nova sessão | Implementar o padrão de rádio (setas, Home/End, `tabIndex` 0 só no marcado) ou trocar para botões com `aria-pressed`; teste de teclado |
| 16 | baixa | `packages/client/ui-memory/src/client/MemorySection.tsx:77` e `:116` | O `textarea` de edição não tem nome acessível, e o de adicionar só tem `placeholder` | No modo de edição o leitor de tela anuncia só "editar texto", sem dizer qual memória; o placeholder some ao digitar | `aria-label` localizado nos dois campos (as chaves entram nos oito dicionários); teste por `getByRole('textbox', { name })` |
| 17 | baixa | `packages/client/ui-memory/src/client/MemorySection.tsx:27` (também `ProfileSection.tsx:24`, `ProfileBadge.tsx:37`, `ProjectsSection.tsx:126`) | `useSyncExternalStore(form.subscribe.bind(form), …)` cria uma função `subscribe` nova a cada render, e o React reassina o formulário a cada vez | Cada tecla nos campos de memória, perfil ou projeto remove e recoloca o ouvinte do formulário; uma troca de snapshot nesse intervalo força um render extra | Vincular uma vez (wrapper estável ou `useCallback`) ou usar o hook observável já existente |

Verificação: rodar os specs focados de cada pacote alterado (`npx vitest run <spec>`) com cobertura de 100% por arquivo, `pnpm run typecheck` e `pnpm run lint`; quando a mudança for visível ao modelo (itens 6, 8, 9 e 13) ou ao usuário (itens 1 a 5, 7, 10, 15 e 16), incluir também o snapshot sem chave ou o e2e correspondente.

### M2 · Inventário e documentos (só docs)

1. Refazer a matriz de paridade sobre o 0.2.2, com `arquivo:linha` em cada linha: G1 (o que `documentpreview` e `deliverables` já fazem), G2 citações, G6 editar mensagem, responsivo ≤ 600 px, tokens de motion, conectores e o catálogo de **63 pacotes experimentais** do upstream (N8).
2. Aplicar a errata (`REVISAO-PLANO-V2.md`, seção 3.8): `wait_agent` no lugar de `job_output`, Cordis 4.1.0, `dsh-doc`, cenário `plan-narrow-viewport`, e D3, D6 e D7 creditados ao upstream.
3. Medir o layout atual em 1280, 1024, 768 e 390 px antes de propor qualquer geometria nova.
4. Retirar do A.4 o que o 0.2.2 já entrega: foco por `outline` de 2 px, SheetJS pelo CDN, skills de Office.
5. Escrever `docs/dshc/relatorios/onda-0.7.md` (migração).
6. Gates de docs: `doc-sync`, `verify-md-wrap`, `verify-md-links` e `verify-translation-pairing`.

### Onda 1 · Identidade DSHC e acessibilidade

1. **Nome visível** (0.1): personas e README. Snapshots de transcrição atualizados, porque a persona é visível ao modelo.
2. **Tokens AA** (0.2), mais um teste em `ui-brand-dshc/tests/` que lê `DSHC_TOKENS` e reprova quando:
   - texto fica < 4,5:1 em qualquer superfície onde o token é usado;
   - indicador de UI fica < 3:1;
   - o anel de foco (`state-business-primary`) fica < 3:1 contra algum fundo.

   Prove o gate com um par inválido. Código em N2. Boa prática (WCAG 2.4.13, AAA): `outline-offset: 2px` no botão de envio e em controles preenchidos de cor argila, onde o anel se funde (1,4:1).

3. **Símbolo:** conforme D12.

4. **Onboarding:** "Faça login em sua conta DeepSeek" vira texto neutro, como uma opção de provedor (D11).

5. **Defeitos medidos na festive:**

   - seletor de modos em 390 px (A10);

   - composer focado sem indicador (A11; origem em N1);

   - truncamento "Espaços de traba…", "Mais" duplicado, e "Espaços de trabalho" a 4,38:1 (A12).

6. **Defeitos do axe que vêm do upstream:** papel do composer, árvore vazia, falta de `<main>` e de `h1` (N1). Mande PR ao upstream. Se não for aceita a tempo, mantenha o patch e registre na lista de divergência (N5).

7. **Gate de acessibilidade com axe** no e2e web (N3).

8. **Testes:** cobertura de 100% por arquivo, e2e em 390 px afirmando `scrollLeft = 0` depois de Tab até o último modo, screenshots em 390 e 1280 px, GIF e *Agent Note* substituindo `claude-app-palette-layer`.

### Onda 2 · Segurança e licenças

1. **Camada 1, no sandbox:** `Config` `denyReadPaths` e `network: 'on' | 'off'` em `sandbox-local` (bwrap com `--tmpfs`/`--ro-bind /dev/null` e `--unshare-net`; Landlock; Seatbelt). Proposta como PR ao upstream.
2. **Camada 2, na ferramenta:** *listener* em `tools/pre-execute` em `packages/guard/`, pedindo aprovação para `read`, `grep` e `glob` em caminhos sensíveis e para `web_fetch` fora da lista de domínios.
3. **Snapshot sem chave:** `bash cat ~/.ssh/id_rsa` negado pelo executor.
4. **Teste de privacidade:** nenhum host externo contatado na inicialização (N4).
5. `scripts/verify-licenses.ts` no `run-gates.ts`: MIT, Apache, BSD e ISC liberados; MPL-2.0 liberado só em `devDependencies` (o `axe-core` de N3 é MPL-2.0); bloquear tldraw, AGPL e GPL.
6. Dependabot agrupado no fuso do dono.

### Ondas 3 a 9

| Onda | Entrega | Ajustes do v3 |
|---|---|---|
| 3 | Artifacts duráveis (G1) | Usar `ui-sidebar-right` e `documentpreview`; sem slot novo |
| 4 | Citações (G2) | Confirmar na M2 |
| 5 | Responsivo ≤ 600 px e motion | **Sem a biblioteca `motion`**: tokens CSS `--ds-transition-*`. Modelos de teste: `composer-tab-geometry`, o cenário `plan-narrow-viewport` e `conversation-column-overflow` (portado). Não alterar `columns.ts`. |
| 6 | Gráficos, planilhas e quadro | ECharts 6.1; Univer respeitando a idade mínima do pnpm; decidir sobre o Sandpack (bundler de terceiros); sem Nodebox |
| 7 | Editar mensagem e ramificar | Confirmar na M2 |
| 8 | Conectores, carregador de plugins, Reflect | Sobre `ui-plugin-market` e `mcp-client`. **P2 e P3 revistos:** o Playwright MCP vira o bundle `browser-use-playwright-mcp` do upstream (N8); skills de Office já existem; a skill `deep-research` usa `wait_agent` |
| 9 | Publicação | `SECURITY.md`, `CODE_OF_CONDUCT.md`, aviso de não afiliação, `THIRD_PARTY_NOTICES`, nada publicado sob `@deepseek-ai`, desktop conforme D10 (com `product-analytics` desligado) |

### Etapa final · Substituir a `main`

1. Com `dshc/base` verde e as PRs das ondas mescladas nela, faça `git merge -s ours origin/main` em `dshc/base`.
2. Abra a PR para `main` contendo só esse merge.
3. Feche as PRs #15 e #16 como substituídas, com a sua confirmação.
4. Ligue a sincronização automática com o upstream (N6).

---

## 3. Prompts para o Claude Code

### M0

```text
<papel>Você executa a etapa M0 do Plano v3 do DSHC (revisao-plano-v2/PLANO-V3.md, seção 2).</papel>
<contexto>
- Upstream deepseek-ai/deepseek-harness master = e8f7b93a (0.2.2-rc.2). Festive = origin/claude/festive-euler-vb8psi (64e5cd79).
- O merge simulado dá 29 conflitos: 12 gerados, 6 READMEs, 11 de código (lista em REVISAO-PLANO-V2.md A3).
</contexto>
<tarefa>
1. Crie dshc/base em e8f7b93a e envie ao origin.
2. A partir da festive, crie ccr-a6886271-p3qfkp-v022 e faça merge de upstream/master.
3. Resolva os conflitos: gerados → lado do upstream + geradores do doc-sync; READMEs e código → upstream primeiro, depois a intenção do commit dshc. Anote cada um.
4. Desabilite com gh workflow disable (--repo BlackYuriJDU/dsh-claude): ci-master.yml, ci-python.yml, pr-check-after-approve.yml, pr-check-on-head-branch.yml, pr-check-on-base-branch.yml, sandbox.yml. Não edite .yml.
5. Rode: pnpm install --frozen-lockfile; typecheck; lint; build; test; test:snapshot; doc-sync; uma amostra de test:web (DSH_GATE_CONCURRENCY=1 se houver pouca memória).
6. Abra PR em rascunho de v022 para dshc/base (sempre com --repo e --base).
</tarefa>
<restrições>Sem force-push. Não toque em main, master nem festive. Não faça merge -s ours nesta etapa. Mostre cada push e peça confirmação antes.</restrições>
<parada>Pare depois de 3 rodadas sem compilar e reporte a lista de erros.</parada>
<saída>docs/dshc/relatorios/onda-0.7.md com conflitos e resolução, gates com resultado real e cada vermelho do CI classificado. Reporte só comandos que rodou.</saída>
```

### Onda 1

```text
<papel>Você executa a Onda 1 do Plano v3: identidade DSHC e acessibilidade.</papel>
<entradas>Nome visível: DSHC. Paleta: a original. Símbolo: <decisão D12>. Valores dos tokens: PLANO-V3.md seção 0.2. Código de referência: ESTUDO-MELHORIAS-POS-PLANO.md N1, N2 e N3.</entradas>
<tarefa>
1. Troque "DSH Claude" por "DSHC" nas personas (packages/bundle/dshc/presets/*.patch.yml:17) e no README; mantenha "You are not Claude" e o aviso de não afiliação.
2. Aplique os 7 tokens de tokens.ts (linhas 67, 68, 74, 134, 136, 139, 143); o link ganha literais próprios e DSHC_CLAY continua no botão de envio.
3. Crie ui-brand-dshc/tests/contrast.client.spec.ts (N2) e prove o gate com um par inválido. Dê outline-offset: 2px ao botão de envio.
4. Corrija A10, A11 e A12 da revisão e os quatro itens do axe (N1); os do upstream também viram PR para deepseek-ai/deepseek-harness.
5. Adicione apps/web/tests/dshc-a11y.e2e.ts (N3).
</tarefa>
<verificação>Cobertura de 100% por arquivo; snapshots de transcrição; e2e em 390 px com scrollLeft = 0; screenshots em 390 e 1280 px; GIF; Agent Note.</verificação>
<restrições>Não altere packages/client/ui-layout/src/client/columns.ts. Cada mudança fora de packages/bundle/dshc e packages/client/ui-brand-dshc entra na lista de divergência (N5).</restrições>
```

### Onda 2

```text
<papel>Você executa a Onda 2 do Plano v3: política contra exfiltração em duas camadas.</papel>
<fatos>sandbox-local/src/profiles.ts:17 usa --ro-bind / / sem --unshare-net; fs-sandbox deixa leituras livres; packages/AGENTS.md exige aplicar a decisão na operação e testar a negação pelo executor.</fatos>
<tarefa>
1. Config denyReadPaths (padrão ~/.ssh, ~/.aws, ~/.config/gh, **/.env*) e network: 'on' | 'off' em sandbox-local, para bwrap, Landlock e Seatbelt, como PR separada pensada para o upstream.
2. Plugin em packages/guard/ (listener de tools/pre-execute, sempre chama next()) pedindo aprovação para read/grep/glob nesses caminhos e para web_fetch fora de uma lista de domínios em Config.
3. Snapshot sem chave: bash cat ~/.ssh/id_rsa negado; read de .env pede aprovação.
4. Teste de privacidade de inicialização (ESTUDO-MELHORIAS-POS-PLANO.md N4).
</tarefa>
<restrições>Caminhos e domínios são Config, nunca constantes. Agent Note obrigatória.</restrições>
```
