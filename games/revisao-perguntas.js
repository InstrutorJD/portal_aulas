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
  // Aula 03 — revisa as Partes 1 a 3 da Aula 02 (as que deu tempo de dar):
  // requisição e status no F12, fetch e CORS no Console, Design Thinking,
  // RF x RNF e o que se encontra no GitHub (histórico de commits, Issues).
  'aula-03': {
    titulo: 'Revisão da Aula 2',
    tempo: 20,
    perguntas: [
      // Requisições (F12 e Console)
      { q: 'Você pediu /todos/999 e o item não existe. Qual status volta?', opcoes: ['200', '500', '404', '201'], certa: 2 },
      { q: 'Na aba Rede, os pedidos de DADOS aparecem no filtro...', opcoes: ['Fetch/XHR', 'Imagem', 'CSS', 'Fonte'], certa: 0 },
      { q: 'No Console, qual comando faz uma requisição HTTP?', opcoes: ['document.title', '2 + 2', 'console.log()', 'fetch()'], certa: 3 },
      { q: 'O fetch para outro site deu erro de CORS. Quem bloqueou?', opcoes: ['O servidor caiu', 'O navegador', 'O antivírus', 'O GitHub'], certa: 1 },
      // Requisitos
      { q: '"O sistema deve abrir em até 3 s no 4G" é um...', opcoes: ['RF', 'RNF', 'Critério de aceite', 'Commit'], certa: 1 },
      { q: '"O sistema deve registrar a inspeção" é um...', opcoes: ['RF', 'RNF', 'Webhook', 'Status'], certa: 0 },
      { q: 'No Design Thinking, entender quem sofre com o problema é...', opcoes: ['Prototipar', 'Testar', 'Empatizar', 'Idear'], certa: 2 },
      // GitHub
      { q: 'Onde você vê quem mudou o quê num projeto do GitHub?', opcoes: ['Nas estrelas', 'Na aba Issues', 'No README', 'No histórico de commits'], certa: 3 },
    ],
  },
};
