# Pendências

## Modal do editor de código nas atividades de codificação

**Status:** pendente — implementação atual não ficou boa, precisa ser refeita.

**Onde:** `turmas/jogos/atividades/js-basico.html` (protótipo; ainda não replicado nos outros arquivos).

**Objetivo original:** em telas pequenas/baixas, o editor de código + console
ficavam espremidos ao lado do enunciado do desafio. A ideia era abrir um
modal em tela cheia com o editor, automaticamente, pra dar mais espaço pra
codificar.

**Problema encontrado:** ao mover o editor+console pro modal, o campo do
enunciado (explicação/descrição/dica, `.challenge-header`) que sobra sozinho
no `main-panel` ficou pequeno demais — a solução piorou a leitura do
enunciado em vez de só resolver o espaço do editor.

**Próximos passos:**
- Repensar o layout do modal considerando o enunciado também (ex.: incluir
  o enunciado dentro do modal, ou redimensionar/ajustar o `main-panel`
  quando o editor sai dele).
- Revalidar com Playwright em várias resoluções antes de aplicar.
- Só depois de validado no navegador, replicar para os outros 11 arquivos
  de atividades de código: `js-intermediario.html`, `fund-logica-pratica.html`,
  `fund-prog2d-pratica.html`, `cod-agil-clean-pratica.html`,
  `cod-linguagens-pratica.html`, `cod-poo-pratica.html`,
  `cod-seguranca-ia-pratica.html`, `cod-seguranca-debug-pratica.html`,
  `sql-basico.html`, `sql-join.html`, `sql-agregacao.html`.

**Observação:** a mudança já está commitada e enviada (`5babda2`) em
`main`, ou seja, está em produção mesmo estando marcada como pendente aqui.
