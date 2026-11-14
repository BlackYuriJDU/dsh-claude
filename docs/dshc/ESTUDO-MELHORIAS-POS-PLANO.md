# Estudo: como melhorar o DSHC agora e depois do plano

> **Escopo:** (1) melhorias no DSHC atual que o Plano v3 ainda não cobre e (2) o que fazer depois que todas as ondas do plano estiverem concluídas.
>
> **Data:** 12/11/2026.
>
> **Base de código para integração:** o resultado da M0, isto é, upstream `e8f7b93a` mais a festive `64e5cd79`. Os caminhos e as linhas citados foram lidos nessa árvore (merge simulado `137492d7`) ou na festive.
>
> **Companheiro:** `PLANO-V3.md`. Cada item diz em qual onda do plano entra, ou se é pós-plano (P1 a P3).

---

## 1. Diagnóstico medido

### 1.1 O DSHC em execução

A festive foi construída e servida localmente (`bin/dshc`) e medida com Playwright e axe-core 4.14.

| Medida | Resultado | Leitura |
|---|---|---|
| Primeira carga, transferido | **3,3 MB** comprimidos (12 MB descomprimidos), 33 recursos | Bom em rede local; pesado para acesso remoto ou celular |
| Maior recurso | Um `client.js` de plugins: **2,1 MB** gzip (7,3 MB descomprimido) | Candidato a divisão sob demanda (N11) |
| Primeira pintura (local) | 276 a 576 ms | Bom |
| Heap JS após a carga | 36 a 38 MB | Bom |
| Hosts externos contatados na inicialização | **Nenhum** | A camada de privacidade da festive funciona. Vale travar com teste (N4) |
| Compressão do servidor | gzip ativo | ok |
| axe: erros **críticos** | 2: `aria-allowed-attr` no composer; `aria-required-children` na lista de sessões | Ambos vêm do upstream (N1) |
| axe: moderados | sem *landmark* `main`, sem `h1`, conteúdo fora de região | Upstream (N1) |
| Defeitos visuais | seletor de modos no celular, foco invisível, truncamento, "Mais" duplicado | Já na Onda 1 do Plano v3 |

### 1.2 O upstream

| Medida | Resultado | Consequência |
|---|---|---|
| Ritmo | **500 a 1.335 commits por semana** (setembro a novembro, sem merges) | Sem sincronização automática, o fork envelhece em dias (N6) |
| Mudança desde a base da festive (9 dias) | 4.017 arquivos, +132 mil / −38 mil linhas | O tamanho do patch próprio do DSHC é o que define o custo de cada sincronização (N5) |
| Tipos de commit | fix 284, test 158, feat 134, docs 101, refactor 85 | Projeto em estabilização (rc), não em reescrita |
| Escopos mais ativos | computer use (`cua`), `ptc`, desktop, web, office, forge, subagent, sandbox | É onde virão as próximas mudanças grandes |
| Pacotes experimentais | **63**, vários já cobrindo o que um pós-plano construiria | Ativar e polir antes de construir (N8) |
| Roadmap publicado | Nenhum no repositório | Acompanhar pelo próprio histórico (N6 gera o relatório) |

### 1.3 O mercado

| Referência | Ponto forte em 2026 | O que o DSHC tira disso |
|---|---|---|
| Claude (Anthropic) | Cowork integrado em toda conversa (16/09); Docs, Slides e Design em qualquer conversa e fora do beta (08/10); Dashboards e Motion (08/10); Duet, agente proativo (21/10); memória com tópicos editáveis (25/08); varredura de segurança de skills e plugins (06/08) | Referência de experiência, não de escopo |
| Open WebUI | Modelos locais (Ollama), RAG mais forte, voz, um único contêiner | Modelos locais de primeira classe (N10) |
| LibreChat | Multiusuário, OIDC/LDAP, ramificação, MCP nativo | Não competir em multiusuário |
| LobeChat | Interface polida, marketplace de plugins, painel de artifacts | O DSHC já está no mesmo nível visual |

**Posicionamento recomendado.** Um espaço de trabalho de agentes local, para uma pessoa, com a experiência do Claude e qualquer modelo. O diferencial não é o chat: são os quatro modos (Chat, Cowork, Code, Design), o sandbox, a privacidade verificada e a compatibilidade com o ecossistema do Claude Code (hooks, mods e delegação, N8). Multiusuário e RAG corporativo ficam fora de escopo de propósito.

---

## 2. Itens novos

Formato de cada item: **O quê**, **Por quê** (evidência), **Como integrar** (arquivos, linhas e código), **Teste**, **Quando** e **Esforço**. As estimativas de esforço são minhas.

### Bloco A: melhorias no DSHC atual (entram nas ondas do Plano v3)

#### N1 · Corrigir as quatro falhas do axe que vêm do upstream · Onda 1 · 1 dia

**Por quê.** O axe acusa dois erros críticos e dois moderados em todas as telas. Os arquivos não foram alterados pela festive, então a correção vale para todo usuário do upstream: mande como PR para `deepseek-ai/deepseek-harness`.

**1. Composer como gatilho sem papel de botão (é também a origem do foco invisível, A11).**

Arquivo: `packages/client/ui-conversation/src/client/input/editor/DraftEditor.tsx`, linhas 49 a 52. Sem espaço de trabalho escolhido, o editor vira gatilho de menu: recebe `tabIndex=0`, `aria-haspopup` e `aria-expanded`, mas nenhum `role`. Um `div` sem papel não pode ter `aria-expanded`.

