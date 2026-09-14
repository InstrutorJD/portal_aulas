# Projeto Mural — Banco de Dados e RLS

## 1. Apresentação
3ª etapa do projeto Mural. O aluno cria, num projeto Supabase próprio, as 3 tabelas definidas no DER da Modelagem (Usuário, Post, Curtida), com chaves estrangeiras e políticas de RLS — mesmo padrão de ponta a ponta já usado na trilha "Conexão com Supabase" (TikTak), agora aplicado ao Mural.

---

## 2. Situação-problema
O DER do Mural já existe (`docs/der.png`, matéria anterior). Agora é preciso transformar esse modelo em um banco de dados de verdade, no Supabase, seguro (com RLS) — pronto pra receber as funções de backend que serão escritas na próxima matéria.

---

## 3. Tecnologias utilizadas
- Supabase (projeto, SQL Editor, Data API, RLS/Policies);
- GitHub (commit dos scripts SQL no mesmo repositório `mural-<usuario>`).

---

## 4. Objetivos da atividade
- Criar um projeto Supabase.
- Criar tabelas com FK entre elas.
- Testar INSERT/SELECT manualmente.
- Habilitar RLS e criar policies de leitura/inserção/atualização restrita ao autor.
- Commitar os scripts SQL no repositório do projeto.

---

# ETAPA 1 — Criar o projeto Supabase

## Conceito
Um projeto Supabase é um banco PostgreSQL gerenciado, com API pronta pra uso via JavaScript.

## Comando
Crie um novo projeto Supabase chamado `mural`.

---

# ETAPA 2 — Tabela `usuarios`

## Conceito
Toda tabela precisa de uma chave primária única.

## Comando
`CREATE TABLE usuarios` com: id (PK, auto), nome, turma, foto_url, usuario, senha, criado_em. Commite o script em `database/schema.sql`.

---

# ETAPA 3 — Tabela `posts` (com FK)

## Conceito
Chave estrangeira (FK) conecta uma linha de uma tabela a uma linha de outra.

## Comando
`CREATE TABLE posts` com: id (PK), autor_id (FK → usuarios), texto, criado_em.

---

# ETAPA 4 — Tabela `curtidas` (com restrição única)

## Conceito
Um `unique constraint` impede duplicidade — aqui, evita que o mesmo usuário curta o mesmo post duas vezes.

## Comando
`CREATE TABLE curtidas` com: id (PK), post_id (FK → posts), usuario_id (FK → usuarios), criado_em, `unique(post_id, usuario_id)`.

---

# ETAPA 5 — Testar manualmente

## Comando
Insira 1 usuário, 1 post e 1 curtida direto pelo SQL Editor ou pela interface de tabela do Supabase. Confira que os relacionamentos (FK) foram respeitados.

---

# ETAPA 6 — Revisão da Data API

## Conceito
A Data API do Supabase transforma comandos SQL em chamadas que o JavaScript do navegador consegue fazer (revisão do que já foi visto na trilha Conexão com Supabase).

## Comando
Localize a Project URL e a Publishable Key do projeto `mural`.

---

# ETAPA 7 — Habilitar RLS

## Conceito
Sem RLS habilitado, o banco recusa qualquer acesso pela Data API, mesmo com a chave certa.

## Comando
Habilite RLS nas 3 tabelas (`usuarios`, `posts`, `curtidas`).

---

# ETAPA 8 — Policies de leitura e inserção

## Conceito
Policies de `select`/`insert` controlam, linha por linha, quem pode ler e quem pode criar.

## Comando
Crie policies de leitura pública (feed visível pra todos) e de inserção liberada (cadastro, criar post, curtir) nas 3 tabelas. Commite em `database/policies.sql`.

---

# ETAPA 9 — Policy de atualização/exclusão restrita ao autor

## Conceito
Nem toda operação deve ser liberada geral — editar/apagar um post deve ser restrito a quem criou.

## Comando
Crie uma policy de `update`/`delete` em `posts` que só permita a operação quando `autor_id` bate com o usuário que está fazendo a requisição (usando o valor enviado pela aplicação, já que não há Supabase Auth nesta atividade — documentar essa limitação didática).

---

# ETAPA 10 — Testar as policies e visto

## Comando
Teste select/insert/update de cada tabela. Chame o professor pra dar o visto, mostrando as 3 tabelas, RLS habilitado e os arquivos `database/schema.sql`/`database/policies.sql` commitados.

---

# CHECKLIST DE ENTREGA
- [ ] Projeto Supabase `mural` criado.
- [ ] 3 tabelas criadas com FK corretas.
- [ ] `unique(post_id, usuario_id)` em `curtidas`.
- [ ] RLS habilitado nas 3 tabelas.
- [ ] Policies de leitura, inserção e atualização/exclusão restrita testadas.
- [ ] `database/schema.sql` e `database/policies.sql` commitados no repositório.

---

# REFLEXÃO FINAL
1. Por que uma tabela sem RLS habilitado fica inacessível pela Data API mesmo com a chave certa?
2. Por que `curtidas` precisa de um `unique constraint`?
3. Por que restringir update/delete de `posts` ao próprio autor é importante?

---

# RELAÇÃO COM O PLANO DE ENSINO
A capacidade de Banco de Dados envolvida é aplicar procedimentos de segurança no SGBD — a mesma já trabalhada na trilha "Conexão com Supabase" (TikTak), agora aplicada a um schema de 3 tabelas relacionadas em vez de uma só.

---

# CAPACIDADE PRINCIPAL A SER TRABALHADA
> **Aplicar procedimentos de segurança e backup no SGBD.**

## Capacidades mobilizadas
- Modelagem física de dados (DDL, FK, constraints).
- Controle de acesso (RLS/Policies).

---

# OBSERVAÇÃO PARA O DOCENTE
Ponto de atenção: esta atividade reaproveita a capacidade de "Conexão com Supabase" em vez da capacidade de SQL — se preferir vincular à capacidade de SQL (consulta/manipulação/controle do banco), é só ajustar o campo `capacidade` no `config.js` antes de liberar pra turma.
