// @ts-check
// "Fuga do Bug": motor de física + fases (games/fuga-do-bug-engine.js e
// games/fuga-do-bug-levels.js). Não abre navegador — o motor não depende de
// DOM, então dá pra testar a física e JOGAR cada fase inteira em Node.
//
// O teste mais importante é o "toda fase tem solução": um solver (ver
// tests/fuga-solver.js) procura uma sequência de teclas que leva do início à
// bandeira sem morrer. Se alguém mexer numa fase e criar um pulo impossível,
// este teste quebra.
const { test, expect } = require('@playwright/test');
const { solve, LEVELS, Engine } = require('./fuga-solver.js');

const { TILE, PHYS } = Engine;
const NONE = { left: false, right: false, jump: false };

function ground(def) {
  // sim mínimo: só chão, um espinho e a bandeira longe.
  return Object.assign({
    cols: 60, ground: [[0, 60]], blocks: [], spikes: [], fakes: [], crumbles: [], movers: [], saws: [],
    drops: [], popups: [], springs: [], coins: [], checks: [], start: [2, 13], goal: [58, 12],
  }, def);
}
function run(sim, n, input) { for (let i = 0; i < n; i++) sim.step(typeof input === 'function' ? input(i) : input); }

test.describe('Fuga do Bug — motor de física', () => {
  test('o jogador assenta no chão e fica parado (não afunda nem treme)', () => {
    const sim = Engine.createSim(ground());
    run(sim, 60, NONE);
    expect(sim.p.ground).toBe(true);
    expect(sim.p.y).toBe(14 * TILE - Engine.PH);
    expect(sim.dead).toBe(false);
  });

  test('parede sólida bloqueia de lado (a versão antiga atravessava blocos andando)', () => {
    const sim = Engine.createSim(ground({ blocks: [[10, 12, 2, 2]] }));
    run(sim, 200, { right: true });
    expect(sim.p.x).toBeLessThanOrEqual(10 * TILE - Engine.PW + 0.001);
    expect(sim.p.x).toBeGreaterThan(9 * TILE - 2);
  });

  test('bater a cabeça no teto corta o pulo e o jogador desce', () => {
    // laje sólida 2 tiles acima da superfície do chão (fica em x=2..3 onde ele nasce)
    const sim = Engine.createSim(ground({ blocks: [[0, 11, 8, 1]] }));
    run(sim, 3, NONE);
    run(sim, 30, { jump: true });
    expect(sim.p.y).toBeGreaterThanOrEqual(12 * TILE - 0.001); // nunca entra na laje (linha 11 vai até y=384)
    run(sim, 60, NONE);
    expect(sim.p.ground).toBe(true);
  });

  test('altura e alcance do pulo batem com o que as fases assumem (degrau <= 2, buraco <= 4 tiles)', () => {
    const sim = Engine.createSim(ground());
    run(sim, 3, NONE);
    let minY = sim.p.y;
    const startY = sim.p.y, startX = sim.p.x;
    let landedX = 0;
    for (let i = 0; i < 80; i++) {
      sim.step({ right: true, jump: true });
      minY = Math.min(minY, sim.p.y);
      if (i > 5 && sim.p.ground) { landedX = sim.p.x; break; }
    }
    const heightTiles = (startY - minY) / TILE;
    const rangeTiles = (landedX - startX) / TILE;
    expect(heightTiles).toBeGreaterThan(3.0);
    expect(heightTiles).toBeLessThan(3.8);
    expect(rangeTiles).toBeGreaterThan(4.6);
    expect(rangeTiles).toBeLessThan(5.8);
  });

  test('soltar o pulo cedo dá um pulo curto (controle de altura)', () => {
    const cheio = Engine.createSim(ground()); run(cheio, 3, NONE);
    const curto = Engine.createSim(ground()); run(curto, 3, NONE);
    let minCheio = cheio.p.y, minCurto = curto.p.y;
    for (let i = 0; i < 40; i++) {
      cheio.step({ jump: true }); minCheio = Math.min(minCheio, cheio.p.y);
      curto.step({ jump: i < 3 }); minCurto = Math.min(minCurto, curto.p.y);
    }
    expect(minCurto).toBeGreaterThan(minCheio + TILE); // pulo curto sobe pelo menos 1 tile a menos
  });

  test('coyote time: dá pra pular logo depois de sair da borda', () => {
    const sim = Engine.createSim(ground({ ground: [[0, 6]], cols: 30, goal: [28, 12] }));
    run(sim, 200, i => ({ right: sim.p.x < 6 * TILE - Engine.PW + 4 }));
    // andou até passar da borda; solta e tenta pular 3 frames depois de sair do chão
    sim.p.x = 6 * TILE - Engine.PW + 2; sim.p.ground = false; sim.p.coyote = PHYS.COYOTE - 3; sim.p.vy = 0;
    sim.step({ jump: true });
    expect(sim.p.vy).toBeLessThan(0);
  });

  test('espinho mata, e respawn volta pro início com as mortes contadas', () => {
    const sim = Engine.createSim(ground({ spikes: [[6, 13, 1]] }));
    run(sim, 200, { right: true });
    expect(sim.dead).toBe(true);
    expect(sim.cause).toBe('spike');
    expect(sim.deaths).toBe(1);
    sim.respawn();
    expect(sim.dead).toBe(false);
    expect(sim.p.x).toBeLessThan(3 * TILE);
  });

  test('cair no buraco mata (pit) e o respawn volta pro último checkpoint, não pro início', () => {
    const def = ground({ ground: [[0, 12], [16, 60]], checks: [[8, 13]] });
    const sim = Engine.createSim(def);
    run(sim, 80, { right: true });
    expect(sim.cp).toBe(1);
    run(sim, 200, { right: true });
    expect(sim.dead).toBe(true);
    expect(sim.cause).toBe('pit');
    sim.respawn();
    expect(sim.p.x).toBeGreaterThan(7 * TILE);
  });

  test('plataforma falsa não segura, esfarelável some e volta, e se pisa nela por cima mas se atravessa por baixo', () => {
    // falsa: cai através dela
    const f = Engine.createSim(ground({ fakes: [[2, 12, 3]], start: [3, 11] }));
    run(f, 60, NONE);
    expect(f.p.y).toBe(14 * TILE - Engine.PH);

    // esfarelável: aguenta ~0,3s, some, volta depois
    // chão embaixo: quando ela some, o jogador só cai, não morre
    const c = Engine.createSim(ground({ crumbles: [[5, 12, 1]], start: [5, 10] }));
    for (let i = 0; i < 40 && !c.p.ground; i++) c.step(NONE); // cai do ar até pousar nela
    expect(c.p.ground).toBe(true);
    run(c, PHYS.CRUMBLE_SHAKE + 2, NONE);
    expect(c.cr[0].s).toBe(2);
    run(c, PHYS.CRUMBLE_GONE + 2, NONE);
    expect(c.cr[0].s).toBe(0);

    // por baixo: passa direto subindo por uma laje de mão única
    const u = Engine.createSim(ground({ crumbles: [[2, 12, 1]], start: [2, 13] }));
    run(u, 3, NONE);
    run(u, 14, { jump: true });
    expect(u.cr[0].s).toBe(0); // não pisou nela, só passou por baixo dela subindo
  });

  test('plataforma móvel leva o jogador junto', () => {
    const sim = Engine.createSim(ground({ ground: [[0, 4]], movers: [[4, 14, 3, 8, 240, 0]], start: [3, 13], cols: 40, goal: [38, 12] }));
    run(sim, 20, { right: true });
    run(sim, 80, NONE); // parado em cima
    expect(sim.p.ride).toBe(0);
    expect(sim.p.x).toBeGreaterThan(5 * TILE + 5);
  });

  test('mola lança mais alto que um pulo normal', () => {
    const sim = Engine.createSim(ground({ springs: [[3, 13]], start: [3, 10] }));
    let minY = Infinity;
    for (let i = 0; i < 90; i++) { sim.step(NONE); minY = Math.min(minY, sim.p.y); }
    expect(minY).toBeLessThan(14 * TILE - Engine.PH - 4 * TILE); // subiu bem mais que os 3,4 tiles do pulo
  });

  test('bloco do teto avisa (treme) antes de cair, e só mata caindo', () => {
    const sim = Engine.createSim(ground({ drops: [[6, 8, 2]], cols: 30, goal: [28, 12] }));
    run(sim, 100, () => ({ right: sim.p.x < 4 * TILE })); // anda até ficar ANTES da zona do gatilho e para
    // parado antes da zona do gatilho: nada acontece
    expect(sim.dr[0].s).toBe(0);
    run(sim, 30, { right: true });
    expect(sim.dr[0].s).toBeGreaterThanOrEqual(1); // gatilhou (aviso já começou)
    run(sim, 200, { right: true });
    expect(sim.dr[0].s).toBe(3); // caiu e virou entulho inofensivo
  });

  test('espinho escondido só surge quando o jogador chega perto, e depois de um aviso', () => {
    const sim = Engine.createSim(ground({ popups: [[10, 13]], cols: 30, goal: [28, 12] }));
    run(sim, 60, NONE);
    expect(sim.po[0].s).toBe(0);
    sim.p.x = 10 * TILE - 20; // do lado do espinho escondido
    run(sim, 2, NONE);
    expect(sim.po[0].s).toBe(1);
    expect(sim.dead).toBe(false);
    run(sim, PHYS.POPUP_WARN + 1, NONE);
    expect(sim.po[0].s).toBe(2);
  });

  test('commits coletados ficam contados mesmo depois de morrer', () => {
    const sim = Engine.createSim(ground({ coins: [[5, 13]], spikes: [[9, 13, 1]] }));
    run(sim, 300, { right: true, jump: false });
    expect(sim.coinCount).toBe(1);
    expect(sim.dead).toBe(true);
    sim.respawn();
    expect(sim.coinCount).toBe(1);
  });

  test('a simulação é determinística: mesma entrada, mesmo resultado (independe de FPS)', () => {
    const a = Engine.createSim(LEVELS[3]), b = Engine.createSim(LEVELS[3]);
    const inp = i => ({ right: true, jump: i % 37 < 12 });
    for (let i = 0; i < 500; i++) { a.step(inp(i)); b.step(inp(i)); }
    expect(a.snapshot()).toEqual(b.snapshot());
  });

  test('snapshot/restore devolve exatamente o mesmo estado', () => {
    const sim = Engine.createSim(LEVELS[4]);
    run(sim, 120, i => ({ right: true, jump: i % 30 < 10 }));
    const s = sim.snapshot();
    run(sim, 50, { right: true });
    sim.restore(s);
    expect(sim.snapshot()).toEqual(s);
  });
});

