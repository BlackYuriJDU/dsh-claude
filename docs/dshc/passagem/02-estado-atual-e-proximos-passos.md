# Passagem 3 de 3: o estado atual e os próximos passos

> Retrato de 14/11/2026, quando o dono pediu esta passagem. Último commit enviado: `12b77505` (Onda 2 completa, com a correção do Windows). **Nada da Onda 3 foi commitado.** A árvore de trabalho está no meio de uma migração e **não compila** como está: termine os passos da seção 4 antes de commitar.

## 1. Onde paramos e por quê

A primeira forma da Onda 3 funcionava inteira: 34 testes com 100% de cobertura e o e2e web com 3 casos passando. Ela era um pacote experimental (`packages/experimental/client-ui-presented-versions`) que gravava registros de plugin.

O `pnpm run hygiene` reprovou essa forma em quatro gates:

1. **`verify-default-product-isolation`:** o bundle `dsh-dshc` faz parte do produto padrão e não pode depender de pacote experimental, nem pela `package.json` nem pelo `cordis.patch.yml`.
2. **`constraints`** (`scripts/check-workspace-constraints.ts`):
   - pacote experimental novo não pode usar o prefixo `@deepseek-ai/dsh-experimental-`; usaria `@deepseek-ai/dsh-<nome>` mais a entrada em `EXPERIMENTAL_PACKAGE_NAME_EXCEPTIONS`;
   - o bundle não pode referenciar pacote experimental.
3. **`verify-package-dependencies`:** `pathPartsOf` e `resolveWorkspacePath`, de `@deepseek-ai/dsh-util-workspace-path`, não estão classificados como "safe" ou "peer-required" para uso em runtime do Host. Ainda não foi tratado: veja o passo 4.6.
4. **`rescope-vendor:check`:** acusa "pre-rescope name token" em 9 arquivos. Entre eles estão `docs/dshc/relatorios/onda-0.7.md` e `packages/bundle/dshc/tests/dshc.spec.ts`, mas também arquivos que esta onda não tocou (`creator-persona.e2e.ts`, `upgrade-guide`, `cua/tests`, `ui-agent-preset/tests/policy.host.spec.ts`). **Não se sabe se a falha já existia antes.** Confira rodando `npx tsx scripts/rescope-vendor.ts --check` num worktree limpo em `12b77505`. Se já existia, é do merge M0 e fica para um commit à parte.

O conflito central: só pacote experimental pode gravar registro de plugin, e o produto padrão não aceita pacote experimental. O dono escolheu **um evento de sessão próprio, `deliverables/snapshotted`** (D15-b), em vez de exceções nos gates ou de um índice fora do log. O dono interrompeu duas vezes enquanto a troca era feita: a segunda vez foi para pedir esta passagem.

## 2. O desenho final da Onda 3 (o que o código já faz)

O pacote está em **`packages/client/ui-presented-versions`**, com o nome **`@deepseek-ai/dsh-client-ui-presented-versions`**, já movido e renomeado.

