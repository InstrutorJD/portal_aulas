# Pacman no Godot — guia completo para quem nunca abriu o Godot

Este guia parte do zero: abrir o Godot pela primeira vez até o jogo rodando.
Cada ação de clique está descrita. Jogo 2D, sem sprites (tudo desenhado por
código com `_draw()`).

---

## 1. Criando o projeto

1. Abra o Godot. Você vai cair numa tela chamada **Project Manager**, com uma
   lista de projetos (provavelmente vazia).
2. Clique no botão **Create** (ou **Novo Projeto**), no canto superior.
3. No campo **Project Name**, digite `Pacman`.
4. No campo **Project Path**, escolha uma pasta vazia no seu computador
   clicando em **Browse** — por exemplo, crie uma pasta `Pacman` dentro de
   `Documentos`.
5. Em **Renderer**, deixe marcado **Mobile** (é mais leve, e esse jogo não
   precisa de gráficos avançados).
6. Clique em **Create & Edit**. O Godot vai abrir o editor com o projeto
   vazio.

Você está agora na tela principal do editor. No canto inferior esquerdo tem
um painel chamado **FileSystem** (Sistema de Arquivos) — é ali que os
arquivos do projeto aparecem. No canto superior esquerdo tem o painel
**Scene** (Cena) — é ali que a estrutura da tela aparece. No lado direito tem
o **Inspector** — é onde você edita as propriedades de cada coisa que
selecionar.

---

## 2. Criando os arquivos de script

Vamos criar 5 arquivos de código (`.gd`). O processo é o mesmo pros 5,
mudando só o nome:

1. No painel **FileSystem** (canto inferior esquerdo), clique com o **botão
   direito** em cima de `res://` (a pasta raiz do projeto).
2. No menu que abrir, clique em **New Script...** (Novo Script).
3. Uma janela vai abrir perguntando o nome do script. No campo **Path**,
   apague o que tiver depois de `res://` e digite o nome do arquivo — por
   exemplo `maze.gd`.
4. Pode deixar **Template** como está (Default). Clique em **Create**.
5. O Godot abre o script vazio, já com uma linha `extends Node2D` gerada
   automaticamente. **Apague todo o conteúdo** desse arquivo e cole o código
   correspondente da seção 3 abaixo (cada script tem seu próprio bloco de
   código, com o nome do arquivo escrito acima).
6. Salve com **Ctrl+S**.
7. Repita esse processo pros outros 4 arquivos: `pacman.gd`, `ghost.gd`,
   `game_manager.gd`, `main.gd`.

No final, o painel FileSystem deve mostrar esses 5 arquivos `.gd` soltos
dentro de `res://`.

---

## 3. Código de cada script

### maze.gd — o labirinto

Gera o grid do labirinto por código (parede/pastilha/vazio), desenha tudo e
expõe funções de consulta (parede, comer pastilha, converter célula ↔ pixel).

