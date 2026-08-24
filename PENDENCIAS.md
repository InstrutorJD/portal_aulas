# Pendências

## Quiz de teoria revela a resposta certa no erro, e o aluno pode simplesmente reiniciar

**Status:** pendente.

**Onde:** todo arquivo `*-teoria.html` (e `csharp-basico.html`) em
`turmas/jogos/atividades/` e `turmas/sistemas/atividades/` — 40 arquivos
no total, todos com o mesmo trecho duplicado (não é um motor
compartilhado, é a mesma lógica colada em cada um). Ponto de referência:
`turmas/jogos/atividades/vida-equipe-teoria.html:396`.

**Problema:** quando o aluno erra uma pergunta, a mensagem de feedback já
entrega a alternativa correta:

```js
: `❌ Não foi dessa vez. A resposta certa é "<b>${q.options[q.correctIndex]}</b>": ${q.explanation...}`;
```

O botão de reiniciar (`shuffleOrder()`) só embaralha a ORDEM das mesmas
perguntas/alternativas — o conteúdo continua sendo o mesmo banco fixo.
Então o aluno que errou, viu a resposta certa e reiniciar a atividade
já sabe qual alternativa marcar, sem precisar ter aprendido nada — o
quiz deixa de medir compreensão nesse caminho.

**Próximos passos (ainda não decidido, discutir antes de implementar):**
- Repensar o que mostrar no erro: talvez só a explicação/dica, sem
  entregar literalmente qual é a alternativa certa, deixando o aluno
  tentar de novo na mesma tentativa.
- Ou, se a resposta certa continuar aparecendo, impedir que reiniciar
  "resete" a nota — ex.: contabilizar a tentativa errada mesmo que ele
  reinicie, ou bloquear reinício imediato da mesma pergunta.
- Avaliar se isso deveria ser corrigido junto de
  `scripts/check-quiz-answer-length-bias.mjs` (mesma frente de "o aluno
  não pode acertar sem ler/pensar"), já que os dois mexem no mesmo tipo
  de arquivo.
- Como está duplicado em 40 arquivos, vale considerar extrair um motor
  de quiz compartilhado (`shared/`) nessa mesma reforma, em vez de editar
  os 40 um por um — reduz o risco de esquecer algum na hora de aplicar a
  correção.

## Gerar PDF mensal de faltas, por turma

**Status:** pendente.

**Onde:** aba Gestão → "Chamada e Notas", em `shared/platform-core.js`
(`loadChamada()`/`finalizarChamada()`/`exibirResumoChamada()`, por volta
da linha 1256). Hoje a chamada é registrada dia a dia na tabela
`attendance` (`turma`, `data`, `student_email`, `presente`) e o único
resumo existente é a tabela de % de presença por aluno (linha ~1349),
sem exportação nenhuma — só um botão "Copiar" que só pega o resumo do
dia selecionado no campo de data, não o mês inteiro.

**Objetivo:** um botão pra gerar um PDF com a chamada do MÊS inteiro
(aluno × dia, mostrando quem faltou em qual data), pra imprimir/arquivar.
Precisa ser por turma — cada PDF gerado a partir do portal de uma turma
só pode trazer os alunos daquela turma (já é assim que `attendance` é
consultada, `.eq('turma', cfg.id)`, então isso já vem de graça desde que
o gerador reaproveite essa mesma consulta em vez de buscar tudo).

**Próximos passos (ainda não decidido, discutir antes de implementar):**
- Nenhuma biblioteca de PDF está no projeto ainda — decidir se usa algo
  tipo jsPDF (client-side, sem servidor, no mesmo espírito de
  `shared/gabarito-generator.js`, que já baixa arquivo direto do
  navegador) ou outra abordagem.
- Definir o layout: tabela aluno × dia do mês (presente/falta/sem
  registro), talvez com o % de presença do mês no rodapé de cada aluno.
- Decidir se o professor escolhe o mês (seletor) ou se é sempre o mês
  corrente.
- Reaproveitar a consulta existente de `attendance` filtrada por
  `turma` (já usada em `exibirResumoChamada`), só trocando o filtro de
  "tudo" pra "dias dentro do mês escolhido".

## Bloquear jogos não tira o aluno de um jogo já aberto

**Status:** pendente.

**Onde:** `shared/platform-core.js`, `checkGamesUnlock()` (linha ~881) e
`fetchTeacherOverride()`/`setupOverrideRealtime()` (linha ~906) — o
realtime já existe (canal `postgres_changes` em `student_overrides`),
mas o callback só chama `checkGamesUnlock()`, que só troca a classe/texto
do botão `#tabBtnJogos`. Nenhum dos dois mexe em `currentGameKey` nem
chama `closeGame()`.

**Problema:** quando o professor revoga o acesso aos jogos (botão
"Revogar" ou bloqueio da turma inteira, aba Gestão), o cadeado do botão
"Jogos" até atualiza sozinho (é realtime) — mas se o aluno JÁ ESTÁ dentro
de um jogo (`gameFrameArea` aberto, `currentGameKey` setado), esse jogo
continua rodando normalmente: nada verifica o bloqueio enquanto o jogo já
carregado está em execução. Só passa a valer se o aluno fechar o jogo e
voltar pra lista (ou atualizar a página) — até lá, pode continuar jogando
por muito tempo mesmo já bloqueado.

**Próximos passos (ainda não decidido, discutir antes de implementar):**
- Fazer `fetchTeacherOverride()` (chamado pelo realtime) checar se
  `currentGameKey` está setado e `isUnlocked` virou `false`; se sim,
  chamar `closeGame()` sozinho, com algum aviso pro aluno (ex.: toast
  "O professor bloqueou os jogos") em vez de só fechar sem explicação.
- Conferir se o mesmo vale pro QuizRush (`quizrush.html`), que também
  roda dentro da aba Jogos.
- Lembrar que `teacherUnlockOverride` é só um dos três critérios de
  `isUnlocked` (`progressUnlocked || teacherUnlockOverride ||
  role==='professor'`) — revogar o override não bloqueia quem já tem
  `progressUnlocked` true (completou os módulos), então o fechamento
  forçado só faz sentido nesse caso.
