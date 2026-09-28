// Estudo de caso "VetAgenda" — compartilhado pelas práticas de Modelagem de
// Sistemas 1 (Aula 34: roteiro de trabalho; Aula 35: laboratório de revisão
// das regras de negócio). As regras "interpretadas anteriormente" têm falhas
// DE PROPÓSITO (ambígua, composta, conflitante, não é regra de negócio): é o
// material que os alunos revisam.
window.VETAGENDA = {
  entrevista: [
    'Somos a clínica veterinária Patas & Cia. Queremos que o tutor agende consultas pelo site, de segunda a sábado, das 8h às 18h (no sábado, só até as 12h).',
    'Cada consulta dura 30 minutos, mas pet com mais de 10 anos faz consulta geriátrica, de 45 minutos.',
    'O tutor se cadastra com CPF e telefone, e pode ter vários pets. Cada pet é de um tutor só.',
    'Quem cancela até 24 horas antes não paga nada. Depois disso, cobramos 50% do valor da consulta.',
    'Se o tutor faltar 2 vezes sem avisar, ele fica 30 dias sem poder agendar pelo site.',
    'A gente quer que o sistema avise o tutor 7 dias antes da próxima dose de vacina.',
    'O pagamento é por PIX ou cartão.',
  ],
  rf: [
    ['RF01', 'Cadastrar tutor'],
    ['RF02', 'Cadastrar pet'],
    ['RF03', 'Agendar consulta'],
    ['RF04', 'Cancelar consulta'],
    ['RF05', 'Enviar lembrete de vacina'],
    ['RF06', 'Registrar pagamento'],
    ['RF07', 'Registrar falta do tutor'],
  ],
  // problema: ok | ambigua | composta | tecnica | conflitante
  rn: [
    { id: 'RN01', texto: 'O tutor deve informar CPF e telefone no cadastro.', problema: 'ok' },
    { id: 'RN02', texto: 'O cancelamento deve ser feito com antecedência razoável.', problema: 'ambigua' },
    { id: 'RN03', texto: 'O agendamento online é de segunda a sábado e o tutor recebe lembrete 7 dias antes da vacina.', problema: 'composta' },
    { id: 'RN04', texto: 'O sistema deve usar o banco de dados PostgreSQL.', problema: 'tecnica' },
    { id: 'RN05', texto: 'Toda consulta dura exatamente 30 minutos, sem exceção.', problema: 'conflitante' },
    { id: 'RN06', texto: 'Consultas de pets com mais de 10 anos duram 45 minutos.', problema: 'ok' },
    { id: 'RN07', texto: 'O tutor que falta muito fica bloqueado por um tempo.', problema: 'ambigua' },
    { id: 'RN08', texto: 'Um tutor pode ter vários pets, e cada pet pertence a um único tutor.', problema: 'ok' },
    { id: 'RN09', texto: 'A tela de agendamento deve carregar em até 2 segundos.', problema: 'tecnica' },
  ],
  problemas: [
    ['ok', 'Está boa'],
    ['ambigua', 'Ambígua (termo vago)'],
    ['composta', 'Composta (duas regras numa)'],
    ['conflitante', 'Conflita com outra regra'],
    ['tecnica', 'Não é regra de negócio'],
  ],
  // Etapas do roteiro de trabalho para modelagem, com o artefato de saída.
  etapas: [
    { id: 'escopo', nome: 'Entender o problema e o escopo', artefato: 'Descrição do escopo (objetivo, usuários, limites)' },
    { id: 'requisitos', nome: 'Revisar os requisitos levantados', artefato: 'Lista de requisitos (RF e RNF) revisada' },
    { id: 'regras', nome: 'Revisar as regras de negócio', artefato: 'Lista de regras de negócio revisada' },
    { id: 'casos', nome: 'Identificar atores e casos de uso', artefato: 'Diagrama de casos de uso' },
    { id: 'dados', nome: 'Identificar entidades, atributos e relacionamentos', artefato: 'Modelo conceitual de dados (DER)' },
    { id: 'validar', nome: 'Validar os modelos com o cliente', artefato: 'Ata de validação com o cliente' },
    { id: 'versionar', nome: 'Ajustar e versionar a documentação', artefato: 'Documento de modelagem versionado' },
  ],
  // Precedências (a antes de b) — a ordem aceita qualquer sequência que as respeite.
  antes: [['escopo', 'requisitos'], ['requisitos', 'regras'], ['regras', 'casos'], ['regras', 'dados'], ['casos', 'validar'], ['dados', 'validar'], ['validar', 'versionar']],
  chaveRoteiro: user => `modelagem_roteiro_pratica_progress_${user}`,
};