| Arquivo | Conteúdo |
|---|---|
| `package.json` | Nome novo; exports `.`, `./client`, `./types`; `dsh.client.inject` = connection, locale, renderer e sidebar-right; peer: cordis, fs e session; deps: schemastery e util-workspace-path; o resto em devDependencies |
| `tsconfig.json` | Só solução, com referências para `tsconfig.host.json` e `tsconfig.client.json` |
| `tsconfig.host.json` | `index.ts`, `route.ts`, `types.ts` e `versions.ts`; referências já ajustadas para `packages/client` |
| `tsconfig.client.json` | `src/client`, `route.ts` e `types.ts` |
| `tsdown.config.ts` | `clientBundle(import.meta.dirname, ['lib/types/index.js'], { hostPhase: true })` importado de `../tsdown.client.ts` |
| `src/types.ts` | `PresentedSnapshotSkip`, `PresentedSnapshotFile`, `PresentedSnapshot { callId, files }`, `PresentedVersion { version, seq, index, time, bytes, previewPath? }`, `PresentedVersions { versions, selected? }`, e o `SessionEventMap['deliverables/snapshotted']: PresentedSnapshot` (já trocado do `PluginRecordMap`) |
| `src/route.ts` | Seguro para o navegador: `PRESENTED_VERSIONS_PATH = '/api/presented.versions'`, `presentedCoordinatesOf(query)`, `presentedVersionsUrl(coords)` e `isPresentedVersions(value)`, que exige versões numeradas a partir de 1 e um `selected` dentro da lista |
| `src/versions.ts` | `isPresentedSnapshot(value)` (validação de dado durável) e `presentedVersions(events, cwd, target, previewPath)`: junta as entregas do mesmo caminho resolvido, liga cada uma à cópia pelo `callId`, numera em ordem de seq e faz cópias iguais e seguidas contarem uma vez. Já lê `event.type === 'deliverables/snapshotted'` |
| `src/index.ts` | O plugin Host: `name = 'presented-versions'`, `Config { maxFileBytes }` com padrão de 16 MiB, `inject = ['tools', 'fs', 'attachments', 'connection', 'sessionQuery']`. Um `tools/result` de `present` sem erro dispara `capture`: lê pelo `ctx.fs` com o teto (`FS_TOO_LARGE` vira `too-large`; outro erro vira `unreadable`), guarda com `attachments.saveFile` e grava `session.append('deliverables/snapshotted', …)` (já trocado). As tarefas pendentes ficam num `Map<SessionId, Set<Promise>>`. Um `tools/pre-execute` espera as pendentes da sessão antes de `next()`. O dispose aborta e espera. A rota GET usa `sessionQuery.readSession`: 400 para coordenadas inválidas, 404 para sessão ou arquivo inexistente, 500 para outra falha |
| `src/client/index.ts` | Registra os dicionários e o componente no slot `deliverables.file.actions`; `connection/reset` limpa a store; `openVersion` chama `ctx.sidebarRight.openResource(fileAddressFor(sessionId, undefined, previewPath))` |
| `src/client/VersionsAction.tsx` | O botão `Button size="sm"` com `IconClockOutlineRegular`, rótulo `v{selected}/{count}` ou `{count} versions`, e o `aria-label` "Delivered versions: {count}". O `Menu` (portal, alinhado ao fim) lista "Version N"; uma versão sem `previewPath` fica desabilitada com o motivo. Abrir o menu relê a lista. O componente só aparece com mais de uma versão, ou com uma versão só quando o cartão dela não tem cópia |
| `src/client/versions-store.ts` | `VersionsStore`: `load` (uma vez), `refresh` (relê sem limpar e mantém a lista se a nova leitura falhar), `reset`, `dispose` |
| `src/client/locales.ts` | O namespace `presented-versions`, com 5 chaves em 8 idiomas |
| `locale/*.json` | Título e descrição do plugin em 8 idiomas |
| `tests/versions.spec.ts` | A função pura e a rota (já trocado para o tipo novo) |
| `tests/plugin.host.spec.ts` | O plugin com o pipeline e a sessão reais e o `LocalAttachmentStore` num diretório temporário (já trocado para o tipo novo) |
| `tests/versions-action.client.spec.tsx` | O componente, a store, o registro e a desmontagem (HMR) e as chaves dos idiomas |
| `README.md`, `README.zh.md`, `README.i18n.yaml` | **Ainda descrevem a forma antiga** (nome experimental, registro de plugin, `plugin:` e a limitação de formato) e precisam de ajuste |

Outros arquivos já criados:
- `apps/web/tests/dshc-presented-versions.e2e.ts` — **ainda semeia** `type: 'plugin:client-ui-presented-versions/snapshot'` com `ignorable: true`; precisa passar a `deliverables/snapshotted`, sem `ignorable`.
- `.agents/notes/implemented/feature/2026-11-14-dshc-presented-file-versions{.md,.zh.md,.i18n.yaml}` — **descreve a forma antiga** (a "decisão" diz plugin record): reescreva para o evento de sessão e mova o "plugin record" para as alternativas consideradas, com o motivo dos gates.
- `docs/dshc/referencias/onda-3/` — 4 PNG e 1 GIF, válidos (a UI não muda).
- `docs/dshc/relatorios/onda-0.7.md` (seção da Onda 3) e `docs/dshc/PLANO-V3.md` (linha D15) — falta acrescentar a D15-b e ajustar "Pacote experimental" e "registro de plugin".

