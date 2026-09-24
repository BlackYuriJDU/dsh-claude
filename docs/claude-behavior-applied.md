# Claude behavior — applied & roadmap (síntese da pesquisa)

Fonte: docs/claude-behavior-research.md (102 consultas Tavily, 0 falhas).
Duas frentes: (A) interface, (B) regras de comportamento do agente.

## A. Interface — aplicado agora

1. **Composer termina na toolbar** — stats dock (turns/steps/LLM/TTFT/cache) removido (`footer: null` + registro do StatsLine fora).
2. **Header de sessão removido** — session log, chip PTC, tabs Chat/Trajectory, ação de background jobs (`hideChrome` permanente).
3. **Send só aparece com algo a enviar** — "Send appears once there is something to ship" (comportamento confirmado do claude.ai).
4. **"Deep diving..." coral** — o shimmer usava os estáticos deepseek azuis diretamente; a escala legacy foi re-pointada para a família coral nos dois modos (nada no produto pode brilhar azul).
5. **Burst que respira** — animação lenta (4.2s) no mark do hero, com guard de prefers-reduced-motion; o logo do Claude "pulsa como algo vivo".
6. **Dark-only** — preferência única `dark`; escada estática dark com luminância monotônica (warm-shift por degrau, nunca invertida).

## B. Regras do agente — charter aplicado nos 4 presets

Síntese da Constituição/character/system-prompt do Claude:
- **Sem sycophancy**: nunca abrir com elogio; avaliar a ideia primeiro; questionar premissas frágeis.
- **Honesty**: "I don't know" quando não sabe; incerteça sinalizada; nada fabricado; correção só de erros consequentes (correction restraint); nada de auto-crítica ritual.
- **Conciso**: resultado primeiro, zero preamble; frases curtas e ativas; prosa > listas.
- **Disciplina de tools**: investigar antes de responder; leituras em paralelo; escrita com efeito colateral jamais paralela a leitura que a informa; todo tracking só para trabalho multi-passo real.
- **Permissões**: ler/escrever livre; pedir antes de ações perigosas/irreversíveis (deletes, force-push, credenciais, sair da máquina).
- **Commits**: convencionais, imperativos, sem nunca citar quem escreveu.
- **Idioma**: responder no idioma do usuário (pt-BR nesta implantação).
- Copyright: nunca reproduzir trechos longos; resumir.

Personas reescritas em: standard (charter completo), code (variante enxuta), minimal (1 linha), cordis (charter + composição Cordis, sem menção a "DeepSeek Harness").

## C. Etapa 2 — menu lateral (próximo)

Referências coletadas: sidebar do claude.ai = busca,组织 por projetos, hover actions, "New chat" no topo; sugestões de prompt no empty state; connectors/skills acessíveis pelo composer. A aplicação começa pelo ui-sidebar (CoralBurst + "DSH Claude" já no lugar).

## D. Backlog identificado pela pesquisa

- Artifacts (painel lateral de prévia) — ui-deliverables já existe; mapear depois.
- "Styles" (concise/default/explanatory) — mapear nos agent presets.
- Memória com página de gestão (Settings > Capabilities).
- Voz além do ditado (modo conversa) — longo prazo.
- Subagents/worktree isolation — já existe no harness; expor na UI depois.
