---
aula: 7
data: 2026-10-08
titulo: Banco de dados: o seu sistema com memória
turma: IA
descricao: Container, VPS e Nginx; tabelas, chaves, SQL no DB Fiddle, o DER do seu projeto e o Supabase com segurança
fonte: grande
---

# O seu sistema tem memória?
Aula 7: o primeiro banco de dados

---

## Salvar, F5... sumiu
+ O usuário preenche o formulário do **seu** sistema
+ Clica em **Salvar**: aparece na tela
+ Ele aperta **F5**: **sumiu**
+ E no celular de outra pessoa? Nem chegou
+ Hoje: um lugar para guardar **tudo**, para **todos**

---

## Onde o dado deveria ficar?
O usuário salva um cadastro e outra pessoa precisa ver, em outro computador.

- [ ] Numa variável do `script.js`
- [ ] No `localStorage` do navegador
- [ ] Num arquivo `.json` no repositório
- [x] Num **banco de dados**, num servidor na internet

---

## Roteiro de hoje
- **Parte 1**: onde o sistema roda: container, VPS e Nginx (20 min)
- **Parte 2**: o que é um banco de dados (25 min)
- **Parte 3**: os primeiros comandos SQL no DB Fiddle (35 min)
- **Parte 4**: o DER e o banco do **seu** projeto no DB Fiddle (65 min)
- **Parte 5**: o **seu** banco no Supabase, com segurança (95 min)

---

# Parte 1 — Onde o sistema roda?
Container, VPS e reverse proxy

---

## Hoje: GitHub Pages
+ Publica só arquivos **estáticos**: HTML, CSS e JS
+ Grátis, e no ar com um `git push`
+ Não roda **servidor** nem **banco** próprio
+ E um sistema que precisa de um servidor ligado 24h?

---

## Você já usa um container
+ O **Codespace** é um container: um Linux pronto, na nuvem
+ Já vem com Node, Git e o que o projeto pede
+ Apagou e criou de novo: volta **igual**
+ A receita fica em `.devcontainer/devcontainer.json`

---

## Docker
+ O programa que cria e roda **containers**
+ **Imagem**: a receita, com tudo o que o sistema precisa
+ **Container**: a imagem **rodando**
+ Roda igual no seu PC, no do colega e no servidor
+ Fim do "na minha máquina funciona"

---