```diff
           aria-label={ariaLabel}
+          role={workspaceTrigger ? 'button' : undefined}
           aria-haspopup={workspaceTrigger ? 'menu' : undefined}
           aria-expanded={workspaceTrigger ? workspacePickerOpen : undefined}
           tabIndex={workspaceTrigger ? 0 : undefined}
```

No módulo CSS que fornece `css.input` (recebido por `DraftEditor` através da prop `classNames`), acrescente:

```css
.input[role='button']:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
}
```

Verifique antes que `ComposerContentEditable` repassa `role` ao elemento DOM; se não repassar, acrescente `role` às props aceitas.

**2. Árvore de sessões vazia.**

Arquivo: `packages/client/ui-workspace/src/client/rows/WorkspaceBrowser.tsx`, linhas 665 e 731. `EmptySessions` é renderizado **dentro** de `AnimatedRows role="tree"`, e uma árvore só pode conter `treeitem` ou `group`. Mova o estado vazio para fora da árvore:

```diff
-      <AnimatedRows className={...} role="tree" label={t('section.sessions')} rowKeys={rows.length === 0 ? ['empty'] : ...} ...>
-        {rows.length === 0 && (
-          <EmptySessions rowState={rowState} onLeaveArchivedOnly={onLeaveArchivedOnly} t={t} />
-        )}
-        {rows.map(...)}
-      </AnimatedRows>
+      {rows.length === 0
+        ? <EmptySessions rowState={rowState} onLeaveArchivedOnly={onLeaveArchivedOnly} t={t} />
+        : (
+          <AnimatedRows className={...} role="tree" label={t('section.sessions')} rowKeys={rows.map(row => `session:${row.id}`)} ...>
+            {rows.map(...)}
+          </AnimatedRows>
+        )}
```

Aplique o mesmo nos dois pontos (agrupado na linha 665, plano na linha 731). A chave sintética `'empty'` sai de `rowKeys`; confira que a animação de entrada da primeira sessão continua correta (existe teste de `WorkspaceBrowser` no pacote para isso).

**3. Sem *landmark* `main`.**

Arquivo: `packages/client/ui-layout/src/client/AppFrame.tsx`, linha 47.

```diff
-  return <div className={css.mainPanel} data-global-panel={panelId !== null || undefined}>
+  return <main className={css.mainPanel} data-global-panel={panelId !== null || undefined}>
     {renderSlot('main', {}, { entryKey: panelId ?? 'conversation' })}
-  </div>
+  </main>
```

Confira que nenhum plugin renderiza outro `<main>` no slot `main` (o axe hoje encontra zero).

**4. Sem `h1`.** O título da tela inicial (slot `conversation.hero.headline`, em `ui-conversation`) deve ser `h1`. Nas sessões abertas, o título da sessão deve ser `h1`. Mantenha o estilo visual por classe, não pela tag.

**Teste.** O gate N3 passa a exigir zero violações `critical` e `serious`.

#### N2 · Teste de contraste que lê os tokens · Onda 1 · 0,5 dia

**Por quê.** O comentário de `tokens.ts` promete AA "em toda superfície", mas 7 tokens reprovam (Plano v3, 0.2). Uma regra só funciona se for teste.

**Onde.** `packages/client/ui-brand-dshc/tests/contrast.client.spec.ts`. O sufixo `.client.spec` segue o padrão do pacote (`browser-plugin.client.spec.tsx`).

```ts ignore-check
/** WCAG 2.1 contrast of every text token against every surface it can sit on. */
import { describe, expect, it } from 'vitest'
import { DSHC_TOKENS } from '../src/client/tokens.ts'

type Scheme = 'light' | 'dark'
type Pair = { readonly light: string; readonly dark: string }
type Tokens = Readonly<Record<string, Pair>>

const SURFACES = [
  '--dsw-alias-bg-base', '--dsw-alias-bg-layer-1', '--dsw-alias-bg-layer-3',
  '--dsw-specific-sidebar-fill', '--dsw-specific-bubble', '--dsw-specific-sidebar-nav-item-active',
] as const
const TEXT = [
  '--dsw-alias-label-primary', '--dsw-alias-label-secondary', '--dsw-alias-label-tertiary',
  '--dsw-alias-label-caption', '--dsw-alias-link', '--dsw-alias-state-error-primary',
  '--dsw-alias-state-success-primary', '--dsw-alias-state-warn-primary', '--dsw-alias-state-business-primary',
] as const
/** The keyboard focus ring reads this token (ui-theme/src/styles/focus.css). */
const FOCUS_RING = '--dsw-alias-state-business-primary'

function rgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (m === null) throw new Error(`expected #rrggbb, got ${hex}`)
  const n = Number.parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Returns every failing pair; the test asserts the list is empty. */
export function failingPairs(tokens: Tokens): string[] {
  const out: string[] = []
  for (const scheme of ['light', 'dark'] as Scheme[]) {
    for (const s of SURFACES) {
      const bg = tokens[s][scheme]
      for (const t of TEXT) {
        const ratio = contrast(tokens[t][scheme], bg)
        if (ratio < 4.5) out.push(`${scheme} ${t} on ${s}: ${ratio.toFixed(2)}`)
      }
      const ring = contrast(tokens[FOCUS_RING][scheme], bg)
      if (ring < 3) out.push(`${scheme} focus ring on ${s}: ${ring.toFixed(2)}`)
    }
  }
  return out
}

