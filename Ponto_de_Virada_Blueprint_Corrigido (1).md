# Ponto de Virada — Blueprint Corrigido

Esta versão parte do **Blueprint Revisado** e resolve os 4 furos identificados:

1. Contagem de decisões (27 vs. 28 declaradas)
2. Cofre 3 vago
3. Sistema de finais sem fórmula
4. Matriz de controle incompleta (só D1–D6)

Tudo o que já estava sólido no Revisado (Mentor ambíguo, pistas retroativas, remoção de RNG, micro-reflexão) foi mantido sem alteração. Aqui só entra o que muda ou o que estava faltando.

---

## CORREÇÃO 1 — A 28ª decisão

O "Twist 4 — O Espelho" virou uma decisão de verdade: **Decisão 28**.

### Decisão 28 — O Espelho (10 anos depois)

A cena de epílogo continua igual (mostra Lucas 10 anos depois, com a consequência da Decisão 2). A diferença: agora o jogador toma uma última escolha, puramente reflexiva, que não altera o final já revelado — fecha o ciclo.

**Contexto:** Lucas encontra (ou não) Duda, dependendo de `ajudou_colega`.

**Opções:**

**A)** Agradecer abertamente pela relação construída (ou reconhecer, sem culpa, que os caminhos se separaram).

**B)** Comentar, sem dramatizar, o que faria diferente com o que sabe hoje.

**C)** As duas coisas.

**Tag:** `reconheceu_trajetoria`

**Função:** não pontua nas 4 dimensões (o final já foi calculado antes disso). Serve só para a camada pedagógica: essa resposta alimenta a reflexão em sala, mostrando se o aluno consegue olhar pra trás sem se julgar como "certo" ou "errado".

Com isso: **28 decisões numeradas, todas rastreáveis**, batendo com o que a Visão Geral sempre declarou.

---

## CORREÇÃO 2 — Cofre 3, definido

O problema do Cofre 3 era pedir "uma informação relevante do Capítulo 4" sem dizer qual. Correção: o cofre vira uma pergunta de **autoconhecimento verificável**, não uma senha fixa.

### Decisão 25 — Cofre 3 (versão corrigida)

**Pré-requisito para o cofre aparecer:** `passou_cofre1` + `descobriu_mentor`.

**Pergunta do cofre:**

> "O que mais pesou na vida da família de Lucas por causa das escolhas dele?"

**O jogo mostra 4 opções, geradas dinamicamente a partir do estado real do jogador** (não fixas):

- Se `familia_sofreu` está ativa: uma opção correta menciona a mãe assumindo o segundo turno.
- Se `familia_sofreu` NÃO está ativa (Lucas aceitou o emprego no Capítulo 2): a opção correta menciona a decisão financeira ruim que a mãe já tinha revelado na Decisão 11.
- As outras 3 opções são eventos que **aconteceram na história do jogador**, mas não foram a causa principal — não são pistas falsas inventadas, são fatos reais mal-interpretados como causa.

**Por que isso resolve o problema:** o cofre não depende de uma senha universal fixa (impossível de escrever igual pra 27 trajetórias diferentes). Ele testa se o jogador consegue **identificar corretamente a causa entre efeitos parecidos** — e a validação é automática, comparando a resposta escolhida com a tag real do jogador.

**Tag:** `passou_cofre3`

---

## CORREÇÃO 3 — Sistema de finais com fórmula real

A versão anterior prometia "4 dimensões" mas não calculava nada. Aqui entra a fórmula.

### 3.1 — Duas camadas de tag

Além das tags narrativas que já existem (pra callbacks e cofres), toda decisão com opções A/B/C agora também gera uma **tag de estratégia**, automaticamente:

- Opção A (impulsiva) → `estrategia_impulsiva`
- Opção B (conservadora) → `estrategia_conservadora`
- Opção C (analítica/negociação) → `estrategia_analitica`

Isso não substitui as tags narrativas (`guardou_dinheiro`, `pediu_ajuda_duda` etc.) — elas continuam existindo, do jeito que já estavam, só pra callback e cofre. As tags de estratégia são uma camada extra, só pra calcular dimensão.

### 3.2 — Pontuação das 4 dimensões

Cada dimensão soma pontos de fontes específicas. Não é "toda tag conta pra tudo" — cada uma tem peso definido.

**Planejamento**
- +1 por `estrategia_analitica` em decisões financeiras (D5, D10, D22)
- +1 se `guardou_dinheiro`
- −1 por `estrategia_impulsiva` em decisões financeiras
- −1 se `pegou_emprestimo` sem `passou_cofre1`

**Relações**
- +1 se `ajudou_colega`
- +1 se `pediu_ajuda_duda` ou pediu ajuda a adulto (D17 opção C)
- +1 se aceitou ajuda no final (D27 opção A ou C)
- −1 se recusou toda ajuda oferecida ao longo do jogo (D17 opção B **e** D27 opção B)

