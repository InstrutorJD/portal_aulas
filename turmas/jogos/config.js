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
    { key: 'intro-dev-projetos', label: 'Introdução de Desenvolvimento de Projetos', trilhas: [] },
    { key: 'codificacao-jogos', label: 'Codificação de Sistemas de Jogos', trilhas: [] },
    {
      key: 'fundamentos-programacao',
      label: 'Fundamentos de Programação',
      trilhas: [
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