## 3. Arquivos modificados que ainda apontam para o nome antigo

- `tsconfig.host.json` e `tsconfig.client.json` (raiz): entradas `./packages/experimental/client-ui-presented-versions/tsconfig.{host,client}.json`, logo depois das do `client-ui-forge`. Mude para `./packages/client/ui-presented-versions/...`.
- `tsconfig.base.json`: três aliases escritos à mão `@deepseek-ai/dsh-experimental-client-ui-presented-versions{,/types,/client}`. Remova-os e rode `npx tsx scripts/gen-tsconfig-paths.ts`, que agora deve gerar os do nome novo.
- `packages/bundle/dshc/cordis.patch.yml`: a entrada `client-ui-presented-versions` com `name: '@deepseek-ai/dsh-experimental-client-ui-presented-versions'`. Troque o id para `ui-presented-versions` e o nome para o novo.
- `packages/bundle/dshc/package.json`: a dependência com o nome antigo (troque e reordene).
- `packages/bundle/dshc/tests/dshc.spec.ts`: a lista de ids inseridos termina em `'client-ui-presented-versions'`.
- `packages/experimental/README.md`, `.zh.md` e `.i18n.yaml`: a linha nova da tabela, que deve **sair** daí e ir para a tabela de `packages/client/README.md` e `.zh.md` (veja o formato das outras linhas, depois `verify-translation-pairing --write`).
- `scripts/verify-package-readme-model-experience.ts`: a entrada `'packages/experimental/client-ui-presented-versions'` vira `'packages/client/ui-presented-versions'`, com o motivo reescrito sem "plugin records".
- Arquivos gerados que vão mudar de novo ao rodar os geradores: `docs/config-catalog*`, `docs/module-graph*`, `docs/event-producer-consumer*`, `docs/experimental-persistence-catalog*` (a linha do registro sai), `packages/extensions/cordis-client-runner/src/client/slot-catalog.ts`, `packages/preset/agent-preset/skills/dsh-doc/references/packages.md`, `pnpm-lock.yaml`, `packages/core/session/src/known-event-types.ts` e `docs/persistence-schema.json`.
- `apps/web/tsconfig.json`: o e2e já está no `exclude`; `tsconfig.host.json` também o lista. Sem mudança.

## 4. Passo a passo para terminar a Onda 3

1. `export PATH=/opt/node24/bin:$PATH NODE_OPTIONS=--max-old-space-size=10240 DSH_GATE_CONCURRENCY=2`
2. Ajuste as referências da seção 3. Depois rode `pnpm install --offline` e `npx tsx scripts/gen-tsconfig-paths.ts`.
3. `npx tsc -b packages/client/ui-presented-versions/tsconfig.json`. Corrija o que aparecer; o evento novo precisa existir para o `session.append` compilar.
4. `npx vitest run --coverage.enabled --coverage.include='packages/client/ui-presented-versions/src/**' packages/client/ui-presented-versions` deve dar 100%. Se a validação do `type` em `versions.ts` deixar um ramo de fora, cubra com um caso.
5. **Evento novo, persistência:** `pnpm run gen-persistence-catalog`, depois `pnpm --silent run verify-persistence-changes --json` para ver a mudança, e siga `docs/cookbook/reviewing-persistence-type-changes.md`:
   - escreva `.artifacts/persistence-change.prose.json` com `en` e `zh`, cada um com `summary`, `compatibility` e `verification`;
   - **summary:** acrescenta o evento `deliverables/snapshotted`;
   - **compatibility:** um tipo novo, gravado só pelo plugin do DSHC; leitores deste repositório o conhecem pelo `known-event-types.ts` gerado; um build do upstream sem o tipo recusa abrir a sessão, o que foi aceito pelo dono (D15-b);
   - **verification:** os specs do pacote e o e2e;
   - rode o comando de registro que o cookbook indica e confira `docs/session-format-status.md` antes, sem mexer em registros travados.
