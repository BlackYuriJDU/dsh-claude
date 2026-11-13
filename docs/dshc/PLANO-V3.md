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
| D12 | Símbolo "clay burst" | **em aberto, decisão sua** | Recomendo trocar (0.2) |

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