```gdscript
extends Node2D
class_name Maze

const CELL_SIZE = 24
const WIDTH = 21
const HEIGHT = 21

var grid: Array = []

func _ready():
	_generate_grid()
	queue_redraw()

# Gera um labirinto tipo "grade": pilares nas posições pares,
# corredores nas ímpares. Sempre conectado, de qualquer tamanho.
func _generate_grid():
	grid.clear()
	for y in HEIGHT:
		var row = []
		for x in WIDTH:
			if y == 0 or y == HEIGHT - 1 or x == 0 or x == WIDTH - 1:
				row.append(1)
			elif x % 2 == 0 and y % 2 == 0:
				row.append(1)
			else:
				row.append(2)
		grid.append(row)

	# power pellets nos 4 cantos internos
	grid[1][1] = 3
	grid[1][WIDTH - 2] = 3
	grid[HEIGHT - 2][1] = 3
	grid[HEIGHT - 2][WIDTH - 2] = 3

	# sala vazia no centro pros fantasmas
	var cx = WIDTH / 2
	var cy = HEIGHT / 2
	for y in range(cy - 1, cy + 2):
		for x in range(cx - 2, cx + 3):
			grid[y][x] = 0

# Desenha paredes (retângulo azul), pastilhas (pontinho branco)
# e power pellets (bolinha branca maior). Sem sprite nenhum.
func _draw():
	for y in grid.size():
		for x in grid[y].size():
			var cell = grid[y][x]
			var pos = Vector2(x, y) * CELL_SIZE
			if cell == 1:
				draw_rect(Rect2(pos, Vector2(CELL_SIZE, CELL_SIZE)), Color(0.1, 0.1, 0.6))
			elif cell == 2:
				draw_circle(pos + Vector2(CELL_SIZE / 2.0, CELL_SIZE / 2.0), 3, Color.WHITE)
			elif cell == 3:
				draw_circle(pos + Vector2(CELL_SIZE / 2.0, CELL_SIZE / 2.0), 7, Color.WHITE)

# true se a célula é parede ou está fora do grid (conta como parede)
func is_wall(cell: Vector2i) -> bool:
	if cell.y < 0 or cell.y >= grid.size():
		return true
	if cell.x < 0 or cell.x >= grid[cell.y].size():
		return true
	return grid[cell.y][cell.x] == 1

# come a pastilha da célula (se houver) e devolve o que tinha: 0/2/3
func try_eat(cell: Vector2i) -> int:
	if cell.y < 0 or cell.y >= grid.size():
		return 0
	if cell.x < 0 or cell.x >= grid[cell.y].size():
		return 0
	var val = grid[cell.y][cell.x]
	if val == 2 or val == 3:
		grid[cell.y][cell.x] = 0
		queue_redraw()
	return val

# quantas pastilhas (normais + power) ainda restam no mapa
func pellets_left() -> int:
	var count = 0
	for row in grid:
		for cell in row:
			if cell == 2 or cell == 3:
				count += 1
	return count

# posição em pixels -> coordenada de célula (linha/coluna)
func world_to_cell(world_pos: Vector2) -> Vector2i:
	return Vector2i(int(world_pos.x / CELL_SIZE), int(world_pos.y / CELL_SIZE))

# coordenada de célula -> posição em pixels (centro da célula)
func cell_to_world(cell: Vector2i) -> Vector2:
	return Vector2(cell.x * CELL_SIZE + CELL_SIZE / 2.0, cell.y * CELL_SIZE + CELL_SIZE / 2.0)
```

### pacman.gd — o jogador

Movimento em grade (célula por célula, nunca "no meio do caminho"), leitura de
input, e desenho de um círculo amarelo com uma "fatia" preta simulando a boca.

```gdscript
extends Node2D
class_name Pacman

const SPEED = 120.0
const CELL_SIZE = 24

var maze: Maze
var current_cell: Vector2i
var direction := Vector2i.ZERO
var next_direction := Vector2i.ZERO
var mouth_open := true
var mouth_timer := 0.0

# chamado pelo main.gd depois de atribuir "maze"
# (NÃO usar _ready aqui: o _ready dos filhos roda antes do _ready do pai)
func initialize():
	current_cell = maze.world_to_cell(position)
	position = maze.cell_to_world(current_cell)

func _process(delta):
	delta = min(delta, 0.05)  # trava pico de lag, evita atravessar parede
	if maze == null:
		return
	_read_input()
	_move(delta)
	_animate_mouth(delta)
	queue_redraw()

# lê as setas do teclado e guarda a direção desejada
func _read_input():
	if Input.is_action_pressed("ui_right"):
		next_direction = Vector2i(1, 0)
	elif Input.is_action_pressed("ui_left"):
		next_direction = Vector2i(-1, 0)
	elif Input.is_action_pressed("ui_up"):
		next_direction = Vector2i(0, -1)
	elif Input.is_action_pressed("ui_down"):
		next_direction = Vector2i(0, 1)

# anda até o centro da PRÓXIMA célula usando move_toward
# (nunca ultrapassa o alvo, por isso nunca atravessa parede)
func _move(delta):
	if direction == Vector2i.ZERO:
		if next_direction != Vector2i.ZERO and not maze.is_wall(current_cell + next_direction):
			direction = next_direction
		return

	var target = maze.cell_to_world(current_cell + direction)
	position = position.move_toward(target, SPEED * delta)

	if position == target:
		current_cell += direction

		var eaten = maze.try_eat(current_cell)
		if eaten == 2:
			GameManager.add_score(10)
		elif eaten == 3:
			GameManager.add_score(50)
			GameManager.start_frightened()

		# troca de direção só é aceita se a próxima célula não for parede
		if next_direction != Vector2i.ZERO and not maze.is_wall(current_cell + next_direction):
			direction = next_direction
		if maze.is_wall(current_cell + direction):
			direction = Vector2i.ZERO

# pisca a "boca" abrindo e fechando
func _animate_mouth(delta):
	mouth_timer += delta
	if mouth_timer > 0.15:
		mouth_timer = 0.0
		mouth_open = not mouth_open

# desenha o círculo amarelo + fatia preta (boca) na direção do movimento
func _draw():
	var radius = CELL_SIZE / 2.0 - 2
	draw_circle(Vector2.ZERO, radius, Color.YELLOW)

	if mouth_open and direction != Vector2i.ZERO:
		var angle = Vector2(direction).angle()
		var wedge = PackedVector2Array([
			Vector2.ZERO,
			Vector2(radius * 2, 0).rotated(angle - 0.4),
			Vector2(radius * 2, 0).rotated(angle + 0.4)
		])
		# cor igual ao fundo simula a "boca" aberta
		draw_colored_polygon(wedge, Color.BLACK)
```

