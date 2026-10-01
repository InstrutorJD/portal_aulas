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
  // Aula 02 — revisa a Aula 01 ("Do bit à IA" / "O caminho de uma inspeção":
  // peças de uma aplicação web, métodos e status HTTP).
  'aula-02': {
    titulo: 'Revisão da Aula 1',
    tempo: 20,
    perguntas: [
      { q: 'Os dados da inspeção saem do celular e chegam ao servidor. Quem faz esse transporte?', opcoes: ['Frontend', 'API', 'Backend', 'Banco de dados'], certa: 1 },
      { q: 'Para ENVIAR uma inspeção nova, o app usa o método...', opcoes: ['GET', 'DELETE', 'POST', 'PUT'], certa: 2 },
      { q: 'Uma resposta com status 404 quer dizer...', opcoes: ['Deu tudo certo', 'O servidor falhou', 'Inspeção registrada', 'O que foi pedido não existe'], certa: 3 },
      { q: 'A regra "freio reprovado bloqueia o equipamento" deve ficar no...', opcoes: ['Backend', 'Frontend', 'Banco de dados', 'Celular do operador'], certa: 0 },
    ],
  },
};
