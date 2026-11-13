# Onda 0.5 — baseline: o que ficou verde e o que falta

Base: `c1f0f4ec5` + Onda 0. Branch `ccr-a6886271-p3qfkp`. Objetivo: deixar verdes todos os gates locais do CI antes de qualquer feature, como pedido no "parar se" da Onda 0.

**Resultado:** typecheck, lint, os 37 gates estáticos, o build, os testes unitários e os snapshots sem chave ficaram verdes; as falhas que restam são todas de ambiente do container e estão documentadas. **Continuam vermelhos** dois gates que o CI do fork nunca chegou a rodar: a cobertura de 100% por arquivo (nota 3) e a suíte de navegador (nota 4). Os dois viram a Onda 0.6.

## Entregue (o que mudou e por quê)

**Compilação e wiring dos pacotes do fork**
- `ui-handoff`, `ui-memory`, `ui-projects` e `ui-routines` entraram em `tsconfig.base.json` (`paths`), `tsconfig.client.json` (`references`) e `knip.json`. Era a causa raiz dos erros de tipo em `src/` e da falha do `verify-cordis-config`.
- Removidas as dependências que o knip apontou como não usadas nesses pacotes, e o manifesto do `ui-handoff` foi corrigido pelo `verify-client-packages --fix`.

**Testes alinhados ao comportamento atual do fork** (o comportamento não mudou; os testes descreviam o upstream)
- Slot `details` e `openDetails` removidos dos testes de `ui-tool`, `ui-layout` e `client-runtime` (o fork tem duas colunas).
- A visão Trajectory é selecionada pelo store nos testes, porque o fork esconde as abas (`hideChrome = true`). Ver "Achados".
- Wordmark em texto (`ui-brand-official`), rótulo em inglês (`ui-settings-plugin-inventory`), horário só no cartão de hover (`ui-workspace`), tema só escuro (`ui-theme`, `ui-layout`).
- Tipos de teste: imports de tipo para a declaration merging de locale, `exactOptionalPropertyTypes`, props globais (`useSessions`, `useWorkspaces`, `close`).

**Gate de paridade de locale**
- `scripts/locale-dictionary-parity.spec.ts` checava zh × en, que o fork aposentou. Passou a checar o contrato atual: todo dicionário `pt` pareia com um `en` e não declara chave que o `en` não tem. A Agent Note `2026-09-16-drop-zh-locale-dictionaries` registra isso.

**Lint (299 → 0)**
- `oxlint --fix` para formatação; correções manuais: null-check no foco da gaveta (`AppFrame`), regexes longas do `danger.ts` divididas sem mudar a semântica (o `danger.spec.ts` passa), ramos mortos do tema só escuro, `unref` opcional no scheduler de rotinas, leitura tipada do `FileReader` no perfil.

**Documentação e catálogos**
- Catálogos gerados regenerados (`client-catalog`, `config-catalog`, `tool-catalog`, `module-graph`, `apps/cli/composition.md`), com as contrapartes zh.
- READMEs novos (en + zh) para `ui-handoff`, `ui-projects` e `ui-routines`; o do `ui-memory` foi reescrito no formato canônico de Model Experience.
- As quatro Agent Notes do fork ganharam a versão zh; os pares `README.md`, `apps/cli/reference/README.md` e `ui-layout/README.md` foram ressincronizados.
- Parágrafos quebrados em várias linhas foram unidos (`verify-md-wrap`); links mortos corrigidos (`FishLogo.tsx`, snapshot de permissão apagado, âncora `#run-from-source`).
- `docs/dshc/` saiu do pareamento en/zh (manifesto + `docs/i18n/README.md`): são documentos de planejamento em pt-BR, sem fonte em inglês. As pesquisas `claude-behavior-*.md` foram movidas para `docs/dshc/pesquisa/`.
- JSDoc completado nos exports apontados pelo `verify-export-jsdoc`.

## Gates rodados (comando → resultado)

| Comando | Antes | Depois |
|---|---|---|
| `pnpm run typecheck` | ❌ 65 erros (face cliente) | ✅ |
| `pnpm run lint` | ❌ 299 erros | ✅ |
| `pnpm run check:ci:static` (37 gates) | ❌ 15 falhas | ✅ 37/37 (ver nota 1) |
| `pnpm run build` | ❌ no CI do GitHub | ✅ |
| `pnpm run test` (como root) | ❌ 21 falhas | ✅ só as falhas de ambiente (nota 2) |
| `vitest run --coverage` (limiar de 100% por arquivo) | — | ❌ **ainda vermelho**: 4.433 testes passam, mas 32 arquivos ficam abaixo de 100% (nota 3) |
| `pnpm run test:snapshot` | ❌ 83 falhas (o fork mudou a descrição das ferramentas `bash`/`pwsh` e a política de aprovação sem regravar) | ✅ 123 de 126, depois de `test:snapshot:refresh` (sem chave); as 3 restantes vêm do `ExperimentalWarning: SQLite` do Node 22 deste container no stderr. O job de snapshots do CI usa Node 24 |
| `pnpm run test:web` (Chromium) | — | ❌ **ainda vermelho**: a suíte de navegador espera a interface do upstream (nota 4) |

