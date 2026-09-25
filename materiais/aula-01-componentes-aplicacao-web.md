---
aula: 1
data: 2026-09-30
titulo: Componentes de uma aplicação web
turma: IA
descricao: Frontend, backend, banco, API e HTTP a partir de um Sistema de Comandas
---

# Por dentro de uma aplicação web
Do papel da comanda ao pedido que viaja pela internet

---

## Um palpite antes de tudo
Para abrir **uma** página comum, quantos pedidos o seu navegador faz?

- [ ] 1: a página vem inteira de uma vez
- [ ] Uns 5
- [x] Cerca de 70
- [ ] Mais de 10 mil

---

## Cerca de 70 pedidos. Por página.
+ Cada imagem, fonte e script é um **pedido** separado
+ Na mediana, uma página no computador faz **71 pedidos**
+ Você não vê nenhum deles, mas eles estão lá
+ Hoje você vai aprender a **enxergar** esses pedidos

> Fonte: Web Almanac 2024 (HTTP Archive), páginas no computador.

---

## Desafio: o que está escrito aqui?
### `01001111 01001001`

+ Cada 0 ou 1 é um **bit**
+ 8 bits formam um **byte**
+ Cada byte desta mensagem é uma **letra**
+ A mensagem é: **OI** 👋

---

## Como o computador lê um byte
Cada posição vale o dobro da anterior. Some as posições com 1:

```
posição:  128  64  32  16   8   4   2   1
bits:       0   1   0   0   1   1   1   1

64 + 8 + 4 + 2 + 1 = 79  →  letra "O"
```

---

## Sua vez
Quanto vale o byte `00000101`?

- [ ] 3
- [x] 5
- [ ] 6
- [ ] 101

---

# Como tudo começou
De 0 e 1 até a IA que escreve código

---

## Das contas às máquinas
| Ano | O que aconteceu |
|---|---|
| 1703 | Leibniz publica a aritmética **binária**: tudo com 0 e 1 |
| 1843 | Ada Lovelace escreve o **primeiro algoritmo** para uma máquina |
| 1946 | **ENIAC**: 30 toneladas, 18 mil válvulas, programado por seis mulheres |
| 1947 | **Transistor**: um interruptor minúsculo que substitui a válvula |
| 1952 | Grace Hopper cria o **compilador** A-0: código mais perto da nossa língua |

---

## Curiosidade
Em 1969, a ARPANET, avó da internet, ligou dois computadores. Qual foi a primeira mensagem?

- [ ] "HELLO"
- [x] "LO"
- [ ] "OI"
- [ ] "TESTE"

---

## "LO" de LOGIN
+ Iam digitar **LOGIN** de um computador para o outro
+ Chegaram o **L** e o **O**... e o sistema travou
+ Uma hora depois, o LOGIN completo funcionou
+ Primeira lição da rede: **nem todo pedido chega** 😅

---

## Da rede à web
| Ano | O que aconteceu |
|---|---|
| 1969 | ARPANET conecta os primeiros computadores |
| 1989 | Tim Berners-Lee propõe a **web** no CERN |
| 1990 | Nascem **HTML**, **HTTP** e **URL**, e o primeiro servidor |
| 1995 | **JavaScript** deixa as páginas interativas |
| 2022 | **ChatGPT** populariza a IA que conversa e escreve código |

---

## O primeiro site ainda está no ar
Aponte a câmera e visite o endereço do primeiro servidor web da história.

