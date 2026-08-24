# Atividade Prática — Sistema Web com Banco de Dados

## 1. Apresentação

Nesta atividade, você irá desenvolver um pequeno sistema web para **cadastro de clientes**.

O projeto será desenvolvido passo a passo.

Você começará criando uma página utilizando **HTML, CSS e JavaScript**.

Depois, irá criar um banco de dados utilizando o **Supabase**.

Por fim, irá conectar o seu sistema ao banco de dados para que os dados digitados no formulário sejam armazenados e consultados.

---

# 2. Situação-problema

Uma pequena empresa precisa de um sistema para cadastrar seus clientes.

Atualmente, os funcionários anotam os dados manualmente, dificultando a organização das informações.

Você foi escolhido para desenvolver uma primeira versão do sistema.

O sistema deverá permitir:

- cadastrar clientes;
- armazenar os dados no banco;
- consultar os clientes cadastrados;
- apresentar os clientes na página.

Cada cliente terá:

- Nome;
- E-mail;
- Telefone.

---

# 3. Tecnologias utilizadas

Durante a atividade serão utilizadas:

- HTML;
- CSS;
- JavaScript;
- GitHub;
- GitHub Codespaces;
- Supabase;
- PostgreSQL.

Para facilitar o aprendizado, não será utilizado nenhum framework como React ou Vue.

---

# 4. Objetivos da atividade

Ao finalizar a atividade, você deverá conseguir:

- criar um projeto no GitHub;
- utilizar o GitHub Codespaces;
- criar uma página HTML;
- criar um formulário;
- utilizar JavaScript para capturar dados;
- criar um projeto no Supabase;
- criar uma tabela;
- compreender campos e tipos de dados;
- conectar JavaScript ao Supabase;
- inserir dados no banco;
- consultar dados;
- apresentar os dados na página;
- compreender o funcionamento da Data API;
- compreender o conceito de RLS;
- criar uma política de acesso;
- compreender a importância da segurança do banco de dados.

---

# 5. Como o projeto irá funcionar

Ao final, o funcionamento deverá ser semelhante a:

```text
USUÁRIO
   ↓
FORMULÁRIO HTML
   ↓
JAVASCRIPT
   ↓
SUPABASE
   ↓
DATA API
   ↓
POSTGRESQL
   ↓
TABELA clientes
```

---

# ETAPA 1 — Criar o repositório

## Atividade

Crie um novo repositório no GitHub.

Utilize o seguinte padrão de nome:

```text
sistema-cadastro-seunome
```

Exemplo:

```text
sistema-cadastro-joao
```

### Faça

1. Acesse sua conta do GitHub.
2. Crie um novo repositório.
3. Informe o nome do projeto.
4. Marque a opção para criar um `README.md`.
5. Crie o repositório.

### Entrega

O projeto deverá possuir um repositório próprio no GitHub.

---

# ETAPA 2 — Criar o Codespace

## Atividade

Agora você irá criar um ambiente de desenvolvimento utilizando o GitHub Codespaces.

### Faça

1. Abra o seu repositório.
2. Clique em **Code**.
3. Acesse a opção **Codespaces**.
4. Crie um novo Codespace.

Aguarde o ambiente carregar.

Você deverá visualizar um editor de código.

---

# ETAPA 3 — Criar os arquivos

Dentro do Codespace, crie os seguintes arquivos:

```text
index.html
style.css
script.js
```

A estrutura deverá ficar:

```text
sistema-cadastro/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

### Responda

Qual será a função de cada arquivo?

```text
index.html → ______________________________________

style.css → _______________________________________

script.js → _______________________________________
```

---

# ETAPA 4 — Criar o HTML

## Atividade

Abra o arquivo:

```text
index.html
```

Crie uma página HTML básica.

A página deverá possuir:

- título;
- formulário;
- campo para nome;
- campo para e-mail;
- campo para telefone;
- botão de cadastro.

O título deverá ser:

```text
Cadastro de Clientes
```

A estrutura do formulário deverá começar assim:

```html
<form id="formCadastro">