**Pensamento Crítico**
- +1 por `estrategia_analitica`, contado uma vez por capítulo (máx. 5, não 28 — evita que quem sempre clica C domine sozinho a dimensão)
- +1 se `confrontou_mentor` via investigação (D15 opção C)
- −1 se seguiu o Mentor sem questionar (D6 opção A) **e** não pesquisou o curso (D8 opção A)

**Responsabilidade**
- +1 se `assumiu_responsabilidade` (D3 opção C)
- +1 se contou aos pais sobre o empréstimo (D11 opção C)
- +1 se `pediu_desculpa` (D21 opção A ou C)
- −1 se `escondeu_nota`
- −1 se `mentiu_pais`
- −1 se `colou_descoberto`

### 3.3 — Classificação por faixa

Cada dimensão fecha entre aproximadamente −3 e +5. Classificação:

| Faixa | Nível |
|---|---|
| ≤ 0 | Baixo |
| 1–2 | Médio |
| ≥ 3 | Alto |

### 3.4 — Regras de override (checadas primeiro, antes da tabela)

1. Se `revelacao_cofre` foi ativada **e** a dívida não foi resolvida até a Decisão 27 → **Final 9 (Dívida)**, sempre, independente das dimensões.
2. Se `colou_descoberto` **e** `mentiu_pais` estão ativas ao mesmo tempo → **Final 10 (Confiança Perdida)**, sempre.
3. Se nenhum override bater, segue pra tabela de resolução.

### 3.5 — Tabela de resolução (dimensão dominante × dimensão mais fraca)

"Dominante" = maior pontuação entre as 4. "Mais fraca" = menor. Em empate, Responsabilidade tem prioridade como dominante e Relações como mais fraca (critério de desempate fixo, evita ambiguidade de implementação).

| Dominante \ Mais fraca | Planejamento baixo | Relações baixo | Crítico baixo | Responsabilidade baixo |
|---|---|---|---|---|
| **Planejamento alto** | — (não se aplica) | Final 2 — Independência | Final 5 — Bolsa Conquistada | Final 6 — Vitória com Custo |
| **Relações alto** | Final 7 — Rede de Apoio | — (não se aplica) | Final 1 — Reconstrução | Final 3 — Segunda Chance |
| **Crítico alto** | Final 5 — Bolsa Conquistada | Final 8 — Caminho Solitário | — (não se aplica) | Final 4 — O Ciclo |
| **Responsabilidade alto** | Final 6 — Vitória com Custo | Final 3 — Segunda Chance | Final 1 — Reconstrução | — (não se aplica) |

Se todas as 4 dimensões ficarem em "Médio" (sem alto nem baixo claro) → **Final 8 — Caminho Solitário**, tratado como final neutro-padrão.

Isso fecha os 10 finais com regra determinística, sem depender de sorte nem de combinação arbitrária de 3 tags como na v1.

---

## CORREÇÃO 4 — Matriz completa (D1–D28)

| ID | Cap. | Decisão | Tag(s) narrativa(s) | Callback | Competência | Dimensão alimentada |
|---|---|---|---|---|---|---|
| D1 | 1 | Rotina | `priorizou_rotina` | Cap. 5 (D28) | Autogestão | Planejamento |
| D2 | 1 | Ajudar Duda | `ajudou_colega` | Cap. 5 (D28, Twist 4) | Relacionamento | Relações |
| D3 | 1 | Nota | `escondeu_nota` / `assumiu_responsabilidade` | Cap. 4 (D19) | Responsabilidade | Responsabilidade |
| D4 | 1 | Bico | `comecou_bico` | Cap. 2 (D7) | Planejamento | Planejamento |
| D5 | 1 | Dinheiro | `guardou_dinheiro` | Cap. 3 (D18) | Finanças | Planejamento |
| D6 | 1 | Mentor | `confiou_mentor_cedo` | Cap. 3 (D13, D14) | Pensamento crítico | Crítico |
| D7 | 2 | Proposta de emprego | `pegou_emprego_cedo` | Cap. 4 (D20) | Priorização | Planejamento |
| D8 | 2 | Curso do Mentor | `fez_curso_mentor` | Cap. 3 (D14) | Análise de risco | Crítico |
| D9 | 2 | A prova (colar) | `colou_prova` | Cap. 4 (D24) | Integridade | Responsabilidade |
| D10 | 2 | Empréstimo | `pegou_emprestimo` | Cap. 5 (D26) | Finanças | Planejamento |
| D11 | 2 | Contar aos pais | `mentiu_pais` | Cap. 4 (D19), Cap. 5 (D25) | Comunicação | Responsabilidade |
| D12 | 2 | Escola ou trabalho | `perdeu_evento_escola` | — (textura) | Negociação | Relações |
| D13 | 3 | Cofre 1 | `passou_cofre1` | Cap. 5 (D25) | Memória contextual | Crítico |
| D14 | 3 | Twist 1 — conflito de interesses | `descobriu_mentor` | Cap. 5 (D25) | Pensamento crítico | Crítico |
| D15 | 3 | Confrontar ou investigar | `confrontou_mentor` | — | Autonomia | Crítico |
| D16 | 3 | A prova (faltar) | `faltou_prova` | Cap. 4 (D23) | Priorização | Planejamento |
| D17 | 3 | Pedir ajuda | `pediu_ajuda_duda` | Cap. 5 (D27) | Rede de apoio | Relações |
| D18 | 3 | Vender algo | `vendeu_pertence` | Cap. 4 (D22) | Valor emocional vs. prático | Planejamento |
| D19 | 4 | A verdade aparece | `pais_descobriram` | — | Confiança | Responsabilidade |
| D20 | 4 | Twist 2 — custo invisível | `familia_sofreu` | Cap. 5 (D25) | Visão sistêmica | Responsabilidade |
| D21 | 4 | Reparar ou justificar | `pediu_desculpa` | — | Reparação | Responsabilidade |
| D22 | 4 | Cofre 2 | `passou_cofre2` | — | Memória contextual | Crítico |
| D23 | 4 | Bolsa de estudos | `tentou_bolsa` | — | Resiliência | Planejamento |
| D24 | 4 | A cola (consequência) | `colou_descoberto` | Cap. 5 (D25, override final) | Consequência causal | Responsabilidade |
| D25 | 5 | Cofre 3 (corrigido) | `passou_cofre3` | — | Autoconhecimento | Crítico |
| D26 | 5 | Twist 3 — verdadeira cobrança | `revelacao_cofre` | — (dispara override Final 9) | Consequência financeira | Planejamento |
| D27 | 5 | Última escolha | `decisao_final` | — | Autonomia com apoio | Relações |
| D28 | 5 | Espelho / epílogo | `reconheceu_trajetoria` | Fecha D2 | Reflexão de trajetória | (não pontua — só pedagógico) |