6. **Dependências classificadas:** o `verify-package-dependencies` reclamou de `pathPartsOf` e `resolveWorkspacePath` em runtime do Host. Veja como outros pacotes usam `dsh-util-workspace-path` (o `ui-deliverables` usa no cliente) e a lista "safe" em `scripts/verify-package-dependencies.ts`. A saída mais simples: tirar a dependência de runtime, trocando `pathPartsOf(path).name` por `basename` de `node:path` e `resolveWorkspacePath` por `isAbsolute`/`resolve` de `node:path` no Host.
7. **SDKs:** o `AGENTS.md` pede que mudanças no `SessionEventMap` atualizem as saídas esperadas dos SDKs TypeScript e Python. Procure, em `docs/testing.md#when-a-snapshot-test-is-required`, quais saídas listam tipos de evento. Rode os testes dos SDKs (`pnpm run test:snapshot` e os testes de `python/`, que exigem o ambiente Python) e regrave o que mudar.
8. Troque, no e2e, o tipo do evento semeado e tire o `ignorable`. Rode `pnpm run build:artifacts`, **sem** editar `tsconfig`s enquanto ele roda; foi essa corrida que vazou saída do compilador em `src/` antes. Se vazar, use `git clean -fq packages/llm packages/test-support packages/util`. Depois: `NODE_PATH=/opt/node22/lib/node_modules DSH_SNAPSHOT=replay npx vitest run --config vitest.web.config.ts apps/web/tests/dshc-presented-versions.e2e.ts`. Os 3 casos devem passar.
9. Reescreva o README (en e zh), a Agent Note (en e zh), o relatório e o PLANO, e rode `npx tsx scripts/verify-translation-pairing.ts --write <arquivo en>` em cada par.
10. Rode os geradores: `gen-config-catalog`, `gen-plugin-packages`, `gen-doc-graphs`, `gen-module-graph`, `gen-client-catalog`, `gen-persistence-catalog`, `gen-dependency-catalog` e `gen-third-party-notices`. Depois, `pnpm run doc-sync`, `pnpm run hygiene` e o lint com `npx tsx scripts/run-oxlint.ts <caminhos>`.
11. Rode `pnpm run build:check`. O typecheck completo roda no hook de pre-push.
12. Commits separados, com os trailers do arquivo 1: pacote e evento; composição DSHC e e2e; docs, Agent Note e relatório. Depois `git push -u origin ccr-a6886271-p3qfkp-v022` e acompanhe o CI da PR #17. Falhas de ambiente e falhas antigas já comentadas não pedem comentário novo.

## 5. Depois da Onda 3

- **Onda 4: citações (G2).** Normalizar as fontes de `tool-web` num formato `{ id, url, title, snippet }`, numa seção de system prompt com a convenção `[n]`, e fazer o renderer transformar `[n]` em chip clicável só quando a fonte existe no turno. Confirmar antes no `inventario-0.2.2.md` o que o 0.2.2 já faz.
- **Pendências da Onda 2:** o launcher do Landlock com negação de leitura e de rede; o `.env` do workspace continua legível pelo shell, porque a camada 1 não aceita glob; e a PR do `sandbox-local` para o upstream.
- **Pendências do dono:**
  - o secret `DEEPSEEK_API_KEY_EXTERNAL`;
  - o GitHub App;
  - proteger ou apagar a `master`;
  - decidir a D10 antes da Onda 9;
  - confirmar o fechamento das PRs #15 e #16 quando a `dshc/base` estiver verde.
- **Falhas antigas do CI, fora do escopo das ondas:** `sandbox-windows-acl` no Windows, timeouts do `liveshare`, o `loader-composition` do `tool-pwsh-persistent` e a variação dos benchmarks.

## 6. Limitações conhecidas da Onda 3 (vão para o README)

- As cópias nunca são apagadas; bytes iguais são guardados uma vez só, porque o armazenamento de anexos é endereçado por conteúdo.
- Um workspace remoto lista as versões, mas não mostra a prévia, porque o caminho da cópia é do Host.
- Um cartão antigo só lê a lista ao montar e ao abrir o menu, então pode precisar de um recarregamento para mostrar o botão.
- A espera vale para chamadas que começam depois de o `present` terminar; uma chamada paralela no mesmo lote pode mudar o arquivo antes da cópia.
- Um build do upstream sem o tipo `deliverables/snapshotted` recusa abrir sessões do DSHC que tenham versões.
- A aba de prévia de uma versão mostra o nome do arquivo e o caminho da cópia, sem o número da versão.