</form>
```

Dentro do formulário, crie os campos necessários.

Utilize os elementos HTML que você já conhece.

---

# ETAPA 5 — Criar o botão

Dentro do formulário, crie um botão:

```text
Cadastrar
```

O botão deverá ser do tipo:

```html
<button type="submit">
```

### Teste

Abra a página no navegador.

Verifique se:

- [ ] O título aparece.
- [ ] O campo Nome aparece.
- [ ] O campo E-mail aparece.
- [ ] O campo Telefone aparece.
- [ ] O botão aparece.

---

# ETAPA 6 — Criar o JavaScript

Abra:

```text
script.js
```

Agora vamos fazer o JavaScript identificar o formulário.

Utilize:

```javascript
document.getElementById()
```

para localizar:

```text
formCadastro
```

Depois, utilize:

```javascript
addEventListener()
```

para identificar quando o formulário for enviado.

O objetivo desta etapa é fazer aparecer no console:

```text
Formulário enviado!
```

---

# ETAPA 7 — Capturar os dados

Agora você deverá capturar os valores digitados pelo usuário.

Crie variáveis para:

```text
nome
email
telefone
```

Para obter o conteúdo de um campo, utilize:

```javascript
.value
```

Por exemplo:

```javascript
const nome = document.getElementById("nome").value;
```

Faça o mesmo para os outros campos.

---

# ETAPA 8 — Testar o JavaScript

Digite dados fictícios:

```text
Nome: João da Silva
E-mail: joao@email.com
Telefone: 64999999999
```

Ao enviar o formulário, mostre os dados no console.

O resultado deverá permitir identificar:

```text
Nome
E-mail
Telefone
```

### Checklist

- [ ] Consigo capturar o nome.
- [ ] Consigo capturar o e-mail.
- [ ] Consigo capturar o telefone.
- [ ] Os dados aparecem no console.

---

# ETAPA 9 — Criar o projeto no Supabase

## Atividade

Agora vamos criar o banco de dados.

Acesse o Supabase e crie uma conta ou entre na sua conta existente.

Crie um novo projeto.

Utilize um nome relacionado ao projeto, por exemplo:

```text
sistema-cadastro
```

Aguarde a criação do projeto.

---

# ETAPA 10 — Conhecendo o banco

Dentro do Supabase, localize a área de banco de dados.

Você deverá encontrar recursos relacionados a:

- tabelas;
- SQL Editor;
- Data API;
- configurações do projeto;
- API Keys.

### Responda

Com suas palavras:

> O que é um banco de dados?

```text
____________________________________________________

____________________________________________________
```

---

# ETAPA 11 — Criar a tabela

## Atividade

Crie uma tabela chamada:

```text
clientes
```

A tabela deverá possuir os seguintes campos:

| Campo | Tipo |
|---|---|
| id | bigint |
| nome | text |
| email | text |
| telefone | text |

O campo `id` deverá ser a chave primária e possuir geração automática de valores.

### Resultado esperado

```text
clientes
│
├── id
├── nome
├── email
└── telefone
```

---

# ETAPA 12 — Inserir um registro manualmente

Antes de conectar o sistema, vamos verificar se a tabela está funcionando.

Insira manualmente um cliente pelo próprio Supabase.

Utilize dados fictícios.

Exemplo:

```text
Nome: Maria Souza
E-mail: maria@email.com
Telefone: 64988888888
```

Depois visualize a tabela.

### Checklist

- [ ] A tabela foi criada.
- [ ] O registro foi inserido.
- [ ] O `id` foi gerado.
- [ ] Os dados aparecem corretamente.

---

# ETAPA 13 — Conhecer a Data API

O Supabase permite que aplicações utilizem a biblioteca JavaScript para consultar e alterar dados do PostgreSQL por meio da Data API.

Nesta atividade, o JavaScript será utilizado para conversar com o banco.

A biblioteca oficial `supabase-js` pode ser utilizada diretamente por CDN em uma página HTML.

---

# ETAPA 14 — Adicionar o Supabase ao HTML

## Atividade

Abra o arquivo:

```text
index.html
```

Antes do seu arquivo `script.js`, adicione a biblioteca do Supabase:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="script.js"></script>
```