1. O gate "documentation build" falha numa segunda execução local porque o `website/.dist` da rodada anterior fica no disco; apagando a pasta, passa. O CI sempre parte de um checkout limpo.
2. Dez testes só falham quando o processo roda como **root** (o container desta sessão): eles testam arquivos sem permissão, e root ignora `chmod`; e o Claude Code se recusa a rodar em modo bypass como root. Rodando como usuário comum, os 11 arquivos passam (348 testes). Um teste de IPv6 falha porque o container não tem IPv6 (`EAFNOSUPPORT`).

3. **Cobertura: o único gate do CI que continua vermelho.** O gate completo só calcula a cobertura quando todos os testes passam, o que este container não permite (root, IPv6). Por isso a medição foi feita sobre os 49 pacotes cujo `src/` o fork alterou, rodando as suítes deles mais as globais (`scripts/`, `apps/`, `packages/sdk`, `packages/bundle`). Todos os testes passam, mas o fork adicionou componentes e plugins sem teste. São 478 pontos não cobertos, concentrados em: `ui-settings-general/ProfileRows.tsx` (110), `ui-routines/src/index.ts` (35), `ui-handoff/client/index.tsx` (34), `ui-theme/ChatFontRow.tsx` (28), `ui-sidebar/SidebarRoot.tsx` (22), `ui-settings-models/profile-store.ts` (22), `ui-theme/client/index.ts` (18), `ui-projects/client/index.ts` (18), `ui-routines/client/index.ts` (16), `ui-memory/client/index.ts` (15), `ui-routines/RoutinesSection.tsx` (13), `ui-handoff/ArtifactsModal.tsx` (11), e mais 20 arquivos com 1 a 9 pontos cada. Fechar essa lacuna é a Onda 0.6.4. Como o job de cobertura do CI nunca rodou no fork (achado 1), o problema estava invisível.

4. **Suíte de navegador (`test:web`).** Neste container, o Playwright do projeto pede o build 1228 do Chromium e o instalado é o 1243; com um alias local, os testes passam a abrir o navegador. A causa comum das falhas são os dois modais obrigatórios de onboarding do fork (perfil e provedor), que cobrem a tela e interceptam os cliques. O scaffold (`apps/web/tests/scaffold.ts`) passou a semear o `userName`, o que conclui o passo de perfil. Depois disso, os testes ainda falham porque esperam a estrutura de sidebar, as abas e o chrome de sessão do upstream, que o fork mudou (exemplo: `markdown-wide-table.e2e.ts` espera um segundo `treeitem`). Na primeira rodada, 78 de 84 arquivos falharam. Adaptar a suíte é a Onda 0.6.5.

## Achados (entram no plano como Onda 0.6)

1. **O CI do fork nunca rodou de verdade.** Os jobs `static`, `coverage`, `snapshots` e Windows pedem runners enterprise do upstream (`dsh-ubuntu-24-04-16core`, `dsh-windows-2025-16core`), que não existem no fork: ficam 24h na fila e são cancelados. Os jobs em `ubuntu-latest` rodam, mas o `node 22.19` falhava porque o `build` quebrava (resolvido aqui).
2. **Bug de UX: preso na visão Trajectory.** O botão "inspecionar" dos tool rows chama `setView('trajectory')`, mas as abas foram escondidas; não há caminho de volta ao chat.
3. **Idioma misturado.** Com o navegador em inglês, a interface fica em inglês, mas modais do fork misturam pt e en ("Adicione um provedor" + "Not now"; "Boas-vindas ao DSH Claude" + "Could not save your profile").
4. **O modo `?fixture` não passa do onboarding**: o perfil não pode ser salvo e o modal não fecha. Isso atrapalha demos e testes visuais.
5. **O modal "Adicione um provedor" volta** depois do "Not now" (por exemplo, ao abrir a gaveta no celular).
6. **Rótulo truncado** na sidebar: "Conversations and tas…".
7. **Correção do relatório da Onda 0:** o responsivo **já tem** gaveta abaixo de 1024px (`AppFrame.tsx:111-183`); o que falta é o layout de celular.

## Desvios do plano e motivo
- A Onda 0.5 não estava no `PLANO.md`; foi criada porque o "parar se" da Onda 0 disparou.
- Não houve plan mode: são correções de baseline, sem feature nova.

## Próximo passo sugerido
Onda 0.6 (CI vivo e o bug da Trajectory), depois a Onda 1. O detalhamento está em `docs/dshc/plano-implementacao.md`.
