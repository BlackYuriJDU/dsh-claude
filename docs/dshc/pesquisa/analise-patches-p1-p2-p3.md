# Análise dos patches P1, P2 e P3 e do estudo "Claude × DSH Claude"

Fontes: os patches `P1-ci-runners`, `P2-mcp-connectors`, `P3-skills-knowledge-work` e suas combinações (`P2P3`, `ALL-P1P2P3`), além de `ESTUDO-CLAUDE-vs-DSH-CLAUDE.md`, enviados pelo dono do projeto em 12/11/2026. Análise com dupla checagem: os patches foram aplicados num worktree descartável, os gates foram rodados de verdade e os fatos externos foram conferidos no npm, no PyPI e no GitHub.

## 1. Combinações
`P2P3` é idêntico byte a byte a P2+P3, e `ALL-P1P2P3` é idêntico a P1+P2+P3. Todos aplicam limpo.

## 2. P1, CI: aplicado (commit `f7a91e898`)
- As 4 trocas no `ci.yml` conferem. O `ci-master.yml` só usa os labels enterprise nas matrizes de benchmark manuais. Seus jobs `serial-*` e o `sandbox.yml`, porém, rodam em push para `master`. **Proteja ou apague a branch `master` do fork**, senão um push nela deixa jobs presos na fila.
- **Concorrência no `ubuntu-latest` (4 vCPU, 16 GB em repositório público):**
  - `DSH_GATE_CONCURRENCY: '8'` (static e consumers) e `DSH_COVERAGE_MAX_WORKERS: '6'` sobrecarregam a máquina.
  - Se a primeira execução travar ou ficar sem memória, usar `${{ vars.DSH_GATE_CONCURRENCY || '4' }}` e 4 workers de cobertura.
  - Os jobs Linux não têm `timeout-minutes`, então o padrão é 360 minutos.
- **Windows nativo:** em `windows-latest`, com 8 partições e timeout de 120 minutos, tende a estourar. Ele não está nos `needs` do `all-checks-passed`, então não bloqueia PR, mas gasta minutos.
- **Repositório privado:** os minutos só são grátis em repositório público. Em privado, o `ubuntu-latest` tem 2 vCPU.
- **Pendência:** os comentários do topo do `ci.yml` ainda falam em "enterprise pools".

## 3. P2, conectores MCP: não aplicar como está
**Gates com o patch aplicado:**
- `verify-cordis-config` falha porque os overlays não são registrados. A correção testada é adicionar `...globSync('examples/mcp-connectors/*.cordis.yml', { cwd: root })` em `appOverlayFiles` (`scripts/verify-cordis-config.ts`).
- `verify-translation-pairing` falha: falta o par `README.zh.md` + `README.i18n.yaml`.
- Os demais gates passam.

**Correções de conteúdo:**

| Afirmação do patch | Fato verificado | Correção |
|---|---|---|
| "a ponte stdio remove as duas variáveis do Google" | o padrão `/KEY\|PASSWORD\|SECRET\|TOKEN/i` remove só `…_SECRET` | ajustar o comentário |
| variável não definida "não verificada" | o boot inteiro aborta com `ValidationError` | documentar: "An unset variable aborts startup with a config validation error" |
| ms365: "sign in through the `login` tool" | com `--read-only` só sobram `verify-login` e `list-accounts` | `npx @softeria/ms-365-mcp-server@0.184.0 --login` uma vez, no terminal |
| "74 vs 178 tools" | as contagens do upstream assumem `--org-mode` | "74 tools (counted with `--org-mode`; personal accounts get fewer)" |
| exemplos com `dshc` | a marca muda na Onda 1 | usar `dsh` |
| "não implica endosso … DeepSeek Harness" | o produto é o DSHC | nomear o DSHC |

Confirmados: versões e licenças (`@playwright/mcp` 0.0.85 Apache-2.0, `@softeria/ms-365-mcp-server` 0.184.0 MIT, `workspace-mcp` 2.4.2 MIT), os campos de config do `mcp-client`, a nomenclatura `mcp__<server>__<tool>` e o timeout de 60 s do SDK.

**Risco:** `npx -y`/`uvx` baixam pacotes a cada boot, um risco de cadeia de suprimentos que o precedente `mcp-memory` evita. Deixar documentado e desligado por padrão.

## 4. P3, skills de knowledge work: não aplicar como está
| Problema | Correção |
|---|---|
| Com `KNOWLEDGE_WORK_PLUGINS_DIR` não definida, a raiz vira `undefined/finance/skills` e o catálogo fica vazio em silêncio (viola "Misconfiguration fails loud") | usar a forma que falha alto, testada no Loader: `- !!js process.env.KNOWLEDGE_WORK_PLUGINS_DIR && process.getBuiltinModule('node:path').join(process.env.KNOWLEDGE_WORK_PLUGINS_DIR, 'finance', 'skills')` |
| `deep-research` manda usar `subagent` com `run_in_background: true` e `job_output` | o `subagent` distribuído é `continuable`: já roda em segundo plano e o runtime avisa quando termina. Remover `job_output` e usar `send_message` para continuar |
| "o texto da skill entra no system prompt" | o catálogo (nome e descrição) entra como mensagem de usuário de lembrete do sistema, e o corpo como resultado de ferramenta. O risco de injeção continua; corrigir a frase |
| raiz `~/.dshc/skills` | escrever `$DSH_HOME/skills` (`~/.dshc/skills` com o launcher `dshc`) |
| ferramentas citadas | existem nos presets `standard`, `code` e `cordis`, **não** no `minimal`; no Windows a ferramenta é `pwsh` |

Confirmados: licenças e commits de `claude-code-security-review` (MIT), `open_deep_research` (MIT) e `knowledge-work-plugins` (Apache-2.0, com `finance`, `legal`, `data` e `engineering`/`skills`); a atribuição do `NOTICE.md` está correta.

## 5. O estudo "Claude × DSH Claude"
- "O precedente `mcp-memory` não tem testes" está **errado**: existe `apps/cli/tests/memory-mcp-configs.spec.ts`.
- O "Problema 6" (READMEs ausentes) já foi resolvido na Onda 0.5.
- `docs/claude-behavior-applied.md` foi movido para `docs/dshc/pesquisa/`.

## 6. Como entrar no código (plano)
- **PR A (P2), Onda 8:**
  1. Aplicar o P2 com as correções da §3.
  2. Adicionar o `globSync` no `verify-cordis-config.ts`.
  3. Criar o par zh do README.
  4. Teste `apps/cli/tests/connector-mcp-configs.spec.ts`, no molde do `memory-mcp-configs.spec.ts`.
  5. Agent Note.
- **PR B (P3), Onda 8:**
  1. Aplicar o P3 com as correções da §4.
  2. Adicionar o mesmo `globSync` para `examples/skills-knowledge-work/*.cordis.yml`.
  3. Teste de boot com uma raiz temporária.
  4. Par zh do README e Agent Note.
- **Gates por PR:** `verify-cordis-config`, `verify-translation-pairing`, `verify-md-links`, `verify-md-wrap`, o spec novo e `doc-sync`.
