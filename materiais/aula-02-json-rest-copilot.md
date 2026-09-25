---
aula: 2
data: 2026-10-01
titulo: JSON, REST e a primeira IA no código
turma: IA
descricao: DevTools, requisitos, GitHub Codespaces, comanda em JSON, rotas REST e Copilot
---

# A comanda vira dado
Aula 2: JSON, REST e o primeiro código com IA

---

## O que é isto?
Olhe com calma. Você consegue dizer o que foi pedido?

```json
{
  "mesa": 12,
  "itens": ["X-Burger", "Suco de laranja"],
  "pago": false
}
```

---

## Você acabou de ler JSON
+ Mesmo sem nunca ter estudado, você entendeu
+ Mesa **12**, dois itens, e a conta **ainda não foi paga**
+ JSON é o jeito mais comum de os sistemas trocarem dados na web
+ Hoje a nossa comanda de papel vai virar **isto**

---

## Termômetro: levante os dedos
**0** nunca ouvi · **1** já ouvi · **2** sei explicar · **3** já usei

+ JSON
+ REST
+ Webhook
+ Upload de arquivos
+ Streaming
+ GitHub e terminal

---

## Retomada da Aula 1
O garçom leva o pedido do salão até a cozinha. Na web, ele é...

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
- [ ] O pedido foi criado

---

## Roteiro de hoje (4h)
1. DevTools: HTTP de verdade (25 min)
2. Design Thinking: requisitos (30 min)
3. GitHub, Codespace e README (35 min)
4. JSON e rotas REST (35 min)
5. Webhooks, upload e streaming (20 min)
6. Mão na massa com o Copilot (95 min)

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
| Método | `GET`, `POST`... (botão direito no cabeçalho → Método) |
| Status | O código da resposta (`200`, `304`, `404`...) |
| Tipo | Documento, script, imagem, fetch... |

Clique numa linha e abra **Cabeçalhos**: lá estão a URL e o endereço do servidor.

---

## Mão na massa: observar
1. Filtre por **Fetch/XHR**: são as chamadas de API
2. Escolha 3 requisições: 1 documento, 1 Fetch/XHR, 1 imagem
3. Anote de cada uma: **método, endereço e status**
4. Diga quem é o **cliente** e quem é o **servidor**

[cronômetro 15]

---

## O que você encontrou?
Numa requisição Fetch/XHR, a resposta geralmente vem em qual formato?

- [ ] HTML
- [ ] Imagem PNG
- [x] JSON
- [ ] PDF

---

# Parte 2 — Design Thinking
O problema das comandas de papel

---

## Design Thinking em 5 etapas
1. **Empatizar**: entender quem sofre com o problema
2. **Definir**: escrever o problema com clareza
3. **Idear**: pensar em muitas soluções
4. **Prototipar**: construir uma versão simples
5. **Testar**: colocar na mão do usuário e aprender

> Hoje o foco é **empatizar** e **definir**: sem entender o problema, a solução erra o alvo.

---

## Quem sofre com a comanda?
| Pessoa | Dor | Necessidade |
|---|---|---|
| Garçom | Letra ilegível, volta à cozinha | Anotar rápido e sem erro |
| Cozinha | Comanda perdida ou fora de ordem | Ver os pedidos em fila |
| Caixa | Soma errada no fechamento | Total calculado sozinho |
| Cliente | Prato errado, espera longa | Receber o que pediu |

---

## RF x RNF
| | Requisito funcional (RF) | Requisito não funcional (RNF) |
|---|---|---|
| Responde | **O que** o sistema faz | **Como** o sistema deve ser |
| Exemplo 1 | Registrar o pedido de uma mesa | Funcionar no celular do garçom |
| Exemplo 2 | Mostrar os pedidos para a cozinha | Usar HTTPS |
| Exemplo 3 | Calcular o total da comanda | Ter custo zero de hospedagem |

Dica: comece cada requisito com **"O sistema deve..."**.

---

## RF ou RNF?
"O sistema deve abrir em menos de 3 segundos no celular."

- [ ] RF: é algo que o sistema faz
- [x] RNF: é uma qualidade do sistema
- [ ] Nenhum dos dois: é só uma opinião

---

## Mão na massa: imersão
1. Em grupo, liste as dores do **garçom**, da **cozinha** e do **caixa**
2. Transforme cada dor em uma **necessidade**
3. Escreva **5 RF** começando com "O sistema deve..."
4. Escreva **3 RNF** (celular, HTTPS, custo zero...)

[cronômetro 20]

---

# Parte 3 — Nosso ambiente
GitHub, Codespace e terminal

---

## As três peças
+ **GitHub**: guarda o seu projeto na nuvem, com todo o histórico
+ **Repositório**: a "pasta" do projeto dentro do GitHub
+ **Codespace**: um computador na nuvem, com editor e terminal, aberto no navegador
+ Grátis para contas pessoais: **120 horas por mês** (máquina de 2 núcleos)