### Atenção

A ordem é importante.

Primeiro carregamos:

```text
supabase-js
```

Depois carregamos:

```text
script.js
```

Assim, o JavaScript poderá utilizar o Supabase.

---

# ETAPA 15 — Encontrar a URL e a Publishable Key

## Atividade

No painel do seu projeto Supabase, procure as informações de conexão/API.

Você precisará de:

```text
Project URL
Publishable Key
```

A documentação atual do Supabase recomenda a **Publishable Key**, que normalmente começa com:

```text
sb_publishable_
```

As chaves antigas `anon` ainda podem aparecer em projetos existentes, mas são consideradas o modelo legado.

---

# ATENÇÃO — SEGURANÇA

A Publishable Key pode aparecer no código do frontend.

Isso é esperado.

Porém, ela **não deve ser confundida com uma chave secreta**.

Nunca coloque no JavaScript do navegador:

```text
sb_secret_...
```

Também nunca coloque:

```text
service_role
```

A documentação do Supabase determina que chaves secretas e `service_role` não devem ser expostas no navegador, pois possuem privilégios elevados e podem ignorar o RLS.

---

# ETAPA 16 — Criar o cliente Supabase

No arquivo:

```text
script.js
```

adicione:

```javascript
const supabaseUrl = "SUA_URL";

const supabaseKey = "SUA_PUBLISHABLE_KEY";

const supabase = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);
```

Substitua:

```text
SUA_URL
```

pela URL do seu projeto.

Substitua:

```text
SUA_PUBLISHABLE_KEY
```

pela sua Publishable Key.

---

# ETAPA 17 — Testar a conexão

Crie um teste simples:

```javascript
console.log(supabase);
```

Abra o console do navegador.

Se o objeto do Supabase aparecer, a biblioteca foi carregada corretamente.

### Checklist

- [ ] A biblioteca foi carregada.
- [ ] A URL foi configurada.
- [ ] A Publishable Key foi configurada.
- [ ] O objeto `supabase` aparece no console.

---

# ETAPA 18 — Fazer o primeiro SELECT

## Atividade

Agora vamos consultar os clientes existentes.

Crie uma função:

```javascript
async function carregarClientes() {

}
```

Dentro dela, faça uma consulta utilizando:

```javascript
const { data, error } = await supabase
    .from("clientes")
    .select("*");
```

Depois mostre o resultado:

```javascript
console.log(data);
```

E também verifique possíveis erros:

```javascript
console.log(error);
```

---

# ETAPA 19 — Executar a consulta

Chame a função:

```javascript
carregarClientes();
```

Atualize a página.

Abra o console.

Você deverá visualizar os registros existentes na tabela.

### Se aparecer um erro

Não altere várias coisas ao mesmo tempo.

Leia a mensagem apresentada no console.

Verifique:

1. nome da tabela;
2. URL;
3. Publishable Key;
4. acesso da Data API;
5. RLS;
6. policies.

---

# ETAPA 20 — Preparar o cadastro

Agora vamos fazer o contrário.

Antes nós:

```text
Banco → JavaScript
```

Agora faremos:

```text
JavaScript → Banco
```

O formulário deverá enviar:

```text
nome
email
telefone
```

para a tabela:

```text
clientes
```

---

# ETAPA 21 — Criar a função de cadastro

Crie uma função:

```javascript
async function cadastrarCliente() {

}
```

Dentro dela, obtenha os valores dos campos:

```text
nome
email
telefone
```

Depois faça um `insert`.

A estrutura será:

```javascript
const { data, error } = await supabase
    .from("clientes")
    .insert([
        {
            nome: nome,
            email: email,
            telefone: telefone
        }
    ]);
```

---

# ETAPA 22 — Verificar o resultado

Depois do `insert`, verifique se ocorreu erro.

Utilize:

```javascript
if (error) {

    console.log(error);

} else {

    console.log("Cliente cadastrado com sucesso!");

}
```

### Objetivo

