// Trilhas/módulos da turma Jogos Digitais.
// Consumido por plataforma.html (via window.TURMA_CONFIG) e por
// professor/painel.html (via window.TURMA_CONFIG_JOGOS, só leitura,
// pra montar as colunas de desempenho por trilha no relatório de notas).
window.TURMA_CONFIG_JOGOS = {
  id: 'jogos',
  label: 'Jogos Digitais',
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
          progressKey: 'csharp_basico_progress_', progressMode: 'flag'
        }
      ]
    }
  ]
};
