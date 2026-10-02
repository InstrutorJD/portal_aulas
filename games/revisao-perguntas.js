// Perguntas do "Responde Aí!" — revisão ao vivo no começo da aula
// (telão em professor/revisao.html, celular do aluno em games/revisao.html).
// O slide da aula abre o telão com professor/revisao.html?p=<chave>.
//
// Este arquivo só é carregado pelo TELÃO (o celular recebe a pergunta pelo
// canal ao vivo e só fica sabendo qual era a certa quando o tempo acaba).
//
// Cada conjunto:
//   titulo    — aparece no telão e no celular
//   tempo     — segundos para responder cada pergunta
//   perguntas — { q, opcoes: [4 alternativas curtas], certa: <índice 0–3> }
//               A ordem fica como está aqui: varie a posição da certa.
//
// Revisão = só o que a turma JÁ viu nas aulas anteriores. 3 ou 4 perguntas
// bastam (é um aquecimento de 5 minutos).
window.REVISAO_PERGUNTAS = {
  // Aula 02 — revisa a Aula 01: tipos de IA (classificação e os 5 usos da
  // IA estreita), métodos HTTP (GET, POST, PUT/PATCH, DELETE) e algoritmo
  // ("passos claros, em ordem, sem ambiguidade" — a receita do macarrão).
  'aula-02': {
    titulo: 'Revisão da Aula 1',
    tempo: 20,
    perguntas: [
      // Tipos de IA
      { q: 'Toda IA que existe hoje (ChatGPT, Copilot...) é do tipo...', opcoes: ['IA geral (forte)', 'Superinteligência', 'IA estreita (fraca)', 'IA consciente'], certa: 2 },
      { q: 'Uma IA que analisa o histórico para prever quando um caminhão vai quebrar é...', opcoes: ['Preditiva', 'Generativa', 'Visão computacional', 'Assistente de código'], certa: 0 },
      { q: 'Uma IA que acha desgaste olhando a FOTO de um pneu é...', opcoes: ['Generativa', 'Visão computacional', 'Preditiva', 'Agente'], certa: 1 },
      // Métodos HTTP
      { q: 'Para BUSCAR a lista de equipamentos, o app usa o método...', opcoes: ['POST', 'DELETE', 'PATCH', 'GET'], certa: 3 },
      { q: 'Para ENVIAR uma inspeção nova, o app usa o método...', opcoes: ['GET', 'POST', 'DELETE', 'PUT'], certa: 1 },
      { q: 'Para APAGAR uma inspeção de teste, o app usa o método...', opcoes: ['DELETE', 'GET', 'POST', 'PATCH'], certa: 0 },
      // Algoritmo
      { q: 'Algoritmo é...', opcoes: ['Um programa de IA', 'Uma linguagem de programação', 'Um tipo de computador', 'Passos claros, em ordem, que resolvem um problema'], certa: 3 },
      { q: 'Qual destes NÃO serve como passo de um algoritmo?', opcoes: ['Verifique se os 4 pneus estão calibrados', 'Confira o caminhão', 'Anote a hora da inspeção', 'Desligue o motor'], certa: 1 },
    ],
  },
};