Quando o cadastro funcionar, o console deverá apresentar:

```text
Cliente cadastrado com sucesso!
```

---

# ETAPA 23 — Ligar o formulário ao cadastro

Agora o botão do formulário deverá chamar a função de cadastro.

No evento de envio do formulário:

1. impeça o comportamento padrão da página;
2. capture os valores;
3. chame `cadastrarCliente()`.

Utilize:

```javascript
event.preventDefault();
```

para impedir que a página seja recarregada.

---

# ETAPA 24 — Fazer o primeiro cadastro pelo sistema

Agora não utilize mais o Supabase para inserir manualmente.

Utilize o seu formulário.

Cadastre:

```text
Nome: Carlos Oliveira
E-mail: carlos@email.com
Telefone: 64977777777
```

Depois abra a tabela:

```text
clientes
```

no Supabase.

### Resultado esperado

O novo cliente deverá aparecer no banco.

---

# ETAPA 25 — Cadastrar cinco clientes

Cadastre pelo menos cinco clientes fictícios.

Exemplo:

```text
Ana
Carlos
Mariana
Pedro
Lucas
```

Utilize e-mails e telefones fictícios.

### Checklist

- [ ] Primeiro cliente cadastrado.
- [ ] Segundo cliente cadastrado.
- [ ] Terceiro cliente cadastrado.
- [ ] Quarto cliente cadastrado.
- [ ] Quinto cliente cadastrado.
- [ ] Os cinco aparecem no banco.

---

# ETAPA 26 — Mostrar os clientes na página

Agora vamos retirar a dependência do console.

No HTML, crie:

```html
<h2>Clientes cadastrados</h2>

<div id="listaClientes"></div>
```

No JavaScript, utilize os dados retornados pelo:

```text
SELECT
```

para preencher:

```text
listaClientes
```

---

# ETAPA 27 — Criar a função de listagem

Crie:

```javascript
async function carregarClientes() {

}
```

A função deverá:

1. consultar a tabela;
2. receber os dados;
3. percorrer os registros;
4. criar o conteúdo HTML;
5. mostrar os clientes na página.

Você poderá utilizar:

```javascript
forEach()
```

para percorrer os resultados.

---

# ETAPA 28 — Testar o sistema completo

Agora o sistema deverá funcionar assim:

```text
1. Usuário abre a página
        ↓
2. Preenche o formulário
        ↓
3. Clica em Cadastrar
        ↓
4. JavaScript captura os dados
        ↓
5. JavaScript envia os dados
        ↓
6. Supabase recebe
        ↓
7. PostgreSQL armazena
        ↓
8. Sistema consulta os dados
        ↓
9. Clientes aparecem na página
```

---

# ETAPA 29 — Validar os campos

Agora vamos melhorar o sistema.

Antes de enviar os dados ao banco, verifique se os campos estão preenchidos.

Utilize `if`.

Exemplo de lógica:

```text
SE nome estiver vazio
    mostrar mensagem

SENÃO SE e-mail estiver vazio
    mostrar mensagem

SENÃO SE telefone estiver vazio
    mostrar mensagem

SENÃO
    cadastrar cliente
```

### Testes

Teste:

- [ ] Nome vazio.
- [ ] E-mail vazio.
- [ ] Telefone vazio.
- [ ] Todos os campos preenchidos.

---

# ETAPA 30 — Criar mensagens para o usuário

Não utilize apenas o `console.log()`.

Crie mensagens visíveis na página.

Exemplos:

```text
Cliente cadastrado com sucesso!
```

```text
Preencha o nome.
```

```text
Preencha o e-mail.
```

```text
Preencha o telefone.
```

---

# ETAPA 31 — Entender o RLS

Agora vamos estudar segurança.

O Supabase utiliza o **Row Level Security (RLS)** para controlar quais registros podem ser acessados pelas aplicações.

A documentação atual recomenda habilitar RLS nas tabelas expostas e criar policies que determinem quais operações cada usuário pode realizar.

Pense no RLS como uma regra de segurança dentro do próprio banco.

---

# ETAPA 32 — Verificar o RLS da tabela

