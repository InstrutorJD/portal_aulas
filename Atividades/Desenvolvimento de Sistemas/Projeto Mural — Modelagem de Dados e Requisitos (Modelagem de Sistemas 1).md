# Projeto Mural — Modelagem de Dados e Requisitos

## 1. Apresentação
2ª etapa do projeto interdisciplinar Mural (rede social da escola — ver ETAPA 1 do Kickoff, em Introdução de Desenvolvimento de Projetos). Aqui o aluno modela, em cima do repositório `mural-<usuario>` já criado, os requisitos e os dados que vão virar as tabelas reais na próxima matéria (Banco de Dados).

---

## 2. Situação-problema
A PixelForge Studios já tem o repositório do Mural criado (Kickoff). Antes de criar qualquer tabela ou tela, o time de modelagem precisa definir: o que o sistema precisa fazer (requisitos) e como os dados vão se organizar (entidades, atributos, relacionamentos).

O Mural (1ª versão) cobre: cadastro/login, perfil (nome, turma, foto), criar post (texto), feed com posts de todos, curtir.

---

## 3. Tecnologias utilizadas
- Canva / Google Slides / draw.io / dbdiagram.io (à escolha, pra desenhar o DER);
- GitHub (repositório já existente, pra guardar o resultado).

---

## 4. Objetivos da atividade
- Diferenciar requisito funcional de não funcional.
- Identificar entidade, atributo e relacionamento.
- Definir cardinalidade (1:N, N:N).
- Marcar chave primária e chave estrangeira.
- Desenhar um DER/MER.

---

# ETAPA 1 — Requisitos funcionais e não funcionais

## Conceito
Requisito funcional é uma AÇÃO que o sistema faz; requisito não funcional é uma QUALIDADE do sistema (desempenho, segurança, usabilidade).

## Comando
Liste 5 requisitos funcionais (um por funcionalidade do MVP) e 3 requisitos não funcionais do Mural (ex.: tempo de resposta do feed, layout responsivo, senha nunca aparece em texto puro na tela).

---

# ETAPA 2 — Entidades e atributos

## Conceito
Entidade é algo do mundo real que vira tabela; atributo é uma característica dela, que vira coluna.

## Comando
Liste os atributos de 3 entidades do Mural: **Usuário** (nome, turma, foto, usuário, senha), **Post** (texto, data), **Curtida** (data).

---

# ETAPA 3 — Relacionamentos e cardinalidade

## Conceito
Cardinalidade descreve quantos registros de uma entidade se relacionam com quantos de outra (1:N, N:N).

## Comando
Defina a cardinalidade: um Usuário pode ter quantos Posts? Um Post pode ter quantas Curtidas, de quantos Usuários diferentes?

---

# ETAPA 4 — Chave primária e chave estrangeira

## Conceito
A chave primária identifica um registro de forma única; a chave estrangeira cria o link entre duas tabelas.

## Comando
Marque a PK de cada entidade e as FKs que conectam Post→Usuário e Curtida→Post/Usuário.

---

# ETAPA 5 — Desenhar o DER

## Conceito
O Diagrama de Entidade-Relacionamento (DER/MER) é o "mapa" visual do banco de dados antes de criar qualquer tabela.

## Comando
Desenhe o DER do Mural (Canva, draw.io ou dbdiagram.io), exporte como imagem e salve como `docs/der.png` no repositório `mural-<usuario>` (commit + push).

---

# ETAPA 6 — Entrega e questionário

## Comando
Exporte o material (PDF ou imagem), envie por e-mail pro professor e peça o visto — igual ao padrão já usado em Modelagem de Dados e Requisitos. Depois do visto, responda o questionário sobre o que você modelou aqui (mesmo padrão trabalho→questionário já existente na trilha "Modelagem de Dados e Requisitos", com trava anti-saída de tela).

---

# CHECKLIST DE ENTREGA
- [ ] 5 requisitos funcionais + 3 não funcionais listados.
- [ ] Entidades Usuário/Post/Curtida com atributos definidos.
- [ ] Cardinalidade definida entre as 3 entidades.
- [ ] PK/FK marcadas.
- [ ] DER desenhado, exportado e commitado em `docs/der.png`.
- [ ] Questionário respondido (≥80%).

---

# REFLEXÃO FINAL
1. Por que modelar os dados antes de criar as tabelas evita retrabalho?
2. O que aconteceria se Post não tivesse uma FK pra Usuário?
3. Por que Curtida precisa de uma regra que impeça o mesmo usuário de curtir o mesmo post duas vezes?

---

# RELAÇÃO COM O PLANO DE ENSINO
A Unidade Curricular de Modelagem de Sistemas 1 tem como capacidade elaborar modelo de dados e definir requisitos funcionais/não funcionais de um sistema. Esta atividade aplica essa capacidade especificamente ao projeto Mural, cujo resultado (DER + requisitos) alimenta diretamente a criação das tabelas reais na matéria de Banco de Dados.

---

# CAPACIDADE PRINCIPAL A SER TRABALHADA
> **Elaborar modelo de dados e definir requisitos funcionais e não funcionais de um sistema.**
(TODO professor: mesma capacidade provisória já usada na trilha "Modelagem de Dados e Requisitos" — confirmar o texto real da MSEP antes de liberar pra turma.)

## Capacidades mobilizadas
- Documentação técnica (DER exportado).
- Trabalho em equipe/individual de levantamento de requisitos.

---

# OBSERVAÇÃO PARA O DOCENTE
Reaproveita a MESMA capacidade da trilha existente "Modelagem de Dados e Requisitos" (genérica/teórica) — esta é a versão aplicada ao projeto Mural, com produto indo para o repositório real que as próximas matérias vão usar. Considerar se deve substituir ou complementar a trilha genérica existente, e atribuir o bimestre certo na Gestão.