---

## Criando conta e repositório
1. Crie a sua conta em **github.com** (use um e-mail que você acessa)
2. Clique em **New repository**
3. Nome: `sistema-comandas`, marque **Public**
4. Marque **Add a README file** e clique em **Create repository**

---

## Abrindo o Codespace
1. No repositório, clique no botão verde **Code**
2. Abra a aba **Codespaces**
3. Clique em **Create codespace on main**
4. Espere: um editor completo abre no navegador

> Ele desliga sozinho depois de **30 min** parado. Seus arquivos ficam salvos.

---

## Terminal: comandos essenciais
```bash
pwd              # mostra em qual pasta você está
ls               # lista os arquivos da pasta
cd pasta         # entra numa pasta
cd ..            # volta uma pasta
```

No Codespace, o terminal fica na parte de baixo da tela.

---

## Markdown em 1 minuto
```markdown
# Sistema de Comandas
## Requisitos funcionais
- RF01 - O sistema deve registrar o pedido de uma mesa
**negrito** e `código`
```

O **README.md** é a vitrine do projeto: é o que aparece primeiro no GitHub.

---

## Modelo do README.md
```markdown
# Sistema de Comandas

## Mapa do sistema
Frontend → API → Backend → Banco de dados

## Requisitos funcionais
- RF01 - O sistema deve ...

## Requisitos não funcionais
- RNF01 - O sistema deve ...
```

---

## Mão na massa: ambiente
1. Crie a conta, o repositório e o Codespace
2. No terminal, use `pwd`, `ls` e `cd`
3. Abra o `README.md` e escreva o **mapa** e os **5 RF e 3 RNF**
4. Salve com `Ctrl + S`

[cronômetro 25]

---

# Parte 4 — A comanda em JSON
Dados organizados em chave e valor

---

## A comanda em JSON
```json
{
  "id": 7,
  "mesa": 12,
  "garcom": "Ana",
  "status": "aberta",
  "itens": [
    { "nome": "X-Burger", "quantidade": 2, "preco": 22.0 },
    { "nome": "Suco", "quantidade": 1, "preco": 8.5 }
  ],
  "total": 52.5
}
```

---

## Chave, valor e lista
+ **Chave**: o nome do dado, sempre entre aspas duplas: `"mesa"`
+ **Valor**: texto `"Ana"`, número `12`, `true`/`false` ou `null`
+ **Objeto** `{ }`: um grupo de chaves e valores (uma comanda)
+ **Lista** `[ ]`: vários valores em ordem (os itens)

---

## Regras que quebram tudo
- Chave **sem aspas** ou com aspas simples: `mesa: 12` ✗
- **Vírgula sobrando** no último item ✗
- **Comentários** não existem em JSON ✗
- Número **entre aspas** vira texto: `"12"` não é `12`

> Um único caractere errado e o JSON inteiro é recusado.

---

## Qual JSON é válido?
Três destes têm erro. Qual está certo?

- [ ] `{ mesa: 12 }`
- [ ] `{ 'mesa': 12 }`
- [x] `{ "mesa": 12 }`
- [ ] `{ "mesa": 12, }`

---

## CRUD: as 4 ações com dados
| CRUD | Significa | Na comanda |
|---|---|---|
| **C**reate | Criar | Abrir uma comanda |
| **R**ead | Ler | Listar as comandas |
| **U**pdate | Atualizar | Adicionar um item |
| **D**elete | Apagar | Cancelar a comanda |

---

## REST: CRUD virando rotas
| Ação | Método | Rota |
|---|---|---|
| Abrir comanda | `POST` | `/comandas` |
| Listar comandas | `GET` | `/comandas` |
| Adicionar item | `PATCH` | `/comandas/7` |
| Cancelar comanda | `DELETE` | `/comandas/7` |

REST: o **recurso** fica no endereço, a **ação** fica no método.

---

## Abrindo uma comanda
```http
POST /comandas HTTP/1.1
Content-Type: application/json

{ "mesa": 12, "garcom": "Ana" }
```

A resposta `201 Created` devolve a comanda nova, já com o seu `id`.

---

## Qual método?
O garçom esqueceu a sobremesa e precisa acrescentar na comanda 7.

- [ ] `GET /comandas/7`
- [ ] `POST /comandas`
- [x] `PATCH /comandas/7`
- [ ] `DELETE /comandas/7`

---

## Qual método?
O cliente desistiu e foi embora antes de pedir.

- [ ] `PATCH /comandas/7`
- [x] `DELETE /comandas/7`
- [ ] `GET /comandas`
- [ ] `POST /comandas/7`

---

# Parte 5 — Recursos da web
Webhooks, upload e streaming no restaurante

---

