---
aula: 4
data: 2026-10-05
titulo: O checklist no ar
turma: IA
descricao: Revisão de JavaScript, leitura de código, desafios no PixelCode e a tela do checklist no Codespace, publicada no Pages e revisada pelos colegas
fonte: grande
---

# O checklist no ar
Aula 4: do PixelCode para um link que qualquer colega abre no celular

---

## Roteiro de hoje (1/2)
- **Parte 1**: revisão rápida de JavaScript (15 min)
- **Parte 2**: leitura de código, todos juntos (15 min)
- **Parte 3**: desafios no PixelCode (40 min)
- ☕ **Intervalo** (15 min)

---

## Roteiro de hoje (2/2)
- **Parte 4**: o projeto no Codespace: README, HTML e CSS (40 min)
- **Parte 5**: o `script.js`, por sua conta (40 min)
- **Parte 6**: commit, GitHub Pages e feedback dos colegas (30 min)

---

# Parte 1 — Revisão rápida
As 5 peças do JavaScript

---

## As 5 peças da lógica
| Peça | O que faz | No checklist |
|---|---|---|
| **Variável** | Guarda um valor com nome | `resultado` |
| **Lista** | Guarda vários valores | `itens` |
| **Condição** | Escolhe um caminho | Crítico falhou → INAPTO |
| **Função** | Receita com nome | `avaliarInspecao()` |
| **Evento** | Espera o operador agir | O clique em **Finalizar** |

---

## Relembrando: variável
O horímetro **muda** a cada turno. Qual declaração?

- [ ] `const horimetro = 1250`
- [x] `let horimetro = 1250`
- [ ] `horimetro === 1250`
- [ ] `'horimetro' = 1250`

---

## Relembrando: condição
```js
const combustivel = 18
if (combustivel < 25) {
  console.log('Abastecer')
} else {
  console.log('Ok')
}
```

- [x] `Abastecer`
- [ ] `Ok`
- [ ] Os dois
- [ ] Nada: falta a função

---

## Relembrando: lista e laço
```js
const itens = ['Freios', 'Pneus', 'Cinto']
for (const item of itens) {
  console.log(item)
}
```

Quantas linhas aparecem no Console?

- [ ] 1
- [x] 3
- [ ] 4
- [ ] Nenhuma

---

## Relembrando: o E e o OU
- `&&` é **e**: as **duas** partes precisam ser verdade
- `||` é **ou**: **uma** das partes já basta
- `===` pergunta: os dois lados são **iguais**?
- Crítico `&&` não conforme → **INAPTO**

> `=` **guarda**, `===` **compara**.

---

## Relembrando: evento
O que acontece quando a página abre?

```js
botao.addEventListener('click', () => {
  saida.textContent = 'Finalizado!'
})
```

- [ ] A frase aparece na hora
- [x] Nada, até alguém clicar no botão
- [ ] Dá erro: falta o `console.log`
- [ ] A frase aparece e some

---

# Parte 2 — Leitura de código
Todos juntos, linha por linha

---

## Como ler um código
+ **O que entra?** Quais dados o programa recebe
+ **O que ele guarda?** As variáveis e o valor de cada uma
+ **Quantas voltas?** Cada `for` roda uma vez por item
+ **O que sai?** Preveja o Console **antes** de rodar
+ Só então **rode** e confira: acertou?

---

## Vamos ler juntos
```js
const itens = [
  { nome: 'Freios', critico: true, conforme: true },
  { nome: 'Cinto', critico: true, conforme: false },
  { nome: 'Limpeza', critico: false, conforme: false },
]
let falhas = 0
for (const item of itens) {
  if (item.conforme === false) {
    falhas = falhas + 1
    console.log('FALHOU ' + item.nome)
  }
}
console.log('Falhas: ' + falhas)
```

---

## Quantas voltas?
Quantas vezes o `for` roda?

- [ ] 1: só o Cinto falhou
- [ ] 2: só os que falharam
- [x] 3: uma por item da lista
- [ ] 5: os 5 itens do checklist

---

## O que sai primeiro?
Qual é a **primeira** linha do Console?

- [ ] `FALHOU Freios`
- [x] `FALHOU Cinto`
- [ ] `Falhas: 2`
- [ ] `FALHOU Limpeza`

