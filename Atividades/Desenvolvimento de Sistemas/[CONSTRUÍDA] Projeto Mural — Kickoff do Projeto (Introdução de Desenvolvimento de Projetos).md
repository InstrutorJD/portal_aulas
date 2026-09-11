# Projeto Mural — Kickoff do Projeto (GitHub)

## 1. Apresentação

Este é o primeiro passo de um projeto que vai atravessar o curso inteiro: a turma vai construir, cada aluno na sua própria conta, uma **rede social da escola** chamada **Mural**. Cada matéria contribui com uma etapa real desse mesmo projeto (não é conteúdo isolado):

1. **Introdução de Desenvolvimento de Projetos** (esta atividade) — kickoff: cria o repositório no GitHub e planeja o trabalho.
2. **Modelagem de Sistemas 1** — modela os requisitos e os dados do Mural.
3. **Banco de Dados** — cria as tabelas reais no Supabase, com RLS.
4. **Redes de Computadores** — entende como o app conversa com a internet.
5. **Desenvolvimento de Sistemas 1** — escreve as funções de backend (JavaScript + Supabase).
6. **Programação de Aplicativos** — constrói a interface e entrega o app funcionando.

Aqui o aluno só cuida da parte 1: criar a "casa" do projeto no GitHub e planejar o que vai ser construído.

---

## 2. Situação-problema

A PixelForge Studios foi contratada pela escola pra criar uma rede social interna — o **Mural** —, onde alunos e professores possam se conectar, compartilhar o que estão fazendo e ver as novidades da turma. Você faz parte do time.

O Mural (1ª versão) deverá permitir:

- cadastro e login;
- perfil (nome, turma, foto);
- criar post (texto);
- feed com os posts de todos;
- curtir um post.

Antes de escrever qualquer código, todo projeto de verdade passa por uma fase de organização: criar o repositório, documentar o objetivo e planejar o trabalho em tarefas. É isso que você faz agora.

---

## 3. Tecnologias utilizadas
- GitHub (conta, repositório, README, Issues).

---

## 4. Objetivos da atividade

Ao finalizar, você deverá conseguir:
- identificar em qual fase de um projeto uma atividade está;
- criar uma conta no GitHub;
- criar um repositório;
- escrever um README que serve de cartão de visita do projeto;
- quebrar um projeto em tarefas (issues), uma por funcionalidade;
- documentar decisões de projeto desde o início.

---

## 5. Como o projeto vai crescer

```text
KICKOFF (aqui)
   ↓ repositório + README + issues
MODELAGEM
   ↓ docs/der.png, requisitos no README
BANCO DE DADOS
   ↓ database/schema.sql, database/policies.sql
DEV. DE SISTEMAS 1
   ↓ funções JS (app.js)
PROGRAMAÇÃO DE APLICATIVOS
   ↓ index.html + telas funcionando
MURAL PRONTO
```

Um único repositório (`mural-<usuario>`) acumula o trabalho de todas as matérias.

---

# ETAPA 1 — Missão do projeto

## Conceito
O Mural é um projeto real que você vai construir aos poucos, matéria por matéria, ao longo do curso — não um exercício isolado.

## Comando
Leia as 5 funcionalidades da 1ª versão (cadastro/login, perfil, criar post, feed, curtir) e escreva com suas palavras o que o Mural vai fazer.

---

# ETAPA 2 — Fases de um projeto, agora na prática

## Conceito
Você já estudou, na Oficina de Comunicação, as fases de elaboração de um projeto (levantamento, planejamento, desenvolvimento, testes, entrega). O Kickoff do Mural é a fase de **planejamento** virando ação de verdade.

## Comando
Identifique: em qual fase o projeto está agora, e em qual fase ele vai estar quando a Modelagem de Sistemas terminar o DER?

---

# ETAPA 3 — Controle de versão e GitHub

## Conceito
Times de desenvolvimento usam controle de versão (Git) pra guardar o histórico de tudo que foi feito, sem perder nada. O GitHub hospeda esse histórico na nuvem e também funciona como portfólio.

## Comando
Crie sua conta no GitHub (se ainda não tiver uma).

---

# ETAPA 4 — Criar o repositório do Mural

## Conceito
Um repositório é a "casa" do projeto: todo código, documentação e histórico moram ali.

## Comando
Crie um repositório novo, público, chamado `mural-<seuusuario>` (ex.: `mural-joao`), já marcando a opção de criar um `README.md`.

---

# ETAPA 5 — README como cartão de visita

## Conceito
O README é a primeira coisa que qualquer pessoa vê ao abrir o repositório — ele precisa explicar o projeto sem exigir que ninguém pergunte nada.

## Comando
Escreva no README: objetivo do Mural, a lista das 5 funcionalidades da 1ª versão, e as tecnologias que vão ser usadas (HTML, CSS, JavaScript, GitHub, Supabase).

---

# ETAPA 6 — Issues como plano de trabalho

## Conceito
Issues (no GitHub) são tarefas — o jeito de quebrar um projeto grande em pedaços pequenos e acompanháveis.

## Comando
Crie 5 issues, uma por funcionalidade: "Cadastro e login", "Perfil do usuário", "Criar post", "Feed com posts de todos", "Curtir post".

---

# ETAPA 7 — Documentar decisões desde o início

## Conceito
Decisões de projeto (nome, público-alvo, escopo) documentadas desde o começo evitam retrabalho e desalinhamento mais pra frente.

## Comando
Adicione ao README uma seção "Decisões de Projeto" com o nome escolhido pro app (pode manter "Mural" ou trocar) e o público-alvo (alunos e professores da turma/escola).

---

# CHECKLIST DE ENTREGA
- [ ] Conta no GitHub criada.
- [ ] Repositório `mural-<usuario>` criado (público, com README).
- [ ] README com objetivo, as 5 funcionalidades, tecnologias e "Decisões de Projeto".
- [ ] 5 issues criadas (uma por funcionalidade).

---

# REFLEXÃO FINAL
1. Por que planejar antes de programar economiza tempo depois?
2. O que aconteceria se o projeto não tivesse um README?
3. Por que quebrar o projeto em issues pequenas ajuda mais do que uma única tarefa gigante?

---

# RELAÇÃO COM O PLANO DE ENSINO
A Unidade Curricular de Introdução de Desenvolvimento de Projetos trabalha o reconhecimento das fases de elaboração de um projeto. Esta atividade aplica essa mesma capacidade de forma prática — em vez de só documentar as fases (como na Oficina de Comunicação), o aluno vive a fase de planejamento criando a estrutura real (repositório, README, issues) de um projeto que vai continuar sendo construído nas próximas matérias.

---

# CAPACIDADE PRINCIPAL A SER TRABALHADA
> **Reconhecer as diferentes fases pertinentes à elaboração de um projeto.**

## Capacidades mobilizadas durante o projeto
- Organizar um projeto em tarefas.
- Documentar objetivo e escopo de um sistema.
- Usar controle de versão (Git/GitHub).

---

# OBSERVAÇÃO PARA O DOCENTE
Esta atividade reaproveita a MESMA capacidade já trabalhada pela trilha "Oficina de Comunicação" (mesma matéria), mas com avaliação/produto diferente: aqui o "produto" é um repositório GitHub real, que vai ser reaproveitado (não descartado) pelas próximas 5 matérias do projeto Mural. Se preferir separar por bimestre, atribua o bimestre de cada trilha na aba Gestão do portal.
