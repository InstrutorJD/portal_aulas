// Trilhas/módulos da turma Sistemas.
// Consumido por plataforma.html (via window.TURMA_CONFIG) e por
// professor/painel.html (via window.TURMA_CONFIG_SISTEMAS, só leitura,
// pra montar as colunas de desempenho por trilha no relatório de notas).
//
// Pra adicionar uma trilha nova nesta turma, basta um novo item aqui
// (mesmo formato usado em turmas/jogos/config.js) — nenhum outro
// arquivo precisa mudar.
window.TURMA_CONFIG_SISTEMAS = {
  id: 'sistemas',
  label: 'Sistemas',
  trilhas: [
    {
      key: 'sql',
      label: 'SQL',
      desc: 'Aprenda a teoria e depois pratique resolvendo chamados de verdade.',
      capacidade: 'Utilizar comandos SQL básicos (SELECT, WHERE, ORDER BY, INSERT, UPDATE, DELETE) para consultar e manipular dados em um banco relacional.',
      modules: [
        {
          key: 'teoria', title: 'Teoria — Fundamentos de SQL',
          desc: 'Entenda tabelas, colunas, chave primária e os comandos SELECT, WHERE, ORDER BY, INSERT, UPDATE e DELETE antes de praticar.',
          icon: '📖', src: 'atividades/sql-basico-teoria.html',
          progressKey: 'sql_basico_teoria_progress_', progressMode: 'flag'
        },
        {
          key: 'basico', title: 'Prática — Central de Dados',
          desc: 'Resolva chamados escrevendo consultas SQL de verdade contra um banco de exemplo, direto no navegador.',
          icon: '🗄️', src: 'atividades/sql-basico.html',
          progressKey: 'sql_basico_progress_', progressTotal: 8,
          requires: 'teoria'
        }
      ]
    }
  ]
};
