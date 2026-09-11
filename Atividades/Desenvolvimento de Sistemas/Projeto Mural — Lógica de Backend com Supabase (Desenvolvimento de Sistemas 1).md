# Projeto Mural — Lógica de Backend com Supabase

## 1. Apresentação
5ª etapa do projeto Mural. Com as tabelas já criadas (Banco de Dados), o aluno escreve, no mesmo repositório `mural-<usuario>` (Codespace), as funções JavaScript que usam a biblioteca `supabase-js` pra implementar as 5 funcionalidades do MVP.

---

## 2. Situação-problema
O Mural tem banco pronto, mas nenhuma linha de código ainda conecta a aplicação a ele. Você vai escrever as funções de backend (cadastro, login, criar post, carregar feed, curtir) — a interface visual só vem na próxima matéria.

---

## 3. Tecnologias utilizadas
- JavaScript (funções assíncronas);
- Biblioteca `supabase-js`;
- GitHub Codespaces.

---

## 4. Objetivos da atividade
- Importar e usar uma biblioteca/SDK de terceiros.
- Escrever funções assíncronas (`async`/`await`).
- Fazer INSERT, SELECT com filtro, SELECT com join e ordenação.
- Tratar erros retornados pela API.
- Evitar duplicidade em uma operação (curtir 1x).

---

# ETAPA 1 — Biblioteca vs. requisição na mão

## Conceito
Uma biblioteca/SDK (como `supabase-js`) encapsula chamadas HTTP repetitivas em funções prontas.

## Comando
Adicione `supabase-js` ao projeto (CDN ou import) e crie o cliente com a URL e a Publishable Key do projeto `mural`.

---

# ETAPA 2 — `cadastrarUsuario`

## Conceito
Função assíncrona: uma operação que espera uma resposta (do banco) sem travar o resto do programa.

## Comando
Escreva `async function cadastrarUsuario(nome, turma, usuario, senha)` que faz `insert` em `usuarios`.

---

# ETAPA 3 — `fazerLogin`

## Conceito
Consulta condicional (`.eq()`) filtra linhas por um valor específico.

## Comando
Escreva `async function fazerLogin(usuario, senha)` que faz `select` filtrando por usuário e senha, e retorna se autenticou.

---

# ETAPA 4 — `criarPost`

## Conceito
Um insert com relação grava a FK (quem é o autor) junto com o dado.

## Comando
Escreva `async function criarPost(autorId, texto)`.

---

# ETAPA 5 — `carregarFeed`

## Conceito
Select com join junta dados de duas tabelas relacionadas numa única consulta; ordenação define a sequência de exibição.

## Comando
Escreva `async function carregarFeed()` que retorna os posts com o nome do autor, mais recentes primeiro.

---

# ETAPA 6 — `curtir`

## Conceito
Uma operação idempotente não deve duplicar efeito se repetida — aqui, não deixar curtir o mesmo post duas vezes.

## Comando
Escreva `async function curtir(postId, usuarioId)` tratando a duplicidade (o `unique constraint` do banco ajuda, mas trate o erro no JavaScript também).

---

# ETAPA 7 — Tratamento de erro

## Conceito
Toda chamada ao Supabase retorna `{ data, error }` — ignorar `error` esconde falhas do usuário.

## Comando
Adicione `try/catch` e verificação de `error` em todas as funções acima.

---

# ETAPA 8 — Teste manual e commit

## Comando
Teste cada função pelo console do navegador, capture uma evidência (print) de cada uma funcionando, e commite o arquivo (`app.js` ou `mural.js`) no repositório. Chame o professor pra dar o visto.

---

# CHECKLIST DE ENTREGA
- [ ] `supabase-js` importado e cliente criado.
- [ ] `cadastrarUsuario`, `fazerLogin`, `criarPost`, `carregarFeed`, `curtir` implementadas.
- [ ] Todas tratam erro (`try/catch` + `error` do Supabase).
- [ ] Evidência de teste de cada função.
- [ ] Arquivo commitado no repositório.

---

# REFLEXÃO FINAL
1. Por que usar uma biblioteca em vez de escrever a requisição HTTP na mão?
2. O que `await` resolve que uma chamada síncrona não resolveria aqui?
3. Por que ignorar `error` é perigoso mesmo quando o código "parece" funcionar?

---

# RELAÇÃO COM O PLANO DE ENSINO
A capacidade de Desenvolvimento de Sistemas 1 envolvida é aplicar linguagem de programação por meio de APIs/bibliotecas/frameworks na construção de rotinas de software — a mesma da trilha "APIs, Bibliotecas e Frameworks", agora aplicada a rotinas reais do Mural em vez de cenários de central de chamados.

---

# CAPACIDADE PRINCIPAL A SER TRABALHADA
> **Aplicar linguagem de programação por meio de apis, bibliotecas, frameworks na construção de rotinas de software.**

---

# OBSERVAÇÃO PARA O DOCENTE
Esta atividade não tem correção automática pelo portal (o código roda no Codespace do aluno, contra um banco real) — segue o padrão de visto do professor, igual às demais peças do projeto Mural.
