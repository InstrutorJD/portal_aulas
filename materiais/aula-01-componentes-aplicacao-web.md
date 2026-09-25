---
aula: 1
data: 2026-09-30
titulo: Do bit à IA: como uma aplicação web funciona
turma: IA
descricao: Boas-vindas, história, binário, linguagens, como a IA pensa e o caminho de um pedido
---

# Do bit à IA
Aula 1: como a tecnologia conversa, e onde a IA entra nisso

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
+ Até o fim da aula, você vai saber **quem atende** cada um

> Fonte: Web Almanac 2024 (HTTP Archive), páginas no computador.

---

# Termômetro da turma
O que você já sabe? Sem nota, só para a gente se conhecer

---

## Termômetro: levante os dedos
**0** nunca ouvi · **1** já ouvi · **2** sei explicar · **3** já usei

+ Binário (bit e byte)
+ Linguagem de programação
+ IA generativa
+ Frontend e backend
+ API
+ HTTP

---

## Pergunta 1 de 3
Como o computador guarda tudo o que você vê na tela?

- [ ] Em letras e números, como a gente escreve
- [x] Em 0 e 1
- [ ] Em imagens pequenas
- [ ] Depende do programa

---

## Pergunta 2 de 3
Qual destes é um exemplo de **frontend**?

- [x] A tela de login de um app
- [ ] O servidor que confere a senha
- [ ] A tabela que guarda os usuários
- [ ] O cabo de rede do servidor

---

## Pergunta 3 de 3
Uma IA como o ChatGPT **sempre** acerta quando responde com segurança?

- [ ] Sim, ela busca a resposta num banco de verdades
- [ ] Sim, se a pergunta for bem escrita
- [x] Não, ela pode inventar com toda a confiança
- [ ] Não, ela só erra em matemática

---

## Placar da turma
Anote no quadro quantos acertaram cada pergunta.

> No fim da aula, a gente faz o termômetro de novo e compara. 📈

---

## O que você vai aprender no curso
+ Como computadores, internet e web funcionam por dentro
+ Criar páginas com **HTML**, **CSS** e **JavaScript**
+ Guardar e consultar dados com **SQL**
+ Programar **com ajuda da IA**, e revisar o que ela faz

---

## Nossas ferramentas
| Ferramenta | Para quê |
|---|---|
| Navegador | Ver e testar o que a gente cria |
| Editor de código | Escrever HTML, CSS, JavaScript e SQL |
| GitHub Copilot | Assistente que sugere código enquanto você digita |
| Codex | Agente que executa tarefas inteiras de desenvolvimento |

---

## Projeto integrador: Sistema de Comandas
Um restaurante ainda anota os pedidos em comanda de papel.

+ A comanda se **perde** no caminho até a cozinha
+ A **letra ilegível** vira o prato errado
+ A **soma** do total sai errada no caixa
+ Ao longo do curso, **você** vai construir o sistema que resolve isso

---

## Roteiro de hoje
1. Boas-vindas e o curso (15 min)
2. Como tudo começou: binário e computador (15 min)
3. Linguagens de programação (20 min)
4. Como uma IA "pensa" (25 min)
5. Em grupo: tipos de IA no restaurante (25 min)
6. O caminho de um pedido na web (20 min)

---

# Como tudo começou
Das máquinas de calcular aos computadores

---

## Das contas às máquinas
| Ano | O que aconteceu |
|---|---|
| 1642 | Pascal cria a **Pascaline**: soma e subtrai com engrenagens |
| 1703 | Leibniz publica a aritmética **binária**: tudo com 0 e 1 |
| 1837 | Babbage projeta a **máquina analítica**, um computador mecânico |
| 1843 | Ada Lovelace escreve o **primeiro algoritmo** para essa máquina |
| 1946 | **ENIAC**: 30 toneladas, 18 mil válvulas, programado por seis mulheres |

---

## A máquina de 1837 já tinha as 4 partes
| Na máquina de Babbage | Hoje | Função |
|---|---|---|
| Leitor de cartões | Teclado, mouse, toque | **Entrada** |
| Moinho (*mill*) | Processador (CPU) | **Processamento** |
| Armazém (*store*) | Memória RAM e disco | **Memória** |
| Impressora | Tela, som, impressora | **Saída** |

---

## Entrada, processamento, memória e saída
Você toca no botão "Pedir" no app do restaurante. Esse toque é...

- [x] Entrada
- [ ] Processamento
- [ ] Memória
- [ ] Saída

---

## Por que 0 e 1?
+ Um processador tem **bilhões de transistores**
+ Cada transistor é um interruptor: **ligado ou desligado**
+ Ligado = **1**, desligado = **0**
+ Com interruptores suficientes, dá para representar **qualquer coisa**

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