No Supabase, abra a tabela:

```text
clientes
```

Verifique a configuração de segurança.

### Pergunta

O que significa RLS?

```text
____________________________________________________

____________________________________________________

____________________________________________________
```

---

# ETAPA 33 — Criar uma Policy para leitura

Nesta atividade inicial, vamos permitir que a aplicação consiga consultar os clientes.

Crie uma policy de `SELECT` para a tabela `clientes`.

A lógica da policy deverá permitir a leitura dos registros para o papel que a aplicação está utilizando.

Para uma atividade didática sem login, a policy pode utilizar a role:

```text
anon
```

e uma condição simples:

```sql
using (true)
```

A ideia é:

```text
Aplicação
   ↓
SELECT
   ↓
Policy permite?
   ↓
SIM → dados retornados
```

A documentação do Supabase utiliza policies com `TO anon` e `USING (true)` como exemplo de leitura pública controlada por RLS.

---

# ETAPA 34 — Criar uma Policy para inserção

Agora o sistema também precisa cadastrar clientes.

Crie uma policy para:

```text
INSERT
```

A policy deverá permitir que a aplicação insira novos registros.

Para esta atividade didática, a regra poderá permitir a inserção para:

```text
anon
```

com:

```sql
with check (true)
```

### Atenção

Isso é uma configuração **didática** para um sistema de exercício sem autenticação.

Em um sistema real, permitir cadastro anônimo precisa ser analisado de acordo com o contexto da aplicação e acompanhado de outras medidas de segurança.

---

# ETAPA 35 — Testar o RLS

Agora teste novamente:

### Teste 1

Consultar clientes.

Resultado esperado:

```text
Clientes aparecem.
```

### Teste 2

Cadastrar cliente.

Resultado esperado:

```text
Cliente cadastrado.
```

### Teste 3

Remover temporariamente uma policy de leitura.

Teste novamente.

O sistema deverá apresentar um erro de acesso.

### Conclusão

Isso demonstra que:

```text
Código correto
+
Banco correto
+
Permissão correta
=
Operação funcionando
```

---

# ETAPA 36 — Entender permissões

O Supabase trabalha com roles, incluindo:

```text
anon
authenticated
```

A role `anon` representa uma requisição sem usuário autenticado.

A role `authenticated` representa uma requisição de um usuário autenticado.

A Publishable Key, quando utilizada sem login, opera com a role `anon`; quando existe autenticação, a requisição pode operar como `authenticated`.

---

# ETAPA 37 — Responder

### 1. O que é RLS?

```text
____________________________________________________

____________________________________________________
```

### 2. Para que serve uma Policy?

```text
____________________________________________________

____________________________________________________
```

### 3. Qual é a diferença entre `anon` e `authenticated`?

```text
____________________________________________________

____________________________________________________
```

### 4. Por que uma chave `sb_secret_...` não deve estar no JavaScript?

```text
____________________________________________________

____________________________________________________
```

---

# ETAPA 38 — Revisar a segurança

Verifique seu projeto.

- [ ] Estou utilizando uma Publishable Key.
- [ ] Não estou utilizando `sb_secret_...`.
- [ ] Não estou utilizando `service_role`.
- [ ] O RLS está habilitado.
- [ ] Existem policies para as operações utilizadas.
- [ ] Entendi que a Publishable Key não é uma senha.
- [ ] Entendi que o RLS protege os dados.

A documentação atual do Supabase reforça que a Publishable Key é apropriada para código público, mas que ela deve ser acompanhada por RLS e políticas de menor privilégio.

---

# ETAPA 39 — Organizar o projeto

Verifique seus arquivos:

```text
sistema-cadastro/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

O código deverá estar:

- organizado;
- indentado;
- comentado quando necessário;
- sem códigos desnecessários.

---

# ETAPA 40 — Criar o README

No arquivo:

```text
README.md
```

documente o projeto.

Inclua:

## Nome

```text
Sistema de Cadastro de Clientes
```

## Descrição

Explique o que o sistema faz.

## Tecnologias

Liste:

```text
HTML
CSS
JavaScript
Supabase
PostgreSQL
```

## Banco de dados

Informe:

```text
Tabela: clientes
```

## Campos

```text
id
nome
email
telefone
```

## Funcionamento

Explique:

```text
Formulário
↓
JavaScript
↓
Supabase
↓
PostgreSQL
```

## Segurança

Explique:

- o que é RLS;
- o que é uma Policy;
- por que a Publishable Key pode estar no frontend;
- por que a Secret Key não pode estar no frontend.

---

# ETAPA 41 — Desafio extra

Se você terminou todas as etapas, escolha **uma** das opções.

## Opção A — Pesquisa

Crie um campo para pesquisar clientes pelo nome.

---

## Opção B — Exclusão

Crie um botão para excluir um cliente.

Você deverá estudar a operação:

```text
DELETE
```

e criar a policy necessária.

---

## Opção C — Atualização

Crie uma função para alterar os dados de um cliente.

Você deverá estudar:

```text
UPDATE
```

e criar a policy necessária.

---

# ETAPA 42 — Teste final

Seu sistema deverá permitir:

### Cadastro

```text
Nome
E-mail
Telefone
        ↓
Cadastrar
        ↓
Banco de Dados
```

### Consulta

```text
Banco de Dados
        ↓
JavaScript
        ↓
Página
```

### Segurança

```text
Aplicação
        ↓
RLS
        ↓
Policy
        ↓
Banco
```

---

# CHECKLIST DE ENTREGA

## GitHub

- [ ] Repositório criado.
- [ ] Codespace funcionando.
- [ ] Código enviado para o GitHub.

## HTML

- [ ] Página criada.
- [ ] Formulário criado.
- [ ] Nome.
- [ ] E-mail.
- [ ] Telefone.
- [ ] Botão.

## JavaScript

- [ ] Formulário identificado.
- [ ] Evento de envio criado.
- [ ] Dados capturados.
- [ ] Validação criada.
- [ ] Supabase conectado.
- [ ] INSERT funcionando.
- [ ] SELECT funcionando.
- [ ] Dados apresentados na página.

## Supabase

- [ ] Projeto criado.
- [ ] Tabela `clientes` criada.
- [ ] Campo `id` criado.
- [ ] Campo `nome` criado.
- [ ] Campo `email` criado.
- [ ] Campo `telefone` criado.
- [ ] Data API configurada para a tabela.
- [ ] RLS configurado.
- [ ] Policy de leitura criada.
- [ ] Policy de inserção criada.

## Segurança

- [ ] Utilizei Publishable Key.
- [ ] Não utilizei Secret Key no navegador.
- [ ] Não utilizei `service_role`.
- [ ] Entendi o funcionamento do RLS.
- [ ] Entendi o funcionamento das Policies.

## Documentação

- [ ] README criado.
- [ ] Projeto explicado.
- [ ] Banco documentado.
- [ ] Tecnologias documentadas.
- [ ] Segurança documentada.

---

# REFLEXÃO FINAL

Responda com suas próprias palavras.

## 1. Qual é a função do HTML?

```text
____________________________________________________

____________________________________________________
```

## 2. Qual é a função do JavaScript?

```text
____________________________________________________

____________________________________________________
```

## 3. Qual é a função do Supabase?

```text
____________________________________________________

____________________________________________________
```

## 4. O que é uma tabela?

```text
____________________________________________________

____________________________________________________
```

## 5. O que acontece quando o usuário clica em "Cadastrar"?

```text
____________________________________________________

____________________________________________________

____________________________________________________
```

## 6. O que é RLS?

```text
____________________________________________________

____________________________________________________
```

## 7. O que é uma Policy?

```text
____________________________________________________

____________________________________________________
```

## 8. Por que não podemos utilizar uma Secret Key no navegador?

```text
____________________________________________________

