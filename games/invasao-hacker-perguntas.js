// Perguntas do jogo "Invasão Hacker" (games/invasao-hacker.html), por aula.
// O slide da aula aponta o QR Code para invasao-hacker.html?p=<chave>.
//
// Cada conjunto:
//   titulo   — aparece no topo da defesa
//   tempo    — segundos até a invasão chegar a 100%
//   sortear  — quantas perguntas entram em cada partida (sorteadas do banco,
//              pra ninguém colar do vizinho; a ordem das alternativas também)
//   perguntas — { q, opcoes: [...], certa: <índice> }   (múltipla escolha)
//               { q, numero: <resposta> }               (teclado numérico)
//
// Só pergunte o que a turma JÁ viu até o momento do jogo na aula.
window.INVASAO_PERGUNTAS = {
  // Aula 01 — "Do bit à IA" (jogo logo depois do intervalo: binário,
  // linguagens e "como a IA pensa" já foram vistos; tipos de IA e HTTP não).
  'aula-01': {
    titulo: 'Aula 01 · Do bit à IA',
    tempo: 70,
    sortear: 6,
    perguntas: [
      { q: 'Quanto vale o byte 00000110?', numero: 6 },
      { q: 'Quanto vale o byte 00001001?', numero: 9 },
      { q: 'Quanto vale o byte 00000011?', numero: 3 },
      { q: 'Em ASCII, qual letra maiúscula vale 65?', opcoes: ['A', 'B', 'Z', 'O'], certa: 0 },
      { q: 'Quantos bits formam 1 byte?', opcoes: ['8', '2', '10', '16'], certa: 0 },
      { q: 'Tocar na tela do celular é uma ação de...', opcoes: ['Entrada', 'Saída', 'Memória', 'Processamento'], certa: 0 },
      { q: 'Qual parte do computador faz as contas?', opcoes: ['Processador (CPU)', 'Memória RAM', 'Tela', 'Teclado'], certa: 0 },
      { q: 'O navegador lê o JavaScript e executa na hora. Isso é...', opcoes: ['Interpretação', 'Compilação', 'Linguagem de máquina', 'Assembly'], certa: 0 },
      { q: 'A IA inventou, com toda a confiança, uma função que não existe. Isso é...', opcoes: ['Alucinação', 'Compilação', 'Um token', 'Um algoritmo'], certa: 0 },
      { q: 'A IA lê o texto em pedaços chamados...', opcoes: ['Tokens', 'Bytes', 'Pixels', 'Linhas'], certa: 0 },
      { q: 'Qual foi a primeira mensagem da ARPANET, em 1969?', opcoes: ['"LO"', '"OI"', '"HELLO"', '"LOGIN"'], certa: 0 },
      { q: 'Qual destes NÃO serve como passo de um algoritmo?', opcoes: ['Confira até ficar bom', 'Ferva 500 ml de água', 'Espere 3 minutos', 'Desligue o fogo'], certa: 0 },
    ],
  },
};
