// Matérias/trilhas/módulos da turma Sistemas (9 matérias no total).
// Consumido por plataforma.html (via window.TURMA_CONFIG) — inclusive pela
// aba "Gestão" do próprio portal (shared/platform-core.js), que lê isso
// pra montar as colunas de desempenho por trilha do relatório de notas e a
// lista de aulas com geração de slides (campo hasSlides).
//
// Só dentro de uma matéria é que as trilhas aparecem (ver renderMaterias/
// openMateria em shared/platform-core.js). Por enquanto só a Matéria 1 tem
// conteúdo de verdade — as demais são placeholders prontos pra receber
// trilhas quando o currículo de cada uma for definido.
//
// Pra adicionar uma trilha nova numa matéria, edite o array `trilhas` dela
// (mesmo formato usado em turmas/jogos/config.js) — nenhum outro arquivo
// precisa mudar.
window.TURMA_CONFIG_SISTEMAS = {
  id: 'sistemas',
  label: 'Sistemas',
  materias: [
    {
      key: 'materia1',
      label: 'Matéria 1',
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
              progressKey: 'sql_basico_teoria_progress_', progressMode: 'flag',
              hasSlides: true
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
    },
    { key: 'materia2', label: 'Matéria 2', trilhas: [] },
    { key: 'materia3', label: 'Matéria 3', trilhas: [] },
    { key: 'materia4', label: 'Matéria 4', trilhas: [] },
    { key: 'materia5', label: 'Matéria 5', trilhas: [] },
    { key: 'materia6', label: 'Matéria 6', trilhas: [] },
    { key: 'materia7', label: 'Matéria 7', trilhas: [] },
    { key: 'materia8', label: 'Matéria 8', trilhas: [] },
    { key: 'materia9', label: 'Matéria 9', trilhas: [] }
  ]
};
