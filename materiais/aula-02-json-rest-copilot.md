---
aula: 2
data: 2026-10-01
titulo: JSON, REST e a primeira IA no código
turma: IA
descricao: DevTools, requisitos, GitHub e git no terminal, testando uma API pública, a inspeção em JSON e Copilot
fonte: grande
---

# A inspeção vira dado
Aula 2: JSON, REST e o primeiro código com IA

---

## O que é isto?
Olhe com calma. Você consegue dizer o que aconteceu com o caminhão?

```json
{
  "equipamento": "CAM-07",
  "operador": "Ana",
  "freios": "reprovado"
}
```

---

## Você acabou de ler JSON
+ Mesmo sem nunca ter estudado, você entendeu
+ A Ana inspecionou o **CAM-07** e os **freios foram reprovados**
+ JSON é o jeito mais comum de os sistemas trocarem dados na web
+ Hoje a nossa folha de inspeção em papel vai virar **isto**

---

## Termômetro: levante os dedos
**0** nunca ouvi · **1** já ouvi · **2** sei explicar · **3** já usei

+ JSON
+ REST e métodos HTTP
+ GitHub
+ Terminal e git (commit, push, pull)
+ Webhook, upload e streaming

---

## Retomada da Aula 1
Os dados da inspeção saem do celular do operador e chegam ao servidor. Quem faz esse transporte?

- [ ] O frontend
- [x] A API
- [ ] O backend
- [ ] O banco de dados

---

## Retomada da Aula 1
Uma resposta com status `404` quer dizer...

- [ ] Deu tudo certo
- [ ] O servidor quebrou
- [x] O que foi pedido não existe
- [ ] A inspeção foi registrada

---

## Roteiro de hoje (4h)
1. DevTools: HTTP de verdade (20 min)
2. Design Thinking: requisitos (25 min)
3. Explorando o GitHub (15 min)
4. Repositório, Codespace e git (45 min)
5. Testando uma API de verdade e criando o JSON (45 min)
6. Webhooks, upload e streaming (10 min)
7. Mão na massa com o Copilot (55 min)

---

# Parte 1 — HTTP de verdade
Espiando as requisições de um site conhecido

---

## Abrindo a aba Rede
1. Abra um site que você usa no dia a dia
2. Aperte **F12** (ou `Ctrl + Shift + I`)
3. Clique na aba **Rede** (*Network*)
4. Recarregue a página com **F5**

> A aba só registra o que acontece **enquanto está aberta**. Por isso, recarregue.

---

## O que observar
| Coluna | O que mostra |
|---|---|
| Nome | O recurso pedido (página, imagem, dados) |
| Método | `GET`, `POST`... |
| Status | O código da resposta (`200`, `404`...) |
| Tipo | Documento, script, imagem, fetch... |

Clique numa linha e abra **Cabeçalhos**: lá estão a URL e o servidor.

---

## Mão na massa: observar
1. Filtre por **Fetch/XHR**: são as chamadas de API
2. Escolha 3 requisições: 1 documento, 1 Fetch/XHR, 1 imagem
3. Anote de cada uma: **método, endereço e status**
4. Diga quem é o **cliente** e quem é o **servidor**

---

## O que você encontrou?
Numa requisição Fetch/XHR, a resposta geralmente vem em qual formato?

- [ ] HTML
- [ ] Imagem PNG
- [x] JSON
- [ ] PDF

---

# Parte 2 — Design Thinking
O problema do checklist em papel

---

## Design Thinking em 5 etapas
1. **Empatizar**: entender quem sofre com o problema
2. **Definir**: escrever o problema com clareza
3. **Idear**: pensar em muitas soluções
4. **Prototipar**: construir uma versão simples
5. **Testar**: colocar na mão do usuário e aprender

---

## Quem sofre com o checklist em papel?
| Pessoa | Dor | Necessidade |
|---|---|---|
| Operador | Folha molha, suja e se perde | Marcar os itens no celular |
| Supervisor | Letra ilegível; falha liberada | Ver na hora o que reprovou |
| Manutenção | Descobre a avaria tarde | Ser avisada e ver o histórico |