---

## E no fim?
Qual é a **última** linha do Console?

- [ ] `Falhas: 0`
- [ ] `Falhas: 1`
- [x] `Falhas: 2`
- [ ] `Falhas: 3`

> Por quê: a Limpeza **também** falhou. O `if` não olha se é crítico.

---

## Agora confira
1. Abra o PixelCode, modo **Só JavaScript**
2. Crie o arquivo `leitura.js` e digite o código
3. Rode: o Console bateu com o que vocês previram?
4. Mude o `if` para contar só os **críticos** que falharam
5. Rode de novo: quantas falhas agora?

---

# Parte 3 — Desafios no PixelCode
Vários desafios curtos, um tema por vez

---

## Seu laboratório: o PixelCode
[qrcode https://tinyurl.com/pixelcode-jd tinyurl.com/pixelcode-jd]

---

## Sua IA de apoio
[qrcode https://claude.ai/artifact/5iH131aR6Pt7RArxueKmS2 A IA da turma]

Abra no **computador**, numa aba ao lado do PixelCode.

---

## Travou? Use a IA de apoio
+ Peça **explicação**, não a resposta pronta
+ Bom: "o que significa este erro?"
+ Bom: "me dê uma dica, sem o código"
+ Ruim: "faça o desafio para mim"
+ Quem copia a resposta não aprende o que vai usar no `script.js`

---

## Como fazer os desafios
1. Um arquivo por desafio: `d1.js`, `d2.js`...
2. Leia o contexto e faça os passos, **em ordem**
3. Rode e confira antes de passar para o próximo
4. Terminou todos? Faça o **bônus**

[cronômetro 40]

---

## 🎯 D1: a frase
Contexto: o supervisor quer saber **quem** inspecionou **o quê**.

1. Crie `equipamento` valendo `'CAM-07'`
2. Crie `operador` com o seu nome
3. Mostre: `Ana inspecionou o CAM-07`

---

## 🎯 D2: o horímetro
Contexto: a cada turno de **8** horas, o horímetro aumenta.

1. Crie o horímetro valendo **1250**
2. Some 8 horas, **duas vezes**
3. Mostre o valor final: deu **1266**?

---

## 🎯 D3: o tanque
Contexto: caminhão com menos de **25** litros não começa o turno.

1. Crie `combustivel` valendo **18**
2. Se for menor que 25, mostre `Abastecer`
3. Senão, mostre `Combustível ok`
4. Teste com **18** e com **90**

---

## 🎯 D4: o item crítico
Contexto: só item **crítico** e **não conforme** para o caminhão.

1. Crie `critico` valendo `true`
2. Crie `conforme` valendo `false`
3. Se for crítico **e** não conforme, mostre `INAPTO`
4. Senão, mostre `APTO`. Teste trocando os dois

---

## 🎯 D5: a lista
Contexto: o checklist do CAM-07 tem **5** itens.

1. Crie a lista: Freios, Pneus, Cinto, Limpeza e Combustível
2. Mostre o **primeiro** item
3. Mostre **quantos** itens a lista tem

---

## 🎯 D6: um por um
Contexto: o operador confere item por item.

1. Use a lista do D5
2. Com o `for`, mostre `Conferir: ` antes de cada item
3. Rode: saíram **5** linhas?

---

## 🎯 D7: a função
Contexto: o operador quer uma **frase**, não só a palavra.

1. Crie a função `mensagem(resultado)`
2. Se `resultado` for `'APTO'`, devolva `Liberado para o turno`
3. Senão, devolva `Procure a manutenção`
4. Mostre `mensagem('APTO')` e `mensagem('INAPTO')`

---

## 🎯 D8: o botão
Contexto: agora no modo **Página web**.

1. No `index.html`: um botão `id="finalizar"` e um `<p id="resultado">`
2. No `script.js`: pegue os dois com `querySelector`
3. No clique, escreva `Inspeção finalizada!` no parágrafo

---

## ⭐ Bônus: o rádio marcado
```html
<input type="radio" name="freios" value="conforme"> Conforme
<input type="radio" name="freios" value="nao-conforme"> Não conforme
```

No clique do D8, pegue `document.querySelector('[name=freios]:checked')`. Ninguém marcado? Vem `null`. Senão, escreva o `.value` dele.

---

## Desafios: como foi?
No bônus, ninguém marcou os Freios. O que o `querySelector` devolve?

- [ ] `'conforme'`
- [ ] `''`, um texto vazio
- [x] `null`, nada encontrado
- [ ] Um erro no Console

---

# ☕ Intervalo: 15 min
Na volta: o projeto no **Codespace** ganha tela, cor e lógica

---

# Parte 4 — O projeto no Codespace
README, HTML e CSS com o Copilot

---

## Abra o seu projeto
1. No GitHub, abra o repositório `checklist-inspecao`
2. **Code** → **Codespaces** → clique no seu codespace
3. No terminal: `git pull`, para trazer o que mudou no site
4. Abra o `README.md`: o que já tem lá?

---

## RF x RNF
| | Requisito funcional (RF) | Requisito não funcional (RNF) |
|---|---|---|
| Diz | **O que** o sistema faz | **Como** ele precisa ser |
| Exemplo | Registrar o resultado da inspeção | Funcionar no celular |
| Exemplo | Avisar se faltar marcar um item | Botões fáceis de tocar com luva |

---

## Modelo do README.md
```markdown
# Checklist de Inspeção
## Requisitos funcionais (RF)
| ID | Requisito | Prioridade |
|---|---|---|
| RF01 | O sistema deve registrar... | Alta |
## Requisitos não funcionais (RNF)
| ID | Requisito |
|---|---|
| RNF01 | A tela deve funcionar no celular |
```

---

## Mão na massa: o README
1. No ChatGPT, abra o projeto da Aula 2 e copie os **RF** e os **RNF**
2. Monte o `README.md` como no **modelo**
3. Abra a **visualização** (*Preview*): **Ctrl + Shift + V**
4. As duas tabelas aparecem certinhas?

[cronômetro 10]

---

## O plano: um arquivo por vez
1. `index.html`: o **Copilot** cria, você revisa
2. `style.css`: o **Copilot** cria, você deixa do seu jeito
3. `script.js`: **você** escreve, a IA só dá dicas
4. No fim: commit e push com o **Copilot**, e o **Pages**

---

## Ativando o Copilot
1. No Codespace, abra **Extensões** na barra lateral
2. Procure **GitHub Copilot** e instale, se ainda não estiver
3. Entre com a sua conta do GitHub quando ele pedir
4. Abra o **chat do Copilot** pelo ícone dele no topo

> Copilot Free: **50 mensagens** de chat por mês. Um bom prompt economiza.

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

Abra **no computador**, numa aba ao lado do Codespace.

---

## Mão na massa: index.html
1. Cole o **prompt 1** no chat do Copilot
2. Leia o arquivo antes de clicar em **Manter** (*Keep*)
3. Ache o `select`, os rádios e os `id` do botão e do resultado
4. Os `name` estão **sem acento**? Os `value` são `conforme` e `nao-conforme`?
5. Tem o link do CSS e do JS?

---

## Rodando no Codespace
```bash
python3 -m http.server 8000
```

+ Aparece um aviso: clique em **Abrir no navegador** (*Open in Browser*)
+ Perdeu o aviso? Aba **Portas** (*Ports*), porta `8000`, ícone 🌐
+ Mudou o código? Salve e dê **F5** na página

---

## Mão na massa: style.css
1. Cole o **prompt 2** no chat e revise antes de **Manter**
2. Dê **F5** na página: ela ganhou roupa?
3. **F12** → **Ctrl + Shift + M**: escolha um celular
4. Dá para tocar nas opções sem errar? A letra está legível?

[cronômetro 10]

---

## Deixe com a sua cara
1. Peça **um** ajuste com as suas palavras: cores, fonte, espaços
2. Exemplo: "deixe o fundo escuro e os botões amarelos, cor de mina"
3. Diga sempre: **só** o `style.css`, sem mudar o HTML
4. Revise, **Manter**, **F5** e teste de novo no modo celular

---

# Parte 5 — O script.js
Agora é com você

---

## As regras desta parte
+ Quem escreve o `script.js` é **você**
+ O Copilot e a IA de apoio dão **dicas**, não o código
+ Desligue as sugestões automáticas: ícone do Copilot na barra de baixo
+ Vá por **etapas**: cada uma testada antes da próxima
+ Errou? Leia o Console (**F12**): ele diz a linha

---

## Lendo a tela pelo JavaScript
| Eu quero saber | Código |
|---|---|
| O equipamento escolhido | `document.querySelector('#equipamento').value` |
| O rádio marcado dos Freios | `document.querySelector('[name=freios]:checked')` |
| Ninguém marcou? | Veio `null` |
| Conforme ou não? | `.value` do rádio marcado |
| Pintar o resultado | `saida.className = 'apto'` |

---

## Etapa 1: o clique responde
1. Crie o `script.js`
2. Pegue o botão `#finalizar` e o parágrafo `#resultado`
3. No clique, escreva `Clicou!` no parágrafo
4. **F5** e clique: apareceu?

> É o **D8** dos desafios. Abra o PixelCode e compare.

---

## Etapa 2: o equipamento
1. No clique, leia o `.value` do `#equipamento`
2. Se vier `''` (vazio), escreva `Escolha o equipamento`
3. Senão, escreva o código dele, ex.: `CAM-07`
4. Teste sem escolher e escolhendo

---

## Etapa 3: um item só
1. No clique, pegue o rádio marcado dos **Freios**
2. Se vier `null`, escreva `Marque os Freios`
3. Senão, escreva o `.value` dele
4. Teste: sem marcar, conforme e não conforme

> É o **bônus** dos desafios.

---

## Etapa 4: todos os itens
1. Crie a lista `itens`: o `name` e se é `critico`, para os 5
2. Crie a função `avaliarInspecao()`, com um `for` nos itens
3. Algum sem marcar? Devolva `'FALTA'`
4. Crítico com `nao-conforme`? O resultado é `'INAPTO'`
5. No clique, chame a função e escreva o que ela devolveu

---

## Etapa 5: a cor do resultado
1. APTO? `saida.className = 'apto'`
2. INAPTO? `saida.className = 'inapto'`
3. Faltou algo? `saida.className = ''` e o aviso
4. As classes são as do `style.css`: ficou verde e vermelho?

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

## Pedindo dica sem pedir a resposta
1. Leia o erro e clique em **arquivo:linha** no Console
2. Tente **sozinho** primeiro: é nome? É `id`? Faltou `}`?
3. Não achou? Use o **prompt de dica** da página dos prompts
4. Cole a frase **exata** do erro e diga em que etapa está
5. A IA explica; quem **corrige** é você

[cronômetro 40]

---

## 🧩 Referência: script.js (1/3)
```js
const botao = document.querySelector('#finalizar')
const saida = document.querySelector('#resultado')
const itens = [
  { name: 'freios', critico: true },
  { name: 'pneus', critico: true },
  { name: 'cinto', critico: true },
  { name: 'limpeza', critico: false },
  { name: 'combustivel', critico: false },
]
```

Só depois de tentar!

---

## 🧩 Referência: script.js (2/3)
```js
function avaliarInspecao() {
  let resultado = 'APTO'
  for (const item of itens) {
    const seletor = '[name=' + item.name + ']:checked'
    const marcado = document.querySelector(seletor)
    if (marcado === null) {
      return 'FALTA'
    }
    if (item.critico && marcado.value === 'nao-conforme') {
      resultado = 'INAPTO'
    }
  }
  return resultado
}
```

---

## 🧩 Referência: script.js (3/3)
```js
botao.addEventListener('click', () => {
  const equipamento = document.querySelector('#equipamento')
  const resultado = avaliarInspecao()
  if (equipamento.value === '' || resultado === 'FALTA') {
    saida.textContent = 'Complete o checklist'
    saida.className = ''
  } else if (resultado === 'APTO') {
    saida.textContent = '✅ ' + equipamento.value + ': APTO'
    saida.className = 'apto'
  } else {
    saida.textContent = '⛔ ' + equipamento.value + ': INAPTO'
    saida.className = 'inapto'
  }
})
```

---

## Por que não devolver INAPTO na hora?
O `for` acha os Freios **não conformes** no 1º item. Por que a referência **não** faz `return 'INAPTO'` ali?

- [ ] Porque o `return` só funciona no fim
- [x] Porque um item **depois** pode estar sem marcar
- [ ] Porque o INAPTO precisa de duas falhas
- [ ] Porque o `for` não aceita `return`

---

# Parte 6 — No ar!
Commit, Pages e o olhar do colega

---

## Commit e push com o Copilot
1. Barra lateral: **Controle do Código-Fonte**, ou **Ctrl + Shift + G**
2. Confira a lista: README, `index.html`, `style.css`, `script.js`
3. Clique no ✨ da caixa de mensagem: o Copilot **escreve** a mensagem
4. Leia: ela diz **o que** mudou? Ajuste se precisar
5. **Commit** → se perguntar, **Sim** para incluir tudo
6. **Sincronizar alterações** (*Sync Changes*): é o push

---

## A mensagem do Copilot
Qual mensagem de commit você **mantém**?

- [ ] `update`
- [ ] `arquivos`
- [x] `Cria a tela do checklist com HTML, CSS e a regra de APTO/INAPTO`
- [ ] `final agora vai`

> A IA escreveu, mas quem **assina** o commit é você: leia antes.

---

## Ativando o GitHub Pages
1. No site do GitHub: repositório → **Settings** → **Pages**
2. **Source**: **Deploy from a branch**
3. **Branch**: `main` e a pasta `/ (root)` → **Save**
4. Espere ~1 min: o endereço aparece no topo (**Visit site**)
5. Abra no **celular** e refaça os 4 testes

> Endereço: `seu-usuario.github.io/checklist-inspecao`

---

## Feedback construtivo: 3 partes
| Parte | Começa com | Exemplo |
|---|---|---|
| **Elogio** específico | "Gostei de..." | "...dos botões grandes, fáceis de tocar" |
| **Sugestão** com motivo | "Que tal...?" | "...o aviso em vermelho? Quase não vi" |
| **Pergunta** | "Como você...?" | "...fez o fundo mudar de cor?" |

---

## Feedback bom x ruim
- ✗ "Ficou legal" (não ajuda a melhorar)
- ✗ "Tá feio" (não diz o quê, nem como)
- ✓ "Testei com os Freios não conformes e deu APTO"
- ✓ "A letra do resultado é pequena no celular: que tal maior?"

> Critique o **trabalho**, nunca a pessoa. E diga **o que** você testou.

---

## Mão na massa: troque links e feedback
1. Passe o link do seu Pages para os colegas da **direita** e da **esquerda**
2. Abra o link deles **no celular** e faça os **4 testes**
3. No GitHub do colega: aba **Issues** → **New issue**
4. Título: `Feedback de <seu nome>`
5. Escreva os testes que você fez e as **3 partes** do feedback

[cronômetro 15]

---

## Leia o feedback que você recebeu
+ Abra a aba **Issues** do **seu** repositório
+ Algum teste falhou na tela do colega? **Corrija** primeiro
+ Escolha **uma** sugestão para fazer hoje ou na próxima aula
+ Mudou? Commit e push com o Copilot: o Pages atualiza sozinho

---

## Revisão
Qual destes é um requisito **não funcional**?

- [ ] O sistema deve registrar o resultado da inspeção
- [ ] O sistema deve avisar se faltar marcar um item
- [x] A tela deve abrir em até 3 segundos no celular
- [ ] O sistema deve listar os equipamentos

---

## Revisão
Você mudou o `script.js`, mas o Pages ainda mostra a versão antiga. O que faltou?

- [ ] Rodar `python3 -m http.server`
- [x] Fazer o commit e **sincronizar** (push)
- [ ] Apertar F12
- [ ] Ativar o Pages de novo

---

## O que vimos hoje
+ **Ler e prever** um código antes de rodar
+ **RF** diz o que o sistema faz; **RNF** diz como ele precisa ser
+ O Copilot fez a **tela**; **você** escreveu a lógica
+ Commit com o Copilot, e o projeto **no ar** com o Pages
+ Feedback bom é **específico**, com **motivo** e **gentil**

---

# O seu checklist está no ar
E um colega já testou, no celular, se ele decide certo