### ghost.gd — o fantasma

Mesmo esquema de movimento em grade do Pacman. Em modo normal persegue o
Pacman (escolhe a direção que mais aproxima); em modo assustado, anda
aleatório e pode ser "comido".

```gdscript
extends Node2D
class_name Ghost

const SPEED = 100.0
const CELL_SIZE = 24

@export var color: Color = Color.RED

var maze: Maze
var pacman: Pacman
var current_cell: Vector2i
var direction := Vector2i.ZERO
var frightened := false

# chamado pelo main.gd depois de atribuir "maze" e "pacman"
func initialize():
	current_cell = maze.world_to_cell(position)
	position = maze.cell_to_world(current_cell)
	_pick_direction()

func _process(delta):
	delta = min(delta, 0.05)  # mesma trava de segurança do Pacman
	if maze == null:
		return
	_move(delta)
	queue_redraw()

# anda até o centro da próxima célula; ao chegar, escolhe pra onde ir
func _move(delta):
	var target = maze.cell_to_world(current_cell + direction)
	position = position.move_toward(target, SPEED * delta)
	if position == target:
		current_cell += direction
		_pick_direction()

# decide a próxima direção: persegue o Pacman (normal) ou anda
# aleatório (assustado), nunca voltando pra célula anterior à toa
func _pick_direction():
	var options: Array = []
	for d in [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]:
		if d == -direction:
			continue
		if not maze.is_wall(current_cell + d):
			options.append(d)

	if options.is_empty():
		direction = -direction
		return

	if frightened or pacman == null:
		direction = options[randi() % options.size()]
		return

	# perseguição simples: escolhe a direção que mais aproxima do Pacman
	var target_cell = maze.world_to_cell(pacman.position)
	var best = options[0]
	var best_dist = INF
	for d in options:
		var dist = (current_cell + d).distance_to(Vector2(target_cell))
		if dist < best_dist:
			best_dist = dist
			best = d
	direction = best

func set_frightened(value: bool):
	frightened = value

# desenha um círculo colorido; fica azul enquanto assustado
func _draw():
	var radius = CELL_SIZE / 2.0 - 2
	var c = Color.BLUE if frightened else color
	draw_circle(Vector2.ZERO, radius, c)
```

### game_manager.gd — estado global do jogo

Guarda pontuação, vidas e o cronômetro do modo "assustado". Mais adiante
(seção 4) vamos transformar esse arquivo numa variável global chamada
`GameManager`, acessível de qualquer outro script.

```gdscript
extends Node

signal score_changed(new_score)
signal frightened_ended
signal game_over
signal game_won

var score := 0
var lives := 3
var frightened_time := 6.0
var frightened_timer := 0.0
var is_frightened := false

# conta regressiva do modo "assustado" (depois de comer power pellet)
func _process(delta):
	if is_frightened:
		frightened_timer -= delta
		if frightened_timer <= 0:
			is_frightened = false
			emit_signal("frightened_ended")

func add_score(amount: int):
	score += amount
	emit_signal("score_changed", score)

func start_frightened():
	is_frightened = true
	frightened_timer = frightened_time

func lose_life():
	lives -= 1
	if lives <= 0:
		emit_signal("game_over")
```