____________________________________________________
```

---

# RELAÇÃO COM O PLANO DE ENSINO

Esta atividade foi construída como uma **atividade prática integradora**, utilizando conhecimentos de programação e banco de dados.

O plano de ensino informa que a Unidade Curricular de Banco de Dados possui como objetivo desenvolver capacidades para modelagem e manipulação de dados por meio de um SGBD, considerando qualidade, robustez, integridade e segurança.

O perfil profissional também apresenta, entre as subfunções, **realizar interação com banco de dados** e **codificar programas**.

---

# AULAS DE AGOSTO DE 2026

## Aula 24 — 03/08/2026

### Conteúdo do plano

- Fundamentos de PL/SQL;
- Extração de dados estruturados;
- `SELECT`;
- `INTO`.

O aluno pratica a extração de um registro e seu armazenamento em variável.

### Relação com esta atividade

O aluno trabalha o conceito de:

```text
Banco de Dados
↓
Consulta
↓
Dados
↓
Aplicação
```

---

# Aula 25 — 10/08/2026

### Conteúdo do plano

- PL/SQL;
- Extração de dados;
- `IF/ELSE`.

O aluno integra a extração de dados com uma lógica de decisão.

### Relação com esta atividade

O aluno utiliza `if` para:

- validar campos;
- tratar erros;
- decidir se o cadastro pode ser realizado.

---

# Aula 26 — 17/08/2026

### Conteúdo do plano

- PL/SQL;
- Extração de dados;
- `LOOP`;
- processamento de registros.

O plano propõe o processamento de registros e a geração de uma saída organizada.

### Relação com esta atividade

O aluno utiliza estruturas de repetição para percorrer os clientes retornados pelo banco.

---

# Aula 27 — 24/08/2026

### Conteúdo do plano

- Segurança de Dados;
- Gerenciamento do Banco de Dados;
- Controle de acesso;
- `GRANT`;
- `REVOKE`.

A capacidade indicada no plano é:

> **Aplicar procedimentos de segurança e backup no SGBD.**



### Relação com esta atividade

Esta é a etapa principal de segurança.

O aluno aprende:

- RLS;
- Policies;
- permissões;
- roles;
- controle de acesso;
- princípio do menor privilégio.

---

# Aula 28 — 31/08/2026

### Conteúdo do plano

- Segurança de Dados;
- Gerenciamento do Banco de Dados;
- perfis de segurança;
- gerenciamento de privilégios.

O aluno deverá configurar perfis de usuários seguindo uma metodologia de segurança.

### Relação com esta atividade

O aluno relaciona os conceitos de:

```text
Usuário
↓
Role
↓
Permissão
↓
Policy
↓
Dados
```

---

# CAPACIDADE PRINCIPAL A SER TRABALHADA

## Capacidade prevista no plano

> **Aplicar procedimentos de segurança e backup no SGBD.**

Essa é a capacidade diretamente associada às aulas 27 e 28 de agosto.

## Capacidades mobilizadas durante o projeto

Além da capacidade principal, o projeto mobiliza:

- realizar interação com banco de dados;
- codificar programas;
- manipular dados;
- extrair dados estruturados;
- aplicar estruturas condicionais;
- processar registros;
- documentar código;
- aplicar princípios de segurança;
- controlar acesso aos dados.

---

# OBSERVAÇÃO PARA O DOCENTE

A utilização de **Supabase + HTML + JavaScript** não aparece explicitamente como ferramenta nas aulas de agosto do plano fornecido.

Portanto, esta atividade deve ser registrada como uma **atividade prática integradora/ampliação da aprendizagem**, e não como reprodução literal da metodologia descrita nas aulas do documento.

O conteúdo do plano sustenta a integração porque o objetivo da Unidade Curricular envolve modelagem e manipulação de dados em SGBD e o perfil profissional inclui interação com banco de dados e codificação de programas.

A atividade também cria uma ponte concreta entre:

```text
PROGRAMAÇÃO
HTML + JavaScript
       ↓
INTERAÇÃO COM BANCO
Supabase
       ↓
BANCO DE DADOS
PostgreSQL
       ↓
SEGURANÇA
RLS + Policies
```

Isso permite que o aluno não apenas execute comandos de banco isoladamente, mas compreenda **onde o banco de dados entra dentro de um sistema real**.