describe('DSHC token contrast', () => {
  it('keeps every text token at 4.5:1 and the focus ring at 3:1 on every surface', () => {
    expect(failingPairs(DSHC_TOKENS as Tokens)).toEqual([])
  })
  it('rejects a known failing pair (proof that the gate bites)', () => {
    const broken = { ...(DSHC_TOKENS as Tokens), '--dsw-alias-link': { light: '#c6613f', dark: '#d97757' } }
    expect(failingPairs(broken).some((f) => f.includes('--dsw-alias-link'))).toBe(true)
  })
})
```

Tokens com `rgba(...)` não entram nas listas (o teste exige `#rrggbb` e falha alto se alguém trocar um token listado por `rgba`). Se um token comprovadamente nunca aparece numa superfície, retire o par com um comentário dizendo por quê.

#### N3 · Gate de acessibilidade com axe no e2e web · Onda 1 · 1 dia

**Por quê.** Os defeitos de N1 passaram por todos os gates atuais. Um teste com axe impede regressão a cada sincronização com o upstream.

**Onde.** `apps/web/tests/dshc-a11y.e2e.ts`, no mesmo padrão de `apps/web/tests/japanese-plugin-metadata.e2e.ts` (`launchWebScaffold`, `watchConsole`, `saveFailureShot`). Dependência: `axe-core` em `devDependencies` de `apps/web`. A licença é **MPL-2.0**, e o gate de licenças da Onda 2, como está no plano, só aceita MIT, Apache, BSD e ISC: inclua MPL-2.0 para dependências de desenvolvimento, ou o gate bloqueia este teste.

```ts ignore-check
/** DSHC accessibility gate: no critical or serious axe violation on the home screen, light and dark, desktop and phone. */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { chromium, type Browser } from 'playwright'
import { expect, it, onTestFailed, onTestFinished } from 'vitest'
import { launchWebScaffold, watchConsole, type WebScaffold } from './scaffold.ts'
import { saveFailureShot } from './support.ts'

const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')
const CASES = [
  { name: 'desktop-light', viewport: { width: 1280, height: 800 }, colorScheme: 'light' as const },
  { name: 'desktop-dark', viewport: { width: 1280, height: 800 }, colorScheme: 'dark' as const },
  { name: 'phone-light', viewport: { width: 390, height: 844 }, colorScheme: 'light' as const },
]

for (const c of CASES) {
  it(`has no critical or serious axe violation (${c.name})`, async () => {
    const res: { scaffold?: WebScaffold; browser?: Browser } = {}
    onTestFinished(async () => { try { await res.browser?.close() } finally { await res.scaffold?.close() } })
    res.scaffold = await launchWebScaffold()
    res.browser = await chromium.launch()
    const page = await res.browser.newPage({ viewport: c.viewport, colorScheme: c.colorScheme, locale: 'pt-BR' })
    const tripwire = watchConsole(page)
    onTestFailed(() => saveFailureShot(page, `dshc-a11y-${c.name}`))
    await page.goto(res.scaffold.authenticatedUrl)
    await page.locator('[data-slot="conversation.hero.headline"]').waitFor()
    await page.addScriptTag({ content: AXE })
    const violations = await page.evaluate(async () => {
      // @ts-expect-error axe is injected above
      const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
      return r.violations.filter((v: { impact: string }) => v.impact === 'critical' || v.impact === 'serious')
        .map((v: { id: string; nodes: unknown[] }) => `${v.id} (${v.nodes.length})`)
    })
    expect(violations).toEqual([])
    expect(tripwire.pageErrors).toEqual([])
  })
}
```

**Ponto a confirmar.** O scaffold sobe o perfil web do upstream. Para testar a camada DSHC (tokens, presets), use as opções de perfil de `LaunchOptions` em `apps/web/tests/scaffold.ts` (por volta da linha 308; há `extraOverlayPath` e o modo de perfil gerenciado). Caso contrário, o teste mede o upstream, o que já é útil para N1, mas não para N2.

#### N4 · Teste de privacidade: nenhum host externo · Onda 2 · 0,5 dia

**Por quê.** Hoje a festive não contata nenhum host externo na inicialização (medido). Mas o upstream ganha recursos que falam com a rede a cada semana: tradução por "endpoints anônimos" (`translator`), download de modelo de voz (`huggingface.co` ou `hf-mirror.com`), recomendações de plugins, OTel. O teste transforma a promessa "nada liga para casa" do README em gate.

**Onde.** Mesmo arquivo de N3, ou `apps/web/tests/dshc-privacy.e2e.ts`:

```ts ignore-check
it('contacts no external host while booting and idling on the home screen', async () => {
  // ...mesmo setup de N3 (scaffold, browser, page)...
  const external = new Set<string>()
  page.on('request', (r) => {
    const host = new URL(r.url()).hostname
    if (host !== '127.0.0.1' && host !== 'localhost' && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.add(host)
  })
  await page.goto(res.scaffold.authenticatedUrl)
  await page.waitForTimeout(5000) // idle window: background fetchers run here
  expect([...external]).toEqual([])
})
```

O teste cobre o navegador. Para o processo do host (Node), acrescente um teste de unidade na camada dshc que monta o perfil sem chave e afirma que `globalThis.fetch` não foi chamado para hosts externos; use `vi.spyOn(globalThis, 'fetch')`.

#### N5 · Orçamento de divergência do fork · M0 e permanente · 0,5 dia

**Por quê.** Com 500 a 1.300 commits por semana no upstream, cada arquivo do upstream que o DSHC altera é um conflito em potencial a cada sincronização. Hoje a festive altera 169 arquivos existentes. A D2 ("fork leve") precisa de um número, não de uma intenção.