### main.gd — liga tudo

Liga o labirinto, o Pacman e os fantasmas entre si, checa colisão (com
invulnerabilidade temporária pra não descontar várias vidas de uma encostada
só) e atualiza o placar na tela.

```gdscript
extends Node2D

var maze: Maze
var pacman: Pacman
var ghosts: Array = []
var invulnerable := false
var invulnerable_timer := 0.0

func _ready():
	maze = $Maze
	pacman = $Pacman
	pacman.maze = maze
	pacman.initialize()

	for ghost in $Ghosts.get_children():
		ghost.maze = maze
		ghost.pacman = pacman
		ghost.initialize()
		ghosts.append(ghost)

	GameManager.score_changed.connect(_on_score_changed)
	GameManager.game_over.connect(_on_game_over)

	if has_node("UI/ScoreLabel"):
		$UI/ScoreLabel.add_theme_font_size_override("font_size", 24)
	_on_score_changed(GameManager.score)

# a cada frame: atualiza modo assustado dos fantasmas e checa colisão
func _process(delta):
	if invulnerable:
		invulnerable_timer -= delta
		if invulnerable_timer <= 0:
			invulnerable = false

	for ghost in ghosts:
		ghost.set_frightened(GameManager.is_frightened)
		if ghost.current_cell == pacman.current_cell:
			if GameManager.is_frightened:
				# Pacman "come" o fantasma: ele volta pro centro
				ghost.position = maze.cell_to_world(Vector2i(10, 10))
				GameManager.add_score(200)
			elif not invulnerable:
				# perde 1 vida e fica 1.5s protegido antes de poder perder outra
				GameManager.lose_life()
				pacman.position = maze.cell_to_world(Vector2i(10, 19))
				invulnerable = true
				invulnerable_timer = 1.5

	if maze.pellets_left() == 0:
		GameManager.emit_signal("game_won")

func _on_score_changed(new_score):
	if has_node("UI/ScoreLabel"):
		$UI/ScoreLabel.text = "Pontuação: %d" % new_score

func _on_game_over():
	print("Game Over")
	get_tree().paused = true
```

Com os 5 arquivos criados e salvos, feche todas as abas de script (não
precisa, mas ajuda a não se perder) e vamos pra configuração.

---

## 4. Transformando o game_manager.gd numa variável global (Autoload)

Isso é necessário porque `pacman.gd`, `ghost.gd` e `main.gd` usam a palavra
`GameManager` direto no código (ex: `GameManager.add_score(10)`), sem nunca
declarar essa variável. Pra isso funcionar, o Godot precisa saber que
`GameManager` é o `game_manager.gd` carregado globalmente.

1. No menu superior, clique em **Project**.
2. No menu que abrir, clique em **Project Settings...**.
3. Uma janela grande vai abrir. No topo dela, clique na aba **Globals**
   (em algumas traduções aparece como **Globais**).
4. Dentro dessa aba, tem sub-abas: **Autoload**, **Shader Globals**, **Groups**.
   Clique em **Autoload** (já deve estar selecionada por padrão).
5. Clique no botão **Select Script/Scene...** (ou **Selecionar Script/Cena**).
6. Uma janela de arquivos abre. Clique duas vezes na pasta certa (se
   necessário) até ver `game_manager.gd` na lista, e clique nele uma vez pra
   selecionar.
7. Clique em **Open** (Abrir).
8. Você volta pra tela de Autoload. Repare que agora tem um campo de texto
   com o nome sugerido (algo como `game_manager`). **Apague e digite
   `GameManager`**, com essa capitalização exata (G e M maiúsculos, sem
   espaço, sem underline).
9. Clique no botão **Add** (Adicionar), à direita do campo de nome.
10. Confira a lista que aparece embaixo: deve ter uma linha com **Nome**
    `GameManager` e **Path** (Caminho) preenchido com algo como
    `res://game_manager.gd`. Se a coluna Path estiver vazia, clique no ícone
    de lixeira daquela linha pra remover, e repita os passos 5 a 9 — às
    vezes essa tela tem um bug de exibição e o caminho não salva de
    primeira.
11. Clique em **Close** (Fechar) pra sair da janela de configurações.

---

## 5. Montando a cena do jogo