## Webhook: o aviso automático
+ Sem webhook, a cozinha pergunta a cada minuto: "tem pedido novo?"
+ Isso se chama **polling**: muito pedido à toa
+ Com webhook, o sistema **avisa sozinho** quando o pedido chega
+ A cozinha só se cadastra **uma vez** para receber os avisos

---

## Upload: a foto do prato
+ O cardápio precisa da **foto** de cada prato
+ O navegador envia o arquivo com um `POST`
+ O formulário usa o formato `multipart/form-data`
+ O servidor guarda a imagem e devolve o **endereço** dela

---

## Streaming: aos poucos
+ Em vez de esperar tudo pronto, a resposta chega **em pedaços**
+ Como a cozinha que manda a entrada antes do prato principal
+ Vídeos e músicas tocam enquanto ainda estão baixando
+ No chat de uma IA, o texto aparece **palavra por palavra**

---

## Qual recurso?
O caixa precisa ser avisado na hora em que a comanda é fechada.

- [ ] Upload de arquivo
- [ ] Streaming
- [x] Webhook
- [ ] Polling

---

## Qual recurso?
O gerente quer cadastrar o prato novo com uma foto.

- [x] Upload de arquivo
- [ ] Streaming
- [ ] Webhook
- [ ] `DELETE`

---

# Parte 6 — A IA entra no código
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

[cronômetro 10]

---

## Prompt claro: 3 partes
| Parte | Pergunta | Exemplo |
|---|---|---|
| **Contexto** | Onde estou? | Estou criando um Sistema de Comandas |
| **Tarefa** | O que eu quero? | Crie uma comanda de exemplo |
| **Formato** | Como quero? | Só JSON válido, sem comentários |

---

## Prompt vago x prompt claro
- Vago: *"faz um json de comanda"*
- Claro: *"Estou criando um Sistema de Comandas. Crie o arquivo `comanda.json` com uma comanda de exemplo: id, mesa, garçom, status e uma lista de itens com nome, quantidade e preço. Responda só com JSON válido."*

> O prompt claro gasta **uma** mensagem. O vago costuma gastar três.

---

## Validando o JSON
A IA pode errar. Confira no terminal:

```bash
python3 -m json.tool comanda.json
```

Se estiver certo, o JSON aparece organizado. Se tiver erro, ele mostra a linha.

---

## Mão na massa: comanda.json
1. Escreva o prompt com **contexto, tarefa e formato**
2. Crie o arquivo `comanda.json` com o que a IA gerou
3. **Valide** no terminal e corrija o que estiver errado
4. Confira: o `total` bate com os itens? Faça a conta

[cronômetro 30]

---

## Mão na massa: tabela de rotas
No `README.md`, crie a seção **Rotas REST**:

```markdown
## Rotas REST
| Ação | Método | Rota |
|---|---|---|
| Abrir comanda | POST | /comandas |
| Listar comandas | GET | /comandas |
```

Complete com **adicionar item** e **cancelar comanda**.

---

## Mão na massa: rotas
1. Monte a tabela no `README.md` com as **4 ações**
2. Peça ao Copilot para **revisar** a sua tabela
3. Compare com o slide de REST: ele acertou?

[cronômetro 25]

---

## Observando o streaming
1. Faça uma pergunta ao chat: *"Explique o que é PATCH"*
2. Repare: a resposta aparece **aos poucos**
3. Isso é **streaming**, o mesmo recurso da Parte 5
4. Anote no README: onde mais você já viu streaming?

[cronômetro 15]

---

## Revise tudo o que a IA fez
- ✅ O `comanda.json` passa no `json.tool`
- ✅ Os nomes das chaves fazem sentido para o restaurante
- ✅ O `total` confere com os itens
- ✅ Cada rota tem o método certo

> A IA é assistente. Quem assina o trabalho é você.

---

## Antes de entregar
Confira no seu repositório:

- ✅ `README.md` com o mapa do sistema
- ✅ 5 RF e 3 RNF em Markdown
- ✅ `comanda.json` válido
- ✅ Tabela de rotas REST com as 4 ações

[cronômetro 10]

---

## Revisão
Qual rota lista todas as comandas abertas?

- [x] `GET /comandas`
- [ ] `POST /comandas`
- [ ] `GET /comandas/7`
- [ ] `PATCH /comandas`

---

## Termômetro de novo
Levante os dedos outra vez e compare com o começo.

+ JSON
+ REST
+ Webhook
+ Upload de arquivos
+ Streaming
+ GitHub e terminal

---

## O que vimos hoje
+ No DevTools, as APIs respondem em **JSON**
+ Requisitos: **RF** diz o que faz, **RNF** diz como deve ser
+ GitHub guarda, Codespace roda, README apresenta
+ CRUD vira **REST**: o método diz a ação, a rota diz o recurso
+ Webhook avisa, upload envia arquivo, streaming entrega aos poucos

---

# A comanda já é dado
Na próxima, ela começa a virar sistema
