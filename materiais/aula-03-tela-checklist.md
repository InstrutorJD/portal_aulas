---
aula: 3
data: 2026-10-02
titulo: Do papel para a tela: HTML, CSS e JavaScript
turma: IA
descricao: Fim da Aula 2 (git, JSON e métodos, webhook), o primeiro contato com JavaScript e a tela do checklist com o Copilot
fonte: grande
---

# Do papel para a tela
Aula 3: o checklist ganha estrutura, aparência e comportamento

---

## Que tela é esta?
+ O operador escolhe o **CAM-07**
+ Marca cada item: **Conforme** ou **Não conforme**
+ Os **Freios** ficaram não conforme
+ Ele toca em **Finalizar**...
+ ... e a tela responde: ⛔ **INAPTO**. Quem decidiu isso?

---

## A resposta de hoje
+ Por trás dessa tela, existem **três linguagens** trabalhando juntas
+ Uma diz **o que existe** na tela, outra diz **como parece**
+ E a terceira **decide** e **reage** ao clique
+ Hoje você escreve o seu **primeiro programa** e depois monta a tela com o **Copilot**

---

## Termômetro: levante os dedos
**0** nunca ouvi · **1** já ouvi · **2** sei explicar · **3** já usei

+ Terminal e git (commit, push, pull)
+ JSON e métodos HTTP
+ HTML e CSS
+ Variável e condição (if)
+ Lista, laço (for) e função

---

## Roteiro de hoje (1/2)
- **Abertura**: a tela do checklist e o termômetro (5 min)
- **Parte 1**: o nosso repositório: Codespace, terminal e git (30 min)
- **Parte 2**: dados e métodos: JSON, POST, PATCH, DELETE (25 min)
- **Parte 3**: além do pedido e resposta: webhook, upload, streaming (10 min)
- ☕ **Intervalo** (20 min)

As Partes 1 a 3 são o que ficou da **Aula 2**.

---

## Roteiro de hoje (2/2)
- **Parte 4**: JavaScript: a lógica da inspeção, com desafios (75 min)
- **Parte 5**: a tela do checklist com o Copilot (65 min)
- **Fechamento**: revisão e termômetro (10 min)

Tudo **dentro do Codespace**: editor, terminal, Copilot e a página rodando.

---

# Parte 1 — O nosso repositório
Conta, Codespace, terminal e git

---

## Criando conta e repositório
1. Crie a sua conta em **github.com** (use um e-mail que você acessa)
2. Clique em **New repository**
3. Nome: `checklist-inspecao`, marque **Public**
4. Marque **Add a README file** e clique em **Create repository**

---

## O que é o Codespace?
+ Um **computador Linux na nuvem**, criado a partir do seu repositório
+ Abre no **navegador**: editor (o VS Code), terminal e arquivos
+ Nada é instalado no seu PC: ele só **mostra a tela** do computador lá longe
+ Os arquivos ficam na nuvem; quem leva para o GitHub é o **push**
+ Desligou? Ele **dorme** e guarda os arquivos até você voltar

---

## Vantagens x desvantagens
| Vantagens | Desvantagens |
|---|---|
| Zero instalação: qualquer PC com navegador | Precisa de **internet** o tempo todo |
| Mesmo ambiente para a turma toda | Grátis tem **limite**: 60 h por mês |
| Abre de qualquer lugar, até de casa | Parado **30 dias** sem uso, é apagado |
| Já vem com git, Python e Node | Sem **push**, o trabalho fica só nele |

---

## Quando usar (e quando não)
| Cenário | Codespace? |
|---|---|
| Laboratório onde não dá para instalar nada | ✅ Ideal |
| Estudar em casa, num PC fraco ou emprestado | ✅ Sim |
| Projeto grande, usado o dia inteiro | ⚠️ Gasta as horas grátis rápido |
| Sem internet, ou internet muito ruim | ❌ Instale o VS Code no PC |

Na mina: o técnico corrige o sistema de **qualquer** computador, sem instalar nada.

---

## Abrindo o Codespace
1. No repositório, clique no botão verde **Code**
2. Abra a aba **Codespaces**
3. Clique em **Create codespace on main**
4. Espere: um editor completo abre no navegador

> Grátis: até **60 horas por mês**. Ele desliga sozinho após **30 min** parado.

