# Pendências

## Trilha GDScript removida, aguardando reconstrução

**Status:** pendente — remoção deliberada a pedido do professor. A trilha
`csharp` já foi refeita do zero (ver abaixo); só `gdscript` continua sem
conteúdo, aguardando reconstrução (ainda sem data definida).

**Onde:** a trilha `gdscript` (label "GDScript"), dentro da matéria
"Fundamentos de Programação de Jogos" (`turmas/jogos/config.js`), continua
removida — trilha, módulos (`basico`/`pratica`) e os 2 arquivos de atividade
(`atividades/gdscript-basico.html`, `atividades/gdscript-pratica.html`).

**Próximos passos:**
- Definir com o professor a capacidade real (MSEP) da trilha antes de
  recriar qualquer coisa — mesma regra de sempre (a capacidade não pode ser
  inventada, ver seção "Trilha por capacidade (MSEP)" do README).
- Definir o formato (história + quiz, desafios de código, outro) e o
  conteúdo, do zero — não reaproveitar o texto da versão antiga sem revisão,
  já que a remoção foi pedida justamente para refazer.
- Progresso de alunos que já tinham avançado na versão antiga de GDScript
  (e na versão antiga de C#, module keys `basico`/`pratica` — diferentes dos
  novos `teoria`/`comparacao`/`pratica-simples`/`desafios`, então ficam
  órfãos, sem contar no progresso, mas continuam ocupando linhas na
  tabela): ver
  `sql/supabase-reset-progresso-csharp-gdscript-jogos.sql` para apagar
  `student_module_progress` dessas trilhas no Supabase — mesmo padrão de
  aviso de `sql/supabase-reset-progresso-js-jogos.sql` quanto a progresso
  local no navegador dos alunos (localStorage não é apagado por esse SQL).

## Trilha C# reconstruída (teoria + comparação + 2 práticas)

**Status:** concluído — trilha `csharp` recriada do zero dentro de
"Fundamentos de Programação de Jogos" (`turmas/jogos/config.js`), a pedido
do professor, com 4 módulos:
- **Teoria** (`atividades/csharp-teoria.html`, `shared/quiz-teoria-engine.js`):
  história do C# (Microsoft, Anders Hejlsberg, 2000, .NET), motivo de ter
  sido criado, por que é popular em jogos (Unity), pontos positivos/
  negativos e jogos famosos majoritariamente feitos em C# (Hollow Knight,
  Cuphead, Among Us, Cities: Skylines, Subnautica, Rust, Pokémon GO).
- **Comparação — JavaScript vs C#** (`atividades/csharp-comparacao.html`):
  comparação de sintaxe (texto + código lado a lado) entre variável,
  constante, função, if/else e laço, um conceito por vez (abas + Anterior/
  Próximo). Módulo separado da prática de código abaixo — originalmente os
  dois estavam empilhados numa página só (`csharp-comparacao-pratica.html`),
  mas a tela ficou grande demais pra caber num Chromebook; virou 2 etapas
  da trilha, mesmo padrão de teoria/prática separadas usado no resto do
  portal.
- **Prática — JavaScript vs C#** (`atividades/csharp-pratica-simples.html`,
  renomeado de `csharp-comparacao-pratica.html`): só a parte de código de
  verdade, restrita ao mais simples (criar variável, somar, subtrair,
  multiplicar, dividir), com 5 desafios.
- **Prática — Desafios de C#** (`atividades/csharp-desafios-pratica.html`):
  14 desafios de código no mesmo formato "vença cada duelo em ordem" do JS
  (`js-basico.html`) — 10 de variável/`Console.WriteLine` (bloco original) +
  4 novos (um pra cada conceito que só era comparado em texto até então:
  constante, função, if/else e for — ver próxima seção).

Como não dá pra rodar C# de verdade no navegador, as 2 práticas usam
`shared/csharp-challenge-engine.js` — um motor novo (variação de
`shared/js-challenge-engine.js`) que TRANSPILA um subconjunto restrito de
sintaxe C# pra JavaScript equivalente antes de rodar contra os casos de
teste. Qualquer linha fora desse subconjunto reconhecido vira erro de
sintaxe (não passa "por acidente" só por ser JS válido) — e se o tipo
declarado for `int`, o resultado é truncado (`Math.trunc`) igual o C# de
verdade faz na divisão inteira, diferente do JavaScript.

