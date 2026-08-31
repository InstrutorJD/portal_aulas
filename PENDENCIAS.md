# Pendências

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
cadastradas: `js`/`csharp` (Jogos Digitais, `turmas/jogos/config.js`),
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

**Status:** pendente — pedido do professor, ainda não implementado.

**Onde:** o bloqueio por **módulo/trilha** (navegação entre matérias) já
libera tudo pro professor — `isModuleLocked()` em
`shared/platform-core.js` retorna `false` de cara quando
`currentUser.role === 'professor'`, e o mesmo vale pra trava da aba de
Jogos e pra visibilidade de trilha (`trilhaStatus`). O que falta é o
bloqueio **dentro** de cada atividade, entre uma etapa/desafio e o
próximo: hoje toda atividade de código (`CHALLENGES`/`STEPS` com
progressão trancada) usa a mesma lógica —

```js
function isUnlocked(challenge) {
  const idx = CHALLENGES.findIndex(c => c.id === challenge.id);
  if (idx === 0) return true;
  return completed.has(CHALLENGES[idx - 1].id);
}
```

— sem nenhuma exceção pro professor, então mesmo logado como professor
só dá pra abrir a 1ª etapa até "resolver" cada uma em sequência. Esse
exato padrão está duplicado (bespoke, sem função compartilhada) em ~44
arquivos: todas as `*-pratica.html` das duas turmas (jogos e sistemas),
`js-basico.html`, `js-intermediario.html`,
`js-basico-adaptado-engel.html`, `csharp-pratica.html`,
`gdscript-pratica.html`, `sql-basico.html`, `sql-join.html`,
`sql-agregacao.html`. Além desses, dois casos com assinatura levemente
diferente:
- `turmas/jogos/atividades/cobrinha-construcao.html`: `isUnlocked(index)`
  sobre `STEPS` (não `CHALLENGES`), mais uma trava separada pro passo
  final (`vistoUnlocked = STEPS.every(s => completed.has(s.id))`).
- `shared/js-challenge-engine.js`: mesma lógica, mas já centralizada
  numa engine compartilhada (só usada por
  `turmas/sistemas/atividades/js-fundamentos-basico.html` e
  `-intermediario.html`) — corrigir esse arquivo já resolve os dois de
  uma vez.

**Objetivo:** o professor conseguir abrir/navegar livremente por
qualquer etapa de qualquer atividade prática, sem precisar "resolver"
as anteriores em ordem — pra poder revisar, demonstrar ou testar
qualquer parte do conteúdo. Não muda nada pro aluno.

**Caminho já mapeado (não implementado ainda):** em cada arquivo, checar
`(await window.PortalSession.getUser())?.role === 'professor'` (mesmo
`shared/session.js` que toda atividade já inclui) uma vez no carregamento,
guardar num flag (`isProfessor`), e fazer `isUnlocked(...)` retornar
`true` de cara quando o flag estiver ligado — como a checagem é
assíncrona, a etapa fica travada até a resposta chegar e então a
sidebar é re-renderizada. Uma tentativa de aplicar isso em lote (regex
simples sobre os 44 arquivos) esbarrou em arquivos com final de linha
CRLF vs LF misturado no repositório — precisa normalizar isso antes
(ou tratar os dois casos no script) pra não quebrar arquivo nenhum.
Nenhuma mudança chegou a ser commitada.

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