---

## Economizando as horas grátis
1. Terminou? **commit** e **push** antes de tudo
2. Depois, em **github.com/codespaces**: **⋯** → **Stop codespace**
3. Esqueceu? Ele para sozinho depois de **30 min** sem uso
4. Para voltar: **Code** → **Codespaces** → clique no seu codespace

> Parado, ele **não gasta horas**, só um pouco do espaço grátis (15 GB por mês).

---

## Terminal: pastas e arquivos
```bash
pwd              # em qual pasta estou?
ls               # o que tem aqui?
mkdir docs       # cria a pasta docs
cd docs          # entra nela / cd .. volta uma
touch teste.txt  # cria um arquivo vazio
rm teste.txt     # apaga o arquivo
rm -r docs       # apaga a pasta e tudo que tem nela
```

O terminal fica embaixo, no Codespace. **Cuidado:** `rm` não tem lixeira, apagou, sumiu.

---

## Mão na massa: terminal
1. Descubra em qual pasta você está com `pwd`
2. Liste os arquivos com `ls`: o `README.md` está aí?
3. Crie a pasta `docs`, entre nela e volte com `cd ..`
4. Crie `teste.txt` com `touch`, veja com `ls` e apague com `rm`
5. Apague a pasta com `rm -r docs`: o `ls` ainda mostra ela?

> Dica: a tecla **↑** repete o último comando. **Tab** completa o nome.

---

## Git: a máquina do tempo
+ **commit**: tira uma "foto" do projeto, com uma mensagem
+ **push**: envia as suas fotos para o GitHub
+ **pull**: traz do GitHub o que mudou lá
+ Cada commit fica no histórico, igual ao que você viu na Aula 2

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
## Requisitos
| ID | Requisito | Prioridade |
|---|---|---|
| RF01 | O sistema deve registrar... | Alta |
**negrito** e `código`
```

O **README.md** é a vitrine: é o que aparece primeiro no GitHub.

---

## Modelo do README.md
```markdown
# Checklist de Inspeção
## Mapa do sistema
Celular (frontend) → API → Backend → Banco de dados
## Requisitos
(cole aqui a tabela que o ChatGPT devolveu)
```

O **mapa** são as 4 peças da Aula 1, na ordem em que a inspeção passa.

---

## Mão na massa: primeiro commit
1. No ChatGPT, abra o projeto da Aula 2 e **copie** a tabela de requisitos
2. Monte o `README.md` como no **modelo**: o mapa e, embaixo, a tabela
3. Salve com `Ctrl + S` e rode `git status`
4. `git add README.md` e `git commit -m "Requisitos"`
5. `git push` e veja a **tabela** pronta no GitHub

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

# Parte 2 — Dados e métodos
A inspeção em JSON e as 4 ações com dados

---

## Do README para os dados
+ O README guarda o **texto** do projeto: o mapa e os requisitos
+ Mas o sistema troca **dados**: o equipamento, os itens, o status
+ Esses dados viajam em **JSON**, nos pedidos que você viu na Aula 2
+ Na API de treino, cada `todo` é um **item de checklist**
+ `title` é o nome do item; `completed` diz se ele está ok

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

## POST: criando um item
```bash
curl -i -X POST \
  https://jsonplaceholder.typicode.com/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Freios", "completed": false}'
