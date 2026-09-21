// Solver do "Fuga do Bug": joga a fase usando o MESMO motor do jogo
// (games/fuga-do-bug-engine.js) e devolve se existe uma sequência de teclas que
// chega na bandeira sem morrer. Usado por tests/fuga-do-bug-fases.spec.js pra
// garantir que nenhuma fase tem pulo impossível — e por quem for mexer nas
// fases: `node tests/fuga-solver.js` imprime o resultado de cada uma.
const Engine = require('../games/fuga-do-bug-engine.js');
const LEVELS = require('../games/fuga-do-bug-levels.js');

const MACRO = Number(process.env.FUGA_MACRO) || 4; // frames por decisão (tecla mantida por 4 frames)
const ACTIONS = [];
for (const dir of [1, 0, -1]) for (const jump of [1, 0]) ACTIONS.push({ left: dir < 0, right: dir > 0, jump: !!jump });

// Fila de prioridade mínima (heap binário).
class Heap {
  constructor() { this.a = []; }
  push(item) {
    const a = this.a; a.push(item);
    let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p].f <= a[i].f) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
  }
  pop() {
    const a = this.a; const top = a[0]; const last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
  get size() { return this.a.length; }
}

function keyOf(sim) {
  const p = sim.p;
  const dyn = sim.cr.map(c => c.s * 1000 + (c.s ? c.k : 0)).join(',') + '|' +
    sim.dr.map(d => d.s + ':' + (d.s === 1 ? d.k : d.s === 2 ? Math.round(d.y) : 0)).join(',') + '|' +
    sim.po.map(u => u.s + ':' + (u.s === 1 ? u.k : 0)).join(',');
  return [
    Math.round(p.x / 4), Math.round(p.y / 4), Math.round(p.vx), Math.round(p.vy),
    p.ground ? 1 : 0, p.coyote > 0 ? 1 : 0, p.jumping ? 1 : 0, p.ride, Math.floor((sim.t % 240) / 8), dyn,
  ].join('/');
}

function solve(def, { maxNodes = 4000000 } = {}) {
  const sim = Engine.createSim(def);
  const goalX = def.goal[0] * Engine.TILE;
  const start = sim.snapshot();
  const heap = new Heap();
  const seen = new Set([keyOf(sim)]);
  const h = s => Math.max(0, goalX - s.p.x) / Engine.PHYS.MOVE;
  heap.push({ f: h(start), snap: start, path: null, g: 0 });
  let nodes = 0, bestX = 0, bestPath = null;
  while (heap.size && nodes < maxNodes) {
    const cur = heap.pop();
    for (let ai = 0; ai < ACTIONS.length; ai++) {
      sim.restore(cur.snap);
      const a = ACTIONS[ai];
      for (let i = 0; i < MACRO && !sim.dead && !sim.won; i++) sim.step(a);
      nodes++;
      if (sim.dead) continue;
      const node = { snap: null, path: { a: ai, prev: cur.path }, g: cur.g + MACRO, f: 0 };
      if (sim.won) return { ok: true, frames: node.g, nodes, path: node.path };
      const k = keyOf(sim);
      if (seen.has(k)) continue;
      seen.add(k);
      if (sim.p.x > bestX) { bestX = sim.p.x; bestPath = { a: ai, prev: cur.path }; }
      node.snap = sim.snapshot();
      node.f = node.g * 0.15 + h(node.snap);
      heap.push(node);
    }
  }
  return { ok: false, nodes, bestPath, bestCol: +(bestX / Engine.TILE).toFixed(1) };
}

module.exports = { solve, LEVELS, Engine };

if (require.main === module) {
  const only = process.argv[2] ? Number(process.argv[2]) : null;
  LEVELS.forEach((def, i) => {
    if (only && only !== i + 1) return;
    const t0 = Date.now();
    const r = solve(def);
    console.log(`Fase ${i + 1} (${def.name}): ${r.ok ? 'OK ' + (r.frames / 60).toFixed(1) + 's' : 'SEM SOLUÇÃO (chegou até a coluna ' + r.bestCol + ')'} — ${r.nodes} nós, ${Date.now() - t0}ms`);
  });
}
