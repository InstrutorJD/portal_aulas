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

### Gerar Slides (PPTX) a partir de uma aula teórica
Qualquer aula teórica no formato "história + quiz" (`STEPS = [{ story, question }]`, ver seção acima) pode gerar uma apresentação `.pptx` pronta pro professor apresentar em aula — inclusive sem internet no dia, já que a geração roda 100% no navegador, sem IA nem CDN. Serve como plano B quando falta computador/internet: o professor gera o arquivo com antecedência (quando tem os dois) e leva pronto.

- **Como habilitar numa aula nova**: inclua, nessa ordem, `shared/vendor/pptxgen.bundle.js` e `shared/slides-generator.js`; adicione um botão (visível só quando `urlParams.get('role') === 'professor'`, igual ao `#btnGenSlides` em `csharp-basico.html`/`sql-basico-teoria.html`) que chama `window.PortalSlides.generate({ title, subtitle, capacidade, steps: STEPS, fileName, closingTitle, closingText })`. Não precisa escrever nenhuma lógica de slide — o gerador (`shared/slides-generator.js`) já sabe montar título, um slide por conceito (com destaque automático de `<b>`/`<code>`/`<pre>` do `story`) e um slide de verificação por quiz.
- **Resposta do quiz**: o slide de verificação mostra só a pergunta e as alternativas — a resposta certa e a explicação vão para as **anotações do apresentador** (visíveis só no modo apresentador do PowerPoint/LibreOffice), não para o slide.
- **Visual**: usa o template oficial `Slide_Padrão_Senai.pptx` (fornecido pelo professor) — a moldura de marca (`shared/assets/senai-slide-frame.png`, PNG transparente extraído desse arquivo) fica embutida em base64 dentro de `shared/slides-generator.js`, então não depende de nenhum arquivo externo em tempo de execução. Pra trocar o template, extraia a nova imagem de fundo do `.pptx` e substitua a constante `FRAME_DATA_URI`.
- **Dependência vendorizada**: `shared/vendor/pptxgen.bundle.js` é a build standalone da lib [PptxGenJS](https://gitbrent.github.io/PptxGenJS/) (MIT, licença em `shared/vendor/pptxgenjs.LICENSE.txt`), baixada uma vez e commitada no repo — não usa CDN, por isso continua funcionando offline.

### `TURMA_CONFIG` por turma — `turmas/<turma>/config.js`
Cada turma define sua estrutura de trilhas/módulos num arquivo próprio (`turmas/jogos/config.js` → `window.TURMA_CONFIG_JOGOS`, `turmas/sistemas/config.js` → `window.TURMA_CONFIG_SISTEMAS`), em vez de inline no `plataforma.html`. Isso existe porque **dois lugares** precisam ler essa estrutura: a própria `plataforma.html` da turma (que faz `window.TURMA_CONFIG = window.TURMA_CONFIG_<TURMA>` antes de carregar `shared/platform-core.js`) e `professor/painel.html` (que inclui os dois `config.js` só pra montar as colunas de trilha do relatório de notas, sem duplicar a lista de módulos). Editar trilhas/capacidades continua sendo mexer em um arquivo só, por turma.

### `professor/painel.html` — só navegação + Chamada + Notas
O painel central do professor é enxuto de propósito: aba **Turmas** com só 2 cards (Jogos Digitais / Desenvolvimento de Sistemas) que abrem o portal daquela turma em nova aba, e as abas **Chamada**/**Notas** (ver abaixo). Nada de lista de alunos misturando as duas turmas — cada turma cuida só dos seus próprios alunos, na sua própria página.

Tudo isso depende do Supabase estar configurado (rode `sql/supabase-chamada-notas.sql` no SQL Editor do Supabase antes de usar) — sem isso, as tabelas mostram "Configure o Supabase" em vez de quebrar.

- **Chamada**: lista os alunos da turma escolhida (nome completo, de `USERS_DB`) com um checkbox "Faltou" por aluno (desmarcado = presente). "Finalizar Chamada" grava uma linha por aluno na tabela `attendance` (upsert por `turma+data+aluno`, então reabrir a mesma data recarrega o que já foi marcado). O **Relatório de Presença**, logo abaixo, agrega esse histórico por aluno (dias com chamada, faltas, % de presença).
- **Notas**: 4 campos de nota por bimestre (`grades`, upsert por `aluno+bimestre`); a média é uma coluna gerada pelo próprio Postgres (`generated always as`), recalculada também ao vivo na tela enquanto o professor digita. O **Relatório de Notas** mostra só as médias (nunca os 4 campos) — uma coluna por bimestre, a média geral, e **uma coluna por trilha da turma** com o % de desempenho do aluno nela.
- **% de desempenho por trilha**: só existe porque `shared/platform-core.js` agora sincroniza o progresso de cada módulo (que antes só vivia no `localStorage` do aluno) pra tabela `student_module_progress` — uma vez ao carregar a plataforma e de novo sempre que um módulo é fechado (função `syncModuleProgress`). O % da trilha é a média das frações de conclusão dos seus módulos (dá crédito parcial a um módulo em andamento, não só 0% ou 100%).

### Aba "Gestão 🛠️" — dentro do portal de cada turma
Liberar jogos, bloquear/liberar Ctrl+C/V e ver status/atividade dos alunos **não** ficam no painel central — ficam dentro de `turmas/<turma>/plataforma.html`, numa aba extra que só aparece quando `role === 'professor'` (`shared/platform-core.js`, funções `renderGestaoTab`/`setupGestaoButtons` e afins). Isso mantém cada controle naturalmente restrito à turma cujo portal o professor está vendo — sem precisar escolher a turma num seletor à parte.

- **Restrições**: o bloqueio de Ctrl+C/V (`classroom_settings`) passou a ser **por turma** (`id = 'jogos'` ou `id = 'sistemas'`, em vez de uma linha `'global'` única) — ligar em Jogos não afeta Sistemas. `shared/clipboard-guard.js` lê a turma do parâmetro `?turma=` da própria URL (por isso `index.html` agora inclui `turma` no redirect de login, e os iframes de módulo/jogo já passavam isso).
- **Liberação de Jogos**: mesmos botões de antes (individual + "todos"), mas a lista e o "todos" só enxergam os alunos daquela turma (`student_overrides`, sem filtro de turma na tabela em si — o filtro é feito no cliente, comparando com o roster da turma atual).
- **Atividade em Tempo Real** e **Auditoria**: mesma coisa de antes, só que a tabela de atividade agora filtra `student_activity` por `turma = cfg.id`.