Uma "cena" no Godot é a estrutura de objetos (chamados de **nós**, ou
*nodes*) que formam uma tela do jogo. Vamos montar a cena principal do zero.

### 5.1. Criar a cena e o nó raiz

1. No menu superior, clique em **Scene**.
2. Clique em **New Scene** (Nova Cena).
3. No painel **Scene** (canto superior esquerdo), agora aparecem alguns
   botões de ícones perguntando qual tipo de nó raiz criar (2D Scene, 3D
   Scene, User Interface, Other Node).
4. Clique em **2D Scene** (Cena 2D). Isso cria um nó raiz do tipo `Node2D`
   já pronto.
5. O nó vai aparecer no painel Scene com o nome `Node2D`. Vamos renomear:
   clique duas vezes (devagar, não é duplo-clique rápido) em cima do nome
   `Node2D` até o texto virar editável, apague e digite `Main`, e aperte
   **Enter**.
6. Salve a cena: **Ctrl+S**. Na janela que abrir, digite o nome do arquivo
   como `Main` (o Godot já completa com `.tscn`) e clique em **Save**.

### 5.2. Anexar o main.gd no nó Main

1. Com o nó `Main` selecionado no painel Scene, clique com o **botão
   direito** em cima dele.
2. No menu, clique em **Attach Script...** (Anexar Script).
3. Abre uma janela. Mude o botão de opção no topo da janela de **New
   Script File** (Novo Arquivo de Script) para **Load** (Carregar).
4. Selecione o arquivo `main.gd` na lista de arquivos e clique em **Open**.
5. O ícone do nó `Main` no painel Scene agora deve mostrar um pequeno
   pergaminho, indicando que tem um script anexado.

### 5.3. Criar os nós filhos

Vamos adicionar, dentro de `Main`, os nós: `Maze`, `Pacman`, `Ghosts` (e
dentro dele `Ghost1`, `Ghost2`, `Ghost3`), e `UI` (com `ScoreLabel` dentro).

**Para cada nó Node2D (Maze, Pacman, Ghosts, Ghost1, Ghost2, Ghost3):**

1. Selecione o nó que vai ser o **pai** (por exemplo, clique em `Main` pra
   criar um filho direto dele).
2. Clique no botão **+** no canto superior esquerdo do painel Scene (ou
   clique com o botão direito no nó pai e escolha **Add Child Node...**).
3. Abre uma janela de busca de tipos de nó. Digite `Node2D` na caixa de
   busca.
4. Clique duas vezes em cima de **Node2D** na lista (ou selecione e clique
   **Create**).
5. O novo nó aparece com o nome `Node2D` (ou `Node2D2`, etc). Renomeie
   clicando duas vezes devagar no nome, como fizemos com `Main`.

Repita esse processo seguindo esta ordem e hierarquia:

- Selecione `Main` → crie um filho `Node2D` → renomeie pra `Maze`.
- Selecione `Main` → crie um filho `Node2D` → renomeie pra `Pacman`.
- Selecione `Main` → crie um filho `Node2D` → renomeie pra `Ghosts`.
- Selecione `Ghosts` → crie um filho `Node2D` → renomeie pra `Ghost1`.
- Selecione `Ghosts` → crie um filho `Node2D` → renomeie pra `Ghost2`.
- Selecione `Ghosts` → crie um filho `Node2D` → renomeie pra `Ghost3`.

Ao final, o painel Scene deve mostrar esta árvore (use a setinha ao lado de
cada nó pra expandir/recolher e conferir):

```
Main
├── Maze
├── Pacman
└── Ghosts
    ├── Ghost1
    ├── Ghost2
    └── Ghost3
```

**Para o UI (que é de um tipo diferente, CanvasLayer):**

1. Selecione `Main`.
2. Clique no **+** de novo, mas dessa vez digite `CanvasLayer` na busca.
3. Clique duas vezes em **CanvasLayer** pra criar.
4. Renomeie pra `UI`.
5. Selecione `UI`.
6. Clique no **+**, digite `Label` na busca.
7. Clique duas vezes em **Label** pra criar.
8. Renomeie pra `ScoreLabel`.

Árvore final completa:

```
Main
├── Maze
├── Pacman
├── Ghosts
│   ├── Ghost1
│   ├── Ghost2
│   └── Ghost3
└── UI
    └── ScoreLabel
```