```

`-X` = método, `-H` = cabeçalho, `-d` = o JSON enviado. Rode no terminal do **Codespace**: no PowerShell do Windows as aspas se perdem.

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
Anote o **status** e a **resposta** de cada um:

1. `POST` de um item seu: qual `id` voltou?
2. Busque esse `id` com `GET`: `curl -i` + o endereço `/todos/201`. Existe?
3. `PATCH` e `DELETE` no item 1
4. `GET` no `/todos/1` de novo: ele mudou? Sumiu?

> Tudo no terminal do **Codespace**. Sem `-X`, o `curl` faz `GET`.

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

## Mão na massa: rotas no README
No `README.md`, crie **à mão** a seção **Rotas REST** com as **4 ações**:

```markdown
## Rotas REST
| Ação | Método | Rota |
|---|---|---|
| Registrar inspeção | POST | /inspecoes |
```

Confira a tabela no **Preview** (ícone no canto superior direito do editor). Depois, commit e push.

---

# Parte 3 — Além do pedido e resposta
Webhook, upload e streaming

---

## Quando o servidor precisa avisar
+ Até agora, **você** sempre perguntou e o servidor respondeu
+ Mas e quando um freio é reprovado às 3h da manhã?
+ A manutenção precisa saber **na hora**, sem ficar perguntando
+ Dois jeitos de resolver: **polling** ou **webhook**

---

## Polling x webhook
| | Polling | Webhook |
|---|---|---|
| Quem pergunta? | A manutenção, toda hora | Ninguém: o sistema avisa |
| Pedidos | Muitos, quase todos "nada novo" | Um só, quando acontece |
| Atraso | Até a próxima pergunta | Na hora |
| No dia a dia | Ligar toda hora: "chegou?" | O entregador toca a campainha |

---

## Por dentro de um webhook
+ É só um **POST**, igual ao da Parte 2
+ Quem **envia**: o sistema onde algo aconteceu (o checklist)
+ Quem **recebe**: o sistema que precisa saber (o da manutenção)
+ A manutenção cadastra o endereço dela **uma vez** no checklist
+ O corpo é um **JSON** contando o que aconteceu

---

## O aviso do freio reprovado
```json
{
  "evento": "item_reprovado",
  "equipamento": "CAM-07",
  "item": "Freios",
  "operador": "Ana",
  "hora": "2026-10-01T03:12:00"
}
```

O checklist faz um **POST** com isso para o endereço da manutenção.

---

## Webhook de verdade: o GitHub
+ Todo repositório pode cadastrar webhooks em **Settings → Webhooks**
+ A cada `git push`, o GitHub faz um **POST** para o endereço cadastrado
+ O cabeçalho `X-GitHub-Event` diz o que aconteceu: `push`, `ping`...
+ O corpo em **JSON** traz o repositório, quem fez o push e os commits
+ É assim que robôs de teste e de publicação sabem que o código mudou

---

## Qual recurso?
A manutenção precisa ser avisada na hora em que um freio é reprovado.

- [ ] Upload de arquivo
- [ ] Streaming
- [x] Webhook
- [ ] Polling

---

## Upload: enviando um arquivo
+ Foto de avaria não é texto: vai como **arquivo**
+ O formato muda: `multipart/form-data`, os dados em **partes**
+ Na página, é o `<input type="file">`; no `curl`, a opção `-F`
+ O servidor guarda a foto e devolve o **endereço** dela

---

## Qual recurso?
O operador quer anexar à inspeção a foto de uma mangueira rachada.

- [x] Upload de arquivo
- [ ] Streaming
- [ ] Webhook
- [ ] `DELETE`

---

## Streaming: a resposta em pedaços
+ Normal: o servidor **monta tudo** e só depois envia
+ Streaming: ele envia **aos poucos**, enquanto ainda está gerando
+ Vídeo e música tocam enquanto ainda estão baixando
+ O ChatGPT da Aula 2 escreve palavra por palavra: é streaming

---

## Qual recurso?
O relatório de turno aparece palavra por palavra enquanto a IA escreve.

- [ ] Upload de arquivo
- [ ] Webhook
- [x] Streaming
- [ ] Polling

---

# ☕ Intervalo: 20 min
Na volta: a **tela** do checklist

---

# Parte 4 — JavaScript: a lógica da inspeção
O seu primeiro contato com programação

---

## Uma tela, três linguagens
| Linguagem | Papel | No checklist |
|---|---|---|
| **HTML** | Estrutura: **o que existe** | Itens e o botão Finalizar |
| **CSS** | Apresentação: **como parece** | Letra grande, verde e vermelho |
| **JavaScript** | Comportamento: **o que faz** | Clicou → apto ou inapto |

Hoje o foco é o **JavaScript**. HTML e CSS: só o básico para reconhecer.

---

## Demonstração: desmontando a tela
1. Abra o checklist da Aula 1 e aperte **F12**
2. Aba **Elementos**: apague a linha `<link rel="stylesheet">`
3. O que sobrou? A estrutura **sem roupa**
4. Dê **F5**: tudo volta, porque o arquivo não mudou

[Abrir o checklist da Aula 1](https://instrutorjd.github.io/portal_aulas/materiais/checklist/)

---

## Qual camada?
O botão **Finalizar** ficou grande e laranja, fácil de tocar com luva. Quem fez isso?

- [ ] HTML
- [x] CSS
- [ ] JavaScript
- [ ] O servidor

---

## HTML e CSS em 1 minuto
+ **HTML**: as peças da tela: `<select>`, `<input type="radio">`, `<button>`
+ Cada peça pode ter um `id`: o **nome** que o JavaScript usa para achá-la
+ **CSS**: cor, tamanho e espaço; o `@media` ajeita a tela no celular
+ Na Parte 5, a IA escreve os dois. Você só precisa **reconhecer**
+ O que decide **apto ou inapto** é o JavaScript: é nele que a gente mergulha

---

## Como os 3 arquivos se ligam
```html
<head>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  ... a tela ...
  <script src="script.js"></script>
