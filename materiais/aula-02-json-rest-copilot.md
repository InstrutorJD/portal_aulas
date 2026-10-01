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

## ⚡ Responde Aí: revisão da Aula 1
8 perguntas rápidas sobre **tipos de IA**, **métodos HTTP** e **algoritmo**, respondidas no **celular**. Sem login.

- Leia o QR Code do telão com a câmera
- Toque na resposta antes do tempo acabar
- No fim, o telão mostra quanto a turma acertou

[Abrir o telão da revisão](https://instrutorjd.github.io/portal_aulas/professor/revisao.html?p=aula-02)

---

## Roteiro de hoje (4h)
- **Parte 1**: DevTools, aba Rede e Console (35 min)
- **Parte 2**: requisitos com um agente de IA (45 min)
- **Partes 3 e 4**: GitHub, Codespace e git (15 + 40 min)
- **Parte 5**: API de verdade e o JSON da inspeção (40 min)
- **Partes 6 e 7**: recursos da web e Copilot (5 + 35 min)

Mais mão na massa do que slide. Abertura e fechamento: 25 min.

---

# Parte 1 — HTTP de verdade
Primeiro à mão, no F12. Depois, com código

---

## O que é uma requisição?
+ O site precisa de algo? O navegador faz um **pedido** (a requisição)
+ O servidor devolve uma **resposta**: página, imagem ou **dados**
+ Uma página comum faz **dezenas** de pedidos só para abrir
+ Os pedidos de **dados** costumam voltar em **JSON**

---

## Por dentro de um pedido
| Parte | O que é | Exemplo |
|---|---|---|
| Método | A ação | `GET` = buscar |
| Endereço (URL) | Onde está o que foi pedido | `/todos/1` |
| Status | Como foi | `200` = deu certo, `404` = não existe |
| Cabeçalhos | Informações extras | O tipo do conteúdo |
| Corpo | O conteúdo em si | O JSON com os dados |

---

## Abrindo a aba Rede
1. Abra **g1.globo.com** (ou **apple.com/br**)
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

Clique numa linha: **Cabeçalhos** mostra método e status; **Resposta** mostra o corpo.

---

## Mão na massa: pesquisa no g1
1. No **g1.globo.com**, conte: **quantos** pedidos a página fez? (rodapé da Rede)
2. Filtre por **Fetch/XHR**: são os pedidos de **dados**
3. Escolha 3 pedidos: 1 documento, 1 Fetch/XHR, 1 imagem
4. Anote de cada um: **método, endereço e status**
5. Diga quem é o **cliente** e quem é o **servidor**

---

## Mão na massa: caçando os dados
1. Abra **jsonplaceholder.typicode.com** com a **Rede** aberta e dê **F5**
2. Filtre por **Fetch/XHR**: que pedido de dados a página fez? A qual site?
3. Na barra de endereço, abra `jsonplaceholder.typicode.com/todos/1`
4. Clique no pedido `1`: veja o **status** e, em **Resposta**, o JSON
5. Agora abra `/todos/999`: que **status** voltou? Por quê?

---

## O que você encontrou?
Num pedido Fetch/XHR, a resposta geralmente vem em qual formato?

- [ ] HTML
- [ ] Imagem PNG
- [x] JSON
- [ ] PDF

---

## E se der para fazer isso com código?
+ Até agora você **procurou à mão** os pedidos que o site fez
+ A aba **Console** do F12 executa **JavaScript** na hora
+ Com ela, você mesmo vai **listar** e **fazer** pedidos
+ É o seu primeiro contato com **programação**

> 1ª vez colando código? O navegador pede para digitar **permitir colar** (*allow pasting*). É proteção contra golpe: nunca cole código de estranhos.

---

## Aquecimento no Console
1. Volte para a página inicial: **jsonplaceholder.typicode.com**
2. **F12** → aba **Console**
3. Digite `2 + 2` e aperte **Enter**
4. Digite `document.title` e aperte **Enter**: o que apareceu?

**Enter** executa · **Shift + Enter** pula linha · **↑** repete o último comando

---

## 1º código: quem a página chamou?
```js
const tipos = ['fetch', 'xmlhttprequest']
performance.getEntriesByType('resource')
  .filter(e => tipos.includes(e.initiatorType))
  .map(e => e.name)
```

Cole no **Console** e aperte **Enter**. Que endereço apareceu?

---

## Entendendo o 1º código
| Trecho | O que faz |
|---|---|
| `const tipos = [...]` | Tipos que interessam: pedidos feitos por código |
| `performance.getEntriesByType(...)` | Lista **tudo** que a página baixou |
| `.filter(...)` | Fica só com os pedidos fetch e xhr |
| `.map(e => e.name)` | De cada pedido, mostra só o **endereço** |

**Pra que serve:** faz por código o que você fez à mão no filtro **Fetch/XHR**.

---

## O que é `fetch`?
+ É a função do JavaScript que **faz uma requisição HTTP** (*fetch* = buscar)
+ Você passa o **endereço**; ela pede ao servidor e traz a resposta
+ Sem dizer nada, faz um `GET`; também faz `POST`, `PATCH` e `DELETE`
+ É assim que um site busca **dados** sem recarregar a página
+ Na Parte 5, o `curl` faz o mesmo pelo terminal

> `await` = "espere a resposta chegar antes de seguir".

---

## 2º código: o seu primeiro fetch
```js
const r = await fetch('/todos/1')
r.status
await r.json()
```

Digite **uma linha por vez** no Console, apertando **Enter** em cada uma.

---

## Entendendo o 2º código
| Linha | O que faz |
|---|---|
| `const r = await fetch('/todos/1')` | Pede o item 1; a **resposta** fica em `r` |
| `r.status` | Mostra o **código** da resposta: `200` = deu certo |
| `await r.json()` | Lê o **corpo** e transforma o JSON em objeto |

**Pra que serve:** é o que você fez à mão ao abrir `/todos/1`, agora por código.

---

## Mão na massa: pedidos pelo Console
1. Rode o **2º código**: que **status** e que **JSON** voltaram?
2. Troque `/todos/1` por `/todos/5` e rode de novo: o que mudou?
3. Agora peça `/todos/999`: que **status** voltou? Igual ao da mão?
4. Olhe a aba **Rede**: os seus pedidos aparecem lá?
5. Rode o **1º código** de novo: a lista cresceu?

---

## 3º código: o que o navegador NÃO deixa
```js
// 1) na aba do JSONPlaceholder:
await fetch('https://example.com')

// 2) numa aba nova, em example.com:
const url = 'https://jsonplaceholder.typicode.com'
await fetch(url + '/todos/1')
```

Um dá **erro vermelho**, o outro funciona. Por quê?

---

## Entendendo o 3º código
- `fetch('https://example.com')`: pede **outro site** a partir do JSONPlaceholder
- `const url = '...'`: guarda o endereço numa **variável**, para a linha não ficar longa
- `url + '/todos/1'`: **junta** os textos e forma o endereço completo
- Nos dois, um site pede dados a **outro**; só muda quem responde

**Pra que serve:** ver na prática a regra de segurança que protege você.

---

## Mão na massa: o bloqueio
1. Rode a parte **1** do 3º código: copie a frase do erro que fala em **CORS**
2. Na aba **Rede**, que status aparece nesse pedido?
3. Abra **example.com** numa aba nova, **F12 → Console** e rode a parte **2**
4. Na **Rede**, clique no pedido `1` → **Cabeçalhos**
5. Ache na resposta o `access-control-allow-origin`: que site ele autoriza?

---

## Por que o navegador bloqueou?
- Sem regra, um site malicioso pediria dados a outro site **em seu nome**
- Por isso, o navegador só entrega a resposta se o **outro servidor autorizar**
- Essa autorização é o **CORS**: o cabeçalho `access-control-allow-origin`
- O JSONPlaceholder autoriza qualquer site; o example.com não autoriza
- O `curl` não tem essa trava: ela é do **navegador**, para proteger você

---

## Quem bloqueou?
O seu `fetch` para outro site deu erro de **CORS**. Quem barrou a resposta?

- [ ] O outro servidor caiu
- [x] O navegador: o outro site não autorizou
- [ ] O antivírus do computador
- [ ] Um erro de digitação no Console

---

## Qual comando?
No Console, qual destes faz uma **requisição HTTP** de verdade?

- [ ] `document.title`
- [x] `fetch('/todos/1')`
- [ ] `2 + 2`
- [ ] `performance.getEntriesByType('resource')`

---

## Por que estudar requisições?
+ O nosso checklist **vive** de requisições: `GET` busca equipamentos, `POST` envia a inspeção
+ Quando o app der erro, é no **F12** que você descobre se o problema foi o pedido ou a resposta
+ ChatGPT e Copilot também conversam com você por **requisições** HTTP
+ O Copilot vai escrever `fetch` para você: entender o que ele fez é o seu trabalho
+ Saber o que o navegador bloqueia (CORS) evita horas de erro sem explicação

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

## O que é um requisito?
+ É algo que o sistema **precisa** cumprir para resolver uma dor
+ Nasce de uma **necessidade**, como as da tabela anterior
+ **RF** (funcional): uma **ação** que o sistema faz
+ **RNF** (não funcional): **como** o sistema deve ser ao fazer
+ Se não dá para **testar**, ainda não é um bom requisito

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

## Tipos comuns de RF
| Tipo | Pergunta | Exemplo na inspeção |
|---|---|---|
| Cadastro | O que guardar? | Cadastrar equipamentos e operadores |
| Registro | Que ação o usuário faz? | Registrar uma inspeção com os itens |
| Consulta | O que dá para ver? | Listar o histórico de um equipamento |
| Regra de negócio | Que regra aplicar? | Bloquear se um item crítico reprovar |
| Aviso | Quem avisar? | Avisar a manutenção quando um freio reprova |

**Login** também é RF (a ação de entrar). O **quão protegido** ele é já é RNF.

---

## Tipos comuns de RNF
| Tipo | Pergunta | Exemplo na inspeção |
|---|---|---|
| Desempenho | É rápido? | Abrir em até 3 s no 4G |
| Usabilidade | É fácil? | Registrar uma inspeção em até 2 min |
| Segurança | É protegido? | Só usuário com login vê os dados |
| Compatibilidade | Funciona onde? | Chrome e Edge no celular, sem sinal |

---

## Escrevendo bem
- Comece com **"O sistema deve..."** + um **verbo**
- **Uma coisa** por requisito: se tem "e", talvez sejam dois
- RNF **mensurável**: tempo, quantidade, navegadores
- ✗ *"O sistema deve ser rápido"*
- ✓ *"O sistema deve abrir em até 3 s no 4G"*

---

## Como documentar
| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| RF01 | O sistema deve registrar a inspeção | Alta | Ela aparece no histórico |
| RF02 | O sistema deve bloquear equipamento reprovado | Alta | Não dá para liberá-lo |
| RNF01 | O sistema deve abrir em até 3 s no 4G | Média | *Load* ≤ 3 s no F12 |

**Critério de aceite**: o teste que prova que o requisito foi cumprido.

---

## RF ou RNF?
"O sistema deve avisar a manutenção quando um freio for reprovado."

- [x] RF: é algo que o sistema faz
- [ ] RNF: é uma qualidade do sistema
- [ ] Nenhum dos dois: é só uma opinião

---

## Qual está bem escrito?
Só um destes é um bom requisito. Qual?

- [ ] O sistema deve ser fácil e rápido
- [ ] Login
- [ ] O sistema deve registrar e imprimir a inspeção
- [x] O sistema deve gerar o relatório em até 5 s

---

## Caçando requisitos com o F12
| O que você vê | Onde | Tipo |
|---|---|---|
| Buscar, filtrar, carrinho | Na própria página | RF |
| Cadeado e `https://` | Barra de endereço | RNF: segurança |
| Tempo de **Load** | Rodapé da aba **Rede** | RNF: desempenho |
| Layout no celular | **Ctrl + Shift + M** | RNF: compatibilidade |

---

## Mão na massa: caçando RF
1. Abra uma loja online que você conhece (ex.: Mercado Livre)
2. Use o site **sem comprar**: busque, filtre, abra um produto
3. Anote **3 RF** do site, começando com "O sistema deve..."
4. Clique em **Adicionar ao carrinho**: o que ele exige antes?
5. O endereço começa com `https://`? Isso é RF ou RNF?

---

## Mão na massa: medindo RNF
1. **F12 → Rede**, recarregue: anote o **Load** no rodapé
2. Troque *Sem limitação* (*No throttling*) por **Slow 4G** e recarregue
3. **Ctrl + Shift + M**: escolha um celular. O layout se adapta?
4. Escreva **2 RNF com número**, usando o que você mediu

> No fim, volte para *Sem limitação* e feche o modo celular.

---

## O que você mediu?
A página carregou em 2,4 s no **Fast 4G**. Isso confere qual requisito?

- [ ] Um RF de busca
- [x] Um RNF de desempenho
- [ ] Um RNF de segurança
- [ ] Um RF de carrinho

---

## Seu parceiro de requisitos
+ Um **agente** é a IA com um **papel** e **regras** fixas
+ O nosso não entrega pronto: **pergunta, sugere e critica**
+ Quem escreve primeiro é **você**; ele revisa como um colega exigente
+ No fim, ele devolve tudo em **Markdown**, pronto para o GitHub

---

## Criando o agente (conta grátis)
1. Entre em **chatgpt.com** com uma conta gratuita
2. Na barra lateral, clique em **Novo projeto**: `Requisitos inspeção`
3. No projeto, **⋯ → Configurações do projeto** → **Instruções**
4. Cole lá as **instruções do agente** (o próximo slide mostra onde pegar) e salve
5. Abra um chat **dentro do projeto** e diga: *Vamos começar*

> Sem a opção de projeto? Cole as instruções como **1ª mensagem** de um chat novo.

---

## O que as instruções dizem
+ Você é meu **parceiro** de requisitos do checklist de inspeção
+ Faça **uma pergunta por vez** sobre operador, supervisor e manutenção
+ Peça que **eu escreva primeiro**; depois critique: é RF ou RNF? É medível?
+ Ajude com **prioridade** e **critério de aceite**
+ Quando eu escrever **FIM**, devolva a tabela em **Markdown**

---

## As instruções do agente (1/2)
```text
Você é meu parceiro de análise de requisitos.
Projeto: trocar o checklist de inspeção em papel
de equipamentos de mineração por um sistema.
Me ajude a listar RF e RNF, mas NÃO entregue pronto:
1. Faça UMA pergunta por vez sobre o operador,
o supervisor e a manutenção.
2. Peça que eu escreva cada requisito primeiro.
3. Critique: começa com "O sistema deve"? É medível?
```

Este é o texto que vocês vão copiar pelo QR, daqui a pouco.

---

## As instruções do agente (2/2)
```text
4. Diga se é RF ou RNF e por quê; aponte o que falta.
5. Ajude a definir prioridade e critério de aceite.
Quando eu escrever FIM, devolva num bloco markdown:
## Requisitos
| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
IDs: RF01, RF02... e RNF01, RNF02...
Responda em português, curto e direto.
```

Repare: ele **pergunta e critica**, mas quem escreve é **você**.

---

## Copie as instruções do agente
[qrcode https://instrutorjd.github.io/portal_aulas/materiais/agente-requisitos/ instrutorjd.github.io/portal_aulas/materiais/agente-requisitos]

Leia o QR ou digite o endereço: toque em **Copiar instruções** e cole no projeto.

---

## Mão na massa: imersão
1. **Individual**: no seu ChatGPT, responda às perguntas do agente sobre as **3 pessoas**
2. Escreva cada requisito **antes** e deixe o agente criticar
3. Chegue a pelo menos **5 RF e 3 RNF**, com prioridade e aceite
4. Use os RNF que você **mediu** no F12
5. Escreva **FIM** e confira a tabela em Markdown

> Não precisa de caderno: o chat fica salvo no projeto. Na Parte 4, a tabela vai para o README.

---

## Parceiro ou atalho?
Logo na 1ª mensagem, o agente entregou 10 requisitos prontos. O que você faz?

- [ ] Copia tudo: economiza tempo
- [ ] Pede mais 10 para garantir
- [x] Lembra a regra: eu escrevo primeiro, ele critica
- [ ] Apaga o projeto e anota no caderno

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

## Quem está no GitHub
| Perfil | Quem é | O que fez |
|---|---|---|
| `github.com/torvalds` | Linus Torvalds | Criou o **Linux** e o próprio **Git** |
| `github.com/gvanrossum` | Guido van Rossum | Criou o **Python** |
| `github.com/karpathy` | Andrej Karpathy | Cofundador da OpenAI, ex-chefe de IA da Tesla |
| `github.com/josevalim` | José Valim | Brasileiro, criou a linguagem **Elixir** |
| `github.com/filipedeschamps` | Filipe Deschamps | Brasileiro, criou o **TabNews** |

Mais de **300 mil** pessoas seguem o Linus no GitHub; mais de **200 mil**, o Karpathy.

---

## Mão na massa: perfis de quem faz
1. Abra **github.com/torvalds** e entre no repositório **linux**
2. Quantas **estrelas** ele tem? E quantos **commits**?
3. Abra **github.com/karpathy**: qual projeto dele tem mais estrelas?
4. Veja o **quadro verde** de contribuições: ele programou esta semana?
5. Escolha outro perfil da lista: o que o GitHub conta sobre a pessoa?

---

## Seu GitHub é o seu currículo
+ Linux, Python, VS Code: os maiores projetos do mundo estão lá, **abertos**
+ Empresas olham o GitHub de quem vão **contratar**
+ Cada commit fica no **histórico**, com o **seu nome**
+ Hoje você cria o **seu** primeiro repositório

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
1. No ChatGPT, abra o projeto e **copie** a tabela de requisitos
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

## O mesmo GET no terminal do Codespace
```bash
curl -i https://jsonplaceholder.typicode.com/todos/1
```

+ `curl` faz requisições pelo terminal
+ `-i` mostra também o cabeçalho da resposta
+ Olhe a **primeira linha**: ali está o **status** (`200`)

> Rode no terminal do **Codespace** (Linux). No PowerShell do Windows as aspas do JSON se perdem e o `POST` falha.

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

## Plano B: o POST pelo Console
```js
const item = { title: 'Freios', completed: false }
const r = await fetch('/todos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(item)
})
r.status
await r.json()
```

Sem Codespace? Rode no **Console**, na aba do JSONPlaceholder: é o mesmo `POST`.

---

## Entendendo o plano B
| Trecho | O que faz |
|---|---|
| `method: 'POST'` | Escolhe o método (sem isso, o `fetch` faz `GET`) |
| `headers: {...}` | Avisa ao servidor: "estou mandando **JSON**" |
| `JSON.stringify(item)` | Transforma o objeto em **texto JSON** para enviar |
| `r.status` | Deve mostrar `201`: **criado** |

É o mesmo que o `-X`, o `-H` e o `-d` do `curl` fazem.

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
+ **Streaming**: a resposta chega **em pedaços**, como no ChatGPT da Parte 2

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

- ✅ `README.md` com o mapa, a tabela de RF e RNF e as rotas
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
+ Na aba Rede, no Console e no `curl`, as APIs respondem em **JSON**
+ RF diz o que o sistema faz; RNF diz como, **com número**
+ GitHub guarda, Codespace roda, **git** leva e traz
+ O método diz a ação, a rota diz o recurso
+ O status diz o que a API respondeu: **confira** o que aconteceu

---

# A inspeção já é dado
Na próxima, ela começa a virar sistema