### 5.4. Anexar os scripts nos nós certos

Repita o processo da seção 5.2 (botão direito → Attach Script → mudar pra
Load → selecionar o arquivo) pra cada um destes nós:

- `Maze` → `maze.gd`
- `Pacman` → `pacman.gd`
- `Ghost1` → `ghost.gd`
- `Ghost2` → `ghost.gd`
- `Ghost3` → `ghost.gd`

`Ghosts` e `UI` **não** recebem script nenhum, só agrupam outros nós.
`ScoreLabel` também não recebe script.

### 5.5. Configurar o texto inicial do ScoreLabel

1. Clique no nó `ScoreLabel` pra selecioná-lo.
2. No painel **Inspector** (lado direito da tela), procure o campo
   **Text**.
3. Clique no campo de texto ao lado de **Text** e digite: `Pontuação: 0`.
4. Ainda no Inspector, procure a seção **Layout** ou **Transform** →
   **Position**, e defina X = `10`, Y = `10`, pra ele ficar no canto
   superior esquerdo da tela.

### 5.6. Posicionar Pacman e fantasmas

O labirinto vai ter 21 colunas por 21 linhas, cada célula com 24 pixels. Não
dá pra posicionar arrastando visualmente no editor, porque o desenho do
labirinto só aparece quando o jogo está rodando (o código usa `_draw()`, que
não executa em modo de edição) — então vamos digitar as posições
diretamente.

Para cada um dos nós abaixo: clique nele no painel Scene, procure no
Inspector a seção **Transform**, clique na setinha pra expandir se estiver
fechada, ache o campo **Position**, clique no primeiro número (X), apague,
digite o valor da tabela, aperte **Tab**, apague o segundo número (Y) e
digite o valor, aperte **Enter**.

| Nó     | X   | Y   |
|--------|-----|-----|
| Pacman | 252 | 468 |
| Ghost1 | 228 | 252 |
| Ghost2 | 252 | 252 |
| Ghost3 | 276 | 252 |

O nó `Maze` pode ficar em X=0, Y=0 (posição padrão, não precisa mexer).

### 5.7. Salvar tudo

Aperte **Ctrl+S** de novo pra garantir que a cena salvou com toda essa
estrutura.

---

## 6. Rodando o jogo

1. Aperte **F6** (roda a cena que está aberta no momento) — ou clique no
   ícone de clapboard/filme no canto superior direito da tela, chamado
   **Run Current Scene**.
2. Uma janela separada abre com o jogo. Clique **dentro** dessa janela pra
   ela ficar em foco.
3. Use as **setas do teclado** (↑ ↓ ← →) pra mover o Pacman. Elas já vêm
   mapeadas por padrão no Godot, não precisa configurar nada.

O que esperar:

- O labirinto azul aparece com pontinhos brancos (pastilhas) e bolinhas
  maiores nos 4 cantos internos (power pellets).
- Comer pastilha pequena = 10 pontos. Power pellet = 50 pontos + fantasmas
  ficam azuis (assustados) por 6 segundos.
- Encostar num fantasma assustado (azul) = come ele, +200 pontos. Encostar
  num fantasma normal (vermelho) = perde 1 vida, com 1.5s de proteção
  depois.
- Comer todas as pastilhas = vitória. Perder as 3 vidas = fim de jogo (o
  jogo pausa e aparece "Game Over" no console de baixo, no painel
  **Output**).

Se algum erro aparecer no painel **Output** (embaixo, em vermelho), leia a
mensagem — ela geralmente aponta o arquivo e a linha exata do problema.

---

## 7. Pra deixar ainda maior ou mudar o jogo

- **Tamanho do mapa**: abra `maze.gd` (clique duas vezes nele no painel
  FileSystem) e mude os valores de `WIDTH` e `HEIGHT` no topo (mantenha
  números ímpares). Depois recalcule e ajuste as posições de Pacman e
  fantasmas na seção 5.6.
- **Dificuldade**: `SPEED` no `pacman.gd` e no `ghost.gd`,
  `frightened_time` no `game_manager.gd`.
- **Sprites de verdade**: quando tiver arte pronta, troque o `_draw()` por
  um nó filho do tipo `AnimatedSprite2D` dentro de Pacman/Ghost — a lógica
  de movimento em grade não muda nada.