## Desafios de constante/função/if-else/for na trilha C#

**Status:** concluído — a Comparação JS vs C# (`csharp-comparacao.html`)
sempre ensinou 5 conceitos (variável, constante, função, if/else, laço),
mas até então só "variável" tinha desafio de código de verdade nas 2
práticas; os outros 4 eram só comparados em texto, nunca escritos pelo
aluno. `shared/csharp-challenge-engine.js` só reconhecia 2 formatos de
linha (declaração de variável e `Console.WriteLine`) — qualquer `if`, `for`
ou `static TIPO Nome(...)` caía direto no erro genérico "não reconheci o
comando".

**O que mudou:** `transpile()` ganhou mais formatos reconhecidos —
declaração sem valor inicial (`TIPO nome;`), reatribuição (`nome = expr;`),
cabeçalho de função (`static TIPO Nome(TIPO p1, TIPO p2) {`), `return`,
`if (cond) {`, `} else {`, `for (int i = ini; i OP fim; i++) {` e `}`
sozinho numa linha. Não é um parser recursivo — é reconhecimento linha a
linha (cada linha bate com um padrão isolado); o aninhamento de blocos
funciona sozinho porque as chaves emitidas são as mesmas do código do
aluno, e quem interpreta de verdade a estrutura é o `new Function` do JS
que roda o resultado. C# e JS já compartilham a sintaxe de if/else/for, então
essas linhas passam quase direto — só o cabeçalho do `for` troca `int` por
`let`, e a assinatura da função vira `function Nome(p1, p2) {`.

4 desafios novos em `csharp-desafios-pratica.html` (ids 11-14): criar
constante, criar função (com parâmetro e `return`), if/else, e um `for`
imprimindo uma sequência no console. `progressTotal` do módulo foi de 10
pra 14 — precisou atualizar `turmas/jogos/config.js` e os testes que
semeavam esse progresso com um array genérico de 10 itens
(`tests/turma-jogos.spec.js`, `tests/daily-activity-release.spec.js`,
`tests/trilha-individual-engel.spec.js` — `csharp_desafios` saiu do grupo
compartilhado `praticaDez` e ganhou array próprio de 14).

Cobertura: `tests/csharp-jogos.spec.js` — desafio de função rejeita
`function` (JS) e exige `static TIPO Nome`; desafio de for rejeita `let`
(JS) e exige `int` no cabeçalho; desafio de if/else falha sem o `else`.

**C# Básico (Engel):** trilha individual (`visibleFor: ['engel.fraga']`,
mesmo padrão de `js-adaptado-engel`), `atividades/csharp-basico-adaptado-engel.html`.
Mesmo assunto da trilha C# principal (criar "variável", somar, subtrair,
multiplicar, dividir), só que com termos concretos: "caixa" no lugar de
variável, "objeto dentro da caixa" no lugar de valor, e a palavra do tipo
(`int`) descrita como "etiqueta da caixa". Reaproveita a UI de ícones
grandes + palavras conhecidas (emoji) de `js-basico-adaptado-engel.html`, e
valida o código digitado chamando `window.PortalCsharpChallenges.transpile`
(exportado por `shared/csharp-challenge-engine.js`) — mesma validação de
sintaxe C# restrita da trilha principal, sem duplicar o parser.

## Efeito visual + sonoro ao concluir uma atividade

**Status:** pendente — ideia do professor, ainda não implementada.

**Onde:** hoje, ao concluir uma atividade (trabalho com visto, questionário
que bate o % mínimo, prática que resolve o último desafio), a tela de
"concluído"/troféu é só estática — nenhum efeito visual (ex.: confete,
fogos de artifício) nem sonoro (ex.: som de palmas) toca nesse momento, em
nenhuma das telas de conclusão das duas turmas.

**Objetivo:** dar um retorno mais comemorativo/gratificante quando o aluno
termina uma atividade — exemplo citado pelo professor: fogos de artifício
e/ou som de palmas.

**Próximos passos (ainda não decidido, discutir antes de implementar):**
- Onde aplicar: só nas telas de conclusão dos motores compartilhados
  (`shared/quiz-teoria-engine.js`, `shared/js-challenge-engine.js`, o que
  cobriria a maior parte do conteúdo com pouco esforço), ou também nas
  ~48 telas bespoke de prática/trabalho das duas turmas?