## Uma imagem em 2 linhas
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
```

O `Dockerfile` parte de uma imagem pronta com o **Nginx** e copia o seu site para dentro dela.

---

## Imagem ou container?
O Codespace aberto agora no seu navegador é...

- [ ] Uma imagem
- [x] Um container rodando
- [ ] Um Dockerfile
- [ ] Um site estático

---

## VPS: servidor virtual privado
+ Um computador **só seu**, alugado na nuvem, ligado 24h
+ Você escolhe o sistema e instala o que quiser
+ Paga **todo mês**, com ou sem acesso
+ **Você** cuida: atualizações, backup e segurança
+ Lá dentro, cada parte do sistema roda num **container**

---

## Reverse proxy: o Nginx na porta
+ Na VPS rodam **vários** containers: site, API, banco
+ O visitante conhece **um** endereço só
+ O **Nginx** recebe todo pedido e **encaminha** ao container certo
+ Ele também cuida do **HTTPS**
+ Como a **recepção** de uma empresa

---

## O Nginx por dentro (só para ver)
```nginx
server {
  server_name sistema.empresa.com.br;
  location / {
    proxy_pass http://localhost:8080;
  }
}
```

Pedido para `sistema.empresa.com.br`? Vai para o container da porta **8080**.

---

## O caminho de um pedido
1. O navegador pede `sistema.empresa.com.br`
2. O pedido chega na **VPS**, pela porta 443 (HTTPS)
3. O **Nginx** recebe e confere o endereço
4. **Encaminha** para o container certo
5. A resposta volta pelo mesmo caminho

---

## GitHub Pages x VPS com Docker
| | GitHub Pages | VPS com Docker e Nginx |
|---|---|---|
| **Custo** | Grátis | Mensalidade |
| **Manutenção** | Nenhuma: o GitHub cuida | **Sua**: atualizações e backup |
| **Controle** | Só site estático | **Tudo**: servidor, banco e portas |
| **Publicar** | `git push` | Gerar a imagem e subir o container |

---

## Qual escolher?
Uma empresa quer o sistema **e o banco** nos próprios servidores, sem depender de serviço de terceiros. O que atende?

- [ ] GitHub Pages
- [x] Uma VPS (ou servidor próprio) com Docker e Nginx
- [ ] Um Codespace aberto 24h
- [ ] O `localStorage` do navegador

---

## E hoje?
+ Na VPS, o **banco** também seria um container para você cuidar
+ Hoje, o banco fica num serviço que **cuida por você**: o **Supabase**
+ Site no GitHub Pages + banco no Supabase: **nenhum** servidor para manter
+ Mas, antes: o que é um **banco de dados**?

---

# Parte 2 — O que é um banco de dados
Tabelas, linhas, colunas e tipos

---

## Banco de dados
+ Um lugar **organizado** para guardar dados
+ Os dados **não somem**: nem com F5, nem desligando o PC
+ **Muita gente** lê e grava ao mesmo tempo
+ **Busca rápida** entre milhões de registros
+ Tem **regras** que barram dado errado

---

## Planilha x banco de dados
| | Planilha | Banco de dados |
|---|---|---|
| Quem usa | **Pessoas**, na tela | **Sistemas**, pelo código |
| Dado errado | Aceita, se ninguém conferir | **Recusa** pelas regras |
| Colunas | Qualquer coisa em qualquer célula | Cada coluna com **tipo** fixo |
| Ligações | Copia e cola entre abas | **Chaves** que ligam tabelas |

> Planilha é ótima para análise. Sistema guarda em banco.

---

## O exemplo de hoje: um app de delivery
| id | nome | telefone | cidade |
|---|---|---|---|
| 1 | Ana Souza | 31 99999-0001 | Itabira |
| 2 | Bruno Lima | 31 99999-0002 | Itabira |
| 3 | Carla Dias | 31 99999-0003 | João Monlevade |

A tabela `clientes`: cada **coluna** é uma informação, cada **linha** é um cliente.

---

## Linha e coluna
Na tabela `clientes`, o que é **uma linha**?

- [ ] Os nomes de todos os clientes
- [x] Um cliente, com todas as informações dele
- [ ] A cidade de todos os clientes
- [ ] O nome da tabela

---

## Cada coluna tem um tipo
| Tipo | Guarda | Exemplo |
|---|---|---|
| `int` | Número inteiro | `3` |
| `numeric` | Número com casas decimais | `42.90` |
| `text` | Texto | `'Ana Souza'` |
| `boolean` | Verdadeiro ou falso | `true` |
| `timestamptz` | Data e hora (com fuso) | `2026-10-08 14:30` |

> O tipo é uma **regra**: na coluna `int`, o banco não aceita `'três'`.

---

## Qual tipo?
O pedido já foi **pago** ou não. Qual o tipo da coluna `pago`?

- [ ] `text`
- [ ] `int`
- [x] `boolean`
- [ ] `timestamptz`

---

## Chave primária (PK)
+ Uma coluna que **identifica** cada linha
+ Nunca **repete** e nunca fica **vazia**
+ Nunca **muda**: é o "RG" da linha dentro do banco
+ Quase sempre: um `id` numérico, gerado pelo banco
+ Na tabela `clientes`: a coluna `id`

---

## E o CPF?
Todo cliente tem CPF, e ele não repete. Por que **não** usar o CPF como chave primária?

- [ ] Porque o banco não aceita números com ponto
- [ ] Porque dois clientes podem ter o mesmo CPF
- [x] Porque é **dado pessoal** e pode ser digitado errado e precisar de correção
- [ ] Porque chave primária precisa ser texto

---

## Quem cuida do banco
+ **SGBD**: o programa que guarda e protege os dados
+ **PostgreSQL**: um SGBD gratuito, usado no mundo todo
+ **SQL**: a língua que usamos para falar com ele
+ **Supabase**: um PostgreSQL pronto, na nuvem

---

## SQL em 4 verbos
| Comando | Faz | No delivery |
|---|---|---|
| `create table` | Cria a tabela | Criar `clientes` |
| `insert` | Insere uma linha | Cadastrar a Ana |
| `select` | Consulta | Listar os clientes de Itabira |
| `update` / `delete` | Altera / apaga | Trocar o telefone da Ana |

---

# Parte 3 — SQL no DB Fiddle
O primeiro banco, sem instalar nada

---

## Abra o DB Fiddle
1. No navegador: **dbfiddle.uk**
2. No topo, escolha o **PostgreSQL** (a versão mais nova)
3. Escreva o SQL no quadro da esquerda
4. Clique em **Run**: o resultado aparece embaixo

> Não precisa de conta. A cada **Run**, ele cria o banco do zero e roda **tudo** de novo.

---

## Criando a tabela
```sql
create table clientes (
  id serial primary key,
  nome text not null,
  telefone text not null unique,
  cidade text not null
);
```

---

## Lendo o create table
+ `serial`: número que o banco **conta sozinho**: 1, 2, 3...
+ `primary key`: esta é a **chave primária**
+ `not null`: a coluna **não pode** ficar vazia
+ `unique`: o valor **não pode repetir**
+ Vírgula entre as colunas; **ponto e vírgula** no fim

---

## Nomes no banco
+ Tudo em **minúsculas**: `clientes`, `telefone`
+ **Sem acento** e **sem espaço**: `data_pedido`, não `data do pedido`
+ Tabela no **plural**: `clientes`, `pedidos`
+ Chave estrangeira: `cliente_id` (já já você vai ver)

---

## Inserindo linhas
```sql
insert into clientes (nome, telefone, cidade)
values ('Ana Souza', '31 99999-0001', 'Itabira');

