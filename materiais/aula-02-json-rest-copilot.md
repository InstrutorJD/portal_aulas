---
aula: 2
data: 2026-10-01
titulo: JSON, REST e a primeira IA no código
turma: IA
descricao: DevTools, requisitos, GitHub Codespaces, a inspeção em JSON, rotas REST e Copilot
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
+ REST
+ Webhook
+ Upload de arquivos
+ Streaming
+ GitHub e terminal

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
1. DevTools: HTTP de verdade (25 min)
2. Design Thinking: requisitos (30 min)
3. GitHub, Codespace e README (35 min)
4. A inspeção em JSON e as rotas REST (35 min)
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
O problema do checklist em papel

---

## Design Thinking em 5 etapas
1. **Empatizar**: entender quem sofre com o problema
2. **Definir**: escrever o problema com clareza
3. **Idear**: pensar em muitas soluções
4. **Prototipar**: construir uma versão simples
5. **Testar**: colocar na mão do usuário e aprender

> Hoje o foco é **empatizar** e **definir**: sem entender o problema, a solução erra o alvo.

---

## Quem sofre com o checklist em papel?
| Pessoa | Dor | Necessidade |
|---|---|---|
| Operador | Folha molha, suja e se perde em campo | Marcar os itens rápido, no celular |
| Supervisor | Letra ilegível; equipamento com falha liberado | Ver na hora o que foi reprovado |
| Manutenção | Descobre a avaria tarde; dados que ninguém analisa | Ser avisada e ver o histórico |

---

## RF x RNF
| | Requisito funcional (RF) | Requisito não funcional (RNF) |
|---|---|---|
| Responde | **O que** o sistema faz | **Como** o sistema deve ser |
| Exemplo 1 | Registrar a inspeção de um equipamento | Funcionar no celular, em campo |
| Exemplo 2 | Bloquear o equipamento com item crítico reprovado | Usar HTTPS |
| Exemplo 3 | Listar o histórico de inspeções | Ter custo zero de hospedagem |

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

[cronômetro 20]

---

# Parte 3 — Nosso ambiente
GitHub, Codespace e terminal

---

## As três peças
+ **GitHub**: guarda o seu projeto na nuvem, com todo o histórico
+ **Repositório**: a "pasta" do projeto dentro do GitHub
+ **Codespace**: um computador na nuvem, com editor e terminal, aberto no navegador
+ Grátis para contas pessoais: **120 horas-núcleo por mês**, ou seja, **60 horas** numa máquina de 2 núcleos

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

> Ele desliga sozinho depois de **30 min** parado. Seus arquivos ficam salvos.

---

## Terminal: comandos essenciais
```bash
ls               # lista os arquivos da pasta
cd pasta         # entra numa pasta
cd ..            # volta uma pasta
pwd              # mostra em qual pasta você está
```

No Codespace, o terminal fica na parte de baixo da tela.

---

## Markdown em 1 minuto
```markdown
# Checklist de Inspeção
## Requisitos funcionais
- RF01 - O sistema deve registrar a inspeção de um equipamento
**negrito** e `código`
```

O **README.md** é a vitrine do projeto: é o que aparece primeiro no GitHub.

---

## Modelo do README.md
```markdown
# Checklist de Inspeção

## Mapa do sistema
Frontend → API → Backend → Banco de dados

## Requisitos funcionais
- RF01 - O sistema deve ...

## Requisitos não funcionais
- RNF01 - O sistema deve ...
```

---

## Mão na massa: ambiente
1. Crie a conta, o repositório `checklist-inspecao` e o Codespace
2. No terminal, use `ls` e `cd`
3. Abra o `README.md` e escreva o **mapa** e os **5 RF e 3 RNF**
4. Salve com `Ctrl + S`

[cronômetro 25]

---

# Parte 4 — A inspeção em JSON
Dados organizados em chave e valor

---

## A inspeção em JSON
```json
{
  "id": 7,
  "equipamento": "CAM-07",
  "operador": "Ana",
  "turno": "A",
  "itens": [
    { "nome": "Freios", "status": "ok" },
    { "nome": "Pneus", "status": "reprovado" },
    { "nome": "Luzes", "status": "ok" }
  ]
}
```

---

## Chave, valor e lista
+ **Chave**: o nome do dado, sempre entre aspas duplas: `"turno"`
+ **Valor**: texto `"Ana"`, número `7`, `true`/`false` ou `null`
+ **Objeto** `{ }`: um grupo de chaves e valores (uma inspeção, um item)
+ **Lista** `[ ]`: vários valores em ordem (os itens)

---

## Regras que quebram tudo
- Chave **sem aspas** ou com aspas simples: `turno: "A"` ✗
- **Vírgula sobrando** no último item ✗
- **Comentários** não existem em JSON ✗
- Número **entre aspas** vira texto: `"7"` não é `7`

> Um único caractere errado e o JSON inteiro é recusado.

---

## Qual JSON é válido?
Três destes têm erro. Qual está certo?

- [ ] `{ turno: "A" }`
- [ ] `{ 'turno': 'A' }`
- [x] `{ "turno": "A" }`
- [ ] `{ "turno": "A", }`

---