</body>
```

O `index.html` chama os outros dois. O script fica no **fim**: só roda depois que a tela existe.

---

## O que é programar?
+ Lembra do **algoritmo** da Aula 1? Passos claros, em ordem
+ Programar é escrever esses passos numa **linguagem** que o computador entende
+ O JavaScript roda no **navegador** e também no **terminal** (com o Node)
+ Hoje: a regra da inspeção, **passo a passo**, no Codespace
+ Errar faz parte: o computador **avisa** onde errou

---

## Seu laboratório: treino.js
```bash
touch treino.js   # cria o arquivo
node treino.js    # roda o arquivo
```

Você escreve no `treino.js`, salva com `Ctrl + S` e roda no terminal. O **Node** já vem no Codespace.

---

## console.log: o programa fala
```js
console.log('Inspeção iniciada')
console.log('CAM-07')
console.log(3 + 2)
```

`console.log` mostra no terminal o que está entre parênteses. **Texto** vai entre aspas; **número**, não.

---

## 🎯 Desafio: o cabeçalho da inspeção
Contexto: toda folha de inspeção começa com um cabeçalho.

1. Crie o `treino.js` e mostre: `Checklist de Inspeção`
2. Na linha de baixo, mostre a data de hoje
3. Mostre o total de itens: 3 críticos **mais** 2 comuns, calculado pelo JS
4. Rode com `node treino.js`: saíram as 3 linhas?

---

## Variável: uma caixa com nome
### Contexto: a inspeção tem dados que o programa precisa **lembrar**.

```js
const equipamento = 'CAM-07'
const operador = 'Ana'
console.log(operador + ' inspecionou o ' + equipamento)
```

A variável guarda um valor e você usa pelo **nome**. O `+` junta textos.

---

## Tipos de valor
| Tipo | Exemplo | Na inspeção |
|---|---|---|
| Texto | `'Freios'` | O nome do item |
| Número | `1250` | O horímetro do caminhão |
| Booleano | `true` ou `false` | O item é crítico? Está conforme? |

Lembra do JSON? `'7'` com aspas é **texto**; `7` sem aspas é **número**.

---

## const ou let?
```js
const equipamento = 'CAM-07'   // não muda
let resultado = 'APTO'         // pode mudar
resultado = 'INAPTO'
console.log(resultado)
```

O `=` **guarda** um valor. O equipamento da inspeção não troca no meio dela: `const`. O resultado pode virar: `let`.

---

## 🎯 Desafio: a ficha do turno
Contexto: o supervisor quer ver quem inspecionou o quê.

1. Crie variáveis para o operador, o equipamento e o turno
2. Mostre a frase: `Ana inspecionou o CAM-07 no turno A`
3. Crie `let horimetro = 1250` e some as **8 horas** do turno
4. Tente mudar uma `const`: o que o terminal diz?

---

## Qual declaração?
O resultado começa **APTO** e pode virar **INAPTO** durante a avaliação.

- [ ] `const resultado = 'APTO'`
- [x] `let resultado = 'APTO'`
- [ ] `resultado === 'APTO'`
- [ ] `'resultado' = 'APTO'`

---

## Condição: se... senão
### Contexto: o freio não está conforme? Então o caminhão **não sai**.

```js
const freios = 'não conforme'
if (freios === 'não conforme') {
  console.log('INAPTO: não pode operar')
} else {
  console.log('APTO para o turno')
}
```

---

## Comparando valores
| Sinal | Pergunta | Exemplo |
|---|---|---|
| `===` | É igual? | `freios === 'conforme'` |
| `!==` | É diferente? | `freios !== 'conforme'` |
| `<` e `>` | É menor? É maior? | `combustivel < 25` |

> `=` **guarda**, `===` **compara**. Trocar um pelo outro é o erro nº 1.

---

## 🎯 Desafio: o tanque
Contexto: caminhão com pouco diesel não começa o turno.

1. Crie `let combustivel = 18` (em %)
2. Se estiver **abaixo de 25**, mostre: `Abastecer antes do turno`
3. Senão, mostre: `Combustível ok`
4. Teste com **18**, **25** e **90**: as 3 respostas fazem sentido?

---

## E e OU: duas condições
### Contexto: só bloqueia se o item for **crítico** **e** estiver não conforme.

```js
const critico = true
const conforme = false
if (critico && conforme === false) {
  console.log('INAPTO')
}
```

`&&` = **e**: as duas precisam ser verdade. `||` = **ou**: basta uma.

---

## Tabela verdade do `&&`
### Contexto: o item trava o caminhão?

| Item crítico? | Não conforme? | `critico && naoConforme` |
|---|---|---|
| `true` | `true` | `true` → ⛔ **INAPTO** |
| `true` | `false` | `false` → APTO |
| `false` | `true` | `false` → APTO |
| `false` | `false` | `false` → APTO |

Todas as combinações possíveis. O `&&` só dá `true` numa linha: as **duas** verdadeiras.

---

## 🎯 Desafio: crítico ou não?
Contexto: limpeza suja não para o caminhão; freio ruim para.

1. Rode o código do slide: apareceu INAPTO?
2. Troque `critico` para `false`: o que mudou? Qual linha da tabela é essa?
3. Acrescente um `else` que mostre `APTO`
4. Crie: se for **noite** OU tiver **neblina**, mostre `Conferir faróis`

---

## 🎯 Desafio: a tabela do `||`
Contexto: os faróis são conferidos se for **noite** OU tiver **neblina**.

| `noite` | `neblina` | noite **OU** neblina |
|---|---|---|
| `true` | `true` | ? |
| `true` | `false` | ? |
| `false` | `true` | ? |
| `false` | `false` | ? |

Complete no caderno. Depois, confira as 4 linhas no `treino.js` com `console.log(noite || neblina)`.

---

## Qual linha da tabela?
A **Limpeza** é não crítica (`false`) e está não conforme (`true`). O `critico && naoConforme` dá...

- [ ] `true`: um dos dois é verdade
- [x] `false`: o `&&` precisa dos dois
- [ ] `true`: ela está não conforme
- [ ] Erro: não dá para misturar

---

## Apto ou inapto?
Freios e Pneus conformes, **Limpeza da cabine** não conforme. Qual o resultado?

- [x] APTO: limpeza não é item crítico
- [ ] INAPTO: um item ficou não conforme
- [ ] Nenhum: o botão não foi clicado
- [ ] INAPTO: todos precisam estar conformes

---

## Lista: vários valores em ordem
### Contexto: o checklist não tem um item, tem **vários**.

```js
const itens = ['Freios', 'Pneus', 'Cinto']
console.log(itens[0])      // o 1º item
console.log(itens.length)  // quantos itens
itens.push('Extintor')     // acrescenta no fim
```

A contagem começa em **0**: o 1º item é o `itens[0]`.

---

## Laço: um por um
### Contexto: o operador confere **cada** item da lista, do primeiro ao último.

```js
for (const item of itens) {
  console.log('Conferir: ' + item)
}
```

O `for...of` repete o bloco **para cada** item. 3 itens = 3 voltas.

---

## 🎯 Desafio: a lista do caminhão
Contexto: o checklist do CAM-07 tem 5 itens.

1. Crie a lista: Freios, Pneus, Cinto, Limpeza e Combustível
2. Mostre **quantos** itens ela tem
3. Mostre o **primeiro** e o **último** item
4. Com o `for`, mostre cada item com `✔` na frente
5. Acrescente o `Extintor`: o total mudou?

---

## Lista de objetos: o item completo
### Contexto: como no JSON da Parte 2, cada item tem detalhes.

```js
const itens = [
  { nome: 'Freios', critico: true, conforme: true },
  { nome: 'Limpeza', critico: false, conforme: false },
]
for (const item of itens) {
  console.log(item.nome + ': ' + item.conforme)
}
```

---

## 🎯 Desafio: só os críticos
Contexto: o supervisor quer ver primeiro o que pode **parar** o caminhão.

1. Monte a lista de objetos com os **5 itens** (3 críticos)
2. Com o `for`, mostre **só** os itens críticos
3. Deixe um item crítico com `conforme: false`
4. Mostre `⛔` ao lado do item que falhou

> Dica: um `if` dentro do `for`.

---

## Função: a receita com nome
### Contexto: avaliar é algo que se faz **toda vez**, em todo equipamento.

```js
function avaliarInspecao(itens) {
  let resultado = 'APTO'
  // ...confere cada item...
  return resultado
}
console.log(avaliarInspecao(itens))
```

Entre parênteses, o que ela **recebe**. O `return` é o que ela **devolve**.

---

## Juntando tudo
```js
function avaliarInspecao(itens) {
  for (const item of itens) {
    if (item.critico && item.conforme === false) {
      return 'INAPTO'
    }
  }
  return 'APTO'
}
```

Achou um crítico não conforme? O `return` devolve INAPTO e a função **para ali**.

---

## Entendendo a função
| Linha | O que faz |
|---|---|
| `for (const item of itens)` | Passa por **cada** item da lista |
| `if (item.critico && ...)` | É crítico **e** não está conforme? |
| `return 'INAPTO'` | Achou um: devolve e **para** |
| `return 'APTO'` | Passou por todos e nenhum falhou |

---

## 🎯 Desafio: a função da inspeção
Contexto: essa é a regra que vai rodar na tela do operador.

1. **Digite** (sem copiar) a função no `treino.js`
2. Chame com todos conformes: deu APTO?
3. Deixe um item **crítico** não conforme: deu INAPTO?
4. E se só a **Limpeza** falhar?
5. Crie `mensagem(resultado)`: `Liberado para o turno` ou `Procure a manutenção`

---

## Evento: quando o operador toca
### Contexto: na tela, a função roda quando o operador **toca** em Finalizar.

```js
const botao = document.querySelector('#finalizar')
const saida = document.querySelector('#resultado')