- Efeito visual: biblioteca de confete/fogos (ex.: canvas-confetti) ou algo
  mais simples em CSS puro, sem dependência nova?
- Som: precisa de um arquivo de áudio (ex.: clipe de palmas) — de onde
  viria (licença livre) e como ficaria disponível offline (mesmo padrão
  dos assets já usados no portal, sem depender de CDN externo)?
- Precisa de opção pra desligar o som (autoplay de áudio costuma ser
  bloqueado por navegador até alguma interação do usuário, e alguns
  alunos podem estar em ambiente silencioso/compartilhado)?

## Timer mínimo antes de liberar resposta nos quizzes/desafios

**Status:** pendente — ideia do professor, ainda não implementada.

**Onde:** hoje, ao renderizar uma pergunta, as opções de resposta (ou o
editor/botão "Executar", nos desafios de código) já ficam clicáveis/
disponíveis de imediato — nada impede responder em 1-2 segundos.
`shared/quiz-teoria-engine.js` (teoria, ~20 aulas) e
`shared/js-challenge-engine.js` (prática de código, 2 arquivos da turma
Sistemas) são motores compartilhados, então uma mudança em cada um já
cobre a maior parte do conteúdo. As ~9 telas de "pareceres" bespoke da
turma Jogos (padrão antigo, sem motor compartilhado — ver pendência
"Correção mais flexível nos desafios de código de verdade" abaixo)
exigiriam repetir a mudança arquivo por arquivo.

**Objetivo:** o professor percebeu alunos tirando print da pergunta,
mandando pra uma IA (ChatGPT) e respondendo tudo muito rápido, sem ler.
A ideia é um timer mínimo (ex.: 10-15s) antes de liberar o clique nas
opções/botão de resposta, com contagem regressiva visível, pra reduzir
esse padrão de resposta reflexa.

**Observação importante (mesmo espírito do aviso já existente em
`shared/clipboard-guard.js`):** isso é um **desincentivo pedagógico, não
segurança de verdade** — trava só a resposta por reflexo dentro do
portal; não impede o aluno de tirar print, esperar o timer zerar
enquanto conversa com uma IA em outra aba, e só depois responder.

**Próximos passos (ainda não decidido, discutir antes de implementar):**
- Duração do timer (10s? 15s? variar por tamanho da pergunta/desafio?).
- Timer conta a partir de quando a pergunta aparece, ou some por completo
  se a resposta já veio antes de acabar? (mostrar contagem regressiva é
  mais transparente pro aluno do que só desabilitar sem explicação).
- Vale aplicar nas ~9 telas bespoke de pareceres da turma Jogos agora, ou
  só nos dois motores compartilhados por enquanto (cobre a maior parte
  do conteúdo com bem menos esforço)?

## Relatório de capacidade trabalhada por matéria/dia

**Status:** pendente — ainda é só uma ideia a avaliar, não uma decisão de
implementar.

**Onde:** hoje os relatórios existentes (chamada/notas, inatividade) não
registram qual **capacidade** (ver seção "Trilha por capacidade (MSEP)" do
README) foi trabalhada em cada matéria em cada dia de aula.

**Objetivo:** nos relatórios, incluir um relatório de **capacidade**
trabalhada em cada **matéria** naquele dia.

**Próximos passos (ainda não decidido, discutir antes de implementar):**
- Como registrar isso: automático a partir dos módulos abertos/concluídos
  naquele dia (cruzando com a trilha/capacidade de cada módulo), manual
  (o professor marca qual capacidade foi trabalhada), ou os dois?
- Onde esse relatório aparece: junto dos relatórios já existentes na aba
  Gestão do professor, ou uma tela nova?
- Granularidade: por matéria+dia é suficiente, ou também precisa por
  turma/aluno?

## Documentação das linguagens dentro do portal

**Status:** pendente.

