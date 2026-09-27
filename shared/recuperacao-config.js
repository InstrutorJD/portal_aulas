// Matéria "Recuperação" — igual pra todas as turmas, por isso mora aqui e
// não no config.js de cada turma. Fica FORA de cfg.materias de propósito
// (ver recuperacaoMateria em shared/platform-core.js): não entra na nota,
// no ranking, no % por matéria nem no desbloqueio da aba Jogos — é reforço,
// não mais uma matéria cobrada.
//
// O card só aparece pro aluno com 1+ matéria abaixo de 6,0 no bimestre
// atual, depois que o professor liga "Mostrar Notas" (ver
// refreshRecuperacaoStatus). O professor sempre vê, pra revisar.
//
// `src` é relativo a turmas/<turma>/plataforma.html — as atividades ficam
// em turmas/recuperacao/atividades/, mesma profundidade das atividades de
// cada turma (então os caminhos ../../../shared/ continuam valendo).
//
// A turma Sistemas (mais alunos em recuperação) tem uma versão MAIOR das
// duas trilhas: a teoria ganha 6 etapas (listas, for, for...of, objetos) e
// o jogo ganha os Capítulos 5 e 6 — 25 etapas em vez de 17. As próprias
// atividades decidem isso pelo ?turma= da URL; aqui só muda o total que o
// portal usa pra contar o progresso. window.TURMA_CONFIG já foi definido
// pela plataforma.html antes deste arquivo carregar.
const RECUPERACAO_EXTRA_SISTEMAS = !!(window.TURMA_CONFIG && window.TURMA_CONFIG.id === 'sistemas');
window.RECUPERACAO_MATERIA = {
  key: 'recuperacao',
  label: 'Recuperação',
  trilhas: [
    {
      key: 'recuperacao-teoria',
      label: 'Programação do Zero',
      desc: 'Do zero às funções, bem devagar: o que é um programa, pra que serve uma variável, tipos de valor, decisões com if / else, pra que serve uma função (chamar e criar), parâmetros e return.',
      modules: [
        {
          key: 'teoria', title: 'Teoria — Programação do Zero',
          desc: RECUPERACAO_EXTRA_SISTEMAS
            ? 'Variáveis, tipos (número, texto, verdadeiro/falso), operações, if / else, chamar e criar funções, parâmetros, return, objetos, listas (push e length) e repetição com for e for...of — com exemplos do dia a dia.'
            : 'Variáveis, tipos (número, texto, verdadeiro/falso), operações, if / else, chamar e criar funções, parâmetros, return e objetos — com exemplos do dia a dia.',
          icon: '🦉', src: '../recuperacao/atividades/recuperacao-teoria.html',
          progressKey: 'recuperacao_teoria_progress_', progressMode: 'flag'
        }
      ]
    },
    {
      key: 'recuperacao-jogo',
      label: 'O Herói do Código',
      desc: RECUPERACAO_EXTRA_SISTEMAS
        ? 'Um jogo em 6 capítulos (Variáveis, Funções, Decisões, Criando o mundo, Listas e repetição, e Objetos) onde o herói começa só andando e cada item e ação dele é construído por você, em código: de let espada = true; até listas, laços for e objetos.'
        : 'Um jogo em 4 capítulos (Variáveis, Funções, Decisões e Criando o mundo) onde o herói começa só andando e cada item e ação dele é construído por você, em código: de let espada = true; até as funções que fazem ele pular, atacar, defender e criar os inimigos.',
      modules: [
        {
          key: 'jogo', title: 'Jogo — O Herói do Código',
          desc: RECUPERACAO_EXTRA_SISTEMAS
            ? 'Atravesse floresta, caverna, castelo, arena, o Salão das Listas e a Sala dos Objetos. Em cada um dos 24 terminais, o código que você escrever vira item, ação ou inimigo — até o chefão Rei Bug.'
            : 'Atravesse floresta, caverna, castelo e arena. Em cada um dos 16 terminais, o código que você escrever vira item, ação ou inimigo — até o chefão Rei Bug.',
          icon: '⚔️', src: '../recuperacao/atividades/recuperacao-jogo.html',
          progressKey: 'recuperacao_jogo_progress_', progressTotal: RECUPERACAO_EXTRA_SISTEMAS ? 25 : 17
        }
      ]
    }
  ]
};
