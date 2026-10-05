# Checklist de Inspeção (React + Next.js + TypeScript)

Projeto base da **Aula 04**: o mesmo checklist que você fez em HTML, CSS e
JavaScript, agora do jeito que as ferramentas de IA costumam gerar.

## Como rodar no Codespace

```bash
npm install
npm run dev
```

Clique em **Abrir no navegador** (porta `3000`). Teste a inspeção e a página
**Histórico**. Para desligar: **Ctrl + C** no terminal.

## Checklist de análise da estrutura

Preencha a coluna **Onde está?** com `arquivo` (e a linha, se der).
Use o chat do Copilot para **achar**, mas confira abrindo o arquivo.

| # | O que procurar | Onde está? |
|---|---|---|
| 1 | O componente que mostra **um** item do checklist | |
| 2 | O componente que mostra APTO ou INAPTO | |
| 3 | O **estado** que guarda os itens marcados | |
| 4 | O **estado** que guarda o resultado | |
| 5 | As **props** que o `ItemChecklist` recebe | |
| 6 | O **tipo** TypeScript de um item | |
| 7 | O tipo que só aceita `'APTO'` ou `'INAPTO'` | |
| 8 | A função `avaliarInspecao` (lembra da Aula 03?) | |
| 9 | O arquivo da página `/` (inspeção) | |
| 10 | O arquivo da página `/historico` | |

## Perguntas para o Copilot

Cole uma por vez no chat (o `#codebase` deixa ele ler o projeto todo):

1. `#codebase Quais são os componentes React deste projeto e onde cada um é usado?`
2. `#codebase Onde estão os estados (useState) e o que cada um guarda?`
3. `#codebase Quais props o ItemChecklist recebe e de onde elas vêm?`
4. `#codebase Quais tipos TypeScript existem e para que serve cada um?`
5. `#codebase Quais páginas este projeto Next.js tem e qual endereço abre cada uma?`

## Desafio (se sobrar tempo)

Crie a página `/sobre` com o nome da sua equipe. Dica: no Next.js, uma
página nova é uma **pasta** nova dentro de `app/`.
