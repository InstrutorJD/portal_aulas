// Cenários do jogo "Rodada Relâmpago" (games/rodada-relampago.html), por
// aula. O slide aponta o QR Code para rodada-relampago.html?p=<chave>.
//
// Cada conjunto:
//   titulo    — aparece no topo
//   segundos  — tempo para responder cada cenário
//   sortear   — quantos cenários por partida (sempre entra pelo menos 1 de
//               cada opção; o resto é sorteado)
//   opcoes    — as respostas possíveis (botões), { id, rotulo, emoji }
//   cenarios  — { texto, certa: <id da opção>, porque }
window.RODADA_RELAMPAGO = {
  // Aula 01 — "Do bit à IA": os 5 USOS da IA vistos no slide "Cinco usos
  // da IA hoje". Nenhum cenário repete o do slide "Aquecimento" (troca de
  // óleo), que a turma já respondeu.
  'aula-01': {
    titulo: 'Aula 01 · Usos da IA na mina',
    segundos: 10,
    sortear: 6,
    opcoes: [
      { id: 'preditiva', rotulo: 'Preditiva', emoji: '📈' },
      { id: 'visao', rotulo: 'Visão computacional', emoji: '👁️' },
      { id: 'generativa', rotulo: 'Generativa', emoji: '✍️' },
      { id: 'assistente', rotulo: 'Assistente de código', emoji: '💡' },
      { id: 'agente', rotulo: 'Agente', emoji: '🤖' },
    ],
    cenarios: [
      { texto: 'Avisar a manutenção antes de a bomba da mina quebrar, pela vibração', certa: 'preditiva', porque: 'Usa o histórico para prever o que vai acontecer.' },
      { texto: 'Estimar quantas peças de reposição vão faltar no mês que vem', certa: 'preditiva', porque: 'Prever demanda a partir do passado é IA preditiva.' },
      { texto: 'Conferir, por foto, se a correia transportadora está rasgada', certa: 'visao', porque: 'Analisar imagem é visão computacional.' },
      { texto: 'Ler pela câmera a placa de identificação do equipamento', certa: 'visao', porque: 'A câmera "lê" a imagem: visão computacional.' },
      { texto: 'Detectar pela câmera se o operador está sem capacete', certa: 'visao', porque: 'Reconhecer algo numa imagem é visão computacional.' },
      { texto: 'Escrever o resumo do turno a partir das inspeções do dia', certa: 'generativa', porque: 'Criar um texto novo é IA generativa.' },
      { texto: 'Criar um cartaz de segurança, com imagem, a partir de uma frase', certa: 'generativa', porque: 'Gerar imagem nova também é IA generativa.' },
      { texto: 'Sugerir o resto da linha de código enquanto você digita', certa: 'assistente', porque: 'Sugere, e você decide cada passo: assistente.' },
      { texto: 'Completar a função que confere se todos os itens foram marcados', certa: 'assistente', porque: 'Completa o código junto com você: assistente.' },
      { texto: 'Criar sozinho a tela inteira do dashboard a partir de uma descrição', certa: 'agente', porque: 'Faz a tarefa inteira, em etapas: agente.' },
      { texto: 'Receber "corrija o bug e rode os testes" e fazer tudo sozinho', certa: 'agente', porque: 'Recebe a tarefa e executa do começo ao fim: agente.' },
    ],
  },
};