## CRUD: as 4 ações com dados
| CRUD | Significa | Na inspeção |
|---|---|---|
| **C**reate | Criar | Registrar uma inspeção |
| **R**ead | Ler | Listar as inspeções |
| **U**pdate | Atualizar | Mudar o status de um item |
| **D**elete | Apagar | Cancelar a inspeção |

---

## REST: CRUD virando rotas
| Ação | Método | Rota |
|---|---|---|
| Registrar inspeção | `POST` | `/inspecoes` |
| Listar inspeções | `GET` | `/inspecoes` |
| Atualizar item | `PATCH` | `/inspecoes/7` |
| Cancelar inspeção | `DELETE` | `/inspecoes/7` |

REST: o **recurso** fica no endereço, a **ação** fica no método.

---

## Registrando uma inspeção
```http
POST /inspecoes HTTP/1.1
Content-Type: application/json

{ "equipamento": "CAM-07", "operador": "Ana", "turno": "A" }
```

A resposta `201 Created` devolve a inspeção nova, já com o seu `id`.

---

## Qual método?
O operador marcou "Luzes: ok" por engano na inspeção 7 e precisa corrigir para reprovado.

- [ ] `GET /inspecoes/7`
- [ ] `POST /inspecoes`
- [x] `PATCH /inspecoes/7`
- [ ] `DELETE /inspecoes/7`

---

## Qual método?
A inspeção 7 foi aberta para o equipamento errado e precisa ser descartada.

- [ ] `PATCH /inspecoes/7`
- [x] `DELETE /inspecoes/7`
- [ ] `GET /inspecoes`
- [ ] `POST /inspecoes/7`

---

# Parte 5 — Recursos da web
Webhooks, upload e streaming na mineração

---

## Webhook: o aviso automático
+ Sem webhook, a manutenção abre o sistema toda hora: "tem freio reprovado?"
+ Isso se chama **polling**: muito pedido à toa, e o aviso chega atrasado
+ Com webhook, o sistema **avisa sozinho** quando um item crítico é reprovado
+ A manutenção só se cadastra **uma vez** para receber os avisos

---

## Upload: a foto da avaria
+ O operador fotografa o **pneu cortado** ou o **vazamento de óleo**
+ O celular envia o arquivo com um `POST`
+ O formulário usa o formato `multipart/form-data`
+ O servidor guarda a imagem e devolve o **endereço** dela, que vai junto com a inspeção

---

## Streaming: aos poucos
+ Em vez de esperar tudo pronto, a resposta chega **em pedaços**
+ Vídeos e músicas tocam enquanto ainda estão baixando
+ No chat de uma IA, o texto aparece **palavra por palavra**
+ Você lê o começo do relatório enquanto o resto ainda está sendo gerado

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
| **Contexto** | Onde estou? | Estou criando um checklist de inspeção de equipamentos |
| **Tarefa** | O que eu quero? | Crie uma inspeção de exemplo |
| **Formato** | Como quero? | Só JSON válido, sem comentários |

---

## Prompt vago x prompt claro
- Vago: *"faz um json de inspeção"*
- Claro: *"Estou criando um checklist de inspeção de equipamentos de mineração. Crie o arquivo `inspecao.json` com uma inspeção de exemplo: id, equipamento, operador, turno e uma lista de itens com nome e status (ok ou reprovado). Responda só com JSON válido."*

> O prompt claro gasta **uma** mensagem. O vago costuma gastar três.

---

## Validando o JSON
A IA pode errar. Confira no terminal:

```bash
python3 -m json.tool inspecao.json
```

Se estiver certo, o JSON aparece organizado. Se tiver erro, ele mostra a linha.

---

## Mão na massa: inspecao.json
1. Escreva o prompt com **contexto, tarefa e formato**
2. Crie o arquivo `inspecao.json` com o que a IA gerou
3. **Valide** no terminal e corrija o que estiver errado
4. Confira: tem equipamento, operador e turno? Todo item tem nome e status **ok** ou **reprovado**?

[cronômetro 30]

---

## Mão na massa: tabela de rotas
No `README.md`, crie a seção **Rotas REST**:

```markdown
## Rotas REST
| Ação | Método | Rota |
|---|---|---|
| Registrar inspeção | POST | /inspecoes |
| Listar inspeções | GET | /inspecoes |
```

Complete com **atualizar item** e **cancelar inspeção**.

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
- ✅ O `inspecao.json` passa no `json.tool`
- ✅ Os nomes das chaves fazem sentido para a inspeção
- ✅ Todo item tem um status válido: ok ou reprovado
- ✅ Cada rota tem o método certo

> A IA é assistente. Quem assina o trabalho é você.

---

## Antes de entregar
Confira no seu repositório:

- ✅ `README.md` com o mapa do sistema
- ✅ 5 RF e 3 RNF em Markdown
- ✅ `inspecao.json` válido
- ✅ Tabela de rotas REST com as 4 ações

[cronômetro 10]

---

## Revisão
Qual rota lista todas as inspeções registradas?

- [x] `GET /inspecoes`
- [ ] `POST /inspecoes`
- [ ] `GET /inspecoes/7`
- [ ] `PATCH /inspecoes`

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

# A inspeção já é dado
Na próxima, ela começa a virar sistema