---

## RF x RNF
| | Funcional (RF) | Não funcional (RNF) |
|---|---|---|
| Responde | **O que** o sistema faz | **Como** o sistema deve ser |
| Exemplo 1 | Registrar a inspeção | Funcionar no celular, em campo |
| Exemplo 2 | Bloquear equipamento reprovado | Usar HTTPS |
| Exemplo 3 | Listar o histórico | Custo zero de hospedagem |

Dica: comece cada requisito com **"O sistema deve..."**.

---

## RF ou RNF?
"O sistema deve abrir em menos de 3 segundos no celular do operador."

- [ ] RF: é algo que o sistema faz
- [x] RNF: é uma qualidade do sistema
- [ ] Nenhum dos dois: é só uma opinião

---

## Mão na massa: imersão
1. Em grupo, liste as dores do **operador**, do **supervisor** e da **manutenção**
2. Transforme cada dor em uma **necessidade**
3. Escreva **5 RF** começando com "O sistema deve..."
4. Escreva **3 RNF** (celular em campo, HTTPS, custo zero...)

> Guarde no caderno: daqui a pouco eles vão para o GitHub.

---

# Parte 3 — Explorando o GitHub
Antes de criar a conta, conheça o lugar

---

## O que é o GitHub?
+ Um site que **guarda projetos de código** na nuvem
+ Cada projeto é um **repositório**: a "pasta" do projeto
+ Guarda também **todo o histórico**: quem mudou, o quê e quando
+ Milhões de projetos são **públicos**: dá para ver sem ter conta

---

## Mão na massa: explorar
Sem fazer login, abra **github.com/typicode/jsonplaceholder**

1. Leia o **README**: o que esse projeto oferece?
2. Clique em **commits**: qual a mensagem do último? Quando foi?
3. Abra **Issues**: escolha um problema que alguém relatou
4. Ache as **estrelas** (*stars*) e a **linguagem** principal

> Esse é o projeto da API que vamos testar na Parte 5.

---

## Mão na massa: o que está em alta
1. Abra **github.com/trending**
2. Qual **linguagem** aparece mais nos projetos de hoje?
3. Escolha um projeto e descubra **para que ele serve**
4. Conte para a turma: o que achou mais curioso?

---

## O que você encontrou?
Onde você descobre **quem mudou o quê** num projeto, e quando?

- [ ] No README
- [x] No histórico de commits
- [ ] Nas estrelas
- [ ] Na aba Issues

---

## O que você encontrou?
Um usuário achou um erro no projeto e quer avisar os autores. Onde ele registra?

- [ ] No README
- [ ] Num commit
- [x] Em Issues
- [ ] Nas estrelas

---

# Parte 4 — O nosso repositório
Conta, Codespace, terminal e git

---

## Criando conta e repositório
1. Crie a sua conta em **github.com** (use um e-mail que você acessa)
2. Clique em **New repository**
3. Nome: `checklist-inspecao`, marque **Public**
4. Marque **Add a README file** e clique em **Create repository**

---

## Abrindo o Codespace
1. No repositório, clique no botão verde **Code**
2. Abra a aba **Codespaces**
3. Clique em **Create codespace on main**
4. Espere: um editor completo abre no navegador

> Grátis: até **60 horas por mês**. Ele desliga sozinho após **30 min** parado.

---

## Terminal: andando pelas pastas
```bash
pwd          # em qual pasta estou?
ls           # o que tem aqui?
mkdir docs   # cria a pasta docs
cd docs      # entra nela
cd ..        # volta uma pasta
```

O terminal fica na parte de baixo do Codespace.

---

## Mão na massa: terminal
1. Descubra em qual pasta você está com `pwd`
2. Liste os arquivos com `ls`: o `README.md` está aí?
3. Crie a pasta `docs`, entre nela e volte
4. Use `ls` de novo: a pasta nova aparece?

> Dica: a tecla **↑** repete o último comando. **Tab** completa o nome.

---

