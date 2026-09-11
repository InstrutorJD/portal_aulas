# Projeto Mural — Construa o Aplicativo

## 1. Apresentação
6ª e última etapa do projeto Mural. O aluno constrói a interface (HTML/CSS/JS) que chama as funções REAIS escritas na matéria anterior, entregando o app funcionando de ponta a ponta: cadastro → login → perfil → feed → postar → curtir.

---

## 2. Situação-problema
O Mural já tem banco (Banco de Dados) e lógica de backend (Desenvolvimento de Sistemas 1). Falta a interface que os alunos e professores vão realmente usar. Você fecha o projeto construindo essa interface no mesmo repositório `mural-<usuario>`.

---

## 3. Tecnologias utilizadas
- HTML, CSS, JavaScript (DOM, eventos, formulários);
- as funções de `app.js`/`mural.js` já escritas.

---

## 4. Objetivos da atividade
- Construir formulários com validação.
- Renderizar uma lista dinâmica (feed) a partir de dados reais.
- Ligar eventos de clique/submit às funções de backend já existentes.
- Implementar um toggle de estado (curtir/descurtir) com contador.
- Entregar um aplicativo completo, integrado, funcionando com dados reais.

---

# ETAPA 1 — Tela de Cadastro

## Conceito
Validação de formulário impede que dados incompletos cheguem ao banco.

## Comando
Construa o formulário (nome, turma, usuário, senha) e a função `validarCadastro()`; ao validar, chame `cadastrarUsuario()`.

---

# ETAPA 2 — Tela de Login

## Conceito
O front-end chama a função de backend e reage ao resultado (sucesso/erro).

## Comando
Construa a tela e `validarLogin()`, chamando `fazerLogin()` e redirecionando pro feed quando autenticar.

---

# ETAPA 3 — Tela de Perfil

## Comando
Exiba nome, turma e foto do usuário logado.

---

# ETAPA 4 — Feed

## Conceito
Renderizar uma lista dinâmica significa transformar um array de dados em elementos HTML na tela.

## Comando
Implemente `renderPost()` pra cada item retornado por `carregarFeed()`, e `formatarData()` pra exibir a data de forma amigável.

---

# ETAPA 5 — Criar Post

## Comando
Construa o formulário de texto + botão publicar, chamando `criarPost()` e atualizando o feed sem recarregar a página.

---

# ETAPA 6 — Curtir

## Conceito
Um toggle de estado alterna entre dois visuais (curtido/não curtido) e mantém contador.

## Comando
Implemente o botão de curtir, chamando `curtir()` e atualizando o contador de curtidas na tela.

---

# ETAPA 7 — Tema visual

## Comando
Escolha uma paleta de cores/tema pro Mural (como no ClipZone).

---

# ETAPA 8 — Visto do professor

## Comando
Chame o professor pra conferir o app funcionando de ponta a ponta: cadastro → login → postar → curtir, com dados reais no Supabase.

---

# CHECKLIST DE ENTREGA
- [ ] Cadastro e login funcionando com validação.
- [ ] Perfil exibindo dados reais.
- [ ] Feed renderizando posts reais, mais recentes primeiro.
- [ ] Criar post funcionando e atualizando o feed.
- [ ] Curtir funcionando com contador.
- [ ] Tema visual escolhido.

---

# REFLEXÃO FINAL
1. O que mudou entre a versão de backend (console) e a versão com interface de verdade?
2. Qual foi a parte mais difícil de integrar — e por quê?

---

# RELAÇÃO COM O PLANO DE ENSINO
A capacidade de Programação de Aplicativos envolvida é aplicar, de forma integrada, lógica de programação, manipulação de objetos e validação de formulário na construção de um aplicativo completo — a mesma do Projeto ClipZone, agora fechando o projeto interdisciplinar Mural com dados reais (não mockados).

---

# CAPACIDADE PRINCIPAL A SER TRABALHADA
> **Aplicar, de forma integrada, lógica de programação, manipulação de objetos e validação de formulário na construção de um aplicativo completo em JavaScript.**

---

# OBSERVAÇÃO PARA O DOCENTE
Esta é a etapa que fecha o projeto Mural — o aluno já deve ter passado pelas 5 matérias anteriores (Kickoff, Modelagem, Banco de Dados, Redes, Lógica de Backend) com o mesmo repositório. Sem correção automática pelo portal (produto real, testado com Supabase de verdade) — visto do professor, mesmo padrão do ClipZone/TikTak.