insert into clientes (nome, telefone, cidade)
values ('Bruno Lima', '31 99999-0002', 'Itabira');
```

O `id` não aparece: o `serial` preenche.

---

## Aspas simples!
+ Em SQL, texto vai entre aspas **simples**: `'Itabira'`
+ No JSON eram **duplas**; no SQL, duplas são outra coisa
+ `"Itabira"` dá erro: `column "Itabira" does not exist`
+ Número e `true`/`false` vão **sem** aspas

---

## Consultando
```sql
select * from clientes;
```

+ `select`: "me mostre"
+ `*`: **todas** as colunas
+ `from clientes`: de qual tabela

---

## Mão na massa 1: a primeira tabela
1. **Digite** (não copie) o `create table clientes`
2. Insira **4** clientes, de pelo menos **2** cidades
3. No fim, o `select * from clientes;`
4. **Run**: apareceram 4 linhas, com `id` de 1 a 4?

> Deu erro? Leia a mensagem: ela diz a **linha** e a **palavra** do problema.

---

## Escolhendo o que ver
```sql
select nome, telefone
from clientes
where cidade = 'Itabira'
order by nome;
```

+ Só as colunas `nome` e `telefone`
+ `where`: só as linhas que passam no **filtro**
+ `order by`: em ordem **alfabética** de nome

---

## Mão na massa 2: consultas
Escreva um `select` para cada pedido:

1. Só o **nome** de todos os clientes
2. Só os clientes de **uma** cidade
3. Todos, em ordem de **cidade**
4. O cliente com `id` igual a **3**

---

## O que essa consulta mostra?
```sql
select telefone from clientes
where nome = 'Bruno Lima';
```

- [ ] Todas as colunas do Bruno
- [x] Só o telefone do Bruno
- [ ] O telefone de todos os clientes
- [ ] Um erro: faltou o `*`

---

## O banco protege os dados
Rode e **leia** o erro de cada um:

```sql
insert into clientes (nome, telefone, cidade)
values ('Outra Ana', '31 99999-0001', 'Itabira');

