# Pacman no Phaser — guia completo para quem nunca usou Phaser

Este guia parte do zero: criar os arquivos no Codespace até o jogo rodando
no navegador. Jogo 2D com a biblioteca **Phaser 3**, em HTML + JavaScript,
com sprites desenhados pelo próprio aluno no **Piskel** (Pacman e fantasma)
e paredes/moedas geradas por código (sem arte pra elas).

Este é o mesmo roteiro que aparece, em blocos explicados, na atividade
**Prática — Construa o Pacman no Phaser** (trilha "Motor Phaser: Construa o
Pacman", dentro de Codificação de Jogos). Qualquer alteração de conteúdo
técnico deve manter os dois em sincronia.

---

## 1. Criando os arquivos do projeto (no Codespace)

1. Abra o repositório do seu jogo no GitHub e clique no botão verde **Code**
   → aba **Codespaces** → **Create codespace on main** (ou abra o Codespace
   que já existe, se já tiver criado um antes).
2. Espere o Codespace carregar — ele abre um VS Code inteiro dentro do
   navegador, com um explorador de arquivos à esquerda.
3. No painel **Explorer** (ícone de duas folhas, no topo da barra lateral
   esquerda), clique no ícone **New File** (uma folha com um "+") na altura
   do nome da pasta raiz do projeto.
4. Digite `game.html` e aperte **Enter**. Repita e crie `game.js`.

No final, o Explorer deve mostrar `game.html` e `game.js` soltos na raiz do
projeto (mesma pasta). Os dois arquivos de imagem que você vai exportar do
Piskel (seção 4) também vão pra essa mesma pasta.

---

## 2. Ligando a biblioteca Phaser (CDN)

Phaser é a **biblioteca** (um conjunto de código pronto) que faz o trabalho
pesado de jogo: desenhar na tela, física, animação, teclado. Sem build nem
instalação, a forma mais simples de "ligar" essa biblioteca num projeto só
de HTML/JS é apontar uma tag `<script>` pra uma cópia hospedada num CDN
(*Content Delivery Network* — um servidor público que guarda bibliotecas
prontas pra qualquer site carregar).

> Se um dia você montar um projeto com um *bundler* (Vite, Webpack) em vez
> de HTML puro, aí sim existe o comando de terminal `npm install phaser`
> pra baixar a biblioteca como dependência do projeto. Neste roteiro isso
> **não é necessário** — a tag `<script>` do CDN já resolve tudo.

Abra `game.html` e cole o conteúdo abaixo. Repare na ordem das duas tags
`<script>` no final do `<body>`: a do Phaser vem **antes** da do `game.js`,
porque `game.js` usa coisas que só existem depois que o Phaser carrega.

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>Pacman Evoluído</title>
  <style>
    body { margin: 0; background: #111; display: flex; justify-content: center; align-items: center; height: 100vh; }
    canvas { image-rendering: pixelated; }
  </style>
</head>
<body>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
  <script src="game.js"></script>
</body>
</html>
```

Salve com **Ctrl+S**.

---

## 3. Configuração inicial do jogo

Abra `game.js` (ainda vazio) e cole o bloco abaixo no topo do arquivo.

```javascript
const configuracao = {
  type: Phaser.AUTO,
  width: 640,
  height: 480,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: { preload: preCarregar, create: criar, update: atualizar }
};

let jogador;
let teclas;
let paredes;
let inimigos;
let moedas;
let textoPontuacao;
let textoFimDeJogo;
let pontuacao = 0;
let jogoTerminou = false;
let velocidade = 160;

// Layout simples: 1 = parede, 0 = vazio
const mapa = [
  '1111111111111111',
  '1000000001000001',
  '1011110101011101',
  '1010000101000001',
  '1010111101110101',
  '1000100000010001',
  '1110101111101011',
  '1000101000001011',
  '1011101011101011',
  '1000000010000001',
  '1111111111111111'
];

const tamanhoBloco = 40;
```

- `configuracao` é o objeto que diz ao Phaser como criar o jogo: tamanho da
  tela (640×480), cor de fundo, o motor de física (`arcade`, o mais simples
  do Phaser) e as três funções que formam o ciclo de vida da cena:
  `preCarregar` (carrega imagens antes de tudo), `criar` (monta o cenário
  uma vez) e `atualizar` (roda a cada frame, ~60 vezes por segundo).
- As variáveis com `let` no escopo global ficam visíveis pras três funções
  do ciclo de vida (elas não recebem parâmetros pra passar esses dados).
- `mapa` é o labirinto desenhado como texto: cada string é uma linha, cada
  caractere é uma célula — `1` vira parede, `0` vira espaço livre (onde uma
  moeda pode existir).
- `tamanhoBloco` é quantos pixels cada célula do mapa ocupa na tela.

- [ ] Bloco de configuração, variáveis e mapa colado no topo de game.js

---

## 4. Desenhando o Pacman e o fantasma no Piskel

O código de `preCarregar()` (próxima seção) espera dois arquivos de imagem
prontos: `pacman_sheet.png` (3 quadros de animação, 32×32 pixels cada) e
`ghost_sheet.png` (2 quadros, 32×32 cada). Essas imagens não vêm prontas —
você desenha no **Piskel**, um editor de pixel art gratuito que roda direto
no navegador (funciona bem em Chromebook, sem instalar nada).

### 4.1. Desenhando o Pacman (3 quadros, 32×32)

1. Acesse `piskelapp.com` numa aba nova e clique em **Create Sprite** (ou já
   caia direto no editor).
2. No topo, clique no ícone de engrenagem/configurações do canvas (ou vá em
   **Resize**) e defina o tamanho como **32 × 32 pixels**. Esse é o tamanho
   de cada quadro individual, não da imagem final.
3. Desenhe o **quadro 1**: um círculo amarelo preenchendo boa parte do
   32×32, com uma fatia preta (boca) aberta apontando pra direita.
4. No painel de quadros (embaixo, ou lateral, dependendo do layout), clique
   no botão **+** pra adicionar um **quadro 2**: o mesmo círculo amarelo,
   mas com a boca só um pouco aberta.
5. Adicione o **quadro 3**: o círculo amarelo com a boca fechada (só o
   círculo, sem fatia nenhuma).
6. Confira que você tem exatamente **3 quadros**, todos 32×32, nessa ordem
   (boca aberta → meio aberta → fechada) — é a ordem que a animação de
   mastigação do jogo espera.

### 4.2. Exportando o Pacman

1. No menu do Piskel (ícone **PISKEL** no canto superior esquerdo, ou o
   menu hambúrguer), clique em **Export**.
2. Na aba **PNG**, confira que o layout está como **tira horizontal**
   (*row*) — é o padrão do Piskel, os quadros ficam lado a lado.
3. Clique em **Download** (ou no botão de baixar o PNG).
4. O arquivo baixado deve ter **96×32 pixels** (3 quadros × 32px de largura,
   32px de altura) — se o nome do arquivo vier diferente, **renomeie** para
   `pacman_sheet.png` antes de continuar.

### 4.3. Desenhando e exportando o fantasma (2 quadros, 32×32)

1. Ainda no Piskel, clique em **New** (ou abra outra aba do site) pra
   começar um sprite novo, também com canvas 32×32.
2. Desenhe o **quadro 1**: um corpo arredondado colorido (qualquer cor viva
   — vermelho, rosa, ciano — o jogo troca a cor dele por código quando ele
   fica "assustado", então a cor que você escolher aqui é só a cor normal).
3. Adicione o **quadro 2**: o mesmo fantasma, com uma pequena diferença (por
   exemplo, os "pés" ondulados embaixo trocando de posição, ou os olhos
   piscando) — é o suficiente pra dar uma sensação de flutuação quando os
   dois quadros alternam rápido.
4. Exporte do mesmo jeito da seção 4.2 (Export → PNG → Download). O arquivo
   deve sair com **64×32 pixels** (2 quadros × 32px). Renomeie para
   `ghost_sheet.png`.

### 4.4. Se o seu desenho não saiu 32×32, ou não tem o número exato de quadros

Se você seguiu os tamanhos e quantidades de quadros à risca (3 quadros
32×32 pro Pacman, 2 quadros 32×32 pro fantasma), pode pular esta parte — o
código das próximas seções já está pronto pro seu caso. Mas se o seu canvas
no Piskel ficou de outro tamanho, ou você desenhou mais ou menos quadros do
que o pedido, **dois lugares do código precisam mudar** pra acompanhar:

1. **Tamanho do quadro** — na seção 5 (`preCarregar()`), os números
   `frameWidth: 32, frameHeight: 32` têm que ser o tamanho real de cada
   quadro do seu desenho. Pra conferir esse tamanho: abra o arquivo no
   Piskel (ou olhe em **Resize**, no menu do Piskel) — o valor mostrado ali
   é exatamente o que entra em `frameWidth`/`frameHeight`. Se o Pacman e o
   fantasma tiverem tamanhos diferentes entre si, ajuste cada
   `this.load.spritesheet(...)` com o valor certo do seu respectivo
   desenho.
2. **Quantidade de quadros** — na seção 6.4 (as animações),
   `generateFrameNumbers('jogador', { start: 0, end: 2 })` espera 3 quadros
   (contados do 0 ao 2) e `generateFrameNumbers('inimigo', { start: 0, end:
   1 })` espera 2 quadros (0 e 1). O número em `end` é sempre **a
   quantidade de quadros menos 1** — se você desenhou 4 quadros do Pacman,
   por exemplo, o valor vira `end: 3`. Conte os quadros no painel de frames
   do Piskel antes de exportar, pra saber esse número.

Se esses dois pontos não baterem com o seu desenho, o sintoma mais comum é
o sprite aparecer cortado, esticado ou mostrando um pedaço errado da
imagem.

### 4.5. Levando os arquivos pro Codespace

1. No Chromebook, os dois PNGs baixados ficam na pasta **Downloads** (ou no
   app **Arquivos**).
2. Volte pro Codespace, no painel **Explorer**.
3. Arraste os dois arquivos (`pacman_sheet.png` e `ghost_sheet.png`) direto
   do gerenciador de arquivos do Chromebook pra dentro do painel Explorer,
   soltando na mesma pasta onde estão `game.html` e `game.js`. (Se preferir,
   clique com o botão direito numa área vazia do Explorer e use **Upload...**
   pra escolher os arquivos manualmente, em vez de arrastar.)
4. Confira que os dois arquivos aparecem na lista, com os nomes exatos
   `pacman_sheet.png` e `ghost_sheet.png` — o código em `preCarregar()`
   procura essas imagens exatamente por esse nome.

- [ ] pacman_sheet.png criado (3 quadros, 96×32) e enviado pro Codespace
- [ ] ghost_sheet.png criado (2 quadros, 64×32) e enviado pro Codespace

---

## 5. Carregando os sprites e gerando as texturas (preCarregar)

Volte pra `game.js` e cole o bloco abaixo, logo depois do que você colou na
seção 3.

```javascript
function preCarregar() {
  this.load.spritesheet('jogador', 'pacman_sheet.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('inimigo', 'ghost_sheet.png', { frameWidth: 32, frameHeight: 32 });

  // parede e moeda seguem gerados (sem asset externo)
  const grafico = this.add.graphics();

  grafico.fillStyle(0x2255cc, 1);
  grafico.fillRect(0, 0, tamanhoBloco, tamanhoBloco);
  grafico.generateTexture('parede', tamanhoBloco, tamanhoBloco);
  grafico.clear();

  grafico.fillStyle(0xffffff, 1);
  grafico.fillCircle(4, 4, 4);
  grafico.generateTexture('moeda', 8, 8);
  grafico.destroy();
}
```

- `this.load.spritesheet(chave, arquivo, { frameWidth, frameHeight })`
  carrega uma imagem e diz ao Phaser como cortá-la em quadros — por isso
  `frameWidth`/`frameHeight` (32×32) têm que bater exatamente com o
  tamanho que você desenhou no Piskel. Se não bater, os quadros saem
  cortados errado (rever seção 4.4 se o seu desenho não ficou 32×32).
- Parede e moeda **não** vêm de arquivo nenhum: `this.add.graphics()`
  desenha formas simples (retângulo azul, círculo branco) direto por
  código e `generateTexture()` transforma esse desenho numa textura
  reutilizável, com nome próprio (`'parede'`, `'moeda'`), do mesmo jeito
  que uma imagem carregada de arquivo. É o mesmo princípio do `_draw()` da
  versão Godot deste jogo, só que aqui só as peças mais simples usam essa
  técnica — Pacman e fantasma usam arte de verdade.

- [ ] Função preCarregar() colada e salva

---

## 6. Montando o jogo (criar())

A função `criar()` roda **uma única vez**, depois de `preCarregar()`
terminar de carregar tudo. É onde o cenário inteiro é montado. Vamos colar
ela em partes.

### 6.1. O labirinto e as moedas, a partir do mapa

```javascript
function criar() {
  paredes = this.physics.add.staticGroup();
  moedas = this.physics.add.staticGroup();

  for (let linha = 0; linha < mapa.length; linha++) {
    for (let coluna = 0; coluna < mapa[linha].length; coluna++) {
      const x = coluna * tamanhoBloco + tamanhoBloco / 2;
      const y = linha * tamanhoBloco + tamanhoBloco / 2;
      if (mapa[linha][coluna] === '1') {
        paredes.create(x, y, 'parede');
      } else {
        moedas.create(x, y, 'moeda');
      }
    }
  }
```

- `staticGroup()` cria um grupo de objetos de física que **não se movem**
  (paredes e moedas nunca andam) — mais leve que um grupo dinâmico.
- O laço duplo percorre cada linha e coluna do `mapa`. `x`/`y` convertem a
  posição na grade (coluna/linha) pra posição em pixels na tela,
  centralizando o objeto dentro do bloco de `tamanhoBloco` pixels.
- Onde o mapa tem `'1'`, nasce uma parede; em qualquer outro caractere
  (`'0'`), nasce uma moeda.

- [ ] Grupos de paredes/moedas criados e preenchidos a partir do mapa

### 6.2. O jogador

Continue colando, ainda dentro de `criar()`:

```javascript
  jogador = this.physics.add.sprite(tamanhoBloco * 1.5, tamanhoBloco * 1.5, 'jogador');
  jogador.setCollideWorldBounds(true);
  jogador.setScale(3);
  jogador.body.setSize(9, 9);
```

- `this.physics.add.sprite(x, y, chave)` cria um sprite **com física** (ao
  contrário de paredes/moedas, o Pacman se move) usando a textura
  `'jogador'` carregada em `preCarregar()`.
- `setCollideWorldBounds(true)` impede o Pacman de sair da área de 640×480.
- `setScale(3)` amplia o sprite (desenhado em 32×32) pra ficar mais visível
  na tela.
- `body.setSize(9, 9)` deixa a **caixa de colisão** bem menor que o
  desenho — assim o Pacman colide com precisão mesmo estando ampliado
  visualmente.

- [ ] Sprite do jogador criado, com colisão de bordas e escala aplicadas

### 6.3. Os fantasmas e as colisões

Continue colando:

```javascript
  inimigos = this.physics.add.group();
  const inimigo1 = inimigos.create(tamanhoBloco * 14.5, tamanhoBloco * 9.5, 'inimigo');
  const inimigo2 = inimigos.create(tamanhoBloco * 8.5, tamanhoBloco * 5.5, 'inimigo');
  [inimigo1, inimigo2].forEach(inimigo => {
    inimigo.setCollideWorldBounds(true);
    inimigo.body.setSize(28, 28);
  });

  this.physics.add.collider(jogador, paredes);
  this.physics.add.collider(inimigos, paredes);
  this.physics.add.collider(inimigos, inimigos);

  this.physics.add.overlap(jogador, moedas, coletarMoeda, null, this);
  this.physics.add.overlap(jogador, inimigos, colidirComInimigo, null, this);
```

- `inimigos` é um grupo dinâmico com 2 fantasmas, criados em posições fixas
  do mapa.
- `collider(a, b)` faz dois grupos **se empurrarem/pararem** um no outro —
  é o que impede o jogador e os fantasmas de atravessarem paredes, e os
  fantasmas de se atravessarem entre si.
- `overlap(a, b, funcao)` é diferente: não bloqueia o movimento, só chama
  uma função quando os dois se sobrepõem — é assim que comer uma moeda
  (`coletarMoeda`) ou encostar num fantasma (`colidirComInimigo`) disparam
  código sem travar o personagem fisicamente.

- [ ] Fantasmas criados e todos os colliders/overlaps configurados

### 6.4. Animações, teclado, placar e reinício

Continue colando:

```javascript
  // animação do jogador: boca abrindo/fechando
  this.anims.create({
    key: 'jogadorMastigando',
    frames: this.anims.generateFrameNumbers('jogador', { start: 0, end: 2 }),
    frameRate: 10,
    repeat: -1
  });
  jogador.play('jogadorMastigando');

  // animação do inimigo: flutuando
  this.anims.create({
    key: 'inimigoFlutuando',
    frames: this.anims.generateFrameNumbers('inimigo', { start: 0, end: 1 }),
    frameRate: 4,
    repeat: -1
  });
  inimigos.getChildren().forEach(inimigo => inimigo.play('inimigoFlutuando'));

  teclas = this.input.keyboard.createCursorKeys();

  textoPontuacao = this.add.text(10, 490 - 30, 'Pontos: 0', { fontSize: '20px', fill: '#fff' });
  textoPontuacao.setDepth(10);

  this.input.keyboard.on('keydown-R', () => {
    if (jogoTerminou) this.scene.restart();
  });
```

- `this.anims.create({...})` monta uma animação nomeada a partir de uma
  faixa de quadros do spritesheet. `generateFrameNumbers('jogador', {start:
  0, end: 2})` pega exatamente os 3 quadros do Pacman que você desenhou no
  Piskel (seção 4.1), na ordem em que foram salvos (`end` é sempre a
  quantidade de quadros menos 1 — rever seção 4.4 se você desenhou um
  número diferente de quadros). `repeat: -1` faz a animação ficar em loop
  pra sempre.
- O mesmo vale pra `'inimigoFlutuando'`, usando os 2 quadros do fantasma.
- `createCursorKeys()` já devolve um objeto pronto com `up`/`down`/`left`/
  `right`, mapeados nas setas do teclado — sem precisar configurar tecla
  por tecla.
- `textoPontuacao` é um elemento de texto fixo na tela, atualizado depois
  toda vez que uma moeda é comida.
- O listener de `keydown-R` deixa reiniciar a partida com a tecla R, mas
  **só** depois que o jogo termina (`jogoTerminou` vira `true`).

- [ ] Animações, cursores de teclado, placar e tecla de reinício colados

### 6.5. Movimento simples dos fantasmas e reset do estado

Feche a função `criar()` com o bloco abaixo:

```javascript
  // movimento simples dos inimigos: direção aleatória, muda periodicamente
  [inimigo1, inimigo2].forEach(inimigo => {
    inimigo.direcao = new Phaser.Math.Vector2(1, 0);
    this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => {
        const direcoes = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const [dx, dy] = Phaser.Utils.Array.GetRandom(direcoes);
        inimigo.direcao.set(dx, dy);
      }
    });
  });

  pontuacao = 0;
  jogoTerminou = false;
}
```

- Cada fantasma ganha uma propriedade extra `direcao` (um vetor 2D) — o
  Phaser não tem isso por padrão em um sprite, então o código simplesmente
  anexa a propriedade no objeto.
- `this.time.addEvent({delay, loop, callback})` roda a função `callback` a
  cada 1500ms (1.5s), pra sempre (`loop: true`). A cada disparo, sorteia
  uma das 4 direções cardeais e substitui a `direcao` atual do fantasma —
  é assim que eles mudam de rumo sozinhos, sem perseguir o jogador de
  verdade (diferente da versão Godot deste jogo, que faz o fantasma
  perseguir; aqui o comportamento é aleatório de propósito, mais simples).
- As duas últimas linhas resetam a pontuação e a flag de fim de jogo — isso
  importa porque `criar()` roda de novo toda vez que `this.scene.restart()`
  é chamado (seção 6.4).

- [ ] Bloco de movimento aleatório e reset de estado colado — função criar() completa

---

## 7. Funções de evento: moeda, colisão e fim de jogo

Cole os três blocos abaixo depois do fechamento de `criar()`.

```javascript
function coletarMoeda(jogador, moeda) {
  moeda.destroy();
  pontuacao += 10;
  textoPontuacao.setText('Pontos: ' + pontuacao);

  if (moedas.countActive(true) === 0) {
    encerrarJogo(this, 'Você venceu!');
  }
}

function colidirComInimigo() {
  encerrarJogo(this, 'Game Over');
}

function encerrarJogo(cena, mensagem) {
  if (jogoTerminou) return;
  jogoTerminou = true;
  jogador.setVelocity(0, 0);
  inimigos.getChildren().forEach(inimigo => inimigo.setVelocity(0, 0));

  textoFimDeJogo = cena.add.text(320, 240, mensagem + '\nPressione R', {
    fontSize: '28px',
    fill: '#fff',
    align: 'center'
  }).setOrigin(0.5).setDepth(10);
}
```

- `coletarMoeda(jogador, moeda)` é chamada automaticamente pelo `overlap`
  configurado na seção 6.3, sempre que o jogador toca uma moeda. Ela some
  com a moeda (`destroy()`), soma 10 pontos e checa se **não sobrou mais
  nenhuma moeda ativa** — se não sobrou, o jogo é vencido.
- `colidirComInimigo()` é chamada pelo outro `overlap`, sempre que o
  jogador toca um fantasma — aqui não existe distinção entre fantasma
  "normal" ou "assustado" (diferente da versão Godot): qualquer toque
  encerra o jogo.
- `encerrarJogo(cena, mensagem)` centraliza o fim de jogo (vitória ou
  derrota): trava tudo (`jogoTerminou = true`), zera a velocidade do
  jogador e de todos os fantasmas, e mostra o texto final no centro da
  tela. O `if (jogoTerminou) return;` no início evita que essa função rode
  duas vezes (por exemplo, se o jogador tocar dois fantasmas quase ao mesmo
  tempo).

- [ ] As três funções de evento coladas e salvas

---

## 8. O loop do jogo (atualizar())

Cole por último a função `atualizar()`, que o Phaser chama sozinho a cada
frame (por volta de 60 vezes por segundo):

```javascript
function atualizar() {
  if (jogoTerminou) return;

  jogador.setVelocity(0);
  if (teclas.left.isDown) {
    jogador.setVelocityX(-velocidade);
    jogador.setAngle(180);
  } else if (teclas.right.isDown) {
    jogador.setVelocityX(velocidade);
    jogador.setAngle(0);
  }

  if (teclas.up.isDown) {
    jogador.setVelocityY(-velocidade);
    jogador.setAngle(-90);
  } else if (teclas.down.isDown) {
    jogador.setVelocityY(velocidade);
    jogador.setAngle(90);
  }

  inimigos.getChildren().forEach(inimigo => {
    inimigo.setVelocity(inimigo.direcao.x * 90, inimigo.direcao.y * 90);
    inimigo.setFlipX(inimigo.direcao.x < 0);
  });
}
```

- Se o jogo já terminou, a função sai logo no início — ninguém mais se move.
- A cada frame, a velocidade do jogador é zerada e recalculada a partir de
  quais setas estão pressionadas **agora** — por isso o movimento para
  assim que a tecla é solta. `setAngle()` gira o sprite pra apontar na
  direção do movimento.
- Repare que horizontal (`left`/`right`) e vertical (`up`/`down`) usam
  `if`/`else if` **separados**: isso permite mover na diagonal (por
  exemplo, segurando seta direita + seta baixo ao mesmo tempo).
- Os fantasmas não leem teclado: eles só aplicam a `direcao` sorteada
  periodicamente (seção 6.5) como velocidade constante, e `setFlipX`
  espelha o sprite horizontalmente quando estão indo pra esquerda, pra não
  parecer andando de costas.

- [ ] Função atualizar() colada e salva

---

## 9. Ligando tudo

Uma última linha, fora de qualquer função, no final do arquivo:

```javascript
new Phaser.Game(configuracao);
```

Isso cria o jogo de verdade, usando o objeto `configuracao` da seção 3 —
é essa linha que efetivamente liga o motor e começa a chamar
`preCarregar()` → `criar()` → `atualizar()` em loop.

- [ ] Linha final `new Phaser.Game(configuracao);` colada e salva — game.js completo

---

## 10. Rodando o jogo no navegador (Codespace + Chromebook)

Abrir `game.html` direto (clicando duas vezes no arquivo) **não funciona**:
o navegador bloqueia o carregamento das imagens (`pacman_sheet.png`,
`ghost_sheet.png`) quando a página é aberta como arquivo local, sem
servidor. É preciso servir os arquivos por HTTP — no Codespace, o jeito
mais simples é a extensão **Live Server**.

1. No Codespace, abra o painel de **Extensions** (ícone de 4 quadradinhos
   na barra lateral esquerda, ou `Ctrl+Shift+X`).
2. Busque por **Live Server** (autor Ritwick Dey) e clique em **Install**.
3. No Explorer, clique com o **botão direito** em `game.html` e escolha
   **Open with Live Server**.
4. O Codespace mostra uma notificação de porta encaminhada (geralmente a
   5500) — clique em **Open in Browser**. Isso abre uma nova aba do
   Chromebook com o jogo rodando de verdade (o Codespace encaminha a porta
   pra fora, então funciona igual a um site normal).
   - Se a notificação não aparecer, abra o painel **Ports** (aba na parte
     de baixo do editor, ao lado de "Terminal"), ache a porta `5500` e
     clique no ícone de globo/link na linha dela.
5. Use as **setas do teclado** (↑ ↓ ← →) pra mover o Pacman.

O que esperar:

- O labirinto azul aparece com pontinhos brancos (moedas) espalhados nos
  espaços livres do mapa.
- Comer uma moeda soma 10 pontos e o placar no canto atualiza.
- Encostar num fantasma encerra o jogo com "Game Over"; comer todas as
  moedas encerra com "Você venceu!".
- Depois de terminar, apertar **R** reinicia a partida.

Toda vez que você editar e salvar `game.js` (ou `game.html`) com a aba do
Live Server aberta, a página recarrega sozinha — não precisa reabrir manualmente.

Se algo não funcionar, abra o **Console** do navegador (tecla F12 →
aba **Console**) — erros de JavaScript aparecem ali, geralmente apontando o
arquivo e a linha exata do problema.

---

## 11. Pra ir além (opcional)

Com o jogo completo rodando, dá pra ir além — nada disso é obrigatório:

- **Vidas**: hoje um único toque num fantasma encerra o jogo. Dá pra somar
  uma variável `vidas` (começando em 3), e só chamar `encerrarJogo` quando
  chegar a zero, reposicionando o jogador nas outras vezes.
- **Fantasma persegue de verdade**: em vez de sortear direção periodicamente
  (seção 6.5), comparar a posição do fantasma com a do jogador e escolher
  o movimento que mais aproxima — é a mesma ideia usada na versão deste
  jogo feita em Godot.
- **Power pellet**: uma moeda especial (textura própria, gerada por código
  como `'moeda'`) que deixa os fantasmas "assustados" por alguns segundos —
  nesse tempo, tocar neles soma pontos em vez de encerrar o jogo.
- **Tamanho do mapa**: editar as strings de `mapa` (seção 3) pra um
  labirinto maior ou diferente, mantendo sempre `1` = parede e qualquer
  outro caractere = espaço livre.`