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
              progressKey: 'js_basico_progress_', progressTotal: 5
            },
            {
              key: 'intermediario', title: 'Intermediário — Desafios de JavaScript',
              desc: 'Vença cada adversário em ordem para avançar. Derrotar um duelo libera o próximo.',
              icon: '🟧', src: 'atividades/js-intermediario.html',
              progressKey: 'js_intermediario_progress_', progressTotal: 7
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
              hasSlides: true
            }
          ]
        }
      ]
    },
    { key: 'testes-jogos', label: 'Testes de Jogos Digitais', trilhas: [] }
  ]
};