**Onde.** `scripts/dshc-divergence.sh` e `.dshc/divergence-allowlist.txt`.

```sh
#!/usr/bin/env bash
# Lists upstream files this branch modifies outside the DSHC-owned paths.
# Exit 1 when a modified upstream file is missing from the allowlist.
set -euo pipefail
BASE="${1:-upstream/master}"
ALLOW=".dshc/divergence-allowlist.txt"
OWNED='^(packages/bundle/dshc/|packages/client/ui-brand-dshc/|packages/client/ui-settings-searxng/|packages/web/web-search-searxng/|packages/client/ui-memory/|packages/client/ui-projects/|packages/dshc/|docs/dshc/|\.dshc/|bin/dshc$|\.github/workflows/dshc-)'
mapfile -t modified < <(git diff --name-only --diff-filter=M "$(git merge-base "$BASE" HEAD)" HEAD | grep -Ev "$OWNED" || true)
missing=()
for f in "${modified[@]}"; do grep -qxF "$f" "$ALLOW" 2>/dev/null || missing+=("$f"); done
echo "upstream files modified: ${#modified[@]} (allowlisted: $(( ${#modified[@]} - ${#missing[@]} )))"
if (( ${#missing[@]} )); then printf 'not in %s:\n' "$ALLOW"; printf '  %s\n' "${missing[@]}"; exit 1; fi
```

O allowlist começa com os arquivos que a M0 deixar alterados e tem **uma linha por arquivo, com o motivo como comentário na linha anterior** (por exemplo, `# PR upstream #NNNN pendente`). A meta é que o número só caia: cada PR aceita no upstream remove linhas. Rode o script no workflow de N6 e num job próprio do CI do fork (`if: github.repository == 'BlackYuriJDU/dsh-claude'`).

---
### Bloco B: sustentação do fork (logo após a Etapa final)

#### N6 · Sincronização semanal automática com o upstream · P1 · 1 dia

**Por quê.** São 500 a 1.335 commits por semana. A festive ficou 1.183 commits atrás em nove dias. Sincronizar uma vez por semana mantém cada merge na casa das dezenas de conflitos, não das centenas.

**Onde.** `.github/workflows/dshc-upstream-sync.yml` (o prefixo `dshc-` já está na lista de caminhos próprios de N5).

```yaml
name: dshc upstream sync
on:
  schedule:
    - cron: '17 9 * * 1'   # segundas, 09:17 UTC
  workflow_dispatch:
permissions:
  contents: write
  pull-requests: write
  issues: write
jobs:
  sync:
    if: github.repository == 'BlackYuriJDU/dsh-claude'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          ref: dshc/base
          fetch-depth: 0
          token: ${{ secrets.DSHC_SYNC_TOKEN }}
      - name: Fetch upstream
        run: |
          git remote add upstream https://github.com/deepseek-ai/deepseek-harness.git
          git fetch upstream master
      - name: Dry-run merge
        id: dry
        run: |
          set +e
          git merge-tree --write-tree --name-only --messages HEAD upstream/master > merge.txt
          echo "clean=$([ $? -eq 0 ] && echo true || echo false)" >> "$GITHUB_OUTPUT"
          echo "behind=$(git rev-list --count HEAD..upstream/master)" >> "$GITHUB_OUTPUT"
          awk 'NR>1 && /^$/{exit} NR>1' merge.txt > conflicts.txt
      - name: Open sync PR
        env:
          GH_TOKEN: ${{ secrets.DSHC_SYNC_TOKEN }}
        run: |
          branch="sync/upstream-$(date -u +%Y%m%d)"
          git switch -c "$branch"
          git config user.name 'dshc-sync'; git config user.email 'dshc-sync@users.noreply.github.com'
          if [ "${{ steps.dry.outputs.clean }}" = true ]; then
            git merge --no-edit upstream/master
          else
            git merge upstream/master || true
            git add -A && git commit --no-edit -m "Merge upstream master (conflicts to resolve)" || true
          fi
          bash scripts/dshc-divergence.sh upstream/master > divergence.txt || true
          git push origin "$branch"
          {
            echo "Upstream: ${{ steps.dry.outputs.behind }} commits."
            echo; echo "### Conflitos"; echo '```'; cat conflicts.txt; echo '```'
            echo; echo "### Divergência (N5)"; echo '```'; cat divergence.txt; echo '```'
          } > body.md
          gh pr create --repo "$GITHUB_REPOSITORY" --base dshc/base --head "$branch" \
            --title "Sync upstream $(date -u +%F)" --body-file body.md --draft
```

**Detalhes que importam.**
- **Token próprio.** Uma PR criada com o `GITHUB_TOKEN` padrão **não dispara** outros workflows, então o CI não rodaria nela. Use um token fino (`DSHC_SYNC_TOKEN`, com escopo só neste repositório: *contents* e *pull requests*) ou um GitHub App.
- **Conflitos não bloqueiam.** A PR abre mesmo com conflito, com marcadores no código, para o Claude Code resolver com o prompt da M0. Os arquivos gerados (12 dos 29 na M0) se regeneram com os geradores do `doc-sync`.
- **Fixe as actions por versão exata**, como o upstream faz (`actions/checkout@v7.0.1` no `ci.yml` dele). Fixar por SHA é ainda mais seguro. Deixe o Dependabot atualizar.

#### N7 · Versionamento e releases do DSHC · P1 · 0,5 dia