botao.addEventListener('click', () => {
  saida.textContent = avaliarInspecao(itens)
})
```

---

## Entendendo o evento
+ `document.querySelector('#finalizar')`: acha na tela a peça com esse `id`
+ `addEventListener('click', ...)`: "**quando clicar**, faça isto"
+ `saida.textContent = ...`: escreve o resultado no parágrafo
+ Sem clique, **nada** acontece: o código fica esperando
+ O evento só existe no **navegador**: você vai vê-lo na Parte 5

---

## Qual peça?
O que faz a função `avaliarInspecao()` rodar na tela do operador?

- [ ] A variável `resultado`
- [ ] A lista `itens`
- [x] O evento de clique no Finalizar
- [ ] O `@media` do CSS

---

## Quando dá erro
| O terminal diz | O que aconteceu |
|---|---|
| `resultdo is not defined` | Nome escrito **diferente** |
| `Assignment to constant variable` | Tentou mudar uma `const` |
| `SyntaxError: Unexpected token` | Faltou `)`, `}` ou aspa |

O erro mostra **arquivo:linha**: comece a procurar por ali.

---

## 🎯 Desafio: quebre de propósito
Contexto: na mina, quem conserta precisa saber **ler** o defeito.

1. Na função, escreva `itns` em vez de `itens`: que erro? Qual linha?
2. Conserte. Agora apague uma `}`: o que o terminal diz?
3. Conserte. Tire uma aspa de um texto
4. Tudo consertado? `git add treino.js`, commit e push

---

## As 5 peças da lógica
| Peça | No checklist |
|---|---|
| **Variável** | `resultado`: guarda APTO ou INAPTO |
| **Lista** | `itens`: os itens do checklist |
| **Função** | `avaliarInspecao()`: avalia a inspeção |
| **Condição** | Item crítico não conforme → **INAPTO** |

E a 5ª: o **evento**, o clique em **Finalizar** que põe tudo para rodar.

---

## Comentário: explicando o código
```text
<!-- HTML: a lista de itens da inspeção -->
/* CSS: botão largo para tocar com luva */
// JS: confere cada item da lista
```

O computador **ignora** os comentários: eles são para **pessoas**. Cada linguagem tem o seu jeito de escrever.

---

## Comentário bom x ruim
- ✗ `// função` (só repete o que já está escrito)
- ✗ `// isso aqui faz coisas`
- ✓ `// se um item crítico falhar, o equipamento não sai`
- ✓ `// botão largo: o operador usa luva`