Matriz fechada: 28 decisões, todas rastreadas, todas com competência e dimensão associada. Isso é o que faltava antes de começar a escrever texto.

---

## CORREÇÃO 5 — Distância narrativa: Lucas não é o aluno

Mudança de foco pedida: o jogo não fala com o aluno como se ele fosse Lucas. Lucas é um personagem separado. O aluno **decide por ele**, mas observa de fora.

### Por que isso muda o jogo

Antes, frases como "sua mãe trabalha até tarde" misturavam o jogador com o personagem. Isso pode:
- deixar decisões sensíveis (dívida, mentira aos pais) pesadas demais, porque soam como acusação direta
- fazer o aluno projetar a própria família em vez de analisar a situação de Lucas com distância crítica

Com Lucas como personagem separado, o jogo vira **estudo de caso interativo**, não confissão pessoal. Isso é mais seguro emocionalmente e mais fácil de discutir em roda de conversa depois — o aluno comenta "o Lucas deveria ter feito X", não "eu deveria ter feito X". A ponte pra vida real fica pra depois, na mediação do professor, não embutida forçosamente no texto do jogo.

### Convenção de narração (regra fixa pra qualquer texto gerado)

- **Nunca** usar "você", "sua família", "seus pais", "sua mãe" referindo-se ao jogador.
- **Sempre** usar "Lucas", "a família de Lucas", "os pais de Lucas", "a mãe de Lucas".
- O jogador é tratado como quem **decide pelo Lucas** — frases de decisão ficam no formato "O que Lucas deveria fazer?", não "O que você faria?".
- A tela de decisão pode usar 2ª pessoa só quando se dirige explicitamente ao papel de "orientador" do jogador — ex.: "Ajude Lucas a decidir" — nunca confundindo o jogador com o personagem.

### Onde isso se aplica no blueprint já fechado

Nenhuma decisão, tag, cofre, twist ou final muda de estrutura. Só muda a voz do texto na hora de escrever. Pontos que precisam de atenção redobrada na escrita, por terem histórico de mistura de pessoa gramatical:

- Decisão 3 (nota) — pista sobre a mãe
- Decisão 11 (contar aos pais)
- Decisão 20 (Twist 2 — custo invisível)
- Decisão 25 (Cofre 3, já corrigido acima)
- Decisão 26 (Twist 3 — revelação)

Recomendo revisar esses 5 pontos com atenção extra na hora de gerar o texto final, exatamente pela regra do capítulo 17 (checklist): "a decisão pode gerar uma reflexão pedagógica" — a reflexão deve nascer da distância, não da confusão de identidade.

---

## O que fazer agora

Ordem de produção (igual à v1, mas agora sem bloqueio):

1. ✅ 28 decisões fechadas
2. ✅ Tags narrativas fechadas
3. ✅ Matriz de consequências fechada (tabela acima)
4. ✅ Callbacks definidos (coluna da matriz)
5. ✅ 4 twists definidos
6. ✅ 10 finais com fórmula, não só descrição
7. Revisar a coerência final com você antes de escrever texto (recomendo essa revisão)
8. Escrever o Capítulo 1
9. Testar com poucos alunos
10. Revisar, seguir pro Capítulo 2

Único ponto que ainda depende de decisão sua: os pesos exatos da fórmula de dimensões (seção 3.2) são um ponto de partida razoável, não são "a única forma certa". Vale rodar um teste rápido com 3-4 combinações de escolhas simuladas, ver se o final bate com o que você esperaria, e ajustar peso antes de travar a fórmula em código.