**Por quê.** Hoje não há como saber qual DSHC corresponde a qual upstream.

**Como integrar.**
- **Tag:** `dshc-v<versão do upstream>.<n>`, por exemplo `dshc-v0.2.2-rc.2.1`. O prefixo evita colisão com as tags `dsh-v*` do upstream, que chegam junto com o fetch.
- **Notas de release:** só os commits próprios, com `git log --first-parent --no-merges <tag anterior>..HEAD -- $(cat .dshc/owned-paths.txt)`, em `CHANGELOG-dshc.md`. Esse arquivo fica fora do pareamento de tradução, como os demais docs DSHC.
- **Release no GitHub** com o tarball do checkout construído e o `SHA256SUMS`, até existir app desktop (N14).

#### N8 · Ativar e curar os experimentais do upstream antes de construir · M2 e P1 · 2 dias

**Por quê.** O upstream já tem 63 pacotes experimentais. Vários cobrem o que o pós-plano construiria do zero. Ativar custa uma linha de configuração; construir custa semanas e aumenta a divergência (N5).

**Como ligar.**
- **Pelo usuário:** página Plugins. É onde ficam os bundles das listas `EXTENSION_BUNDLES` e `MORE_BUNDLES` em `packages/util/official-bundles/src/plugin-manager.ts:39-60`.
- **Por padrão no DSHC:** acrescentar o bundle à lista do perfil em `packages/util/official-bundles/src/bundles.ts:18`, que a festive já altera:

```diff
   dshc: {
-    bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', '@deepseek-ai/dsh-dshc'],
+    bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', '@deepseek-ai/dsh-dshc',
+      '@deepseek-ai/dsh-experimental-session-search'],
   },
```

  Confira se o pacote também precisa constar nas `dependencies` de `packages/bundle/dshc/package.json` para resolver no perfil instalado.

**Curadoria recomendada.** "Padrão" significa ligado no perfil `dshc`. Qualquer item só vira padrão depois de passar no teste de privacidade (N4).

| Bundle ou pacote | O que faz | Rede | Recomendação |
|---|---|---|---|
| `experimental-session-search` | Ferramentas para o agente buscar e ler sessões anteriores do workspace | local | **Padrão** |
| `experimental-voice-input-bundle` (+ `speech-to-text-sensevoice`) | Ditado com transcrição **local** (SenseVoice, CPU) | Baixa o modelo uma vez de `huggingface.co` ou `hf-mirror.com`, com SHA-256 fixado | **Opt-in**; no DSHC, fixar `modelOrigins: ['https://huggingface.co']` |
| `dsh-subagent-claude-code` | Delega tarefas ao Claude Code instalado na máquina | a do Claude Code | **Opt-in**, encaixa no seu fluxo |
| `experimental-hooks-claude-code` | Roda seus `hooks.json` do Claude Code nas sessões do DSHC | local | Opt-in |
| `experimental-claude-code-mods` (+ UI) | Roda mods do Claude Code como plugins | local | Opt-in, depois de avaliar |
| `experimental-forge-bundle` | Painel de PRs do GitHub e sessões em *worktree* | GitHub, pelo `gh` | Opt-in |
| `experimental-terminal-bundle` | Terminais persistentes na barra lateral | local | Avaliar; está em `HIDDEN_BUNDLES` |
| `browser-use-playwright-mcp` | Navegador via Playwright MCP, estado separado por sessão | sites visitados | **Substitui o P2 de Playwright** |
| `dsh-cua-bundle` | Computer use (macOS e Windows) | local | Opt-in, não roda em Linux |
| `experimental-auto-review` | Revisão automática de cada chamada de ferramenta antes de executar em acesso total | o modelo | Opt-in, recomendado para quem usa acesso total |
| `client-ui-stats` | Contexto por turno, latência, cache, velocidade | local | Base para o "anel de uso" da M1 |
| `experimental-liveshare` | Compartilha sessão por um servidor de relay | servidor de relay | Pós-plano (N14), exige servidor próprio |
| `translator`, `cot-translation-bundle` | Tradução automática | **endpoints anônimos externos** | **Não ligar por padrão** |
| `personalized-recommendations`, `plugin-recommendations` | Cartões de recomendação após respostas | a verificar | Não ligar por padrão |
| `badge-skill-bundle` | Selo "powered by dsh" em documentos e PRs | local | Não ligar |

#### N9 · Painel de uso com `client-ui-stats` · M1 · 1 dia

**Por quê.** A linha 0.1.1 tem o anel de uso (decisão do dono). O 0.2.2 tem um pacote experimental que já mede contexto por turno, latência do primeiro token, tempo de modelo × ferramenta, taxa de acerto de cache e velocidade.

**Como integrar.** Na M1, compare o anel de uso com `packages/experimental/client-ui-stats`. Se a métrica existir lá, o anel vira só a **apresentação** (um componente no slot do composer) lendo os dados do `client-ui-stats`, em vez de recalcular. Isso elimina uma fonte de divergência.

### Bloco C: produto depois do plano

#### N10 · Modelos locais e modelos Claude pela API · P1 · 1 dia

**Por quê.** É o recurso mais citado nos concorrentes (Open WebUI) e combina com "privado e local". O `llm-pi-ai` do 0.2.2 já aceita gateways compatíveis com OpenAI e servidores próprios por `baseURL` (`packages/llm/llm-pi-ai/README.md`, linhas 12 e 36 a 82). O catálogo também traz a rota `anthropic`, o que permite usar modelos Claude reais pela API, com chave do próprio usuário.