> Bom comentário diz **para que serve** e **por quê**, com as **suas** palavras.

---

## 🎯 Desafio: comente o treino
Contexto: amanhã outro técnico vai abrir o seu `treino.js`.

1. Escreva um comentário acima de **cada desafio** dizendo o que ele faz
2. Na função, comente o `for`, o `if` e os dois `return`
3. Leia para um colega: ele entendeu **sem** ver o código?

---

# Parte 5 — A tela do checklist
Com o Copilot, um arquivo por vez

---

## O que vai ser observado
+ A sua tela calcula **certo** o APTO e o INAPTO?
+ Você **explicou**, em comentários, o código que a IA gerou?
+ Não é sobre a tela mais bonita: é sobre **funcionar** e **entender**

---

## O plano: um arquivo por vez
1. `index.html`: pede, revisa, abre no navegador
2. `style.css`: pede, revisa, testa no modo celular
3. `script.js`: pede, revisa, testa apto e inapto
4. Comenta os 3 arquivos com as **suas** palavras
5. Commit e push a cada arquivo pronto

> Tudo de uma vez = um monte de código que ninguém revisou.

---

## Copilot Free: o que você tem
+ **Sugestões** enquanto você digita: 2.000 por mês
+ **Chat** para pedir e perguntar: **50 mensagens por mês**
+ Hoje: **3** mensagens para os arquivos e o resto para correções
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
| **Contexto** | Onde estou? | Checklist de inspeção, no celular |
| **Tarefa** | O que eu quero? | Crie **só** o `index.html` |
| **Formato** | Como quero? | Sem comentários: eu comento |