**Onde:** nada disso existe ainda — hoje não há nenhum ponto de acesso a
documentação externa dentro do portal. Trilhas de linguagem já
cadastradas: `js` (Jogos Digitais, `turmas/jogos/config.js` — as trilhas
`csharp`/`gdscript` foram removidas pra reconstrução, ver "Trilhas C# e
GDScript removidas para reconstrução" abaixo),
`sql`/`sql-comentarios` (Sistemas, `turmas/sistemas/config.js`), além de
HTML/CSS/JavaScript usados na prática de Conexão com Supabase
(`turmas/sistemas/atividades/db-conexao-supabase-pratica.html`).

**Objetivo:** dar acesso rápido à documentação oficial de cada linguagem
trabalhada no curso, sem o aluno precisar procurar por fora — só um link
direto (ex.: MDN pra JavaScript/HTML/CSS, Microsoft Learn pra C#,
documentação do PostgreSQL pra SQL). Não é pra embutir a documentação
inteira dentro do portal, só o atalho.

**Próximos passos (ainda não decidido, discutir antes de implementar):**
- Onde colocar o(s) link(s): dentro de cada trilha/módulo de linguagem
  (ex.: um botão "📖 Documentação" ao lado do módulo), numa seção nova
  dedicada (ex.: dentro da aba Aulas ou do Perfil), ou as duas coisas.
- Quais linguagens/tecnologias entram na lista (JS, C#, SQL, HTML, CSS,
  Supabase/PostgreSQL, Git/GitHub?) e qual link oficial usar pra cada uma.
- Cada link abre em nova aba (mais simples, sem risco de bloqueio) ou a
  ideia é abrir dentro do próprio portal (mais complexo — vários sites de
  documentação bloqueiam ser carregados em `<iframe>` via
  `X-Frame-Options`/CSP, precisa verificar caso a caso antes de decidir).

## Nova atividade "Projetos" (problema proposto pelo professor, construído junto com a turma)

**Status:** pendente — ainda é só uma ideia a avaliar, não uma decisão de
implementar.

**Onde:** não existe hoje um formato assim. Os dois formatos de atividade
atuais são "história + quiz" (teoria, `shared/quiz-teoria-engine.js`) e
"desafios" (prática, `CHALLENGES` com `tests`/`solutionSql`/etc., por
módulo). O mais próximo do espírito de "projeto" que já existe é a
prática de Conexão com Supabase (`turmas/sistemas/atividades/
db-conexao-supabase-pratica.html`), descrita como "projeto integrador"
em `turmas/sistemas/config.js` — mas ali é um roteiro individual que cada
aluno segue sozinho, sem nada colaborativo nem conduzido ao vivo pelo
professor.

**Objetivo:** avaliar se faz sentido um formato de atividade "Projetos"
onde o professor propõe um problema/situação-problema em aula, e a
solução é construída junto com a turma (não cada aluno sozinho no seu
ritmo, como as atividades atuais).

**Próximos passos (ainda não decidido, discutir antes de implementar):**
- Isso é uma atividade de verdade dentro do portal (com progresso
  salvo, gabarito, etc.) ou é mais uma dinâmica de aula/apresentação
  (parecido com o gerador de slides) que só precisa de um roteiro/
  material de apoio, sem mecânica de portal nenhuma?
- O que significa "construir junto": o professor conduz e os alunos só
  acompanham/respondem perguntas ao longo do caminho (mais parecido com
  o QuizRush, mas sem timer/pontuação), ou tem alguma forma de
  participação/edição em tempo real de verdade (bem mais complexo,
  provavelmente fora do escopo atual do portal)?
- Como fica o "progresso"/conclusão dessa atividade — é por aluno
  individualmente (cada um marca que acompanhou) ou só existe um
  registro por turma (ex.: o professor dá o visto uma vez, pra turma
  toda, parecido com `shared/professor-visto.js`)?
- Vale entender melhor com o professor um ou dois exemplos concretos de
  "problema proposto" antes de desenhar qualquer coisa — o formato certo
  depende muito do que essa dinâmica precisa suportar na prática.

## Correção mais flexível nos desafios de código de verdade

**Status:** pendente — problema identificado pelo professor em sala
(alunos travando nos desafios), ainda sem solução definida.

**Onde:** todo módulo de prática onde o aluno escreve código de verdade
num editor (não é múltipla escolha) roda a checagem por igualdade
estrita, comparando o valor produzido pelo código do aluno com um
`expected` fixo — mas com pelo menos 3 implementações bespoke diferentes
hoje, cada uma com sua própria rigidez:

- `turmas/jogos/atividades/js-basico.html`: exige uma variável com nome
  **exato** (`resultVar`, sempre `'resultado'` nesse arquivo) — se o
  aluno guardar o resultado numa variável chamada `soma` ou `total`
  (nomes tão ou mais naturais que `resultado`), o desafio diz que a
  variável não foi criada, mesmo com a lógica 100% correta.
- `turmas/jogos/atividades/js-intermediario.html` e `cod-poo-pratica.html`:
  mesma ideia, mas com nome de **função** exato (`fnName`).
- `turmas/jogos/atividades/cod-linguagens-pratica.html`,
  `cod-seguranca-debug-pratica.html`, `cod-agil-clean-pratica.html`,
  `cod-seguranca-ia-pratica.html`, `fund-logica-pratica.html`,
  `fund-prog2d-pratica.html`: variações do mesmo padrão.
- `shared/js-challenge-engine.js` (usado só em
  `turmas/sistemas/atividades/js-fundamentos-basico.html`/
  `-intermediario.html`): já é compartilhado entre esses dois arquivos,
  mas tem o mesmo problema de fundo — `check.type: 'console'` compara a
  lista inteira de saídas de `console.log`/`alert` com
  `JSON.stringify(result) === JSON.stringify(expected)`, texto exato,
  então formatação/pontuação diferente da esperada também reprova mesmo
  quando o raciocínio do aluno está certo.

**Objetivo:** um aluno que resolveu o problema de um jeito correto, mas
ligeiramente diferente do "gabarito" esperado (nome de variável/função
diferente, texto de `console.log` com espaçamento/pontuação diferente,
resultado certo por outro caminho de código), hoje é bloqueado sem
conseguir avançar — o console só mostra "❌ Ainda não!" ou "a variável/
função 'X' não foi criada", sem indicar que o problema é só o nome
escolhido, não a lógica.

**Próximos passos (ainda não decidido, discutir antes de implementar):**
- Nome de variável/função: dá pra aceitar qualquer nome (inspecionando
  todas as variáveis/funções declaradas no escopo em vez de procurar um
  nome fixo) ou o exercício quer ensinar justamente a seguir um nome
  combinado (ex.: convenção de equipe)? Se for o segundo caso, a solução
  é melhorar a mensagem de erro pra deixar isso explícito, não afrouxar
  a checagem.
- Texto de `console.log`: normalizar espaços/maiúsculas/pontuação antes
  de comparar resolveria a maior parte dos casos, sem abrir mão de
  checar o conteúdo.
- Isso é uma refatoração pra unificar as ~9 implementações bespoke da
  turma Jogos numa engine só (aproveitando/estendendo
  `shared/js-challenge-engine.js`, que já existe mas só é usado em 2
  arquivos da turma Sistemas), ou dá pra resolver módulo a módulo sem
  mexer na arquitetura?
- Ficou definido, numa conversa anterior, **não** seguir pelo caminho de
  uma IA avaliando a resposta do aluno — complexo demais pra manter de
  graça com qualidade e consistência. A solução aqui deve continuar
  sendo determinística (regras de normalização/inspeção de escopo), não
  um modelo de linguagem.

## Desbloquear todas as etapas das atividades para o professor

**Status:** resolvido. Todos os arquivos com a trava por
`isUnlocked`/progressão trancada — motores compartilhados e os ~48
arquivos bespoke — já liberam tudo pro professor. Ver "Já resolvido"
abaixo.

**Onde:** o bloqueio por **módulo/trilha** (navegação entre matérias) já
libera tudo pro professor — `isModuleLocked()` em
`shared/platform-core.js` retorna `false` de cara quando
`currentUser.role === 'professor'`, e o mesmo vale pra trava da aba de
Jogos e pra visibilidade de trilha (`trilhaStatus`). O que faltava era o
bloqueio **dentro** de cada atividade, entre uma etapa/desafio e o
próximo: toda atividade de código (`CHALLENGES`/`STEPS` com progressão
trancada) usa a mesma lógica —

```js
function isUnlocked(challenge) {
  const idx = CHALLENGES.findIndex(c => c.id === challenge.id);
  if (idx === 0) return true;
  return completed.has(CHALLENGES[idx - 1].id);
}
```

— sem nenhuma exceção pro professor, então mesmo logado como professor
só dava pra abrir a 1ª etapa até "resolver" cada uma em sequência. Esse
mesmo padrão estava duplicado (bespoke, sem função compartilhada) em
~46 arquivos, mais dois casos com assinatura levemente diferente
(`cobrinha-construcao.html` e `shared/js-challenge-engine.js`) — ver
lista completa em "Já resolvido" abaixo.

**Objetivo:** o professor conseguir abrir/navegar livremente por
qualquer etapa de qualquer atividade prática, sem precisar "resolver"
as anteriores em ordem — pra poder revisar, demonstrar ou testar
qualquer parte do conteúdo. Não muda nada pro aluno.

**Já resolvido:**
- `shared/quiz-teoria-engine.js` (todas as ~20 telas "história + quiz",
  incluindo `prog-depuracao-teoria.html`): a tela de pergunta ganhou um
  botão "⏭️ Pular (professor)", visível só quando `isProfessor` (checado
  uma vez, assíncrono, via `PortalSession.getUser()`) estiver ligado —
  ele avança sem exigir clique numa opção. Como é assíncrono, a 1ª
  pergunta pode renderizar antes do botão aparecer; da 2ª em diante já
  aparece direto.
- `turmas/sistemas/atividades/prog-depuracao-pratica.html`: mesmo padrão
  aplicado em `isUnlocked(challenge)` — com `isProfessor` ligado, todo
  chamado conta como desbloqueado; a sidebar é re-renderizada assim que
  a checagem assíncrona resolve.
- Os ~46 arquivos bespoke restantes com o padrão `isUnlocked(challenge)`
  sobre `CHALLENGES` (todas as `*-pratica.html` das duas turmas,
  `js-basico.html`, `js-intermediario.html`,
  `js-basico-adaptado-engel.html`, `csharp-pratica.html`,
  `gdscript-pratica.html`, `sql-basico.html`, `sql-join.html`,
  `sql-agregacao.html`): corrigidos em lote (script único, tratando
  arquivos CRLF e LF separadamente — a mistura de final de linha era
  exatamente o que travou a tentativa anterior). Mesmo padrão dos dois
  itens acima: comentário + `isProfessor` + IIFE assíncrona antes de
  `isUnlocked`, `if (isProfessor) return true;` como 1ª linha dela.
- `shared/js-challenge-engine.js` (motor compartilhado, usado por
  `js-fundamentos-basico.html`/`-intermediario.html`): mesmo padrão,
  corrigido uma vez só na engine — resolve os dois arquivos de uma vez.
- `turmas/jogos/atividades/cobrinha-construcao.html`: caso especial —
  além de `isUnlocked(index)` sobre `STEPS`, o passo final ("Visto do
  professor") tem seu próprio `vistoUnlocked = STEPS.every(s =>
  completed.has(s.id))`, sem passar por `isUnlocked`. Vira
  `vistoUnlocked = isProfessor || STEPS.every(...)`, senão o professor
  destravava os passos mas não o Visto.

Cobertura: `tests/professor-unlock-challenges.spec.js` (novo) testa as 3
variações (bespoke, motor compartilhado, caso especial do Cobrinha).
Suíte completa passa (203/203).

## Token do professor em "Dar visto"/"Pular etapa" — proteção contra força bruta

**Status:** pendente — risco residual aceito conscientemente, não uma
falha esquecida.

**Onde:** o token de 6 dígitos que substituiu login/senha reais em
"Dar visto"/"Pular etapa" (`shared/professor-visto.js`,
`verificar_professor_token` em `sql/supabase-setup-completo.sql`, bloco
13) é validado só por RLS/RPC do Postgres — sem nenhum rate limit. Um
aluno mal-intencionado poderia tentar várias combinações de 6 dígitos
seguidas (1 milhão de possibilidades) enquanto o token está válido (até
10min) sem ser bloqueado.

**Objetivo:** hoje isso já é uma melhora enorme sobre o problema
original (senha real, válida pra sempre até alguém trocar manualmente,
digitada num dispositivo do aluno) — mas continua sendo uma senha
numérica curta sem limite de tentativas, então força bruta ainda é
teoricamente possível dentro da janela de 10 minutos.

**Próximos passos (não implementado — precisaria de mais infra do que
o projeto tem hoje):**
- Rate limit por IP/sessão exigiria uma camada além de RLS puro (ex.:
  Edge Function do Supabase contando tentativas, ou uma tabela de
  tentativas falhas com bloqueio temporário) — fora do escopo de
  "só SQL + RPC" que o resto do projeto usa.
- Alternativa mais simples: token mais longo (8+ caracteres
  alfanuméricos em vez de 6 dígitos) aumenta o espaço de busca sem
  precisar de infraestrutura nova — troca simplicidade de digitar por
  mais segurança.