**Como integrar.** Um overlay de exemplo em `examples/dshc/models.cordis.yml`, carregado com `dshc --patch`:

```yaml
# Exemplos de rotas de modelo para o DSHC. Carregue com: dshc --patch "$PWD/examples/dshc/models.cordis.yml"
- id: llm-pi-ai
  config:
    providers:
      ollama:
        displayName: Ollama (local)
        api: openai-completions
        baseURL: http://127.0.0.1:11434/v1
        apiKeyEnv: OLLAMA_API_KEY        # o Ollama ignora a chave; defina OLLAMA_API_KEY=ollama
        models:
          - id: qwen3:8b
            name: Qwen3 8B (local)
            contextWindow: 32768
      lmstudio:
        displayName: LM Studio (local)
        api: openai-completions
        baseURL: http://127.0.0.1:1234/v1
        apiKeyEnv: LMSTUDIO_API_KEY
        models:
          - id: local-model
            contextWindow: 32768
      anthropic:
        apiKeyEnv: ANTHROPIC_API_KEY     # rota do catálogo; modelos vêm do pi-ai
```

**Pontos a confirmar antes de publicar o exemplo.**
1. Se o patch por `id` faz *merge* do dicionário `providers` ou o substitui inteiro. Se substituir, o overlay apaga as rotas padrão; nesse caso, repita as rotas da DeepSeek no exemplo.
2. O identificador da linha no roster base (`llm-pi-ai`, linha 95 da 0.1.1; confirmar no 0.2.2).
3. Que o modelo local suporte chamada de ferramentas. Sem isso, Cowork e Code não funcionam.

**Teste.** Um e2e sem chave, com um servidor OpenAI-compatível falso (resposta fixa), provando que a rota é escolhível e responde.

#### N11 · Carga inicial menor · P2 · 2 a 4 dias

**Por quê.** 3,3 MB comprimidos na primeira carga, dos quais 2,1 MB são um único `client.js` de plugins (7,3 MB descomprimido). Em rede local isso não pesa. Pesa em acesso remoto, celular, PWA (N14) e no *liveshare*.

**Como integrar.**
1. **Medir antes de mudar.** Gere o mapa do pacote com `source-map-explorer` sobre o `client.js` grande, identificando quais plugins dominam. Os candidatos óbvios são renderizadores de planilha e PDF, realce de código e editor.
2. **Na camada DSHC:** desligue no `bundle/dshc/cordis.patch.yml` os plugins de cliente que o DSHC não usa (a festive já faz isso com `ui-brand-official`). Custo zero de divergência.
3. **No upstream:** proponha carregamento sob demanda dos plugins de cliente pesados. É mudança de arquitetura do carregador de plugins, então faça como issue com as medições, não como patch no fork.

**Meta.** Primeira carga ≤ 1,5 MB comprimidos.

#### N12 · DSHC no Slack (no estilo do Claude Tag) · P2 · 5 a 8 dias

**Por quê.** É a superfície do Claude que o DSHC não tem, e o 0.2.2 já traz a infraestrutura: o runtime `dsh-webhook` (`ctx.webhookRuntime`, com `register(rule)` e `dispatch(delivery)`) e um adaptador de GitHub de 192 linhas como modelo.

**Como integrar.**
1. **Pacote próprio** em `packages/dshc/webhook-slack/`. Um grupo novo `packages/dshc/` é permitido pelo `docs/cookbook/adding-a-package.md` (grupo é só contêiner) e mantém o código DSHC separado do upstream, o que zera conflito com N6.
2. **Estrutura** igual a `packages/experimental/webhook-github/src/` (`index.ts`, `handler.ts`, `body.ts`, `types.ts`):

```ts ignore-check
// packages/dshc/webhook-slack/src/index.ts (forma, seguindo webhook-github/src/index.ts)
export const name = 'webhook-slack'
export const inject = ['webServer', 'webhookRuntime', 'credentials']
export interface Config {
  readonly source: string        // id da fonte, ex. 'slack-acme'
  readonly path: string          // rota absoluta, ex. '/hooks/slack'
  readonly secretEnv: string     // referência da credencial com o Signing Secret do app Slack
  readonly maxBodyBytes: number
}
```

```ts ignore-check
// packages/dshc/webhook-slack/src/verify.ts: verificação de assinatura do Slack (v0)
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Slack signs `v0:<timestamp>:<raw body>` with HMAC-SHA256 and sends `v0=<hex>`.
 * Requests older than five minutes are rejected to block replay.
 */
export function verifySlackSignature(secret: string, timestamp: string, rawBody: string, signature: string, nowSeconds: number): boolean {
  const ts = Number(timestamp)
  if (!Number.isInteger(ts) || Math.abs(nowSeconds - ts) > 300) return false
  const expected = 'v0=' + createHmac('sha256', secret).update(`v0:${timestamp}:${rawBody}`).digest('hex')
  const a = Buffer.from(expected); const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}
```

3. **Handler.**
   - Leia `x-slack-signature` e `x-slack-request-timestamp`.
   - Responda o desafio `url_verification` devolvendo `challenge`.
   - Para `event_callback`, monte uma `VerifiedWebhookDelivery<'slack'>` com `deliveryId = event_id` e chame `ctx.webhookRuntime.dispatch(delivery)`, exatamente como `webhook-github/src/handler.ts:107-115`.
   - O Slack exige resposta HTTP em até 3 segundos. O runtime já responde depois do *dispatch* em memória, sem esperar a regra, o que atende.
