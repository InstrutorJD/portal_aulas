# Padrão de trilhas novas — layout de slides

> ⚠️ **STATUS: MOTOR EM CONSTRUÇÃO.** O portal ainda NÃO sabe executar aulas
> neste formato — o motor (`shared/aula-md.js`) e o visual base das práticas
> (`shared/aula-base.css`) ainda vão ser construídos, usando como piloto a
> trilha em andamento de cada turma. Enquanto este aviso existir: se pedirem
> uma trilha nova, **avise o usuário que o motor ainda não está pronto e
> pergunte como seguir — não caia no padrão antigo**. Este aviso sai quando
> o motor estiver pronto e testado.
>
> **Trilhas piloto** (ainda em andamento, as ÚNICAS já existentes que vão
> para o layout novo): as trilhas do **FinancApp** em Sistemas
> (`projeto-financapp-*` e o módulo `pratica-financapp` de Redes) e a
> trilha **Motor Phaser: Construa o Pacman** em Jogos (`cod-phaser`).

Este documento vale para **toda trilha criada daqui pra frente** nas turmas
Jogos Digitais (`turmas/jogos/`) e Desenvolvimento de Sistemas
(`turmas/sistemas/`).

- **Trilhas já construídas não mudam.** As 136 atividades existentes seguem o
  padrão antigo, documentado no `README.md` ("Diretrizes de conteúdo
  educacional"). Não migre, não "modernize" e não copie nenhuma delas como
  modelo para trilha nova.
- **O que muda é só o layout de apresentação.** Regras de nota, progresso,
  cadeado entre módulos, capacidade MSEP e qualidade das perguntas continuam
  exatamente como hoje.

---

## 1. Visão geral

| | Padrão antigo (não usar em trilha nova) | Padrão novo |
|---|---|---|
| Teoria | Um `*-teoria.html` inteiro por aula, com CSS próprio e `STEPS = [{ story, question }]` | Um arquivo **`.md`** com o conteúdo + uma casca HTML mínima que carrega o motor compartilhado |
| Visual da teoria | Cada arquivo com seu CSS (~110 linhas repetidas) | Visual de slides compartilhado: palco, transições, entrada animada, perguntas em cartões |
| Apresentação do professor | Botão "Gerar Slides" baixa um `.pptx` | Botão **▶ Apresentação**: o próprio `.md` vira slides interativos em tela cheia, no navegador |
| Prática | Tela própria por tipo | Mesma lógica de hoje, com o **visual base compartilhado** (`shared/aula-base.css`) |

A vantagem: **o mesmo `.md` serve para o aluno estudar (com nota) e para o
professor projetar**, e é escrito no mesmo formato do "Criar Material"
(`materiais/instrucoes-para-ia.md`).

---

## 2. Antes de começar (obrigatório)

1. **Capacidade real.** A capacidade da trilha é fornecida pelo professor (a
   mesma verificada pela MSEP do SENAI). Nunca invente. Sem capacidade, pergunte.
2. **Conteúdo embasado na capacidade.** Teoria e prática existem para
   desenvolver/verificar aquela capacidade, não conteúdo genérico.
3. **Estrutura:** 1 módulo de teoria + 1 ou mais módulos de prática, com a
   prática travada até a teoria ser concluída (`requires`).
4. **Não copie** nenhuma atividade de `turmas/*/atividades/` como ponto de
   partida — elas estão no padrão antigo.

---

## 3. Arquivos de uma trilha nova

Para uma trilha de key `<trilha>` na turma `<turma>`:

```
turmas/<turma>/aulas/<trilha>-teoria.md          ← conteúdo da teoria (o que você escreve)
turmas/<turma>/atividades/<trilha>-teoria.html   ← casca mínima que carrega o motor (seção 5)
turmas/<turma>/atividades/<trilha>-<pratica>.html← prática(s), com o visual base (seção 8)
turmas/<turma>/config.js                         ← registro da trilha e dos módulos (seção 6)
```

---

## 4. Teoria: o arquivo `.md`

### 4.1 Sintaxe

A sintaxe dos slides é a mesma do "Criar Material" e está **inteira** em
`materiais/instrucoes-para-ia.md` (seções 2 a 4: separador `---`, títulos,
listas, `+` em etapas, código, tabela, destaque, QR Code, cronômetro e os
**limites de cada slide**). Leia esse arquivo antes de escrever — não repita
nem invente sintaxe aqui.

Diferenças da aula de trilha em relação a um material avulso:

- **Cabeçalho** (no topo do arquivo):

  ```
  ---
  titulo: Fundamentos de Redes
  turma: 2º DS
  ---
  ```

  Sem `aula:` nem `data:` — trilha não tem número/data de aula. A
  capacidade NÃO vai no `.md`: vem do `config.js` da trilha e o motor mostra
  sozinho no slide de abertura.

- **Perguntas valem nota.** Toda pergunta `- [ ]` / `- [x]` conta para a
  nota da aula. Formato de cada pergunta:

  ```
  ## Pergunta
  Você precisa rodar um comando Git sem sair do editor. O que usar?

  - [x] O terminal integrado do editor
  - [ ] A paleta de temas do editor
  - [ ] O salvamento automático de arquivos
  - [ ] O painel de extensões instaladas

  > Por quê: o terminal integrado roda comandos sem trocar de janela.
  ```

  - Exatamente **4 alternativas** e exatamente **uma** `[x]`.
  - Escreva a certa em qualquer posição — o motor embaralha as alternativas
    para o aluno.
  - A linha `> Por quê: ...` logo depois das alternativas é a **explicação**.
    O aluno só a vê quando ACERTA (no erro, nada revela a resposta — ver
    seção 7). Na apresentação do professor ela aparece depois de revelar a
    resposta.
  - **Uma pergunta por slide**, e nada além do enunciado, das alternativas e
    do `> Por quê:`.

- **Ritmo:** 1 ou 2 slides de conteúdo antes de cada pergunta. Uma aula
  típica tem **8 a 14 perguntas** (como as teorias atuais) e fecha com um
  slide `#` de encerramento chamando para a prática.

### 4.2 Qualidade das perguntas (mesmas regras de hoje)

Valem integralmente as regras do `README.md`, seção "Perguntas de múltipla
escolha (quiz de teoria)":

- **Comprimento:** as 4 alternativas com tamanho e nível de detalhe
  parecidos — a certa não pode ser a mais longa.
- **O conteúdo não entrega a resposta:** o slide antes da pergunta ensina o
  conceito; a pergunta pede para APLICAR a um cenário novo, não repetir uma
  frase que acabou de aparecer.
- **Distratores plausíveis:** erros de raciocínio reais do mesmo domínio,
  nunca opções absurdas.

### 4.3 Estrutura recomendada da teoria

1. `# Título da trilha` + 1 linha de subtítulo (o motor adiciona a capacidade).
2. "Nesta aula você vai..." com `+` (3 a 4 itens).
3. Blocos de **conteúdo (1–2 slides) → pergunta**, repetidos.
4. "O que vimos" com `+`.
5. `# Hora da prática!` + 1 linha dizendo qual módulo de prática abrir.

---

## 5. Teoria: a casca HTML

> ⚠️ Modelo definitivo sai junto com o motor. A ideia: um arquivo de poucas
> linhas, sem CSS próprio, que só carrega o motor compartilhado e diz qual
> `.md` usar e qual a chave de progresso.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fundamentos de Redes — Teoria</title>
<link rel="stylesheet" href="../../../shared/aula-md.css">
<script src="../../../shared/supabase-config.js"></script>
<script src="../../../shared/session.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../../../shared/activity-tracker.js"></script>
<script src="../../../shared/progress-sync.js"></script>
<script src="../../../shared/aula-md.js"></script>
</head>
<body>
<script>
  AulaMD.iniciar({
    md: '../aulas/redes-fundamentos-teoria.md',
    activityLocation: 'redes_fundamentos_teoria',
  });
</script>
</body>
</html>
```

O motor cuida de tudo que hoje cada `*-teoria.html` repetia: visual,
progresso, nota, embaralhar, gabarito para a Gestão e o botão **▶
Apresentação** (só para professor).

---

## 6. Registro no `config.js`

Igual ao de hoje (ver `README.md`, "Hierarquia Matéria → Trilha → Módulo"):

```js
{
  key: 'redes-fundamentos',
  label: 'Fundamentos de Redes',
  desc: 'Uma frase sobre a trilha.',
  capacidade: '<texto EXATO fornecido pelo professor>',
  modules: [
    {
      key: 'teoria', title: 'Teoria — Fundamentos de Redes',
      desc: 'O que a teoria cobre, em uma frase.',
      icon: '📖', src: 'atividades/redes-fundamentos-teoria.html',
      progressKey: 'redes_fundamentos_teoria_progress_', progressMode: 'flag',
      hasGabarito: true
    },
    {
      key: 'pratica', title: 'Prática — ...',
      desc: '...',
      icon: '🛠️', src: 'atividades/redes-fundamentos-pratica.html',
      progressKey: 'redes_fundamentos_pratica_progress_', progressTotal: 6,
      requires: 'teoria', hasGabarito: true
    }
  ]
}
```

- `progressKey` = `activityLocation` da casca + `_progress_`.
- Não use `hasSlides` em trilha nova: o `.pptx` é do padrão antigo; a
  apresentação agora é o botão ▶ Apresentação.
- Atribua a trilha a um bimestre em Gestão → "Liberação por Trilha" (senão
  ela fica sempre visível — ver "Virada de bimestre" no README).

---

## 7. Nota e progresso (iguais às teorias atuais)

- A aula conta como **concluída** (`progressMode: 'flag'`) quando o aluno
  chega ao fim com **80% ou mais** de acerto.
- **Errou:** não mostra qual era a certa, não escreve a resposta, não mostra
  a explicação — o aluno segue para a próxima.
- **Abaixo de 80% no fim:** pode reiniciar a aula inteira.
- **Sem "responder até acertar":** pergunta já respondida não volta a
  aparecer ao recarregar a página.
- Alternativas embaralhadas para cada aluno.

---

## 8. Prática: visual base

- A **lógica** segue os motores de hoje (ex.: `shared/js-challenge-engine.js`,
  `CHALLENGES` com `tests`, dicas que dão o norte e não a resposta — ver
  README, "Dicas (hints) nas atividades").
- O **visual** vem de `shared/aula-base.css` (a construir): barra do topo,
  barra de progresso, cartões, botões, feedback de acerto/erro e transições —
  o mesmo estilo da teoria. A página da prática não traz CSS de layout
  próprio, só o que for específico daquele exercício.

---

## 9. Desempenho (a internet da escola é fraca)

- Efeitos **só com CSS** (transições e animações). Nada de biblioteca de
  animação, vídeo de fundo ou imagem pesada.
- Nenhuma fonte nova para baixar nas páginas dos alunos.
- Imagens só se forem essenciais, e leves.
- O motor de slides do professor (e bibliotecas como o QR Code) só carrega
  quando o professor clica em ▶ Apresentação.

---

## 10. Checklist de uma trilha nova

- [ ] Capacidade real, fornecida pelo professor, no `config.js`.
- [ ] `turmas/<turma>/aulas/<trilha>-teoria.md` seguindo `materiais/instrucoes-para-ia.md` + seção 4 deste documento.
- [ ] Perguntas: 4 alternativas, uma `[x]`, `> Por quê:`, tamanhos parecidos, distratores plausíveis.
- [ ] Casca `turmas/<turma>/atividades/<trilha>-teoria.html` (seção 5), sem CSS próprio.
- [ ] Prática(s) com o visual base, `requires: 'teoria'`.
- [ ] Módulos registrados no `config.js` (seção 6), sem `hasSlides`.
- [ ] Testes: seguir o `CLAUDE.md` (quem roda é o GitHub; testes novos só se o usuário pedir).
- [ ] `README.md` atualizado se algum comportamento mudou.