[qrcode https://info.cern.ch info.cern.ch]

---

## E o que isso tem a ver com hoje?
+ Tudo ainda vira **0 e 1** lá no fundo
+ A web de 1990 já tinha **cliente, servidor e HTTP**
+ A IA escreve código, mas ele roda **nessas mesmas peças**
+ Quem conhece as peças manda na IA, e não o contrário

---

# Termômetro da turma
O que você já sabe? Sem nota, só para a gente se conhecer

---

## Termômetro: levante os dedos
**0** nunca ouvi · **1** já ouvi · **2** sei explicar · **3** já usei

+ Frontend
+ Backend
+ Banco de dados
+ API
+ HTTP
+ Cliente x Servidor

---

## Pergunta 1 de 4
Qual destes é um exemplo de **frontend**?

- [x] A tela de login de um app
- [ ] O servidor que confere a senha
- [ ] A tabela que guarda os usuários
- [ ] O cabo de rede do servidor

---

## Pergunta 2 de 4
Num app de delivery, onde fica o cardápio que você vê?

- [ ] Dentro do celular, desde a instalação
- [ ] Salvo no navegador para sempre
- [x] Num servidor, que envia os dados quando você abre o app
- [ ] No GPS do celular

---

## Pergunta 3 de 4
O que é uma **API**?

- [ ] Um tipo de banco de dados
- [x] Um jeito combinado de dois sistemas conversarem
- [ ] Uma linguagem de programação
- [ ] Um navegador mais rápido

---

## Pergunta 4 de 4
O que o **S** de HTTP**S** quer dizer?

- [ ] Servidor
- [ ] Sistema
- [x] Seguro: os dados viajam criptografados
- [ ] Super rápido

---

## Placar da turma
Anote no quadro quantos acertaram cada pergunta.

> No fim da aula, a gente faz o termômetro de novo e compara. 📈

---

## Hoje você vai
+ Levantar as necessidades de um restaurante real
+ Transformar necessidades em requisitos (RF e RNF)
+ Identificar frontend, backend, banco de dados e API
+ Ver requisições HTTP de verdade no navegador

---

## Nosso roteiro
| Parte | Atividade | Tempo |
|---|---|---|
| 0 | Abertura: binário, história e termômetro | 20 min |
| 1 | Design Thinking: o problema das comandas | 35 min |
| 2 | Dinâmica: encenando um pedido | 25 min |
| 3 | Prática: HTTP no DevTools + entregável | 40 min |

---

# Parte 1 — Design Thinking
O problema das comandas de papel

---

## O restaurante hoje
O garçom anota o pedido num bloco de papel e leva até a cozinha.

+ A comanda se **perde** no caminho
+ A **letra ilegível** vira o prato errado
+ A **soma** do total sai errada no caixa
+ Ninguém sabe quanto tempo o pedido está esperando

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

## Requisito funcional (RF)
**O que** o sistema faz. Uma ação que o usuário consegue realizar.

- RF01 — O sistema deve registrar o pedido de uma mesa
- RF02 — O sistema deve mostrar os pedidos para a cozinha
- RF03 — O sistema deve calcular o total da comanda

> Dica: comece com "O sistema deve..." e use um verbo de ação.

---

## Requisito não funcional (RNF)
**Como** o sistema deve ser. Qualidade, restrição ou ambiente.

- RNF01 — Deve funcionar no **celular** do garçom
- RNF02 — Deve usar **HTTPS** para proteger os dados
- RNF03 — Deve ter **custo zero** de hospedagem

> RNF não é uma tela nem um botão: é uma regra que vale para o sistema todo.

---

## RF ou RNF?
"A cozinha deve ver os pedidos na ordem em que chegaram."

- [x] RF: é algo que o sistema faz
- [ ] RNF: é uma qualidade do sistema
- [ ] Nenhum dos dois: é só uma opinião

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

# Parte 2 — O caminho de um pedido
Cliente x Servidor, com HTTP no meio

---

## Cliente x Servidor
+ **Cliente**: quem pede. Na web, é o seu navegador ou app
+ **Servidor**: quem atende. Um computador que responde pedidos
+ O cliente **sempre começa** a conversa
+ O servidor **responde** e volta a esperar o próximo pedido

---

## As peças de uma aplicação web
| Na web | No restaurante | Papel |
|---|---|---|
| Frontend | Salão | O que o usuário vê e toca |
| API | Garçom | Leva pedidos e traz respostas |
| Backend | Cozinha | Aplica as regras e processa |
| Banco de dados | Despensa | Guarda os dados com segurança |

---

## HTTP: a língua do pedido
Toda conversa é um par: o cliente envia uma **requisição** e o servidor devolve uma **resposta**.

```http
POST /api/pedidos HTTP/1.1
Host: comandas.exemplo.com
Content-Type: application/json

{ "mesa": 7, "itens": ["X-Burger", "Suco"] }
```

---

## Métodos: o que o cliente quer
| Método | Serve para | No restaurante |
|---|---|---|
| `GET` | Buscar dados | Ver o cardápio |
| `POST` | Criar algo novo | Fazer um pedido |
| `PUT` / `PATCH` | Alterar algo | Trocar o suco por refri |
| `DELETE` | Remover | Cancelar o pedido |

---

## Status: como foi o atendimento
| Faixa | Significa | Exemplo |
|---|---|---|
| `2xx` | Deu certo | `200` OK, `201` pedido criado |
| `3xx` | Procure em outro lugar | `301` o endereço mudou |
| `4xx` | Erro de quem pediu | `404` prato não existe |
| `5xx` | Erro de quem atende | `500` o fogão quebrou |

---

## Qual é o status?
O cliente pede um prato que não existe no cardápio.

- [ ] `200`
- [ ] `201`
- [x] `404`
- [ ] `500`

---

## E a IA com isso?
Ferramentas de IA escrevem código, mas **você** precisa dizer onde ele entra.

- Vago: *"faz um sistema de comandas"*
- Preciso: *"crie no backend uma rota `POST /api/pedidos` que salve a mesa e os itens no banco"*

> Quem conhece as peças faz pedidos melhores para a IA e confere o que ela entregou.

---

## Dinâmica: encenando o pedido
+ **Cliente**: faz o pedido no salão
+ **Salão (Frontend)**: mostra o cardápio e monta o pedido
+ **Garçom (API)**: leva o pedido com método e endereço
+ **Cozinha (Backend)**: confere, prepara e calcula
+ **Despensa (Banco de dados)**: guarda e entrega os dados

---

## Mão na massa: dinâmica
1. Formem grupos de 5 e dividam os papéis
2. Encenem um pedido que **dá certo** (`201`)
3. Encenem um pedido **com erro** (`404` ou `500`)
4. Registrem o fluxo no quadro, com setas e status

[cronômetro 15]

---

## O fluxo de um pedido
1. O cliente escolhe os pratos no **frontend**
2. O frontend envia `POST /api/pedidos` pela **API**
3. O **backend** confere os itens e calcula o total
4. O **banco de dados** grava o pedido
5. A resposta `201` volta e a tela confirma

---

## Onde fica a regra?
Em qual componente deve ficar o cálculo do total da comanda?

- [ ] Frontend, para aparecer mais rápido
- [x] Backend, onde a regra é confiável
- [ ] Banco de dados, junto com o pedido
- [ ] API, porque ela transporta o pedido

---

# Parte 3 — HTTP de verdade
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
3. Anote de cada uma: método, endereço e status
4. Diga quem é o **cliente** e quem é o **servidor**

[cronômetro 15]

---

## Entregável: requisitos.txt
```
SISTEMA DE COMANDAS
Nome:

REQUISITOS FUNCIONAIS
RF01 - O sistema deve ... (até RF05)

REQUISITOS NÃO FUNCIONAIS
RNF01 - O sistema deve ... (até RNF03)

MAPA DO SISTEMA
Componentes: Frontend, API, Backend, Banco de dados
Fluxo de um pedido (até 5 passos):
1.
```

---

## Mão na massa: entregável
1. Crie o arquivo `requisitos.txt` seguindo o modelo
2. Passe a limpo os **5 RF** e os **3 RNF** do seu grupo
3. Escreva o **mapa**: componentes e fluxo em até 5 passos

[cronômetro 25]

---

## Antes de entregar
Confira no seu `requisitos.txt`:

- ✅ 5 RF começando com "O sistema deve..."
- ✅ 3 RNF sobre qualidade (celular, HTTPS, custo...)
- ✅ Frontend, API, backend e banco no mapa
- ✅ Fluxo de um pedido em até 5 passos

---

## Revisão
No DevTools, uma requisição aparece com status `500`. De quem é o problema?

- [ ] Do cliente, que pediu errado
- [x] Do servidor, que falhou ao atender
- [ ] Da internet do aluno
- [ ] Do navegador, que precisa ser atualizado

---

## Termômetro de novo
Levante os dedos outra vez e compare com o placar do começo.

+ Frontend
+ Backend
+ Banco de dados
+ API
+ HTTP
+ Cliente x Servidor

---

## O que vimos hoje
+ Design Thinking começa entendendo quem sofre com o problema
+ RF diz o que o sistema faz; RNF, como ele deve ser
+ Frontend, API, backend e banco trabalham como salão, garçom, cozinha e despensa
+ HTTP é a conversa: método e endereço na ida, status na volta

---

# Todo clique é um pedido
E agora você sabe quem atende cada um deles