4. **Regra** (`WebhookRule<'slack'>`, tipo verificado em `packages/experimental/webhook/src/types.ts`). Para `app_mention`, devolve um `WebhookSessionRequest` com:
   - `workspacePath` (pasta do workspace do Slack);
   - `title` (canal e trecho da mensagem);
   - `prompt` (a mensagem, o canal e o `thread_ts`);
   - `agentPreset: 'cowork'`;
   - `permissionPreset`: o mais restritivo dos presets de `ui-permission-presets`.
5. **Resposta ao Slack.** O runtime só cria sessões. Para responder na thread, monte na mesma composição um conector MCP do Slack mantido, ou uma ferramenta própria `slack_reply` em `packages/dshc/`. O prompt instrui o agente a responder no `thread_ts` recebido.
6. **Segurança.**
   - Mensagem de canal é entrada não confiável (injeção de prompt). Use o preset de permissão mais restritivo e nunca acesso total.
   - Lista de canais permitidos em `Config`.
   - Sem leitura fora do workspace (depende da Onda 2).

**Teste.** Unidade para `verifySlackSignature` (válida, expirada, adulterada, tamanho diferente). E2e sem chave postando um evento assinado e afirmando que uma sessão foi criada.

#### N13 · Proatividade (no estilo do Duet) e "Reflect" · P2 · 3 a 5 dias

**Por quê.** O Claude lançou o Duet (agente proativo) em 21/10. O DSHC tem as peças:
- agendamento (`ui-schedule`, ferramentas `schedule_create`, `schedule_list` e `schedule_delete`);
- gatilhos externos (webhook);
- memória (`ui-memory`);
- busca em sessões anteriores (N8).

**Como integrar.** Sem pacote novo:
1. Um **preset de rotina "Reflect"** na camada DSHC (`packages/bundle/dshc/presets/`), cujo prompt é: ler as sessões do dia com as ferramentas de busca de sessão, propor atualizações de memória e listar pendências. Toda proposta passa pela aprovação do usuário antes de gravar.
2. Um botão "Criar rotina diária de reflexão" que chama `schedule_create` com esse preset.
3. Depois de N12, regras de webhook (por exemplo, "PR aberto no meu repositório → sessão Code de revisão") viram o lado reativo da proatividade.

**Limite.** A memória só muda com aprovação. Proatividade sem confirmação é o oposto do que o projeto promete.

#### N14 · Distribuição: PWA, app desktop e releases · P2 e P3 · 3 a 6 dias

**Por quê.** Hoje o DSHC só roda a partir do código-fonte. O upstream tem app desktop (`apps/desktop`, Electron) e teste de manifesto PWA (`apps/web/tests/pwa-manifest.e2e.ts`).

**Como integrar.**
1. **PWA.** Nome "DSHC", ícones próprios (D12) e `theme_color` da paleta no manifesto servido pelo perfil `dshc`. Isso permite instalar no celular via acesso remoto.
2. **Desktop** (D10), se decidido:
   - perfil `dshc` empacotado;
   - `product-analytics` desligado na camada dshc (hoje ele liga por padrão no perfil Desktop: `bundle/web-app/cordis.patch.yml:49-54`);
   - sem atualização automática apontando para servidores da DeepSeek;
   - assinatura de código só com certificado próprio.
3. **Releases.** Conforme N7.

#### N15 · Documentação de usuário em português · P1 · 2 dias

**Onde.** `docs/dshc/usuario/`, fora do pareamento de tradução, com a mesma isenção de `docs/dshc/`. Conteúdo mínimo:
- instalar e rodar (`bin/dshc`, portas, `DSHC_*`);
- escolher modelo (N10);
- os quatro modos;
- privacidade (o que nunca sai da máquina, com o teste N4 como prova);
- plugins recomendados (N8);
- solução de problemas (CDN do SheetJS em rede restrita, memória no build).

#### N16 · Varredura de skills e plugins de terceiros · P3 · 3 dias

**Por quê.** O `plugin-market-bundle` do upstream aceita índices customizados. O Claude passou a varrer skills e plugins de terceiros (06/08) pelo mesmo motivo: o texto de uma skill entra no catálogo do modelo, e o corpo entra no contexto quando a skill é carregada.

**Como integrar.** Antes de instalar a partir de um índice customizado, rode um verificador estático sobre os `SKILL.md` e os scripts do pacote. Ele procura:
- instruções ocultas (comentários HTML, caracteres de largura zero);
- comandos de rede seguidos de execução (`curl … | sh`);
- leitura de caminhos sensíveis (os mesmos de `denyReadPaths`);
- URLs para hosts fora de uma lista.

O resultado aparece no cartão do plugin, e o usuário confirma. **Ponto a confirmar:** o gancho exato de instalação em `packages/client/ui-plugin-market` e no gerenciador de plugins (não foi lido nesta auditoria).

#### N17 · Contribuições ao upstream · contínuo

Cada PR aceita no upstream remove uma linha do allowlist de N5 e um conflito futuro. Candidatas, todas com evidência neste estudo ou na revisão:

| PR | Origem |
|---|---|
| Papel e foco do composer como gatilho | N1.1 (`DraftEditor.tsx:49-52`) |
| Estado vazio fora da árvore de sessões | N1.2 (`WorkspaceBrowser.tsx:665,731`) |
| `<main>` no `AppFrame` | N1.3 (`AppFrame.tsx:47`) |
| `denyReadPaths` e modo de rede no sandbox | Onda 2 (`sandbox-local/src/profiles.ts:17`) |
| Constantes de `columns.ts` como `Config` | REVISAO A14 |
| Carregamento sob demanda de plugins de cliente | N11 |