## Git: a máquina do tempo
+ **commit**: tira uma "foto" do projeto, com uma mensagem
+ **push**: envia as suas fotos para o GitHub
+ **pull**: traz do GitHub o que mudou lá
+ Cada commit fica no histórico, igual ao que você viu na Parte 3

---

## Os comandos do dia a dia
```bash
git status                 # o que mudou?
git add README.md          # escolhe o que vai
git commit -m "Requisitos" # tira a foto
git push                   # envia para o GitHub
```

Sem `git add`, o arquivo **não entra** no commit.

---

## Markdown em 1 minuto
```markdown
# Checklist de Inspeção
## Requisitos funcionais
- RF01 - O sistema deve registrar...
**negrito** e `código`
```

O **README.md** é a vitrine: é o que aparece primeiro no GitHub.

---

## Mão na massa: primeiro commit
1. No `README.md`, escreva o **mapa do sistema** e os **5 RF e 3 RNF**
2. Salve com `Ctrl + S` e rode `git status`
3. `git add README.md` e `git commit -m "Requisitos"`
4. `git push` e atualize a página do repositório no GitHub

> Apareceu lá? Abra os **commits** e ache a sua foto.

---

## Mão na massa: o caminho de volta
1. No **site** do GitHub, abra o `README.md` e clique no **lápis** ✏️
2. Acrescente a linha `Equipe: <seu nome>` e clique em **Commit changes**
3. Volte ao Codespace: o README ainda **não** mudou
4. Rode `git pull`: agora mudou!

---

## Push recusado?
Se o GitHub tem algo que o Codespace ainda não tem, o `git push` é **recusado**.

1. Rode `git pull --rebase` para trazer o que falta
2. Rode `git push` de novo

> Regra de ouro: **pull antes de push**.

---

## Qual comando?
Você mudou o README no Codespace e quer que a mudança apareça no GitHub.

- [ ] `git pull`
- [ ] `git status`
- [x] `git add`, `git commit` e `git push`
- [ ] `ls`

---

# Parte 5 — Testando uma API de verdade
JSON, métodos HTTP e o que a API responde

---

## Chave, valor e lista
+ **Chave**: o nome do dado, sempre entre aspas duplas: `"turno"`
+ **Valor**: texto `"Ana"`, número `7`, `true`/`false` ou `null`
+ **Objeto** `{ }`: um grupo de chaves e valores
+ **Lista** `[ ]`: vários valores em ordem

---

## CRUD: as 4 ações com dados
| CRUD | Método HTTP | Na inspeção |
|---|---|---|
| **C**reate (criar) | `POST` | Registrar uma inspeção |
| **R**ead (ler) | `GET` | Listar as inspeções |
| **U**pdate (atualizar) | `PATCH` | Mudar o status de um item |
| **D**elete (apagar) | `DELETE` | Cancelar a inspeção |

---

## A API que vamos testar
+ **JSONPlaceholder**: uma API pública e gratuita, feita para treinar
+ Endereço: `jsonplaceholder.typicode.com`
+ O recurso `/todos` é uma lista de tarefas: **cada uma é um item de checklist**
+ `title` é o nome do item, `completed` diz se foi feito (`true`/`false`)

---

## Primeiro teste: GET
Cole no **navegador** o endereço `jsonplaceholder.typicode.com/todos/1`

Agora troque o `1` por `999`. O que aconteceu?

---

## O mesmo GET no terminal
```bash
curl -i https://jsonplaceholder.typicode.com/todos/1
```

+ `curl` faz requisições pelo terminal
+ `-i` mostra também o cabeçalho da resposta
+ Olhe a **primeira linha**: ali está o **status** (`200`)

---

## POST: criando um item
```bash
curl -i -X POST \
  https://jsonplaceholder.typicode.com/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Freios", "completed": false}'
```

`-X` escolhe o método e `-d` leva o JSON que você envia.

---

## PATCH e DELETE
```bash
curl -i -X PATCH \
  https://jsonplaceholder.typicode.com/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

curl -i -X DELETE \
  https://jsonplaceholder.typicode.com/todos/1
```

---

## Mão na massa: investigue a API
Teste e anote o **status** e a **resposta** de cada um:

1. `GET` do item 1 e do item 999
2. `POST` de um item seu: qual `id` voltou?
3. Agora faça `GET` desse `id` novo
4. `PATCH` e `DELETE` no item 1, depois `GET` no item 1

---

## Deu certo... ou não?
+ O `POST` respondeu `201 Created`, com o `id` 201
+ Mas o `GET` do 201 responde `404`: **nada foi salvo**
+ Depois do `DELETE`, o item 1 **continua lá**
+ É uma API de **treino**: ela finge que salvou
+ Lição: o status diz o que a API **respondeu**, não o que **aconteceu**

---

## E se o JSON vier quebrado?
```bash
curl -i -X POST \
  https://jsonplaceholder.typicode.com/todos \
  -H "Content-Type: application/json" \
  -d '{title: "Freios",}'
```

Teste! Que status voltou? Por que ela não aceitou?

---

## Regras que quebram tudo
- Chave **sem aspas** ou com aspas simples: `turno: "A"` ✗
- **Vírgula sobrando** no último item ✗
- **Comentários** não existem em JSON ✗
- Número **entre aspas** vira texto: `"7"` não é `7`

> A API respondeu `500`: erro no servidor. Uma API bem feita responderia `400`, "você mandou errado".

---

## Qual JSON é válido?
Três destes têm erro. Qual está certo?

- [ ] `{ turno: "A" }`
- [ ] `{ 'turno': 'A' }`
- [x] `{ "turno": "A" }`
- [ ] `{ "turno": "A", }`

---

## Qual método?
O operador marcou "Luzes: ok" por engano na inspeção 7 e precisa corrigir para reprovado.

- [ ] `GET /inspecoes/7`
- [ ] `POST /inspecoes`
- [x] `PATCH /inspecoes/7`
- [ ] `DELETE /inspecoes/7`

---

## Agora é a sua vez: a inspeção
```json
{
  "equipamento": "CAM-07",
  "operador": "Ana",
  "itens": [
    { "nome": "Freios", "status": "ok" },
    { "nome": "Pneus", "status": "reprovado" }
  ]
}
```

---

## Validando no terminal
```bash
python3 -m json.tool inspecao.json
```

Se estiver certo, o JSON aparece organizado. Se tiver erro, ele mostra a **linha**.

---

## Mão na massa: inspecao.json
1. No Codespace, crie o arquivo `inspecao.json` **à mão**
2. Coloque um equipamento seu e pelo menos **4 itens**
3. **Valide** no terminal e corrija o que estiver errado
4. Quebre de propósito (tire uma aspa) e valide de novo: que linha ele aponta?
5. Tudo certo? `git add`, `git commit` e `git push`

---

## REST: CRUD virando rotas
| Ação | Método | Rota |
|---|---|---|
| Registrar inspeção | `POST` | `/inspecoes` |
| Listar inspeções | `GET` | `/inspecoes` |
| Atualizar item | `PATCH` | `/inspecoes/7` |
| Cancelar inspeção | `DELETE` | `/inspecoes/7` |

O **recurso** fica no endereço, a **ação** fica no método. Igual ao `/todos`!

---

# Parte 6 — Recursos da web
Webhooks, upload e streaming na mineração

---

## Três recursos em um slide
+ **Webhook**: o sistema **avisa sozinho** a manutenção quando um freio reprova
+ Sem ele, a manutenção pergunta toda hora (*polling*) e o aviso chega atrasado
+ **Upload**: o operador envia a **foto da avaria** com um `POST`
+ **Streaming**: a resposta chega **em pedaços**, como o texto de um chat de IA

---

## Qual recurso?
A manutenção precisa ser avisada na hora em que um freio é reprovado.

- [ ] Upload de arquivo
- [ ] Streaming
- [x] Webhook
- [ ] Polling

---

## Qual recurso?
O operador quer anexar à inspeção a foto de uma mangueira rachada.

- [x] Upload de arquivo
- [ ] Streaming
- [ ] Webhook
- [ ] `DELETE`

---

# Parte 7 — A IA entra no código
GitHub Copilot no Codespace