No chat, `#index.html` mostra ao Copilot o arquivo que já existe.

---

## Copie os prompts
[qrcode https://instrutorjd.github.io/portal_aulas/materiais/prompts-checklist/ instrutorjd.github.io/portal_aulas/materiais/prompts-checklist]

Abra **no computador**, numa aba ao lado do Codespace. Cada prompt tem o seu botão **Copiar**.

---

## Mão na massa: index.html
1. Cole o **prompt 1** no chat do Copilot
2. Repare: a resposta aparece **aos poucos**. É o **streaming** da Parte 3!
3. Leia o arquivo antes de clicar em **Manter** (*Keep*)
4. Ache o `select`, os rádios e o `id` do botão e do resultado
5. Os `name` estão **sem acento**? Tem o link do CSS e do JS?

---

## Rodando no Codespace
```bash
python3 -m http.server 8000
```

+ Aparece um aviso: clique em **Abrir no navegador** (*Open in Browser*)
+ Perdeu o aviso? Aba **Portas** (*Ports*), porta `8000`, ícone 🌐
+ Mudou o código? Salve e dê **F5** na página
+ **Ctrl + C** no terminal desliga o servidor

---

## Mão na massa: style.css
1. Cole o **prompt 2** no chat e revise antes de **Manter**
2. Dê **F5** na página: ela ganhou roupa?
3. **F12** → **Ctrl + Shift + M**: escolha um celular
4. Dá para tocar nas opções sem errar? A letra está legível?
5. Ficou bom? `git add .`, `git commit -m "Tela e estilo"` e `git push`

---

## Mão na massa: script.js
1. Cole o **prompt 3** no chat e revise antes de **Manter**
2. Ache as **5 peças**: variável, lista, função, condição e evento
3. Compare com o **seu** `treino.js`: o que ficou parecido? O que é novo?
4. Os nomes da lista batem com os `name` dos rádios do HTML?
5. **F5**, **F12** → **Console** aberto, e faça os testes do próximo slide

---

## Testes: a tela calcula certo?
| Você marca | A tela deve mostrar |
|---|---|
| Tudo conforme | ✅ **APTO** |
| Só a Limpeza não conforme | ✅ **APTO** |
| Freios não conforme | ⛔ **INAPTO** |
| Faltou um item ou o equipamento | Um **aviso** para completar |

Errou algum? Ainda não está pronto.

---

## Lendo o Console
| Erro (em vermelho) | Causa provável |
|---|---|
| `... is not defined` | Nome escrito diferente, ou não existe |
| `Cannot read properties of null` | O `id` não existe no HTML |
| `404` no `script.js` | Nome do arquivo errado no HTML |

À direita do erro: **arquivo:linha**. Clique e ele mostra **onde** está.

---

## Pedindo a correção ao Copilot
1. Leia o erro e clique em **arquivo:linha**
2. Tente entender **sozinho** primeiro: é nome? É `id`?
3. Não achou? Use o **prompt de correção** da página
4. Cole a frase **exata** do erro e diga o que você fez
5. Revise a mudança: ele mexeu **só** no necessário?

---

## Mão na massa: comente o código
1. `index.html`: um comentário por **bloco** (equipamento, itens, botão)
2. `style.css`: diga **por que** cada regra importante existe
3. `script.js`: comente as **5 peças** com as suas palavras
4. Travou numa linha? Pergunte ao Copilot, mas **escreva você**
5. `git add .`, `git commit -m "Checklist comentado"` e `git push`

---

## GitHub Pages: no celular de verdade
+ O GitHub **publica de graça** os arquivos de um repositório público
+ Ele abre o `index.html` da raiz: por isso o nome importa
+ Endereço: `seu-usuario.github.io/checklist-inspecao`
+ Cada `git push` **atualiza** o site em cerca de 1 minuto

---

## Ativando o Pages
1. No site do GitHub, abra o repositório e clique em **Settings**
2. No menu da esquerda, clique em **Pages**
3. Em **Source**, escolha **Deploy from a branch**
4. Em **Branch**, escolha `main` e a pasta `/ (root)` → **Save**
5. Espere ~1 min e atualize: o endereço aparece no topo (**Visit site**)

---

## Mão na massa: teste no celular
1. Abra o endereço do Pages no **seu celular**
2. Refaça os **4 testes**: o resultado é o mesmo do PC?
3. Troque de celular com um colega e teste a tela **dele**
4. Achou um problema na tela do colega? Mostre **onde** está

---

## Revise tudo o que a IA fez
- ✅ Os **4 testes** de apto e inapto passam
- ✅ O Console não mostra **nenhum** erro vermelho
- ✅ No modo celular, dá para tocar em tudo sem errar
- ✅ Você sabe apontar as **5 peças** no `script.js`

> A IA é assistente. Quem assina o trabalho é você.

---

## Antes de entregar
Abra o seu repositório **no site do GitHub** e confira:

- ✅ `README.md` com o mapa, os requisitos e as rotas
- ✅ `inspecao.json` válido
- ✅ `index.html`, `style.css` e `script.js` **comentados**
- ✅ A tela no ar pelo **GitHub Pages**

---

## Revisão
Qual arquivo decide se o equipamento está apto ou inapto?

- [ ] `index.html`
- [ ] `style.css`
- [x] `script.js`
- [ ] `README.md`

---

## Revisão
O Console mostra `Cannot read properties of null`. O que você confere primeiro?

- [ ] Se a internet caiu
- [x] Se o `id` usado no JS existe no HTML
- [ ] Se o CSS tem `@media`
- [ ] Se fez `git push`

---

## Revisão
Qual linha **compara** se os freios estão conformes?

- [ ] `freios = 'conforme'`
- [x] `freios === 'conforme'`
- [ ] `'freios' + 'conforme'`
- [ ] `const freios = 'conforme'`

---

## Termômetro de novo
Levante os dedos outra vez e compare com o começo.

+ Terminal e git (commit, push, pull)
+ JSON e métodos HTTP
+ HTML e CSS
+ Variável e condição (if)
+ Lista, laço (for) e função

---

## O que vimos hoje
+ GitHub guarda, Codespace roda, git leva e o **Pages** publica
+ Método é a ação, rota é o recurso; **webhook** é um POST que avisa
+ **HTML** estrutura, **CSS** apresenta, **JavaScript** dá comportamento
+ Variável, lista, função, condição e evento: a lógica do **apto ou inapto**
+ O **Console** mostra o erro; o comentário mostra que você **entendeu**

---

# A inspeção virou tela
E quem decide se o equipamento sai é um código que você entende
