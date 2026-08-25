# Pendências

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