---

## Copilot Free: o que você tem
+ **Sugestões** enquanto você digita: 2.000 por mês
+ **Chat** para pedir e perguntar: **50 mensagens por mês**
+ 50 é pouco: cada mensagem precisa **valer a pena**
+ Um bom prompt economiza mensagens

---

## Ativando o Copilot
1. No Codespace, abra **Extensões** na barra lateral
2. Procure **GitHub Copilot** e instale, se ainda não estiver
3. Entre com a sua conta do GitHub quando ele pedir
4. Abra o **chat do Copilot** pelo ícone dele no topo

---

## Prompt claro: 3 partes
| Parte | Pergunta | Exemplo |
|---|---|---|
| **Contexto** | Onde estou? | Checklist de inspeção de equipamentos |
| **Tarefa** | O que eu quero? | Crie 3 inspeções de exemplo |
| **Formato** | Como quero? | Só JSON válido, sem comentários |

---

## Prompt vago x prompt claro
- Vago: *"faz um json de inspeção"*
- Claro: *"Estou criando um checklist de inspeção de equipamentos de mineração. Use o meu `inspecao.json` como modelo e crie `inspecoes.json` com uma lista de 3 inspeções. Responda só com JSON válido."*

> O prompt claro gasta **uma** mensagem. O vago costuma gastar três.

---

## Mão na massa: inspecoes.json
1. Escreva o prompt com **contexto, tarefa e formato**
2. Salve o que a IA gerou em `inspecoes.json`
3. **Valide** com `python3 -m json.tool` e corrija o que estiver errado
4. Confira: todo item tem nome e status **ok** ou **reprovado**?
5. `git add`, `git commit` e `git push`

---

## Mão na massa: tabela de rotas
No `README.md`, crie a seção **Rotas REST** com as **4 ações**:

```markdown
## Rotas REST
| Ação | Método | Rota |
|---|---|---|
| Registrar inspeção | POST | /inspecoes |
```

Peça ao Copilot para **revisar**: ele acertou? Depois, commit e push.

---

## Observando o streaming
1. Pergunte ao chat: *"Explique o que é PATCH"*
2. Repare: a resposta aparece **aos poucos**
3. Isso é **streaming**, o mesmo recurso da Parte 6
4. Anote no README: onde mais você já viu streaming?

---

## Revise tudo o que a IA fez
- ✅ O `inspecoes.json` passa no `json.tool`
- ✅ Os nomes das chaves fazem sentido para a inspeção
- ✅ Todo item tem um status válido: ok ou reprovado
- ✅ Cada rota tem o método certo

> A IA é assistente. Quem assina o trabalho é você.

---

## Antes de entregar
Abra o seu repositório **no site do GitHub** e confira:

- ✅ `README.md` com o mapa, 5 RF, 3 RNF e as rotas
- ✅ `inspecao.json` (à mão) e `inspecoes.json` (com IA)
- ✅ Pelo menos **3 commits** no histórico

---

## Revisão
Qual rota lista todas as inspeções registradas?

- [x] `GET /inspecoes`
- [ ] `POST /inspecoes`
- [ ] `GET /inspecoes/7`
- [ ] `PATCH /inspecoes`

---

## Revisão
O seu colega mudou o README pelo site. O que você roda no Codespace para receber a mudança?

- [ ] `git push`
- [x] `git pull`
- [ ] `git commit`
- [ ] `git status`

---

## Termômetro de novo
Levante os dedos outra vez e compare com o começo.

+ JSON
+ REST e métodos HTTP
+ GitHub
+ Terminal e git (commit, push, pull)
+ Webhook, upload e streaming

---

## O que vimos hoje
+ No DevTools e no `curl`, as APIs respondem em **JSON**
+ RF diz o que o sistema faz; RNF diz como ele deve ser
+ GitHub guarda, Codespace roda, **git** leva e traz
+ O método diz a ação, a rota diz o recurso
+ O status diz o que a API respondeu: **confira** o que aconteceu

---

# A inspeção já é dado
Na próxima, ela começa a virar sistema