## Do transistor à web
| Ano | O que aconteceu |
|---|---|
| 1947 | **Transistor**: o interruptor minúsculo que substitui a válvula |
| 1969 | **ARPANET**, avó da internet, conecta os primeiros computadores |
| 1989 | Tim Berners-Lee propõe a **web** no CERN |
| 1990 | Nascem **HTML**, **HTTP** e **URL**, e o primeiro servidor |
| 1995 | **JavaScript** deixa as páginas interativas |

---

## Curiosidade
Qual foi a primeira mensagem enviada pela ARPANET, em 1969?

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

## O primeiro site ainda está no ar
Aponte a câmera e visite o endereço do primeiro servidor web da história.

[qrcode https://info.cern.ch info.cern.ch]

---

# Linguagens de programação
Como a gente conversa com a máquina

---

## Algoritmo é uma receita
1. Ferva 500 ml de água
2. Coloque o macarrão
3. Espere 3 minutos
4. Misture o tempero
5. Sirva

> **Algoritmo**: passos claros, em ordem, que resolvem um problema.

---

## Qual passo está ruim?
Qual destes **não** serve como passo de um algoritmo?

- [ ] Ferva 500 ml de água
- [ ] Espere 3 minutos
- [x] Cozinhe até ficar bom
- [ ] Desligue o fogo

---

## Baixo nível x alto nível
| Nível | Exemplo | Quem entende |
|---|---|---|
| Linguagem de máquina | `10110000 01100001` | Só o processador |
| Assembly | `MOV AL, 61h` | Especialistas |
| Alto nível | `total = preco * quantidade` | Pessoas |

Quanto mais alto o nível, mais perto da nossa língua.

---

## Do código-fonte à máquina
+ Você escreve o **código-fonte**: texto que pessoas leem
+ O processador só entende **linguagem de máquina**: 0 e 1
+ Alguém precisa **traduzir** um no outro
+ Existem dois jeitos: **compilar** ou **interpretar**

---

## Compilação x interpretação
| Compilação | Interpretação |
|---|---|
| Traduz tudo **antes** de rodar | Traduz **enquanto** roda |
| Gera um programa pronto (executável) | Precisa do interpretador junto |
| Como um livro traduzido inteiro | Como um intérprete ao vivo |
| Ex.: C, Go, Rust | Ex.: Python, JavaScript no navegador |

---

## As linguagens do curso
| Linguagem | Para quê | No Sistema de Comandas |
|---|---|---|
| HTML | Estrutura da página | A tela do cardápio |
| CSS | Aparência | Cores e layout no celular |
| JavaScript | Comportamento | Somar o total, enviar o pedido |
| SQL | Consultar e guardar dados | Os pedidos no banco |

> HTML é marcação e CSS é estilo: não são linguagens de programação, mas são essenciais.

---

## Um algoritmo de verdade
Somar a comanda em JavaScript: fim da soma errada no caixa.

```js
const itens = [
  { nome: "X-Burger", preco: 22 },
  { nome: "Suco", preco: 8 },
];

let total = 0;
for (const item of itens) {
  total = total + item.preco;
}

console.log("Total: R$ " + total); // Total: R$ 30
```

---

## Compilado ou interpretado?
O navegador lê o seu JavaScript e executa na hora. Isso é...

- [ ] Compilação
- [x] Interpretação
- [ ] Linguagem de máquina
- [ ] Assembly

---

# Como uma IA "pensa"
Spoiler: não é do jeito que a gente pensa

---

## Aprender com exemplos
+ Um programa comum segue **regras escritas por pessoas**
+ Uma IA **descobre as regras** sozinha, a partir de exemplos
+ Milhares de fotos de gato → ela reconhece um gato
+ Modelos de linguagem aprenderam com **quantidades enormes de texto**

---

## Complete a frase
### "Batatinha quando nasce..."

+ Você completou sem pensar
+ Porque já viu esse **padrão** muitas vezes
+ A IA faz a mesma coisa, em escala gigante
+ Ela reconhece **padrões**, não "sabe" as coisas como a gente

---

## Tokens: a IA lê em pedaços
Nem letra por letra, nem palavra por palavra: **tokens**, pedaços de texto. Em inglês, 1 token ≈ 4 letras.

```
"O garçom anotou o pedido"
→ [O] [ gar] [çom] [ an] [otou] [ o] [ pedido]
  (divisão ilustrativa)
```

---

## Prever a próxima palavra
### "O cliente pediu um X-Burger e um..."

| Próximo token | Chance |
|---|---|
| suco | 40% |
| refrigerante | 35% |
| batata | 20% |
| guarda-chuva | 0,01% |

Chances ilustrativas. A IA escolhe um dos mais prováveis e repete, token por token.

---

## Como a IA monta a resposta?
Como um modelo de linguagem gera o texto de uma resposta?

- [ ] Busca a resposta pronta num banco de dados
- [x] Prevê o próximo token, várias vezes seguidas
- [ ] Entende a pergunta como um humano
- [ ] Copia o primeiro resultado do Google

---

## Alucinação
+ A IA gera o texto **mais provável**, não o **verdadeiro**
+ Muitas vezes, em vez de dizer "não sei", ela **inventa**
+ E inventa **com a mesma confiança** de quando acerta
+ Isso se chama **alucinação**

---

## Alucinação em código
```js
// Pedido à IA: "some o total da comanda"
const total = itens.somarTudo();
```

Parece certo, mas `somarTudo()` **não existe** no JavaScript. O código quebra.

---

## Regra de ouro: revise tudo
1. **Leia** o que a IA gerou
2. **Teste** de verdade
3. **Confira** na documentação oficial
4. Só então **use**

> A IA é assistente. A responsabilidade continua sendo sua.

---

## E agora?
A IA respondeu com segurança e o código parece certo. O que você faz?

- [ ] Usa direto: ela parece ter certeza
- [ ] Pergunta para a própria IA se está certo
- [x] Testa e confere antes de usar
- [ ] Desiste de usar IA

---

# Tipos de IA
Cada problema pede uma ferramenta

---

## Quatro tipos de IA
| Tipo | O que faz | Exemplo |
|---|---|---|
| Preditiva | Prevê números a partir do histórico | Prever as vendas do sábado |
| Generativa (texto e imagem) | Cria conteúdo novo | Texto do cardápio, foto do prato |
| Assistente de código | Sugere código enquanto você digita | GitHub Copilot |
| Agente de desenvolvimento | Executa uma tarefa inteira, em várias etapas | Codex |

---

## Assistente x agente
+ **Assistente** (Copilot): sugere a próxima linha, você decide cada passo
+ **Agente** (Codex): recebe uma tarefa, lê o projeto, altera arquivos e roda testes
+ O agente trabalha mais sozinho, mas **mostra o que mudou** para você aprovar
+ Nos dois casos: **você revisa** antes de aceitar

---

## Aquecimento
O restaurante quer saber quantos hambúrgueres comprar para o sábado.

- [x] IA preditiva
- [ ] IA generativa
- [ ] Assistente de código
- [ ] Agente de desenvolvimento

---

## Cenários do restaurante
1. Escrever a descrição dos pratos do novo cardápio
2. Prever o movimento do próximo feriado
3. Completar a função que soma a comanda
4. Criar fotos dos pratos para o Instagram
5. Criar a tela de pedidos inteira a partir de uma descrição
6. Descobrir qual ingrediente vai faltar no estoque

---

## Mão na massa: em grupo
1. Formem grupos de 4
2. Para cada cenário, escolham o **tipo de IA**
3. Justifiquem cada escolha em **uma frase**
4. Cada grupo apresenta **um** cenário para a turma

[cronômetro 20]

---

## Gabarito
+ 1. Descrição dos pratos → **generativa de texto**
+ 2. Movimento do feriado → **preditiva**
+ 3. Completar a função → **assistente de código**
+ 4. Fotos dos pratos → **generativa de imagem**
+ 5. Tela de pedidos inteira → **agente de desenvolvimento**
+ 6. Ingrediente em falta → **preditiva**

---

# O caminho de um pedido
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

## No quadro: o fluxo de um pedido
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

## E a IA com isso?
Para pedir código à IA, **você** precisa dizer onde ele entra.

- Vago: *"faz um sistema de comandas"*
- Preciso: *"crie no backend uma rota `POST /api/pedidos` que salve a mesa e os itens no banco"*

> Quem conhece as peças faz pedidos melhores para a IA e confere o que ela entregou.

---

## Checklist de hoje
Confira com o seu grupo:

- ✅ Cada cenário do restaurante tem um tipo de IA
- ✅ Cada escolha tem uma justificativa
- ✅ O fluxo do pedido tem frontend, API, backend e banco
- ✅ O fluxo foi registrado no quadro, em até 5 passos

---

## Termômetro de novo
Levante os dedos outra vez e compare com o placar do começo.

+ Binário (bit e byte)
+ Linguagem de programação
+ IA generativa
+ Frontend e backend
+ API
+ HTTP

---

## O que vimos hoje
+ O computador trabalha com **0 e 1**: bits e bytes
+ Todo computador tem entrada, processamento, memória e saída
+ Código-fonte vira linguagem de máquina: **compilação ou interpretação**
+ A IA **prevê tokens** e pode alucinar: revise sempre
+ Frontend, API, backend e banco: o **caminho de um pedido**

---

# Todo clique é um pedido
E agora você sabe quem atende cada um deles