insert into clientes (nome, cidade)
values ('Davi Rocha', 'Itabira');
```

---

## Mão na massa 3: os erros de propósito
1. Rode o primeiro `insert`: qual **regra** barrou?
2. Rode o segundo: qual **coluna** faltou?
3. Corrija o segundo e rode de novo
4. **Apague** o primeiro: senão ele dá erro a cada Run

> `unique` e `not null` barram o erro **antes** de ele virar dado errado no sistema.

---

## Alterar e apagar
```sql
update clientes
set telefone = '31 98888-0001'
where id = 1;

delete from clientes
where id = 4;
```

> **Sempre** com `where`. Sem ele, o comando vale para **todas** as linhas.

---

## Cuidado!
Alguém rodou `delete from clientes;` (sem `where`). O que aconteceu?

- [ ] Deu erro: faltou o `where`
- [ ] Apagou só o último cliente
- [x] Apagou **todos** os clientes
- [ ] Apagou a tabela, com as colunas

---

# Parte 4 — Tabelas que se relacionam
E o DER do seu projeto

---

## Uma tabela só?
| cliente | total | status |
|---|---|---|
| Ana Souza | 42.90 | entregue |
| ana souza | 18.00 | Entregue |
| Ana S. | 25.50 | entrege |

+ A mesma cliente, escrita de **3 jeitos**
+ "Quanto a Ana gastou?" Ninguém sabe
+ E o `status`, com erro de digitação?

---

## Chave estrangeira (FK)
+ Uma coluna que **aponta** para a chave primária de outra tabela
+ No pedido: `cliente_id = 1` → a **Ana**
+ O nome fica num **lugar só**: mudou, mudou em tudo
+ O banco **recusa** um `cliente_id` que não existe

---

## Um para muitos (1:N)
+ **1** cliente faz **muitos** pedidos
+ Cada pedido é de **1** cliente só
+ A FK fica sempre do lado do **muitos**: em `pedidos`
+ É o relacionamento **mais comum** que existe

---

## Onde vai a FK?
Um pedido tem 5 itens. Onde fica a coluna que liga os dois?

- [ ] Em `pedidos`: uma coluna `item_id`
- [x] Em `itens_pedido`: uma coluna `pedido_id`
- [ ] Nas duas tabelas
- [ ] Não precisa: o banco descobre sozinho

---

## Criando pedidos
```sql
create table pedidos (
  id serial primary key,
  cliente_id int not null references clientes(id),
  total numeric not null,
  status text not null
    check (status in ('aberto', 'entregue', 'cancelado')),
  criado_em timestamptz not null default now()
);
```

---

## Lendo o create table
+ `references clientes(id)`: a **chave estrangeira**
+ `cliente_id` é `int`: o **mesmo tipo** do `id` de lá
+ `check`: o `status` só aceita **esses 3 valores**
+ `default now()`: sem valor, grava a data e hora de **agora**

---

## Inserindo um pedido
```sql
insert into pedidos (cliente_id, total, status)
values (1, 42.90, 'aberto');
```

O `id` e o `criado_em` não aparecem: o banco preenche.

---

## Mão na massa 4: os pedidos
1. No DB Fiddle, **abaixo** dos clientes, crie `pedidos`
2. Insira 4 pedidos, de clientes **diferentes**
3. Um pedido do cliente `99`: leia o **erro**
4. Um pedido com status `'entrege'`: leia o **erro**
5. Apague esses dois e rode de novo

---

## No quadro: o DER do delivery
Vamos desenhar juntos o **Diagrama Entidade-Relacionamento**:

1. Uma **caixa** por tabela: `clientes`, `pedidos`, `produtos`, `itens_pedido`
2. As **colunas** e o **tipo** de cada uma
3. Marque **PK** e **FK**
4. Ligue as caixas: **1** de um lado, **N** do outro

---

## Uma tabela, duas FKs
+ Um pedido tem **muitos** produtos
+ Um produto aparece em **muitos** pedidos
+ A tabela do meio, `itens_pedido`, liga os dois
+ Ela tem `pedido_id` **e** `produto_id`, mais a `quantidade`
+ Muitos para muitos (**N:N**) = duas relações 1:N

---

## Mão na massa: o DER no papel
**Sem código.** Sozinho, numa folha, a **biblioteca** da escola:

- Cada livro tem **título**, **autor** e **ano**
- Cada leitor tem **nome** e **turma**
- Cada empréstimo tem **data de retirada** e se já foi **devolvido**
- Um leitor pega **vários** livros; um livro é emprestado **várias** vezes

> Desenhe as tabelas, as colunas com o **tipo**, a **PK**, as **FKs** e o **1:N**.

---

## Confira o seu DER
| Tabela | Colunas | PK | FK |
|---|---|---|---|
| `livros` | `titulo` text, `autor` text, `ano` int | `id` | — |
| `leitores` | `nome` text, `turma` text | `id` | — |
| `emprestimos` | `retirada` timestamptz, `devolvido` boolean | `id` | `livro_id`, `leitor_id` |

> `emprestimos` é a tabela do meio: **duas** FKs.

---

## Agora é o seu sistema
Escreva **uma frase** sobre o que o seu sistema faz e procure:

+ Os **substantivos**: cada um pode virar uma **tabela**
+ O que se sabe de cada um: as **colunas**
+ "Um ... tem **vários** ...": um relacionamento **1:N**
+ Ex.: "A oficina atende **carros**; cada carro tem vários **serviços**"

---

## Mão na massa 5: o DER do seu projeto
1. No papel, as tabelas do **seu** sistema (no mínimo **3**)
2. Colunas, **tipos**, **PK** e **FKs**
3. Nomes em **minúsculas**, sem acento e sem espaço
4. Status, tipo, categoria? Pense num `check`

> Fotografe o DER: ele é o **gabarito** do DB Fiddle e do Supabase.

---

## A IA escreve, você confere
+ Você **descreve** o seu DER ao **Copilot** ou ao **Codex**
+ A IA responde com o **SQL** das tabelas
+ Você **confere** com o DER do papel
+ **Testa** no DB Fiddle, onde errar não custa nada
+ Só então leva para o **Supabase**

---

## Monte o seu prompt
O seu pedido para a IA precisa dizer:

- É **PostgreSQL**, para rodar no **Supabase**
- Cada tabela e as colunas, com os nomes **exatos** do DER
- Os **tipos**, a **PK** e as **FKs** de cada tabela
- Os `not null` e os `check` que você pensou
- Só o SQL, **sem comentários**

---

## Um começo de prompt
> Escreva o SQL para PostgreSQL (Supabase) que cria as tabelas do meu sistema de...

Continue com **as suas** palavras: as tabelas, as colunas, os tipos e as chaves do **seu** DER.

---

## Confira antes de testar
- ✅ Os nomes das tabelas e colunas são os do **seu DER**
- ✅ Toda tabela tem **primary key**
- ✅ Cada FK tem `references` e o **mesmo tipo** do `id` de lá
- ✅ Os tipos fazem sentido: data é data, sim/não é `boolean`
- ✅ A ordem: primeiro quem **não tem** FK

---

## A IA escreveu diferente?
| A IA escreveu | Quer dizer |
|---|---|
| `bigint generated always as identity` | Igual ao `serial`, jeito mais novo |
| `uuid default gen_random_uuid()` | Um id em forma de código, não número |
| `varchar(100)` | Texto com tamanho máximo |

> Tudo certo, **desde que** a FK tenha o **mesmo tipo** do `id`: `bigint` com `bigint`, `uuid` com `uuid`.

---

## Dados de teste
+ Peça à IA também os `insert` com dados de teste
+ **Variados**: vários registros, todos os status e categorias
+ **Coerentes** com as regras do **seu** sistema
+ **Fictícios**: nada de nome, CPF ou telefone de gente real
+ Confira: os `id` das FKs **existem**?

---

## Mão na massa 6: o seu banco no DB Fiddle
1. Num DB Fiddle **novo**, cole o SQL das tabelas
2. Embaixo, cole os `insert` dos dados de teste
3. **Run**: deu erro? Leia, corrija e rode de novo
4. Um `select * from` em **cada** tabela: os dados estão lá?
5. Um `select` com `where` que faça sentido no **seu** sistema

> Tudo rodando aqui? Guarde esse SQL: ele vai **inteiro** para o Supabase.

---

# Parte 5 — O seu banco no Supabase
PostgreSQL de verdade, na nuvem

---

## Supabase
+ Um **PostgreSQL na nuvem**, com plano gratuito
+ Painel para ver as tabelas sem escrever SQL
+ **SQL Editor**: o mesmo SQL do DB Fiddle
+ O seu sistema vai ler e gravar **daqui**
+ Projeto gratuito parado por **uma semana** é pausado: é só reativar

---

## Mão na massa 7: a sua conta
1. Abra **supabase.com** → **Start your project**
2. **Continue with GitHub** e autorize
3. Primeira vez? Crie a **organização**: o seu nome
4. Tipo **Personal** e plano **Free** ($0)

> Organização é a "pasta" onde ficam os seus projetos. O plano Free permite **2** projetos ativos.

---

## Mão na massa 8: o projeto
1. **New project**: o nome do **seu** sistema
2. **Database Password**: clique em **Generate** e guarde
3. **Region**: South America (São Paulo)
4. **Create new project** e espere ficar pronto (1 a 2 min)

> A senha do banco **nunca** vai para o GitHub (lembra do `.env`?).

---

## O painel: o menu da esquerda
| Menu | Para que serve |
|---|---|
| **Table Editor** | Ver e editar as tabelas, como planilha |
| **SQL Editor** | Escrever e rodar SQL |
| **Database** | Estrutura: tabelas, Schema Visualizer |
| **Authentication** | Usuários, login e políticas (RLS) |
| **Project Settings** | Configurações e as **chaves** do projeto |

---

## Mão na massa 9: explore o painel
1. **Table Editor**: ainda vazio
2. **SQL Editor** → **New query**: rode `select now();`
3. **Authentication** → **Users**: nenhum usuário ainda
4. **Database** → **Schema Visualizer**: vazio, por enquanto
5. **Project Settings** → **General**: o nome e o id do projeto

---

## Onde ficam as chaves
| Onde | O que tem |
|---|---|
| **Project Settings** → **Data API** | A **Project URL**: o endereço do seu banco |
| **Project Settings** → **API Keys** | A **publishable key**: pode ir na página |
| **Project Settings** → **API Keys** | A **secret key**: escondida, atrás do **Reveal** |

> O seu sistema vai precisar da **URL** e da **publishable key**. A secret, **nunca**.

---

## Mão na massa 10: ache as suas chaves
1. Copie a **Project URL**
2. Copie a **publishable key** (começa com `sb_publishable_`)
3. Cole as duas num `.env` no seu Codespace
4. `git status`: o `.env` aparece? Coloque-o no `.gitignore`
5. Ache a **secret key**, mas **não** clique em Reveal

---

## Mão na massa 11: as tabelas no ar
1. Copie o SQL que **funcionou** no DB Fiddle
2. No Supabase: **SQL Editor** → **New query**
3. Cole e clique em **Run** (ou Ctrl+Enter)
4. **Success**: deu certo!
5. Cole o mesmo SQL num `schema.sql` no seu repositório

> Rodou de novo e deu `already exists`? A tabela já está lá, não precisa criar outra vez.

---

## Confira no painel
1. **Table Editor**: as suas tabelas e os dados estão lá?
2. Abra cada uma: as colunas e os tipos batem com o DER?
3. **Database** → **Schema Visualizer**: o seu DER, desenhado
4. As setas ligam as tabelas certas?

> Apareceu **Unrestricted** nas tabelas? Guarde essa palavra: já já ela some.

---

## Errou uma tabela?
```sql
drop table if exists nome_da_tabela;
```

+ Apaga a tabela, **com os dados**
+ Tem FK apontando para ela? Apague **antes** a tabela da FK
+ Corrija o SQL no DB Fiddle, teste e rode de novo aqui

---

# Quem pode ver os dados?
Segurança do banco na nuvem

---

## O banco está na internet
+ O seu sistema vai ler o banco **pela internet**
+ Sem proteção, quem achar o endereço **lê tudo**
+ Pior: pode **apagar** ou **alterar** os dados
+ Saúde, CPF, endereço: dado **sensível** tem proteção na **LGPD**
+ Segurança não é extra: é parte do **sistema**

---

## As camadas de proteção
| Camada | Pergunta | No dia a dia |
|---|---|---|
| **Autenticação** | Quem é você? | O crachá na portaria |
| **Autorização** (RLS) | O que você pode ver e fazer? | Quem entra em cada sala |
| **Criptografia** | Alguém lê no caminho? | O envelope lacrado |
| **Chaves e senhas** | O segredo está escondido? | A chave do cofre |

---

## Autenticação: quem é você?
+ O usuário entra com **e-mail e senha**
+ No Supabase, isso é o **Authentication** (aba Users)
+ Entrou? Ele recebe um **token**: um crachá digital
+ Cada pedido ao banco leva o crachá junto
+ Sem crachá, o usuário é **anônimo** (`anon`)

---

## Criptografia
| Onde | Como | Protege de |
|---|---|---|
| **No caminho** | HTTPS (o cadeado do navegador) | Quem espia a rede |
| **No disco** | Dados criptografados no servidor | Quem rouba o disco |
| **Na senha** | **Hash**: não volta ao texto | Vazamento do banco |

> O Supabase **não guarda** a senha do usuário: guarda só o **hash** dela.

---

## Vazou!
O banco vazou, mas as senhas estavam com **hash**. O que o invasor consegue?

- [ ] Descriptografar as senhas com a chave do Supabase
- [x] Só um texto embaralhado, que **não volta** a ser a senha
- [ ] Ler as senhas, porque o hash só vale no HTTPS
- [ ] Entrar no sistema usando o hash como senha

---

## As chaves do projeto
| Chave | Pode ir na página? | O que faz |
|---|---|---|
| **Publishable** (anon) | ✅ Sim | Só o que o **RLS** deixa |
| **Secret** (service_role) | ❌ Nunca | Passa **por cima** do RLS |
| **Senha do banco** | ❌ Nunca | Acesso **total** |

Ficam em **Project Settings** → **API Keys**. Secret e senha: só no `.env`.

---

## Qual chave?
O `script.js` do seu sistema fica no GitHub Pages, aberto a todos. Qual chave ele usa?

- [x] A **publishable** (anon), com o RLS ligado
- [ ] A **secret** (service_role), porque lê tudo
- [ ] A **senha do banco**, dentro do código
- [ ] A secret, mas escondida num comentário

---

## RLS: segurança por linha
+ **Row Level Security**: regra para **cada linha**
+ RLS ligado, sem regra: pela API, **ninguém** vê nada
+ **Política** (policy): a regra de quem pode o quê
+ Começa **fechado** e você abre só o necessário
+ O painel do Supabase é o **dono**: lá você vê tudo

---

## Ligando o RLS
```sql
alter table clientes enable row level security;
alter table pedidos enable row level security;
```

Uma linha para **cada** tabela. A portaria **fechou**: só entra quem tiver uma política.

---

## Quem pode o quê?
| Tabela | Quem lê | Quem grava |
|---|---|---|
| `produtos` | **Todos** (o cardápio é público) | Só o dono da loja |
| `clientes` | Só o **próprio** cliente | Só o **próprio** cliente |
| `pedidos` | Só o **próprio** cliente | Só o **próprio** cliente |

> Cada sistema tem a sua tabela: o cardápio é público, o prontuário **não**.

---

## Uma política
```sql
create policy "todos leem produtos"
on produtos
for select
to anon, authenticated
using (true);
```

+ `for select`: só **ler** (nada de gravar ou apagar)
+ `to anon, authenticated`: quem entrou e quem não entrou
+ `using (true)`: **todas** as linhas

---

## Mão na massa 12: a portaria
1. No **SQL Editor**, ligue o RLS em **todas** as suas tabelas
2. **Table Editor**: o **Unrestricted** sumiu?
3. No papel: a tabela **quem lê / quem grava** do seu sistema
4. Peça à IA as políticas dessa tabela, **confira** e rode
5. **Advisors** → **Security Advisor**: algum alerta?

---

## RLS ligado, sem política
A página usa a chave **publishable** e a tabela tem RLS sem nenhuma política. O que ela recebe?

- [ ] Todas as linhas, porque a chave é do projeto
- [ ] Só as linhas que ela mesma gravou
- [x] Nenhuma linha
- [ ] Um erro de senha inválida

---

## Boas práticas
- ✅ **RLS ligado** em toda tabela, sempre
- ✅ Política com o **mínimo** necessário: ler não é apagar
- ✅ Secret key e senha só no **`.env`**, nunca no GitHub
- ✅ Dados de teste **fictícios**; dado sensível, protegido
- ✅ Senha do banco **forte** (o **Generate** faz isso)

---

## Checklist de conformidade (1/2)
- ✅ O DER da **biblioteca** e o do **seu** projeto, no papel
- ✅ No Supabase, as tabelas do **seu DER** (no mínimo 3)
- ✅ **Chave primária** em todas as tabelas
- ✅ **Chaves estrangeiras** com o mesmo tipo do `id`
- ✅ Tipos coerentes; o **Schema Visualizer** igual ao DER

---

## Checklist de conformidade (2/2)
- ✅ Dados de teste **variados** e **fictícios**
- ✅ Um `select` com `where` que funciona numa tabela sua
- ✅ **RLS ligado** em todas as tabelas
- ✅ Políticas de acordo com o **quem lê / quem grava**
- ✅ O `schema.sql` no repositório, **sem** chave nem senha

---

## Revisão
O banco recusou `cliente_id = 99` no pedido. Por quê?

- [ ] Porque `99` é um número grande demais
- [ ] Porque o `id` é `serial` e não aceita números
- [x] Porque a **FK** exige um cliente com `id` 99
- [ ] Porque faltou o `where`

---

## Revisão
Na VPS, o que o **Nginx** faz como reverse proxy?

- [ ] Guarda os dados do sistema, como um banco
- [x] Recebe os pedidos e **encaminha** ao container certo
- [ ] Cria as imagens a partir do `Dockerfile`
- [ ] Publica o site no GitHub Pages

---

## O que vimos hoje
+ **Container**, **VPS** e **Nginx**: publicar com servidor próprio
+ **PK** identifica a linha; **FK** aponta para outra tabela
+ O **DER** desenha o banco **antes** do código
+ **SQL**: `create`, `insert`, `select`, `update` e `delete`
+ **Autenticação**, **RLS** e **criptografia** protegem os dados

---

# O seu sistema ganhou memória
E uma portaria. Na próxima: o sistema lendo e gravando no banco
