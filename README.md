# portal_aulas

## Diretrizes de conteúdo educacional

### Dicas (hints) nas atividades
As dicas dos exercícios (`turmas/*/atividades/*.html`, campo `hint` de cada item em `CHALLENGES`) devem **dar o norte, não a resposta**:

- Aponte o conceito, operador ou palavra-chave a pesquisar/lembrar — nunca o código-solução pronto para copiar e colar.
- Pode conter código de exemplo (sintaxe genérica, um trecho ilustrativo), desde que não seja a resposta do exercício aplicada aos dados/variáveis daquele desafio específico.
- Evite o padrão `hint: 'Escreva: <code>...</code>'` quando o código ali já É a solução literal do desafio — isso não é uma dica, é a resposta.
- Prefira perguntas norteadoras ou pistas ("qual operador faz X?", "existe uma função pronta pra isso no objeto Y") que exigem o aluno pensar/escrever a solução.
- O campo separado de solução/verificação (ex.: `solutionSql`, testes em `tests`) já guarda a resposta para validação — não duplique isso no `hint`.

### Trilha por capacidade (MSEP)
A MSEP do SENAI organiza o currículo em torno de **capacidades** a serem desenvolvidas e verificadas. No portal, cada capacidade vira uma trilha:

- Declare a capacidade no campo `capacidade` da trilha, em `window.TURMA_CONFIG_<TURMA>.trilhas[]` (dentro de `turmas/<turma>/config.js`). É um texto livre, exibido no topo da trilha para o aluno.
- Padrão recomendado por trilha: **1 módulo de teoria** seguido de **1+ módulos de prática**.
  - Teoria: formato "história + quiz" (narrador/mascote apresenta o conceito, depois uma pergunta de múltipla escolha), `progressMode: 'flag'`. Ver `turmas/jogos/atividades/csharp-basico.html` e `turmas/sistemas/atividades/sql-basico-teoria.html` como referência.
  - Prática: formato "desafios" (`CHALLENGES` com `tests`/`solutionSql`, ver seção de dicas acima), `progressTotal: <quantidade de desafios>`.
- Para travar um módulo até outro ser concluído (ex.: prática só libera depois da teoria), adicione `requires: '<key do módulo pré-requisito>'` no módulo dependente. O motor (`shared/platform-core.js`) cuida do bloqueio/desbloqueio visual (cadeado no card) automaticamente — nenhuma outra mudança é necessária.
- Professores (`role === 'professor'`) sempre veem todos os módulos destravados, para poder revisar o conteúdo sem precisar completar os pré-requisitos.
- **Navegação entre trilhas**: com 2+ trilhas na turma, `renderTrilhas()` (`shared/platform-core.js`) mostra um único `<select id="trilhaSelect">` em vez de uma fileira de botões — mais conciso e usa o seletor nativo do celular. Com 1 trilha só (ex.: Sistemas hoje), nenhum seletor aparece — o conteúdo já vem direto, já que não faz sentido escolher entre uma opção. Decisão deliberada de não usar sidebar aqui: pra só 2-4 itens, um painel deslizante (hambúrguer/overlay) seria complexidade desproporcional ao ganho.

### Gerar Slides (PPTX) a partir de uma aula teórica
Qualquer aula teórica no formato "história + quiz" (`STEPS = [{ story, question }]`, ver seção acima) pode gerar uma apresentação `.pptx` pronta pro professor apresentar em aula — inclusive sem internet no dia, já que a geração roda 100% no navegador, sem IA nem CDN. Serve como plano B quando falta computador/internet: o professor gera o arquivo com antecedência (quando tem os dois) e leva pronto.

