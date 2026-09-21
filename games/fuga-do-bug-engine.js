// Motor de física do jogo "Fuga do Bug" (games/fuga-do-bug.html).
//
// Separado da página de propósito: não toca em DOM nem em canvas, só recebe a
// definição de uma fase (games/fuga-do-bug-levels.js) e avança a simulação em
// passos FIXOS (60 por segundo), independente da taxa de atualização do
// monitor — a versão antiga movia o jogador por frame de tela, então em um
// monitor de 144Hz o jogo rodava 2,4x mais rápido que em um de 60Hz.
//
// Como não depende do navegador, o mesmo arquivo roda em Node: o teste
// tests/fuga-do-bug-fases.spec.js usa um solver que joga cada fase até o fim
// pra garantir que TODAS têm solução (nenhum pulo impossível).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FugaEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TILE = 32;
  const ROWS = 17;          // 17 * 32 = 544px de altura de fase
  const GROUND_ROW = 14;    // linha do topo do chão padrão
  const PW = 20, PH = 30;   // caixa de colisão do jogador

  const PHYS = {
    GRAVITY: 0.55, MAX_FALL: 13,
    MOVE: 4.2,
    JUMP: -11,         // ~110px de altura (3,4 tiles), ~168px de alcance (5,2 tiles)
    JUMP_CUT: -4,      // soltar o pulo cortando a subida = pulo curto
    SPRING: -15.5,     // ~218px de altura (6,8 tiles)
    COYOTE: 6,         // frames de tolerância pra pular logo depois de sair da borda
    BUFFER: 6,         // frames de tolerância pra apertar pulo logo antes de aterrissar
    CRUMBLE_SHAKE: 18, // frames tremendo antes de sumir
    CRUMBLE_GONE: 150, // frames sumida antes de voltar
    DROP_WARN: 22,     // frames tremendo antes do bloco despencar
    POPUP_WARN: 20,    // frames de aviso antes do espinho surgir do chão
  };

  // ---------- Compilação da fase ----------
  function compile(def) {
    const cols = def.cols;
    const grid = Array.from({ length: ROWS }, () => new Uint8Array(cols));
    const fill = (c, r, w, h) => {
      for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) {
        if (y >= 0 && y < ROWS && x >= 0 && x < cols) grid[y][x] = 1;
      }
    };
    (def.ground || []).forEach(([a, z]) => fill(a, GROUND_ROW, z - a, ROWS - GROUND_ROW));
    (def.blocks || []).forEach(([c, r, w, h]) => fill(c, r, w, h));

    const spawnAt = (c, r) => ({ c, r, px: c * TILE + (TILE - PW) / 2, py: (r + 1) * TILE - PH });
    const [sc, sr] = def.start;
    const checks = [spawnAt(sc, sr)].concat(
      (def.checks || []).slice().sort((a, b) => a[0] - b[0]).map(([c, r]) => spawnAt(c, r))
    );

    const spikes = [];
    (def.spikes || []).forEach(([c, r, w]) => {
      for (let i = 0; i < w; i++) spikes.push({ c: c + i, r, x: (c + i) * TILE + 5, y: r * TILE + 14, w: TILE - 10, h: TILE - 14 });
    });

    const drops = (def.drops || []).map(([c, r, w]) => {
      const wt = w || 2;
      // chão embaixo do bloco = primeira linha sólida abaixo dele, em qualquer
      // uma das colunas que ele cobre (senão despenca pelo poço e some).
      let floorRow = Infinity;
      for (let cc = c; cc < c + wt; cc++) {
        for (let rr = r + 1; rr < ROWS; rr++) {
          if (grid[rr] && grid[rr][cc]) { floorRow = Math.min(floorRow, rr); break; }
        }
      }
      return { c, r, wt, x: c * TILE, y0: r * TILE, w: wt * TILE, h: TILE, floorTop: floorRow === Infinity ? Infinity : floorRow * TILE };
    });

    return {
      def, cols, grid, width: cols * TILE,
      checks,
      spikes,
      drops,
      fakes: (def.fakes || []).flatMap(([c, r, w]) => Array.from({ length: w }, (_, i) => ({ c: c + i, r }))),
      crumbles: (def.crumbles || []).flatMap(([c, r, w]) => Array.from({ length: w }, (_, i) => ({ c: c + i, r, x: (c + i) * TILE, y: r * TILE }))),
      movers: (def.movers || []).map(([c, r, w, range, period, phase]) => ({
        x0: c * TILE, y: r * TILE, w: w * TILE, range: range * TILE, period: period || 240, phase: phase || 0,
      })),
      saws: (def.saws || []).map(([c, r, axis, amp, period, phase]) => ({
        cx: c * TILE + TILE / 2, cy: r * TILE + TILE / 2, axis: axis || 'x', amp: amp * TILE, period: period || 150, phase: phase || 0, r: 12,
      })),
      popups: (def.popups || []).map(([c, r]) => ({ c, r, x: c * TILE, y: r * TILE })),
      springs: (def.springs || []).map(([c, r]) => ({ c, r, x: c * TILE, y: r * TILE + 16, w: TILE, h: 16 })),
      coins: (def.coins || []).map(([c, r]) => ({ c, r, x: c * TILE + 8, y: r * TILE + 8, w: 16, h: 16 })),
      goal: { x: def.goal[0] * TILE, y: def.goal[1] * TILE, w: TILE, h: 2 * TILE },
    };
  }

  function moverX(m, t) { return m.x0 + m.range * (0.5 - 0.5 * Math.cos(2 * Math.PI * t / m.period + m.phase)); }
  function sawPos(s, t) {
    const off = s.amp * Math.sin(2 * Math.PI * t / s.period + s.phase);
    return s.axis === 'y' ? { x: s.cx, y: s.cy + off } : { x: s.cx + off, y: s.cy };
  }

  const overlap = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

  // ---------- Simulação ----------
  function createSim(def) {
    const L = compile(def);
    const { grid, cols } = L;
    const sim = {
      L, t: 0, dead: false, cause: null, won: false, cp: 0, deaths: 0,
      coins: L.coins.map(() => 0), coinCount: 0,
      p: null, cr: null, dr: null, po: null, sp: null,
    };

    const solidTile = (c, r) => {
      if (c < 0 || c >= cols) return true; // paredes invisíveis nas laterais da fase
      if (r < 0 || r >= ROWS) return false;
      return grid[r][c] === 1;
    };

    function resetDyn() {
      sim.cr = L.crumbles.map(() => ({ s: 0, k: 0 }));
      sim.dr = L.drops.map(d => ({ s: 0, k: 0, y: d.y0, vy: 0 }));
      sim.po = L.popups.map(() => ({ s: 0, k: 0 }));
      sim.sp = L.springs.map(() => ({ k: 0 }));
    }

    function spawn() {
      const c = L.checks[sim.cp];
      sim.p = { x: c.px, y: c.py, vx: 0, vy: 0, ground: false, coyote: 0, buffer: 0, prevJump: false, jumping: false, facing: 1, ride: -1 };
      sim.dead = false; sim.cause = null;
      resetDyn();
    }

    function kill(cause) {
      if (sim.dead) return;
      sim.dead = true; sim.cause = cause; sim.deaths++;
    }

    function collideX(p, dir) {
      if (p.x < 0) { p.x = 0; p.vx = 0; }
      else if (p.x + PW > L.width) { p.x = L.width - PW; p.vx = 0; }
      if (!dir) return;
      const c0 = Math.floor(p.x / TILE), c1 = Math.floor((p.x + PW - 0.001) / TILE);
      const r0 = Math.floor(p.y / TILE), r1 = Math.floor((p.y + PH - 0.001) / TILE);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        if (!solidTile(c, r)) continue;
        if (dir > 0) p.x = c * TILE - PW; else p.x = (c + 1) * TILE;
        p.vx = 0;
        return;
      }
    }

    function collideY(p, prevBottom) {
      const falling = p.vy >= 0;
      const c0 = Math.floor(p.x / TILE), c1 = Math.floor((p.x + PW - 0.001) / TILE);
      const r0 = Math.floor(p.y / TILE), r1 = Math.floor((p.y + PH - 0.001) / TILE);
      outer:
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        if (!solidTile(c, r)) continue;
        if (p.vy > 0) { p.y = r * TILE - PH; p.ground = true; }
        else if (p.vy < 0) p.y = (r + 1) * TILE;
        p.vy = 0;
        break outer;
      }

      // Plataformas "de mão única" (só se pisa por cima): esfarelável, móvel e mola.
      if (!falling) return;
      const bottom = p.y + PH;
      let best = null;
      const consider = (top, x, w, apply) => {
        if (!(p.x + PW > x && p.x < x + w)) return;
        if (prevBottom <= top + 0.5 && bottom >= top && (!best || top < best.top)) best = { top, apply };
      };
      L.crumbles.forEach((c, i) => {
        if (sim.cr[i].s === 2) return;
        consider(c.y, c.x, TILE, () => { if (sim.cr[i].s === 0) { sim.cr[i].s = 1; sim.cr[i].k = 0; } });
      });
      L.movers.forEach((m, i) => consider(m.y, moverX(m, sim.t), m.w, () => { p.ride = i; }));
      L.springs.forEach((s, i) => consider(s.y, s.x, s.w, () => { sim.sp[i].k = 10; p.bounce = true; }));
      if (best) {
        p.y = best.top - PH;
        p.vy = 0;
        p.ground = true;
        best.apply();
        if (p.bounce) { p.vy = PHYS.SPRING; p.ground = false; p.jumping = false; p.bounce = false; }
      }
    }

    function step(inp) {
      if (sim.dead || sim.won) return;
      const p = sim.p;
      sim.t++;
      const t = sim.t;

      // Plataforma móvel leva quem está em cima dela.
      if (p.ride >= 0) {
        const m = L.movers[p.ride];
        const dx = moverX(m, t) - moverX(m, t - 1);
        p.x += dx;
        collideX(p, Math.sign(dx));
      }

      // Entrada horizontal: aproxima a velocidade do alvo (chão responde mais rápido que o ar).
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (dir) p.facing = dir;
      const k = dir ? (p.ground ? 0.4 : 0.3) : (p.ground ? 0.35 : 0.04);
      p.vx += (dir * PHYS.MOVE - p.vx) * k;
      if (Math.abs(p.vx) < 0.05) p.vx = 0;

      // Pulo: buffer (apertou um pouco antes de aterrissar) + coyote (saiu da borda há pouco).
      const jp = !!inp.jump;
      if (jp && !p.prevJump) p.buffer = PHYS.BUFFER;
      p.prevJump = jp;
      if ((p.buffer > 0 || jp) && p.coyote > 0) {
        p.vy = PHYS.JUMP; p.jumping = true; p.coyote = 0; p.buffer = 0; p.ground = false; p.ride = -1;
      } else if (p.buffer > 0) p.buffer--;
      if (!jp && p.jumping && p.vy < PHYS.JUMP_CUT) p.vy = PHYS.JUMP_CUT;
      if (p.vy >= 0) p.jumping = false;

      p.vy = Math.min(p.vy + PHYS.GRAVITY, PHYS.MAX_FALL);

      // Eixo X e depois eixo Y, cada um resolvido separado (sem "grudar" em parede).
      p.x += p.vx;
      collideX(p, Math.sign(p.vx));

      const prevBottom = p.y + PH;
      p.y += p.vy;
      p.ground = false; p.ride = -1;
      collideY(p, prevBottom);
      if (p.ground) p.coyote = PHYS.COYOTE; else if (p.coyote > 0) p.coyote--;

      // ---- Armadilhas dinâmicas ----
      sim.cr.forEach(c => {
        if (c.s === 1 && ++c.k >= PHYS.CRUMBLE_SHAKE) { c.s = 2; c.k = 0; }
        else if (c.s === 2 && ++c.k >= PHYS.CRUMBLE_GONE) { c.s = 0; c.k = 0; }
      });
      sim.sp.forEach(s => { if (s.k > 0) s.k--; });

      const pcx = p.x + PW / 2;
      L.drops.forEach((d, i) => {
        const s = sim.dr[i];
        if (s.s === 0 && Math.abs(pcx - (d.x + d.w / 2)) < d.w / 2 + 26 && p.y + PH > d.y0) { s.s = 1; s.k = 0; }
        else if (s.s === 1 && ++s.k >= PHYS.DROP_WARN) { s.s = 2; s.vy = 0; }
        else if (s.s === 2) {
          s.vy = Math.min(s.vy + 0.9, 18);
          s.y += s.vy;
          if (s.y + d.h >= d.floorTop) { s.y = d.floorTop - d.h; s.s = 3; }
          else if (s.y > ROWS * TILE) s.s = 3;
        }
      });

      L.popups.forEach((u, i) => {
        const s = sim.po[i];
        if (s.s === 0 && Math.abs(pcx - (u.x + TILE / 2)) < 34 && p.y + PH >= u.y + TILE - 10 && p.y < u.y + TILE) { s.s = 1; s.k = 0; }
        else if (s.s === 1 && ++s.k >= PHYS.POPUP_WARN) s.s = 2;
      });

      // ---- Morte, coleta e objetivos ----
      if (p.y > ROWS * TILE + 40) kill('pit');

      for (const sp of L.spikes) {
        if (overlap(p.x, p.y, PW, PH, sp.x, sp.y, sp.w, sp.h)) { kill('spike'); break; }
      }
      if (!sim.dead) L.popups.forEach((u, i) => {
        if (sim.po[i].s === 2 && overlap(p.x, p.y, PW, PH, u.x + 5, u.y + 14, TILE - 10, TILE - 14)) kill('popup');
      });
      if (!sim.dead) L.drops.forEach((d, i) => {
        if (sim.dr[i].s === 2 && overlap(p.x, p.y, PW, PH, d.x, sim.dr[i].y, d.w, d.h)) kill('drop');
      });
      if (!sim.dead) for (const s of L.saws) {
        const q = sawPos(s, t);
        const nx = Math.max(p.x, Math.min(q.x, p.x + PW)), ny = Math.max(p.y, Math.min(q.y, p.y + PH));
        const dx = q.x - nx, dy = q.y - ny;
        if (dx * dx + dy * dy < (s.r - 1) * (s.r - 1)) { kill('saw'); break; }
      }
      if (sim.dead) return;

      L.coins.forEach((c, i) => {
        if (!sim.coins[i] && overlap(p.x, p.y, PW, PH, c.x, c.y, c.w, c.h)) { sim.coins[i] = 1; sim.coinCount++; }
      });
      L.checks.forEach((c, i) => {
        if (i > sim.cp && overlap(p.x, p.y, PW, PH, c.c * TILE, c.r * TILE, TILE, TILE)) sim.cp = i;
      });
      const g = L.goal;
      if (overlap(p.x, p.y, PW, PH, g.x, g.y, g.w, g.h)) sim.won = true;
    }

    function respawn() { spawn(); }

    function snapshot() {
      return {
        t: sim.t, dead: sim.dead, cause: sim.cause, won: sim.won, cp: sim.cp, deaths: sim.deaths,
        coins: sim.coins.slice(), coinCount: sim.coinCount,
        p: Object.assign({}, sim.p),
        cr: sim.cr.map(o => Object.assign({}, o)), dr: sim.dr.map(o => Object.assign({}, o)),
        po: sim.po.map(o => Object.assign({}, o)), sp: sim.sp.map(o => Object.assign({}, o)),
      };
    }
    function restore(s) {
      sim.t = s.t; sim.dead = s.dead; sim.cause = s.cause; sim.won = s.won; sim.cp = s.cp; sim.deaths = s.deaths;
      sim.coins = s.coins.slice(); sim.coinCount = s.coinCount;
      sim.p = Object.assign({}, s.p);
      sim.cr = s.cr.map(o => Object.assign({}, o)); sim.dr = s.dr.map(o => Object.assign({}, o));
      sim.po = s.po.map(o => Object.assign({}, o)); sim.sp = s.sp.map(o => Object.assign({}, o));
    }

    spawn();
    Object.assign(sim, { step, respawn, snapshot, restore });
    return sim;
  }

  return { TILE, ROWS, GROUND_ROW, PW, PH, PHYS, compile, createSim, moverX, sawPos };
});