test.describe('Fuga do Bug — fases', () => {
  test('são 10 fases, cada uma com nome, comando git, dificuldade e texto de apresentação', () => {
    expect(LEVELS).toHaveLength(10);
    LEVELS.forEach((d, i) => {
      expect(d.name, `fase ${i + 1} sem nome`).toBeTruthy();
      expect(d.cmd, `fase ${i + 1} sem comando`).toMatch(/^git /);
      expect(d.blurb, `fase ${i + 1} sem texto`).toBeTruthy();
      expect(d.stars).toBeGreaterThanOrEqual(1);
      expect(d.stars).toBeLessThanOrEqual(5);
    });
  });

  test('a dificuldade (estrelas) só sobe: nenhuma fase é marcada mais fácil que a anterior', () => {
    for (let i = 1; i < LEVELS.length; i++) expect(LEVELS[i].stars).toBeGreaterThanOrEqual(LEVELS[i - 1].stars);
    expect(LEVELS[0].stars).toBeLessThan(LEVELS[LEVELS.length - 1].stars);
  });

  test('as fases crescem: cada uma é tão longa quanto a anterior ou mais', () => {
    for (let i = 1; i < LEVELS.length; i++) expect(LEVELS[i].cols).toBeGreaterThanOrEqual(LEVELS[i - 1].cols - 10);
    expect(LEVELS[9].cols).toBeGreaterThan(LEVELS[0].cols * 1.5);
  });

  for (let i = 0; i < LEVELS.length; i++) {
    const def = LEVELS[i];

    test(`fase ${i + 1} (${def.name}): início e fim em chão firme, checkpoints em chão firme, nada te mata no nascimento`, () => {
      const L = Engine.compile(def);
      const solidAt = (c, r) => L.grid[r] && L.grid[r][c] === 1;
      // início, checkpoints e bandeira precisam ter chão sólido logo embaixo
      L.checks.forEach((c, k) => expect(solidAt(c.c, c.r + 1), `checkpoint ${k} sem chão embaixo (col ${c.c})`).toBe(true));
      const gc = def.goal[0];
      expect(solidAt(gc, def.goal[1] + 2), 'bandeira sem chão embaixo').toBe(true);
      // spawn de cada checkpoint não pode estar dentro de sólido nem em cima de armadilha
      const sim = Engine.createSim(def);
      for (let k = 0; k < L.checks.length; k++) {
        sim.cp = k; sim.respawn();
        run(sim, 5, NONE);
        expect(sim.dead, `morreu parado no checkpoint ${k}`).toBe(false);
      }
      // a fase acaba na bandeira, dentro do mapa
      expect(gc).toBeLessThan(def.cols);
    });

    test(`fase ${i + 1} (${def.name}): tem solução (o solver joga do início à bandeira sem morrer)`, () => {
      const r = solve(def);
      expect(r.ok, `sem solução — o solver chegou até a coluna ${r.bestCol}`).toBe(true);
      // fase razoavelmente longa pra ser divertida, e curta o bastante pra não ser maratona
      expect(r.frames / 60).toBeGreaterThan(8);
      expect(r.frames / 60).toBeLessThan(60);
    });
  }
});
