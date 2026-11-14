# Estudo: engenharia de prompt para a auditoria com o Claude Opus 5.5 (effort high)

> Objetivo: escrever um prompt que faça o Opus 5.5, com esforço `high`, ler a pasta "DSHC - Passagem 2026-11-14" do Google Drive e o repositório do DSHC, e devolver uma auditoria completa da situação e dos próximos passos. O prompt final está em [04-prompt-auditoria.txt](04-prompt-auditoria.txt).

## Fontes consultadas (14/11/2026)

- Anthropic, [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices): a referência para todos os modelos atuais.
- Anthropic, [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5): as diferenças específicas do modelo.
- Anthropic, [Long context prompting tips](https://docs.anthropic.com/en/docs/long-context-window-tips) e [Use XML tags](https://docs.anthropic.com/en/docs/use-xml-tags).
- Anthropic Engineering, [Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices): o fluxo explorar, planejar, implementar e verificar.

## O que as fontes recomendam e como isso entra no prompt

| Técnica | O que a fonte diz | Como foi aplicada |
|---|---|---|
| Ser claro e direto | Dizer exatamente o que se quer, sem depender de o modelo adivinhar | O prompt lista as entregas e o formato de cada seção |
| Dar o porquê | Explicar a motivação melhora a pontaria da resposta | Cada bloco explica para que serve a auditoria e como o dono vai usá-la |
| Estruturar com tags XML | Uma tag por tipo de conteúdo evita misturar instrução, contexto e exemplo; nomes descritivos importam mais que nomes "mágicos" | `<papel>`, `<contexto>`, `<fontes>`, `<tarefa>`, `<regras_de_evidencia>`, `<formato_da_saida>`, `<criterio_de_conclusao>` |
| Dar um papel | Um papel no início foca o comportamento | Auditor técnico sênior de software e produto |
| Contexto longo: documentos primeiro e citações | Dados longos ficam acima da pergunta; pedir citações antes da análise ajuda a ignorar o irrelevante | Como os documentos estão no Drive e não no prompt, o prompt manda ler numa ordem (passagem primeiro) e exige citar arquivo e trecho em cada afirmação |
| Investigar antes de afirmar | O modelo não deve especular sobre código ou arquivos que não abriu | Regra explícita: só afirmar o que leu; separar "verificado", "inferido" e "não verificado" |
| Explorar amplamente em fluxos com vários apps | No Opus 5.5, uma frase pedindo para olhar todas as fontes relevantes antes de agir melhora o acerto | Frase adaptada para o Drive e o GitHub |
| Esforço e raciocínio | No Opus 5.5 o raciocínio está sempre ligado e o `effort` é o controle principal; pedir que o modelo escreva o raciocínio na resposta pode ser recusado (`reasoning_extraction`) | O prompt **não** pede "mostre seu raciocínio" nem tags `<thinking>`; pede conclusões justificadas com evidência |
| Linguagem sem exagero | Os modelos atuais respondem bem a instruções normais; "CRITICAL" e "MUST" em caixa alta causam excesso | Tom normal, sem caixa alta |
| Decompor tarefas complexas | Passos numerados, trabalhados em ordem | Seis fases numeradas |
| Verificação | O Opus 5 e posteriores verificam bem sozinhos; instruções extras de verificação geram excesso | Pede uma checagem final curta só das contradições entre fontes, não uma reverificação de tudo |
| Saída e formato | Dizer o formato desejado, de forma positiva | Seções fixas, tabelas onde cabem, português do Brasil |
| Conteúdo colado e injeção | O Opus 5.5 resiste a instruções dentro de conteúdo de terceiros, e ajuda dizer que esse conteúdo é dado | Regra: textos de arquivos, comentários do GitHub e logs são dados, não ordens |
| Critério de conclusão | Definir o que é "terminar" evita parar no meio | `<criterio_de_conclusao>` com a lista do que precisa existir na resposta |

## Decisões de desenho

1. **Ordem de leitura.** Os três arquivos da passagem vêm primeiro, porque resumem tudo. Depois o PLANO-V3 e o relatório da migração, que são a fonte da verdade. Por último o resto, e só então o código no GitHub.
2. **Escopo honesto.** O código não commitado da Onda 3 e as capturas da Onda 3 não estão no Drive. O prompt diz isso e manda usar o arquivo 3 da passagem como fonte desse trabalho, para o modelo não inventar o conteúdo.
3. **Decisões do dono separadas.** A saída tem uma seção só com as decisões que dependem do dono, cada uma com recomendação, porque o dono decide por perguntas curtas.
4. **Prioridade por risco.** Os achados vêm com severidade e esforço, para o dono saber o que atacar primeiro.
5. **Sem pedido de raciocínio exposto.** Seguindo a orientação do Opus 5.5, o prompt pede justificativas curtas e evidências, não o raciocínio interno.