#### N18 · QA visual por release · P1 · 1 dia

**Por quê.** Os defeitos A10 a A12 só apareceram com a interface rodando. Nenhum gate atual os pegaria.

**Como integrar.**
- Um e2e `apps/web/tests/dshc-screens.e2e.ts` que gera capturas em 390 e 1280 px, claro e escuro, das telas principais, e as anexa como artefato do CI.
- Use `captureStableAria` (já existe em `scaffold.ts`) para um *golden* textual da estrutura acessível de cada tela. Ele falha quando um rótulo some ou duplica, como o "Mais".

---

## 3. Roadmap pós-plano

| Fase | Quando | Itens | Resultado esperado |
|---|---|---|---|
| **P1 · Sustentação** | Primeiras 2 semanas após a Etapa final | N6, N5 (contínuo), N7, N8 (padrões), N9, N10, N15, N18 | Fork sincronizado toda semana, divergência medida, modelos locais, documentação |
| **P2 · Alcance** | Semanas 3 a 8 | N11, N12, N13, N14 (PWA) | Slack, rotinas proativas, instalável no celular, carga ≤ 1,5 MB |
| **P3 · Ecossistema** | Depois da semana 8 | N14 (desktop, se D10), N16, `liveshare` | Distribuição para outras pessoas, plugins de terceiros com segurança |
| **Contínuo** | Sempre | N17 | Divergência caindo a cada mês |

**Indicadores** (medir no fim de cada fase):
- arquivos do upstream alterados pelo DSHC (N5), sempre em queda;
- dias de atraso em relação ao upstream (N6), no máximo 7;
- violações axe `critical` e `serious` (N3), zero;
- hosts externos na inicialização (N4), zero;
- primeira carga comprimida (N11), no máximo 1,5 MB.

---

## 4. Prompts para o Claude Code (pós-plano)

### P1 · Sustentação

```text
<papel>Você executa a fase P1 do ESTUDO-MELHORIAS-POS-PLANO.md (DSHC).</papel>
<pré-condição>A Etapa final do PLANO-V3.md foi concluída: dshc/base verde e main substituída.</pré-condição>
<tarefa>
1. N5: crie scripts/dshc-divergence.sh e .dshc/divergence-allowlist.txt com os arquivos hoje alterados, cada um com o motivo na linha anterior.
2. N6: crie .github/workflows/dshc-upstream-sync.yml como no estudo; actions fixadas por versão exata (ou SHA); peça ao dono o secret DSHC_SYNC_TOKEN e não o crie você.
3. N7: CHANGELOG-dshc.md e a convenção de tag dshc-v<upstream>.<n>.
4. N8: ligue por padrão só experimental-session-search no perfil dshc (official-bundles/src/bundles.ts:18), depois do teste N4 passar com ele.
5. N10: examples/dshc/models.cordis.yml; confirme antes se o patch faz merge de providers.
6. N15 e N18 conforme o estudo.
</tarefa>
<restrições>Toda mudança fora dos caminhos próprios entra no allowlist com motivo. Cobertura de 100% por arquivo. Agent Note por item não trivial.</restrições>
<saída>docs/dshc/relatorios/p1.md com o que foi feito, os indicadores medidos e só comandos que rodaram.</saída>
```

### P2 · Slack

```text
<papel>Você implementa N12 (DSHC no Slack).</papel>
<referências>packages/experimental/webhook-github/src/* (modelo), packages/experimental/webhook/src/types.ts (WebhookRule, WebhookSessionRequest).</referências>
<tarefa>
1. Crie o grupo packages/dshc/ e o pacote webhook-slack, seguindo docs/cookbook/adding-a-package.md.
2. verifySlackSignature (v0, janela de 5 min, timingSafeEqual), url_verification e event_callback → ctx.webhookRuntime.dispatch.
3. Regra para app_mention → WebhookSessionRequest com o preset cowork e o preset de permissão mais restritivo; canais permitidos em Config.
4. Resposta na thread por um conector MCP do Slack mantido (mostre a escolha ao dono antes) ou pela ferramenta slack_reply.
</tarefa>
<verificação>Testes de unidade da assinatura; e2e sem chave com evento assinado criando sessão; README com Model Experience e Known Limitations; Agent Note.</verificação>
```

---

## 5. Fontes

- Medições próprias: build local da festive `64e5cd79` (Node 24.22.3, pnpm 11.28.5), Playwright e axe-core 4.14.0, em 12/11/2026.
- Código: [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) `e8f7b93a`; [BlackYuriJDU/dsh-claude](https://github.com/BlackYuriJDU/dsh-claude) festive `64e5cd79`.
- [Anthropic Trademark Guidelines](https://www.anthropic.com/legal/trademark-guidelines)
- [Secure Your Trademark: Clawdbot vira Moltbot](https://secureyourtrademark.com/blog/anthropic-forces-clawdbot-to-rebrand-as-moltbot/)
- [Claude: release notes](https://support.claude.com/en/articles/12138966-release-notes)
- [Unite.AI: Dashboards, Motion e saída do beta](https://unite.ai/anthropic-launches-claude-dashboards-and-motion-takes-docs-out-of-beta)
- [Elest.io: LibreChat × Open WebUI × LobeChat em 2026](https://blog.elest.io/librechat-vs-openwebui-vs-lobe-chat-which-to-self-host-in-2026/)
- npm: `axe-core` 4.14.0 (MPL-2.0)
