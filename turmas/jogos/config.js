// Matérias/trilhas/módulos da turma Jogos Digitais (6 matérias no total).
// Consumido por plataforma.html (via window.TURMA_CONFIG) — inclusive pela
// aba "Gestão" do próprio portal (shared/platform-core.js), que lê isso
// pra montar as colunas de desempenho por trilha do relatório de notas e a
// lista de aulas com geração de slides (campo hasSlides).
//
// Só dentro de uma matéria é que as trilhas aparecem (ver renderMaterias/
// openMateria em shared/platform-core.js). Por enquanto só Fundamentos de
// Programação tem conteúdo de verdade — as demais são placeholders prontos
// pra receber trilhas quando o currículo de cada uma for definido.
window.TURMA_CONFIG_JOGOS = {
  id: 'jogos',
  label: 'Jogos Digitais',
  materias: [
    { key: 'projeto-vida', label: 'Projeto de Vida', trilhas: [] },
    { key: 'mundo-trabalho', label: 'Mundo do Trabalho', trilhas: [] },
    { key: 'intro-dev-projetos', label: 'Introdução ao Desenvolvimento de Projetos', trilhas: [] },
    { key: 'codificacao-jogos', label: 'Codificação de Jogos', trilhas: [] },
    {
      key: 'fundamentos-programacao',
      label: 'Fundamentos de Programação de Jogos',
      trilhas: [
        {
          key: 'fund-ambiente',
          label: 'Ambiente e Ferramentas de Desenvolvimento',
          desc: 'Aprenda a teoria e depois resolva chamados sobre instalação, engines, editor/compilador e bibliotecas.',
          capacidade: 'Reconhecer os procedimentos de preparação de ambiente de programação / Reconhecer as diferentes linguagens de programação utilizadas conforme a plataforma do jogo a ser produzido.',
          modules: [
            {
              key: 'teoria', title: 'Teoria — Ambiente e Ferramentas de Desenvolvimento',
              desc: 'O que compõe um jogo 2D, instalação do ambiente, engines, editor x compilador, linguagem por plataforma e bibliotecas de apoio.',
              icon: '🦈', src: 'atividades/fund-ambiente-teoria.html',
              progressKey: 'fund_ambiente_teoria_progress_', progressMode: 'flag',
              hasSlides: true, hasGabarito: true
            },
            {
              key: 'pratica', title: 'Prática — Central de Suporte: Ambiente e Ferramentas',
              desc: 'Resolva chamados escolhendo a plataforma, ferramenta ou biblioteca certa pra cada cenário.',
              icon: '🛠️', src: 'atividades/fund-ambiente-pratica.html',
              progressKey: 'fund_ambiente_pratica_progress_', progressTotal: 5,
              requires: 'teoria', hasGabarito: true
            }
          ]
        },
        {
          key: 'fund-logica',
          label: 'Lógica e Algoritmos para Jogos 2D',
          desc: 'Aprenda a teoria e depois resolva chamados sobre game loop, coordenadas, cenário, cores e física básica.',
          capacidade: 'Reconhecer técnicas e algoritmos utilizados na programação de elementos em jogos.',
          modules: [
            {
              key: 'teoria', title: 'Teoria — Lógica e Algoritmos para Jogos 2D',
              desc: 'Game loop, sistema de coordenadas 2D, cenário como matriz de tiles, sistema de cores (RGBA) e física básica (gravidade, colisão).',
              icon: '🦈', src: 'atividades/fund-logica-teoria.html',
              progressKey: 'fund_logica_teoria_progress_', progressMode: 'flag',
              hasSlides: true, hasGabarito: true
            },
            {
              key: 'pratica', title: 'Prática — Central de Suporte: Lógica e Algoritmos',
              desc: 'Resolva chamados de game loop, coordenadas, matriz de cenário, cor/transparência e física.',
              icon: '🧮', src: 'atividades/fund-logica-pratica.html',
              progressKey: 'fund_logica_pratica_progress_', progressTotal: 5,
              requires: 'teoria', hasGabarito: true
            }
          ]
        },
        {
          key: 'fund-prog2d',
          label: 'Programação de Jogos 2D na Prática',
          desc: 'Aprenda a teoria e depois resolva chamados sobre movimentação, colisão, eventos e ciclo de vida de objetos.',
          capacidade: 'Utilizar linguagem de programação para desenvolvimento de jogos digitais 2D.',
          modules: [
            {
              key: 'teoria', title: 'Teoria — Programação de Jogos 2D na Prática',
              desc: 'Movimentação com teclado e mouse, colisores, fluxo de eventos, estrutura do código e criação/atualização/remoção de objetos.',
              icon: '🦈', src: 'atividades/fund-prog2d-teoria.html',
              progressKey: 'fund_prog2d_teoria_progress_', progressMode: 'flag',
              hasSlides: true, hasGabarito: true
            },
            {
              key: 'pratica', title: 'Prática — Central de Suporte: Programação de Jogos 2D',
              desc: 'Resolva chamados de movimentação, colisão, eventos e controle de objetos.',
              icon: '🕹️', src: 'atividades/fund-prog2d-pratica.html',
              progressKey: 'fund_prog2d_pratica_progress_', progressTotal: 5,
              requires: 'teoria', hasGabarito: true
            }
          ]
        },
        {
          key: 'fund-multimidia',
          label: 'Multimídia e Versionamento',
          desc: 'Aprenda a teoria e depois resolva chamados sobre sprites, assets, áudio e versionamento de código.',
          capacidade: 'Reconhecer os processos de integração de elementos de multimídia / Reconhecer métodos de versionamento aplicados na produção de jogos.',
          modules: [
            {
              key: 'teoria', title: 'Teoria — Multimídia e Versionamento',
              desc: 'Inserção de sprites, organização de assets gráficos, integração de áudio e versionamento de código com Git.',
              icon: '🦈', src: 'atividades/fund-multimidia-teoria.html',
              progressKey: 'fund_multimidia_teoria_progress_', progressMode: 'flag',
              hasSlides: true, hasGabarito: true
            },
            {
              key: 'pratica', title: 'Prática — Central de Suporte: Multimídia e Versionamento',
              desc: 'Resolva chamados de sprites, organização de assets, áudio e versionamento com Git.',
              icon: '🎬', src: 'atividades/fund-multimidia-pratica.html',
              progressKey: 'fund_multimidia_pratica_progress_', progressTotal: 5,
              requires: 'teoria', hasGabarito: true
            }
          ]
        },
        {
          key: 'js',
          label: 'JavaScript',
          desc: 'Escolha um módulo de desafios para praticar.',
          modules: [
            {
              key: 'basico', title: 'Básico — Desafios de JavaScript',
              desc: 'Vença cada adversário em ordem para avançar. Derrotar um duelo libera o próximo.',
              icon: '🟨', src: 'atividades/js-basico.html',
              progressKey: 'js_basico_progress_', progressTotal: 5,
              hasGabarito: true
            },
            {
              key: 'intermediario', title: 'Intermediário — Desafios de JavaScript',
              desc: 'Vença cada adversário em ordem para avançar. Derrotar um duelo libera o próximo.',
              icon: '🟧', src: 'atividades/js-intermediario.html',
              progressKey: 'js_intermediario_progress_', progressTotal: 7,
              hasGabarito: true
            }
          ]
        },
        {
          key: 'csharp',
          label: 'C#',
          desc: 'Escolha um módulo para começar.',
          capacidade: 'Reconhecer a origem, o propósito e a sintaxe básica da linguagem C# (variáveis, tipos de dados, comandos de saída e comentários).',
          modules: [
            {
              key: 'basico', title: 'Básico — A Jornada do Eri',
              desc: 'Primeiro contato com C#, contado em forma de história. Responda cada pergunta para avançar.',
              icon: '🦈', src: 'atividades/csharp-basico.html',
              progressKey: 'csharp_basico_progress_', progressMode: 'flag',
              hasSlides: true, hasGabarito: true
            }
          ]
        }
      ]
    },
    { key: 'testes-jogos', label: 'Testes de Jogos Digitais', trilhas: [] }
  ],

  // Insígnias da trilha "Curso de Jogos Digitais" (ver aba Perfil, só
  // aluno). Progressivas por % geral de conclusão (student_module_progress)
  // — minPct:0 é tratada à parte em platform-core.js (exige progresso real,
  // não só "0% arredondado"). Sem tabela nova no Supabase: é só uma leitura
  // derivada do progresso que já é sincronizado.
  insignias: [
    { key: 'iniciante', label: 'Iniciante', desc: 'Deu o primeiro passo no mundo dos jogos!', icon: '🚀', minPct: 0 },
    { key: 'explorador', label: 'Explorador', desc: 'Explorou novas ferramentas e mecânicas!', icon: '💚', minPct: 20 },
    { key: 'criador', label: 'Criador', desc: 'Criou seu primeiro jogo do começo ao fim!', icon: '🎮', minPct: 40 },
    { key: 'desafiador', label: 'Desafiador', desc: 'Superou desafios e levou suas habilidades além!', icon: '🏆', minPct: 60 },
    { key: 'mestre-dos-jogos', label: 'Mestre dos Jogos', desc: 'Domina as mecânicas e pensa como um Game Designer!', icon: '⚔️', minPct: 80 },
    { key: 'lendario', label: 'Lendário', desc: 'Criatividade, técnica e paixão pelos jogos em outro nível!', icon: '🐉', minPct: 100 }
  ]
};