- **Onde o professor encontra isso**: dentro do portal da turma, aba **Gestão 🛠️**, card "Apresentações (Slides)" — lista toda aula com `hasSlides: true` no `config.js` da turma e gera o `.pptx` com um clique, sem precisar abrir o módulo. (O botão original também continua existindo dentro do próprio módulo — `#btnGenSlides` no topbar da aula — mas era pouco descoberto lá; o card na Gestão existe justamente pra resolver isso.)
- **Como isso funciona por baixo**: cada aula teórica expõe `window.generateSlidesForGestao()` (uma função que só chama `PortalSlides.generate({...})` com os parâmetros daquela aula). O card na Gestão (`shared/platform-core.js`, função `generateSlidesFor`) cria um `<iframe>` escondido com o `src` do módulo, espera carregar, chama essa função remotamente e depois remove o iframe — o download acontece do mesmo jeito, só sem precisar mostrar a aula na tela.
- **Como habilitar numa aula teórica nova**: inclua, nessa ordem, `shared/vendor/pptxgen.bundle.js` e `shared/slides-generator.js`; defina `window.generateSlidesForGestao = () => window.PortalSlides.generate({ title, subtitle, capacidade, steps: STEPS, fileName, closingTitle, closingText })` (fora de qualquer `if (role === 'professor')`, pra existir mesmo quando o botão local não aparece); marque o módulo com `hasSlides: true` no `config.js` da turma. Opcionalmente, mantenha também um botão local chamando essa mesma função (igual `csharp-basico.html`/`sql-basico-teoria.html`) pra quem já estiver com a aula aberta. Não precisa escrever nenhuma lógica de slide — o gerador (`shared/slides-generator.js`) já sabe montar título, um slide por conceito (com destaque automático de `<b>`/`<code>`/`<pre>` do `story`) e um slide de verificação por quiz.
- **Resposta do quiz**: o slide de verificação mostra só a pergunta e as alternativas — a resposta certa e a explicação vão para as **anotações do apresentador** (visíveis só no modo apresentador do PowerPoint/LibreOffice), não para o slide.
- **Visual**: usa o template oficial `Slide_Padrão_Senai.pptx` (fornecido pelo professor) — a moldura de marca (`shared/assets/senai-slide-frame.png`, PNG transparente extraído desse arquivo) fica embutida em base64 dentro de `shared/slides-generator.js`, então não depende de nenhum arquivo externo em tempo de execução. Pra trocar o template, extraia a nova imagem de fundo do `.pptx` e substitua a constante `FRAME_DATA_URI`.
- **Dependência vendorizada**: `shared/vendor/pptxgen.bundle.js` é a build standalone da lib [PptxGenJS](https://gitbrent.github.io/PptxGenJS/) (MIT, licença em `shared/vendor/pptxgenjs.LICENSE.txt`), baixada uma vez e commitada no repo — não usa CDN, por isso continua funcionando offline.

### `TURMA_CONFIG` por turma — `turmas/<turma>/config.js`
Cada turma define sua estrutura de trilhas/módulos num arquivo próprio (`turmas/jogos/config.js` → `window.TURMA_CONFIG_JOGOS`, `turmas/sistemas/config.js` → `window.TURMA_CONFIG_SISTEMAS`), em vez de inline no `plataforma.html`. A própria `plataforma.html` da turma faz `window.TURMA_CONFIG = window.TURMA_CONFIG_<TURMA>` antes de carregar `shared/platform-core.js`. Editar trilhas/capacidades continua sendo mexer em um arquivo só, por turma.

### `professor/painel.html` — só um launcher
O painel central do professor não faz mais nada além de mostrar 2 cards (Jogos Digitais / Desenvolvimento de Sistemas) que abrem o portal daquela turma em nova aba. Nenhuma lista de alunos, nenhuma chamada de Supabase — de propósito, pra nunca misturar dado das duas turmas numa tela só.

### Aba "Gestão 🛠️" — tudo de professor mora dentro do portal da turma
Chamada, notas, liberação de jogos, bloqueio de Ctrl+C/V e status/atividade dos alunos ficam dentro de `turmas/<turma>/plataforma.html`, numa aba extra que só aparece quando `role === 'professor'` (`shared/platform-core.js`, a partir de `renderGestaoTab`/`setupGestaoButtons`). Como o professor já está dentro do portal de uma turma específica, nada disso precisa de seletor de turma — `cfg.id`/`cfg.trilhas`/`turmaStudents()` já sabem qual é.

Depende do Supabase estar configurado (rode `sql/supabase-chamada-notas.sql` e `sql/supabase-classroom-settings-per-turma.sql` no SQL Editor do Supabase antes de usar) — sem isso, as tabelas mostram "Configure o Supabase" em vez de quebrar.

- **Restrições**: o bloqueio de Ctrl+C/V (`classroom_settings`) é **por turma** (`id = 'jogos'` ou `id = 'sistemas'`, não uma linha `'global'` única) — ligar em Jogos não afeta Sistemas. `shared/clipboard-guard.js` lê a turma do parâmetro `?turma=` da própria URL (por isso `index.html` inclui `turma` no redirect de login, e os iframes de módulo/jogo já passavam isso).
- **Liberação de Jogos**: individual + "todos", sempre só os alunos da turma atual (`student_overrides`, filtrado no cliente contra `turmaStudents()`).
- **Chamada**: checkbox "Faltou" por aluno (desmarcado = presente). "Finalizar Chamada" grava uma linha por aluno em `attendance` (upsert por `turma+data+aluno` — reabrir a mesma data recarrega o que já foi marcado). O **Relatório de Presença** agrega esse histórico por aluno (dias com chamada, faltas, % de presença).
- **Notas**: 4 campos por bimestre em `grades` (upsert por `aluno+bimestre`); a média é uma coluna gerada pelo próprio Postgres (`generated always as`), recalculada também ao vivo na tela. O **Relatório de Notas** mostra só as médias (nunca os 4 campos) — uma coluna por bimestre, a média geral, e uma coluna por trilha com o % de desempenho.
- **% de desempenho por trilha**: existe porque `shared/platform-core.js` sincroniza o progresso de cada módulo (que só vivia no `localStorage` do aluno) pra `student_module_progress` — ao carregar a plataforma e de novo ao fechar um módulo (`syncModuleProgress`). O % é a média das frações de conclusão dos módulos da trilha (crédito parcial, não só 0%/100%).
- **Atividade em Tempo Real** e **Auditoria**: `student_activity` filtrado por `turma = cfg.id`; log de auditoria é local ao navegador, igual antes.