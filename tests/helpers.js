const path = require('node:path');

const FAKE_CLIENT_PATH = path.join(__dirname, 'fixtures', 'fake-supabase-client.js');
const SUPABASE_JS_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
const VLIBRAS_URL = 'https://vlibras.gov.br/app/vlibras-plugin.js';

/** Bloqueia ruído externo (Libras, Google Fonts) que não afeta a lógica
 * testada e só deixaria os testes mais lentos/instáveis. */
async function blockExternalNoise(page) {
  await page.route(VLIBRAS_URL, route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
}

/** Faz supabase-config.js carregar com URL/KEY vazios: sbClient fica null
 * e a app roda 100% no modo "sem backend" (as telas precisam suportar
 * isso de qualquer forma quando o Supabase não está configurado). */
async function stubSupabaseDisabled(page) {
  await blockExternalNoise(page);
  await page.route('**/shared/supabase-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.SUPABASE_URL = ''; window.SUPABASE_ANON_KEY = '';",
  }));
}

/** Faz supabase-config.js carregar com credenciais falsas e troca a lib
 * @supabase/supabase-js real por um cliente falso em memória (ver
 * fixtures/fake-supabase-client.js), seedado via window.__FAKE_DB__. */
async function stubSupabaseFake(page, seed) {
  await blockExternalNoise(page);
  await page.route('**/shared/supabase-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.SUPABASE_URL = 'https://fake.test'; window.SUPABASE_ANON_KEY = 'fake-key';",
  }));
  await page.route(SUPABASE_JS_URL, route => route.fulfill({
    contentType: 'application/javascript',
    path: FAKE_CLIENT_PATH,
  }));
  if (seed) {
    await page.addInitScript(seedData => {
      window.__FAKE_DB__ = seedData;
    }, seed);
  }
}

// Roster fixo das duas turmas (mesmos usuários que existiam em
// shared/users-db.js antes da migração pra Supabase Auth — o arquivo não
// existe mais, mas vários testes de ranking/relatório precisam de um
// roster real pra reproduzir "posição X de Y alunos"). Usar só quando o
// teste depender do TOTAL/identidade dos colegas de turma — a maioria dos
// testes não precisa disso, o cliente fake já sintetiza o profile de quem
// está logado a partir da própria URL (ver fixtures/fake-supabase-client.js).
const JOGOS_ALUNO_ROSTER = [
  ['breno.silva80', 'Breno Silva'], ['edward.guzman', 'Edward Guzman'], ['engel.fraga', 'Engel Fraga'],
  ['gabriella.borges5', 'Gabriella Borges'], ['iago.moreira', 'Iago Moreira'], ['joao.schneider', 'João Schneider'],
  ['jose.lima8', 'José Lima'], ['jose.rodrigues6', 'José Rodrigues'], ['josuel.santos', 'Josuel Santos'],
  ['juliano.alves', 'Juliano Alves'], ['leon.kacki', 'Leon Kacki'], ['maria.moura85', 'Maria Moura'],
  ['maycongabriel.moreira', 'Maycon Gabriel Moreira'], ['miguelmendonca.martins', 'Miguel Mendonça Martins'],
  ['murillo.lima', 'Murillo Lima'], ['tiago.dias1', 'Tiago Dias'], ['yasmim.rezende4', 'Yasmim Rezende'],
];

const SISTEMAS_ALUNO_ROSTER = [
  ['alexandre.natal', 'Alexandre Natal'], ['amanda.silva32', 'Amanda Silva'], ['ana.quevedo1', 'Ana Quevedo'],
  ['anne.karoline', 'Anne Karoline'], ['bianca.bernardi', 'Bianca Bernardi'], ['bruno.gomes1', 'Bruno Gomes'],
  ['douglas.silva16', 'Douglas Silva'], ['emilly.oliveira75', 'Emilly Oliveira'], ['enzo.lopes4', 'Enzo Lopes'],
  ['erasmo.prado', 'Erasmo Prado'], ['franciele.alencar', 'Franciele Alencar'], ['guilherme.almeida8', 'Guilherme Almeida'],
  ['guilherme.lima119', 'Guilherme Lima'], ['gustavo.robson', 'Gustavo Robson'], ['hebert.eduardo', 'Hebert Eduardo'],
  ['isabella.prado', 'Isabella Prado'], ['joao.sousa73', 'João Sousa'], ['jordanna.rocha', 'Jordanna Rocha'],
  ['kaila.jesus', 'Kaila Jesus'], ['kauan.sousa60', 'Kauan Sousa'], ['lauan.souza', 'Lauan Souza'],
  ['luana.victoria', 'Luana Victoria'], ['moises.barros', 'Moisés Barros'], ['nicole.santos21', 'Nicole Santos'],
  ['vicente.ferreira', 'Vicente Ferreira'], ['victor.teodoro', 'Victor Teodoro'],
];

function rosterToProfiles(roster, turma) {
  return roster.map(([email, nome]) => ({ id: `fake-${email}`, email, nome, role: 'aluno', turma }));
}

function jogosAlunoProfiles() { return rosterToProfiles(JOGOS_ALUNO_ROSTER, 'jogos'); }
function sistemasAlunoProfiles() { return rosterToProfiles(SISTEMAS_ALUNO_ROSTER, 'sistemas'); }

/** A lista de gabaritos (Gestão > Gabarito) é agrupada por matéria — cada
 * grupo é um .collapsible-card.nested colapsado por padrão (ver
 * renderGestaoGabaritoList em shared/platform-core.js). Acha o grupo que
 * contém `titleHint`, expande o cabeçalho dele, e devolve o locator da
 * linha (.gabarito-row) — o teste faz o próprio Promise.all com
 * page.waitForEvent('download') em volta do clique no botão dessa linha.
 * Não precisa saber o nome da matéria: acha pelo texto do módulo mesmo. */
async function expandGabaritoRow(page, titleHint) {
  const group = page.locator('#gestaoGabaritoList .collapsible-card.nested', { hasText: titleHint });
  await group.locator('.collapsible-head').click();
  return group.locator('.gabarito-row', { hasText: titleHint });
}

module.exports = {
  blockExternalNoise, stubSupabaseDisabled, stubSupabaseFake,
  jogosAlunoProfiles, sistemasAlunoProfiles, expandGabaritoRow,
};
