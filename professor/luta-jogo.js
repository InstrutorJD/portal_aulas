// Punho Lendário — jogo de luta do professor (professor/luta.html).
//
// Estilo Street Fighter: o lutador (Kaito) enfrenta ondas de inimigos em 3
// fases e, no fim da fase 3, o chefão (Imperador Vulcano). Tudo desenhado
// no canvas (sem imagens), a 60 quadros por segundo com passo fixo.
//
// Controles:
//   - celular como joystick (professor/joystick.html), pareado por QR Code:
//     canal de broadcast do Supabase Realtime 'luta_<sala>', sem tabela e
//     sem SQL. O celular manda 'j' ({ x, y } de -1 a 1), 'b' ({ b: 'soco' |
//     'chute' | 'esp' | 'pulo' | 'pausa' }) e 'ola'; o jogo responde
//     'estado' (vida, energia, fase) e 'vib' (vibrar quando apanha).
//   - teclado: setas/WASD, Z soco, X chute, C especial, espaço pulo,
//     Enter começa, P pausa, M som, F tela cheia.
window.LutaJogo = (function () {
  'use strict';
  const W = 960, H = 540, CHAO = 478, GRAV = 0.75, RAD = Math.PI / 180;
  let cv, ctx, escalaBase = 1;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hash = i => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); };

  // ---------- Som (sintetizado, sem arquivos) ----------
  // O navegador só libera o áudio depois de um clique ou tecla NESTE
  // computador — comando que chega do celular não conta. Por isso iniciar()
  // destrava o som em qualquer clique/tecla (o botão "Jogar" do QR já serve)
  // e o HUD avisa enquanto ele estiver mudo.
  const Som = (function () {
    let ac = null, efeitos = null, eco = null, musVol = null, ligado = true, ruidoBuf = null;
    function a() {
      if (!ac) {
        try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
        const comp = ac.createDynamicsCompressor();
        comp.connect(ac.destination);
        const mestre = ac.createGain(); mestre.gain.value = 0.9; mestre.connect(comp);
        efeitos = ac.createGain(); efeitos.connect(mestre);
        musVol = ac.createGain(); musVol.gain.value = 0.55; musVol.connect(mestre);
        // Reverberação curta (ruído que decai): dá "corpo" de sala aos golpes.
        eco = ac.createConvolver();
        const n = Math.floor(ac.sampleRate * 0.9), ir = ac.createBuffer(2, n, ac.sampleRate);
        for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
        eco.buffer = ir;
        const ecoVol = ac.createGain(); ecoVol.gain.value = 0.22;
        eco.connect(ecoVol).connect(mestre);
        ruidoBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const d = ruidoBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    }
    const pronto = () => ligado && ac && ac.state === 'running';
    function saida(no, o) { no.connect(o.musica ? musVol : efeitos); if (o.eco) no.connect(eco); }
    function envelope(g, t, vol, ataque, dur) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + ataque);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
    // o: { tipo, ate (freq. final), vol, ataque, eco, musica, em (hora exata), atraso, corte (passa-baixa) }
    function tom(freq, dur, o = {}) {
      if (!pronto()) return;
      const t = o.em || ac.currentTime + (o.atraso || 0);
      const osc = ac.createOscillator(), g = ac.createGain();
      osc.type = o.tipo || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (o.ate) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.ate), t + dur);
      envelope(g, t, o.vol || 0.2, o.ataque || 0.004, dur);
      if (o.corte) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.corte; osc.connect(f).connect(g); } else osc.connect(g);
      saida(g, o);
      osc.start(t); osc.stop(t + dur + 0.03);
    }
    // o: { filtro, freq, ate (varre o filtro), q, vol, ataque, eco, musica, em, atraso }
    function ruido(dur, o = {}) {
      if (!pronto()) return;
      const t = o.em || ac.currentTime + (o.atraso || 0);
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = ruidoBuf; s.loop = true;
      f.type = o.filtro || 'lowpass'; f.Q.value = o.q || 0.7;
      f.frequency.setValueAtTime(o.freq || 1500, t);
      if (o.ate) f.frequency.exponentialRampToValueAtTime(o.ate, t + dur);
      envelope(g, t, o.vol || 0.3, o.ataque || 0.003, dur);
      s.connect(f).connect(g); saida(g, o);
      s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
    }

    // Voz: dente-de-serra passando por filtros nas frequências de uma
    // vogal (formantes) — "rá!" para atacar, "uh!" para apanhar.
    const VOGAL_A = [[760, 6, 1], [1180, 8, 0.6], [2600, 10, 0.18]];
    const VOGAL_U = [[340, 6, 1], [780, 8, 0.35], [2400, 10, 0.08]];
    let vozEm = 0;
    function voz(f0, dur, vogal, vol, cai) {
      if (!pronto()) return;
      const agora = performance.now();
      if (agora - vozEm < 160) return; // um grito de cada vez
      vozEm = agora;
      const t = ac.currentTime;
      const osc = ac.createOscillator(), g = ac.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f0 * (cai || 0.72), t + dur);
      const vib = ac.createOscillator(), vibG = ac.createGain();
      vib.frequency.value = 28; vibG.gain.value = f0 * 0.05;
      vib.connect(vibG).connect(osc.frequency);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.025);
      g.gain.setValueAtTime(vol, t + dur * 0.45);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      vogal.forEach(([fq, q, v]) => {
        const bp = ac.createBiquadFilter(), gv = ac.createGain();
        bp.type = 'bandpass'; bp.frequency.value = fq * (f0 < 110 ? 0.85 : 1); bp.Q.value = q; gv.gain.value = v * 3;
        osc.connect(bp).connect(gv).connect(g);
      });
      saida(g, { eco: true });
      osc.start(t); vib.start(t); osc.stop(t + dur + 0.03); vib.stop(t + dur + 0.03);
      ruido(0.07, { filtro: 'highpass', freq: 2200, vol: vol * 0.35 }); // o "h" do começo
    }

    // Narrador: voz do sistema (speechSynthesis), em português se houver.
    let vozNarrador = null;
    function escolherVoz() {
      try {
        const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
        vozNarrador = vs.find(v => /pt-BR/i.test(v.lang) && /male|masculin|daniel|antonio|ricardo/i.test(v.name))
          || vs.find(v => /pt-BR/i.test(v.lang)) || vs.find(v => /^pt/i.test(v.lang)) || null;
      } catch (e) {}
    }
    if (window.speechSynthesis) { escolherVoz(); try { speechSynthesis.onvoiceschanged = escolherVoz; } catch (e) {} }
    function narrar(frase, o = {}) {
      if (!pronto() || !window.speechSynthesis) return;
      try {
        const u = new SpeechSynthesisUtterance(frase);
        if (vozNarrador) u.voice = vozNarrador;
        u.lang = 'pt-BR'; u.rate = o.rate || 1; u.pitch = o.pitch || 0.4; u.volume = 1;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      } catch (e) {}
    }

    // ---------- Música: bateria + baixo + melodia em loop ----------
    // Cada faixa tem 32 semicolcheias (2 compassos). baixo/mel: 16 notas em
    // colcheias, em semitons acima da raiz (null = pausa).
    const FAIXAS = [
      { bpm: 128, raiz: 45, baixo: [0, 0, 12, 0, 0, 0, 10, 12, 5, 5, 17, 5, 7, 7, 19, 7], mel: [12, null, 15, 17, null, 19, 17, 15, 12, null, 10, null, 7, 10, 12, null], bumbo: [0, 6, 8, 16, 22, 24] },
      { bpm: 136, raiz: 43, baixo: [0, 12, 0, 12, 3, 15, 3, 15, 5, 17, 5, 17, 7, 19, 10, 22], mel: [19, 17, 15, null, 15, 17, 19, 22, 24, null, 22, 19, 17, null, 15, null], bumbo: [0, 8, 10, 16, 24, 26] },
      { bpm: 144, raiz: 40, baixo: [0, 0, 0, 12, 1, 1, 1, 13, 0, 0, 0, 12, 3, 3, 5, 7], mel: [12, 13, 12, null, 15, null, 13, 12, 10, null, 12, 13, 15, 17, 15, null], bumbo: [0, 4, 8, 12, 16, 20, 24, 28] },
      { bpm: 160, raiz: 38, baixo: [0, 0, 12, 0, 1, 1, 13, 1, 0, 0, 12, 0, 6, 6, 7, 7], mel: [24, null, 25, 24, 22, null, 19, 18, 19, null, 22, 24, 25, null, 30, 31], bumbo: [0, 3, 6, 8, 11, 14, 16, 19, 22, 24, 27, 30] },
    ];
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    let faixa = null, passoMus = 0, proxNota = 0, relogio = 0;
    function agendar() {
      if (!faixa || !pronto()) return;
      const semi = 60 / faixa.bpm / 4;
      if (proxNota < ac.currentTime) proxNota = ac.currentTime + 0.05;
      while (proxNota < ac.currentTime + 0.15) {
        const p = passoMus % 32, em = proxNota, M = { musica: true, em };
        if (faixa.bumbo.includes(p)) tom(140, 0.16, Object.assign({ ate: 42, vol: 0.55 }, M));
        if (p % 8 === 4) { ruido(0.14, Object.assign({ filtro: 'highpass', freq: 1600, vol: 0.22 }, M)); tom(190, 0.08, Object.assign({ tipo: 'triangle', vol: 0.1 }, M)); }
        if (p % 2 === 0) ruido(0.035, Object.assign({ filtro: 'highpass', freq: 7500, vol: p % 4 === 2 ? 0.07 : 0.04 }, M));
        if (p % 2 === 0) {
          const b = faixa.baixo[(p / 2) % 16];
          if (b !== null) tom(hz(faixa.raiz + b - 12), semi * 1.8, Object.assign({ tipo: 'sawtooth', corte: 520, vol: 0.2 }, M));
          const n = faixa.mel[(p / 2) % 16];
          if (n !== null) {
            tom(hz(faixa.raiz + n), semi * 1.7, Object.assign({ tipo: 'square', corte: 2600, vol: 0.05, eco: true }, M));
            tom(hz(faixa.raiz + n) * 1.005, semi * 1.7, Object.assign({ tipo: 'sawtooth', corte: 1800, vol: 0.03 }, M));
          }
        }
        passoMus++;
        proxNota += semi;
      }
    }

    return {
      destravar() { a(); if (!relogio) relogio = setInterval(agendar, 25); },
      ativo: () => !!(ac && ac.state === 'running'),
      ligado: () => ligado,
      alternar() {
        ligado = !ligado;
        if (!ligado && window.speechSynthesis) speechSynthesis.cancel();
        return ligado;
      },
      musica(n) { const nova = n === null || n === undefined ? null : FAIXAS[n]; if (nova !== faixa) { faixa = nova; passoMus = 0; proxNota = 0; } },
      narrar,
      vento() { ruido(0.14, { filtro: 'bandpass', freq: 500, ate: 2600, q: 1.2, vol: 0.18 }); },
      passo() { ruido(0.05, { freq: 380, vol: 0.12 }); },
      soco() {
        tom(170, 0.1, { ate: 55, vol: 0.7 });
        ruido(0.05, { filtro: 'bandpass', freq: 2600, q: 1.2, vol: 0.5 });
        ruido(0.12, { freq: 900, vol: 0.28, eco: true });
      },
      chute() {
        tom(125, 0.18, { ate: 38, vol: 0.85 });
        ruido(0.07, { filtro: 'bandpass', freq: 1700, q: 1, vol: 0.5 });
        ruido(0.22, { freq: 550, vol: 0.35, eco: true });
      },
      defesa() {
        tom(1650, 0.09, { tipo: 'square', vol: 0.05 });
        tom(2470, 0.12, { tipo: 'triangle', vol: 0.09, eco: true });
        ruido(0.06, { filtro: 'highpass', freq: 3800, vol: 0.18 });
        tom(150, 0.06, { ate: 80, vol: 0.3 });
      },
      queda() { tom(95, 0.3, { ate: 32, vol: 0.8, eco: true }); ruido(0.32, { freq: 320, vol: 0.45, eco: true }); },
      fogo() { ruido(0.55, { filtro: 'bandpass', freq: 350, ate: 3200, q: 2, vol: 0.4, eco: true }); tom(110, 0.45, { tipo: 'sawtooth', ate: 520, vol: 0.12, corte: 1400 }); },
      super() {
        tom(55, 1.0, { tipo: 'sawtooth', ate: 880, vol: 0.14, corte: 2200, eco: true });
        ruido(1.0, { filtro: 'bandpass', freq: 200, ate: 4500, q: 1.5, vol: 0.35 });
        tom(90, 0.8, { ate: 28, vol: 0.9, atraso: 0.55, eco: true });
        ruido(0.6, { freq: 700, vol: 0.5, atraso: 0.55, eco: true });
      },
      ko() { tom(110, 0.8, { ate: 28, vol: 0.95, eco: true }); ruido(0.7, { freq: 650, vol: 0.55, eco: true }); },
      menu() { tom(880, 0.08, { tipo: 'square', vol: 0.07 }); tom(1320, 0.12, { tipo: 'square', vol: 0.07, atraso: 0.07 }); },
      fase() { [523, 659, 784, 1047].forEach((f, i) => tom(f, 0.16, { tipo: 'square', vol: 0.08, atraso: i * 0.11, eco: true })); },
      // Gritos: f0 = tom da voz (Kaito ~170, inimigos ~125, chefe ~85).
      grito(f0, forte) { voz(f0 * rnd(0.95, 1.08), forte ? 0.32 : 0.2, VOGAL_A, forte ? 0.5 : 0.35, 0.75); },
      dor(f0, longo) { voz(f0 * rnd(0.92, 1.05), longo ? 0.6 : 0.24, VOGAL_U, longo ? 0.5 : 0.38, longo ? 0.5 : 0.65); },
    };
  })();

  // ---------- Entrada: teclado + celular ----------
  const Entrada = {
    tecla: {}, cel: { x: 0, y: 0, visto: 0 }, fila: [],
    get x() {
      const t = this.tecla;
      const k = (t.ArrowRight || t.KeyD ? 1 : 0) - (t.ArrowLeft || t.KeyA ? 1 : 0);
      return clamp(k + (performance.now() - this.cel.visto < 3500 ? this.cel.x : 0), -1, 1);
    },
    get y() {
      const t = this.tecla;
      const k = (t.ArrowDown || t.KeyS ? 1 : 0) - (t.ArrowUp || t.KeyW ? 1 : 0);
      return clamp(k + (performance.now() - this.cel.visto < 3500 ? this.cel.y : 0), -1, 1);
    },
    apertar(b) { Som.destravar(); this.fila.push({ b, t: J.tick }); },
    // Consome o primeiro botão da lista apertado nos últimos 8 quadros
    // (um "buffer": apertar um pouco antes da hora ainda vale).
    pegar(...bs) {
      const i = this.fila.findIndex(e => bs.includes(e.b) && e.t >= J.tick - 8);
      if (i < 0) return null;
      return this.fila.splice(i, 1)[0].b;
    },
    limpar() { this.fila = this.fila.filter(e => e.t >= J.tick - 8); },
  };
  const TECLAS = { KeyR: 'reiniciar', KeyZ: 'soco', KeyJ: 'soco', KeyX: 'chute', KeyK: 'chute', KeyC: 'esp', KeyL: 'esp', Space: 'pulo', Enter: 'start', KeyP: 'pausa', Escape: 'pausa' };

  // ---------- Personagens ----------
  const TIPOS = {
    jogador: { nome: 'KAITO', hp: 130, esc: 1, cores: { pele: '#e8b48a', roupa: '#2f5fd0', calca: '#2f5fd0', faixa: '#141414', cabelo: '#1c1410', bandana: '#d62839', luva: '#c1121f', pes: '#e8b48a', manga: 'curta', gola: true, calcaLarga: true, cabeloTipo: 'espetado' } },
    capanga: { nome: 'Capanga', hp: 28, vel: 1.7, alcance: 62, cd: [70, 120], bloq: 0, pontos: 100, golpes: ['eSoco'],
      cores: { pele: '#c68642', roupa: '#6b4f3a', calca: '#2b3a67', faixa: '#2a2a2a', cabelo: '#111111', luva: '#c68642', pes: '#1f1f1f', manga: 'longa', cabeloTipo: 'curto', barba: 'rgba(40,25,15,.45)' } },
    brigao: { nome: 'Brigão', hp: 42, vel: 2.0, alcance: 78, cd: [55, 95], bloq: 0.25, pontos: 150, golpes: ['eSoco', 'eChute'],
      cores: { pele: '#8d5524', roupa: '#2a9d8f', calca: '#333333', faixa: '#222222', cabelo: '#000000', bandana: '#f4a261', luva: '#f4a261', pes: '#222222', manga: 'nenhuma', cabeloTipo: 'curto' } },
    ninja: { nome: 'Ninja', hp: 32, vel: 3.0, alcance: 78, cd: [50, 90], bloq: 0.15, pontos: 200, golpes: ['eChute', 'eVoadora'], atira: true,
      cores: { pele: '#f1c27d', roupa: '#1b1b2f', calca: '#1b1b2f', faixa: '#7b2cbf', cabelo: '#1b1b2f', bandana: '#7b2cbf', luva: '#2a2a40', pes: '#111111', manga: 'longa', mascara: true } },
    brutamontes: { nome: 'Brutamontes', hp: 85, vel: 1.25, esc: 1.25, alcance: 74, cd: [70, 110], bloq: 0, pontos: 300, golpes: ['socoForte'], armadura: 2,
      cores: { pele: '#e0ac69', roupa: '#e76f51', calca: '#264653', faixa: '#1d3557', cabelo: '#e0ac69', luva: '#444444', pes: '#222222', manga: 'nenhuma', colete: true, barba: '#5a3b1e' } },
    chefe: { nome: 'IMPERADOR VULCANO', hp: 440, vel: 2.0, esc: 1.35, alcance: 82, cd: [38, 72], bloq: 0.35, pontos: 5000, chefe: true,
      cores: { pele: '#d9a066', roupa: '#7a0f1f', calca: '#2b0a10', faixa: '#e9b949', cabelo: '#ededed', luva: '#d9a066', capa: '#3d0a12', pes: '#2b1a0a', manga: 'longa', gola: true, calcaLarga: true, cabeloTipo: 'longo', barba: '#ededed', ouro: '#e9b949' } },
  };

  // Golpes: quadros de preparação (ini), ativos e de recuperação (rec);
  // alcance horizontal (alc) e faixa de altura (y0..y1, a partir dos pés).
  const GOLPES = {
    soco1: { ini: 3, ativo: 3, rec: 8, dano: 5, alc: 64, y0: 95, y1: 132, kb: 2.5, pose: 'soco', prox: 'soco2', som: 'soco' },
    soco2: { ini: 3, ativo: 3, rec: 9, dano: 6, alc: 64, y0: 95, y1: 132, kb: 2.5, pose: 'soco2', prox: 'soco3', som: 'soco' },
    soco3: { ini: 5, ativo: 4, rec: 16, dano: 10, alc: 66, y0: 90, y1: 155, kb: 6, derruba: true, pesado: true, pose: 'gancho', som: 'chute' },
    socoBaixo: { ini: 3, ativo: 3, rec: 8, dano: 4, alc: 62, y0: 55, y1: 90, kb: 2, pose: 'socoBaixo', som: 'soco' },
    chute: { ini: 6, ativo: 4, rec: 14, dano: 9, alc: 88, y0: 70, y1: 122, kb: 5.5, pose: 'chute', som: 'chute' },
    rasteira: { ini: 6, ativo: 5, rec: 16, dano: 7, alc: 92, y0: 0, y1: 30, kb: 4, derruba: true, baixo: true, pose: 'rasteira', som: 'chute' },
    voadora: { ini: 3, ativo: 14, rec: 0, dano: 10, alc: 72, y0: 15, y1: 85, kb: 5, derruba: true, aereo: true, pose: 'voadora', som: 'chute' },
    hadouken: { ini: 12, ativo: 1, rec: 22, pose: 'hadouken', disparo: { z: 105, vel: 8.5, raio: 18, dano: 14, kb: 6, tipo: 'fogo' } },
    super: { ini: 34, ativo: 1, rec: 30, pose: 'super', superGolpe: true },

    eSoco: { ini: 12, ativo: 4, rec: 18, dano: 6, alc: 62, y0: 95, y1: 132, kb: 3, pose: 'soco', som: 'soco' },
    eChute: { ini: 14, ativo: 5, rec: 20, dano: 9, alc: 84, y0: 70, y1: 122, kb: 5, pose: 'chute', som: 'chute' },
    eVoadora: { ini: 10, ativo: 30, rec: 0, dano: 10, alc: 70, y0: 15, y1: 85, kb: 5, derruba: true, aereo: true, salto: [10, 6], pose: 'voadora', som: 'chute' },
    shuriken: { ini: 16, ativo: 1, rec: 20, pose: 'arremesso', disparo: { z: 112, vel: 7, raio: 10, dano: 6, kb: 3, tipo: 'shuriken' } },
    socoForte: { ini: 20, ativo: 5, rec: 26, dano: 15, alc: 76, y0: 80, y1: 140, kb: 8, derruba: true, pesado: true, armado: true, pose: 'socoForte', som: 'chute' },

    bCombo: { ini: 10, ativo: 4, rec: 6, dano: 8, alc: 72, y0: 90, y1: 145, kb: 3, pose: 'soco', prox: 'bCombo2', sempre: true, som: 'soco' },
    bCombo2: { ini: 7, ativo: 5, rec: 24, dano: 11, alc: 82, y0: 85, y1: 160, kb: 8, derruba: true, pesado: true, pose: 'gancho', som: 'chute' },
    investida: { ini: 24, ativo: 28, rec: 24, dano: 16, alc: 64, y0: 40, y1: 150, kb: 9, derruba: true, pesado: true, armado: true, corre: 11, pose: 'investida', som: 'chute' },
    pisao: { ini: 14, ativo: 60, rec: 0, dano: 0, aereo: true, armado: true, pisao: true, pose: 'pisao' },
    pouso: { ini: 0, ativo: 0, rec: 28, armado: true, pose: 'agachado' },
    bolaFogo: { ini: 20, ativo: 1, rec: 26, pose: 'hadouken', disparo: { z: 70, vel: 7.5, raio: 24, dano: 14, kb: 7, tipo: 'bola', derruba: true } },
    bolaFogo3: { ini: 18, ativo: 33, rec: 22, pose: 'hadouken', rajada: [0, 16, 32], disparo: { z: 70, vel: 8, raio: 22, dano: 12, kb: 7, tipo: 'bola', derruba: true } },
  };
  Object.keys(GOLPES).forEach(k => { GOLPES[k].nome = k; });

  const FASES = [
    { nome: 'PORTO AO ENTARDECER', ondas: [['capanga', 'capanga'], ['capanga', 'capanga', 'capanga'], ['capanga', 'brigao', 'capanga', 'capanga']] },
    { nome: 'MERCADO NOTURNO', ondas: [['brigao', 'ninja'], ['capanga', 'capanga', 'ninja', 'brigao'], ['ninja', 'ninja', 'brigao', 'brigao', 'capanga']] },
    { nome: 'TELHADO DA TORRE', ondas: [['brutamontes', 'ninja', 'capanga'], ['brutamontes', 'brigao', 'ninja', 'ninja', 'brigao'], ['chefe']] },
  ];

  // ---------- Estado do jogo ----------
  const J = {
    tela: 'titulo', tick: 0, tt: 0, fase: 0, onda: 0, fila: [], inis: [], proj: [], parts: [], textos: [],
    jog: null, pontos: 0, pontosFase: 0, congelar: 0, tremor: 0, lento: 0, flash: 0, superT: 0,
    aviso: null, travado: 0, trans: 0, chefe: null, recorde: 0, seq: 0, raio: 0,
    mortes: 0, voltaFase1: false, confirma: -999,
  };
  try { J.recorde = Number(localStorage.getItem('luta_recorde')) || 0; } catch (e) {}

  function novoLutador(tipo, x, face) {
    const T = TIPOS[tipo];
    return {
      tipo, T, x, z: 0, vx: 0, vz: 0, face, hp: T.hp, hpVisto: T.hp, s: T.esc || 1,
      estado: 'parado', et: 0, atord: 0, golpe: null, gt: 0, acertou: new Set(), encadear: null,
      passo: 0, guarda: false, invul: 0, branco: 0, cd: T.cd ? rnd(T.cd[0], T.cd[1]) : 0,
      armadura: T.armadura || 0, semApanhar: 0, combo: 0, comboT: 0, en: 0, id: ++J.seq,
      entrando: false, engajado: false, slot: 0, guardaT: 0, decidiu: false, cimaAntes: false, puloGolpe: false,
    };
  }

  function novoJogo() {
    J.pontos = 0;
    J.mortes = 0;
    J.jog = novoLutador('jogador', 200, 1);
    comecarFase(0);
  }
  function comecarFase(n) {
    J.fase = n; J.onda = 0; J.inis = []; J.proj = []; J.parts = []; J.textos = []; J.chefe = null;
    J.pontosFase = J.pontos;
    const p = J.jog;
    Object.assign(p, { x: 200, z: 0, vx: 0, vz: 0, face: 1, estado: 'parado', golpe: null, invul: 0, combo: 0 });
    J.fila = FASES[n].ondas[0].slice();
    J.tela = 'jogo';
    J.travado = 150;
    J.aviso = { txt: `FASE ${n + 1}`, sub: FASES[n].nome, t: 150, lute: true };
    Som.fase();
    Som.musica(n);
    Som.narrar(`Fase ${n + 1}`);
  }
  function reiniciarFase() {
    const p = J.jog;
    p.hp = p.T.hp; p.hpVisto = p.hp; p.en = 0;
    J.pontos = J.pontosFase;
    comecarFase(J.fase);
  }

  // ---------- Combate ----------
  const livre = f => ['parado', 'andar', 'agachar', 'guarda'].includes(f.estado);
  const noChao = f => f.z <= 0 && f.vz <= 0;
  function altura(f) {
    if (f.estado === 'caido' || f.estado === 'ko') return 25;
    if (f.estado === 'agachar' || f.estado === 'levantar' || (f.golpe && (f.golpe.pose === 'rasteira' || f.golpe.pose === 'socoBaixo'))) return 88 * f.s;
    return 148 * f.s;
  }
  const intocavel = f => f.invul > 0 || ['caido', 'levantar', 'ko'].includes(f.estado);

  // Tom da voz de cada um (gritos sintetizados).
  const vozDe = f => f === J.jog ? 170 : f.T.chefe ? 82 : f.tipo === 'brutamontes' ? 98 : f.tipo === 'ninja' ? 150 : 125;
  const GRITA = { soco3: 1, chute: 0.5, rasteira: 0.7, voadora: 1, hadouken: 1, socoForte: 1, eVoadora: 1, investida: 1, pisao: 1, bCombo2: 1, bolaFogo: 1, bolaFogo3: 1, eChute: 0.4 };

  function iniciarGolpe(f, nome) {
    const g = GOLPES[nome];
    f.estado = 'golpe'; f.golpe = g; f.gt = 0; f.acertou = new Set(); f.encadear = null;
    if (!g.aereo) f.vx = 0;
    if (g.som || g.disparo) Som.vento();
    if (GRITA[nome] && Math.random() < GRITA[nome]) Som.grito(vozDe(f), nome === 'hadouken' || f.T.chefe);
    if (g.superGolpe) { J.superT = g.ini; f.invul = g.ini + g.rec + 10; Som.super(); }
  }

  function atualizarGolpe(f) {
    const g = f.golpe; f.gt++;
    const fimAtivo = g.ini + g.ativo;
    if (g.salto && f.gt === g.ini) { f.vz = g.salto[0]; f.z = 1; f.vx = f.face * g.salto[1]; }
    if (g.pisao && f.gt === g.ini) {
      // Salta para cair em cima de onde o jogador está agora.
      f.vz = 15; f.z = 1;
      f.vx = clamp((J.jog.x - f.x) / 40, -9, 9);
    }
    if (g.corre) {
      if (f.gt > g.ini && f.gt <= fimAtivo) {
        f.vx = f.face * g.corre;
        if (f.gt % 3 === 0) poeira(f.x - f.face * 20, CHAO, 1);
      } else if (f.gt > fimAtivo) f.vx *= 0.8;
    }
    if (g.disparo) {
      const momentos = g.rajada ? g.rajada.map(o => g.ini + 1 + o) : [g.ini + 1];
      momentos.forEach((m, i) => {
        if (f.gt !== m) return;
        const d = Object.assign({}, g.disparo);
        if (g.rajada && i % 2 === 1) d.z = 128;
        disparar(f, d);
      });
    }
    if (g.superGolpe && f.gt === g.ini + 1) soltarSuper(f);
    if (g.dano && f.gt > g.ini && f.gt <= fimAtivo) testarAcerto(f, g);
    if (f.encadear && f.gt >= fimAtivo && (g.sempre || f.acertou.size)) { iniciarGolpe(f, f.encadear); return; }
    if (g.sempre && g.prox && f.gt === fimAtivo) f.encadear = g.prox;
    if (!g.aereo && f.gt >= fimAtivo + g.rec) { f.estado = 'parado'; f.golpe = null; f.encadear = null; }
  }

  function alvosDe(f) { return f === J.jog ? J.inis : [J.jog]; }

  function testarAcerto(f, g) {
    for (const t of alvosDe(f)) {
      if (f.acertou.has(t.id) || intocavel(t)) continue;
      const dx = (t.x - f.x) * f.face, meia = 22 * t.s;
      if (dx < -meia || dx > g.alc * f.s + meia) continue;
      const lo = f.z + g.y0 * f.s, hi = f.z + g.y1 * f.s;
      if (hi < t.z || lo > t.z + altura(t)) continue;
      f.acertou.add(t.id);
      acertar(t, { x: f.x, ehJog: f === J.jog, g, altura: (lo + hi) / 2 });
    }
  }

  // fonte: { x, ehJog, g (dano, kb, derruba, baixo, pesado), altura }
  function acertar(alvo, fonte) {
    const g = fonte.g;
    const dir = Math.sign(alvo.x - fonte.x) || 1;
    const daFrente = (fonte.x - alvo.x) * alvo.face > 0;
    const jogDefende = alvo === J.jog && alvo.guarda && noChao(alvo) && ['parado', 'andar', 'agachar'].includes(alvo.estado)
      && (!g.baixo || alvo.estado === 'agachar');
    const iniDefende = alvo !== J.jog && alvo.estado === 'guarda' && !g.baixo;
    const yFx = CHAO - (fonte.altura || 100);
    if (daFrente && !g.ignoraDefesa && (jogDefende || iniDefende)) {
      const lasca = g.tipo ? 1 : 0;
      alvo.hp = Math.max(1, alvo.hp - lasca);
      alvo.vx = dir * 3.5;
      faiscas(alvo.x - dir * 16 * alvo.s, yFx, '#7dd3fc', 6);
      J.congelar = 3;
      Som.defesa();
      if (alvo === J.jog) J.jog.en = Math.min(100, J.jog.en + 2);
      return;
    }
    alvo.hp -= g.dano;
    if (alvo.hp > 0 && Math.random() < 0.55) Som.dor(vozDe(alvo));
    alvo.branco = 5;
    alvo.semApanhar = 0;
    faiscas(alvo.x - dir * 14 * alvo.s, yFx, g.pesado ? '#ffd166' : '#fff3b0', g.pesado ? 14 : 9);
    J.congelar = g.pesado ? 7 : 4;
    J.tremor = Math.max(J.tremor, g.pesado ? 7 : 3);
    (g.pesado ? Som.chute : Som.soco)();
    if (fonte.ehJog) {
      J.jog.en = Math.min(100, J.jog.en + 5);
      J.pontos += g.dano * 10;
      J.jog.combo++; J.jog.comboT = 70;
    } else if (alvo === J.jog) {
      J.jog.en = Math.min(100, J.jog.en + 3);
      J.jog.combo = 0;
      Rede.vibrar(g.pesado ? 160 : 70);
    }
    if (alvo.hp <= 0) { nocaute(alvo, dir); return; }
    // Armadura: o Brutamontes aguenta 2 golpes sem se abalar; o chefe não
    // para no meio da investida nem do pisão.
    const armado = (alvo.golpe && alvo.golpe.armado && alvo.estado === 'golpe') || (alvo.armadura > 0 && !g.derruba);
    if (armado) {
      if (alvo.armadura > 0 && !(alvo.golpe && alvo.golpe.armado)) alvo.armadura--;
      return;
    }
    if (g.derruba || !noChao(alvo)) { derrubar(alvo, dir, g.kb); return; }
    alvo.estado = 'dor'; alvo.et = 0; alvo.atord = g.pesado ? 22 : 16;
    alvo.golpe = null; alvo.vx = dir * g.kb;
  }

  function derrubar(f, dir, kb) {
    f.estado = 'caido'; f.et = 0; f.golpe = null;
    f.vz = 7; f.z = Math.max(f.z, 1); f.vx = dir * Math.max(kb, 4);
  }

  function nocaute(f, dir) {
    f.hp = 0;
    f.estado = 'ko'; f.et = 0; f.golpe = null;
    f.vz = 9; f.z = Math.max(f.z, 1); f.vx = dir * 6.5;
    J.congelar = 10; J.tremor = 10;
    Som.ko();
    Som.dor(vozDe(f), true);
    if (f === J.jog) { J.lento = 50; Rede.vibrar(400); Som.narrar('K.O.!', { rate: 0.8 }); return; }
    J.pontos += f.T.pontos;
    texto(f.x, CHAO - 160 * f.s, `+${f.T.pontos}`, '#ffd166', 26);
    if (f.T.chefe) { J.lento = 120; J.flash = 1; Som.musica(null); Som.narrar('K.O.!', { rate: 0.8 }); }
  }

  function disparar(f, d) {
    J.proj.push({
      x: f.x + f.face * 50 * f.s, z: d.z * (f.T.chefe ? 1 : f.s), vx: f.face * d.vel, raio: d.raio, dano: d.dano, kb: d.kb,
      tipo: d.tipo, derruba: !!d.derruba, ehJog: f === J.jog, vida: d.vida || 170, t: 0,
    });
    if (d.tipo !== 'shuriken') Som.fogo(); else Som.vento();
  }

  function soltarSuper(f) {
    J.flash = 1; J.tremor = 16; J.congelar = 8;
    J.inis.forEach(e => {
      if (intocavel(e) || e.entrando) return;
      acertar(e, { x: f.x, ehJog: true, altura: 110, g: { dano: e.T.chefe ? 48 : 34, kb: 8, derruba: true, pesado: true, ignoraDefesa: true } });
      for (let i = 0; i < 18; i++) J.parts.push({ x: e.x, y: CHAO - 80 * e.s, vx: rnd(-7, 7), vy: rnd(-9, 3), vida: 40, cor: i % 2 ? '#7dd3fc' : '#fff', tam: rnd(3, 7) });
    });
  }

  function especial(p) {
    if (p.en >= 100) { p.en = 0; iniciarGolpe(p, 'super'); texto(p.x, CHAO - 190, 'TEMPESTADE DO DRAGÃO!', '#7dd3fc', 30); Som.narrar('Tempestade do Dragão!', { rate: 1.15, pitch: 0.7 }); return; }
    if (p.en >= 25) { p.en -= 25; iniciarGolpe(p, 'hadouken'); return; }
    texto(p.x, CHAO - 170, 'Sem energia!', '#9aa6ba', 18);
  }

  // ---------- Física comum ----------
  function atualizarCorpo(f) {
    if (f.invul > 0) f.invul--;
    if (f.branco > 0) f.branco--;
    if (f.armadura < (f.T.armadura || 0) && ++f.semApanhar > 120) f.armadura = f.T.armadura;
    if (f.z > 0 || f.vz > 0) {
      f.vz -= GRAV; f.z += f.vz;
      if (f.z <= 0) { f.z = 0; f.vz = 0; aterrissar(f); }
    }
    f.x += f.vx;
    switch (f.estado) {
      case 'dor': f.vx *= 0.8; if (++f.et >= f.atord) f.estado = 'parado'; break;
      case 'caido': if (noChao(f)) { f.vx *= 0.75; if (++f.et >= 45) { f.estado = 'levantar'; f.et = 0; } } break;
      case 'levantar': f.vx = 0; if (++f.et >= 18) { f.estado = 'parado'; f.invul = f === J.jog ? 45 : 10; } break;
      case 'ko': if (noChao(f)) { f.vx *= 0.8; f.et++; } break;
      case 'golpe': atualizarGolpe(f); break;
    }
  }

  function aterrissar(f) {
    if (f.estado === 'pulo') { f.estado = 'parado'; f.vx = 0; poeira(f.x, CHAO, 3); return; }
    if (f.estado === 'golpe' && f.golpe && f.golpe.aereo) {
      if (f.golpe.pisao) impactoPisao(f);
      else { f.estado = 'parado'; f.golpe = null; f.vx = 0; }
      return;
    }
    if (f.estado === 'caido' || f.estado === 'ko') { f.et = 0; poeira(f.x, CHAO, 8); Som.queda(); J.tremor = Math.max(J.tremor, 3); }
  }

  function impactoPisao(f) {
    f.vx = 0;
    J.tremor = 14;
    poeira(f.x, CHAO, 16);
    Som.queda(); Som.chute();
    const p = J.jog;
    if (!intocavel(p) && Math.abs(p.x - f.x) < 75 && p.z < 40) {
      acertar(p, { x: f.x, ehJog: false, altura: 60, g: { dano: 18, kb: 8, derruba: true, pesado: true } });
    }
    [-1, 1].forEach(d => J.proj.push({ x: f.x + d * 40, z: 12, vx: d * 7, raio: 16, dano: 12, kb: 6, tipo: 'onda', derruba: true, ehJog: false, vida: 80, t: 0 }));
    iniciarGolpe(f, 'pouso');
  }

  // ---------- Jogador ----------
  function maisProximo(p) {
    let melhor = null, dm = Infinity;
    J.inis.forEach(e => {
      if (e.estado === 'ko') return;
      const d = Math.abs(e.x - p.x);
      if (d < dm) { dm = d; melhor = e; }
    });
    return melhor;
  }

  function atualizarJogador() {
    const p = J.jog;
    if (p.comboT > 0 && --p.comboT === 0) p.combo = 0;
    const dx = Entrada.x, dy = Entrada.y;
    const cima = dy < -0.5, puloBorda = cima && !p.cimaAntes;
    p.cimaAntes = cima;
    atualizarCorpo(p);
    p.x = clamp(p.x, 30, W - 30);
    if (p.estado === 'golpe' && p.golpe.prox && !p.golpe.sempre && Entrada.pegar('soco')) p.encadear = p.golpe.prox;
    if (J.travado > 0) { if (livre(p)) { p.estado = 'parado'; p.vx = 0; } return; }
    if (p.estado === 'pulo') {
      if (!p.puloGolpe && Entrada.pegar('soco', 'chute')) { p.puloGolpe = true; iniciarGolpe(p, 'voadora'); }
      return;
    }
    if (!livre(p) || !noChao(p)) return;
    const alvo = maisProximo(p);
    if (alvo) p.face = alvo.x >= p.x ? 1 : -1;
    else if (Math.abs(dx) > 0.2) p.face = Math.sign(dx);
    p.guarda = dx * p.face < -0.3;
    const b = Entrada.pegar('soco', 'chute', 'esp', 'pulo');
    if (b === 'pulo' || puloBorda) {
      p.estado = 'pulo'; p.vz = 13.5; p.z = 1; p.vx = dx * 3.8; p.puloGolpe = false; Som.vento(); return;
    }
    if (b === 'esp') { especial(p); return; }
    if (b === 'soco') { iniciarGolpe(p, dy > 0.5 ? 'socoBaixo' : 'soco1'); return; }
    if (b === 'chute') { iniciarGolpe(p, dy > 0.5 ? 'rasteira' : 'chute'); return; }
    if (dy > 0.5) { p.estado = 'agachar'; p.vx = 0; return; }
    if (Math.abs(dx) > 0.2) {
      p.estado = 'andar';
      p.vx = dx * (p.guarda ? 2.3 : 3.5);
      const antes = Math.floor(p.passo / Math.PI);
      p.passo += Math.abs(p.vx) * 0.09;
      if (Math.floor(p.passo / Math.PI) !== antes) Som.passo();
    } else { p.estado = 'parado'; p.vx = 0; }
  }

  // ---------- Inimigos ----------
  function engajar() {
    const p = J.jog;
    const vivos = J.inis.filter(e => e.estado !== 'ko' && !e.entrando)
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x));
    const limite = J.chefe && J.chefe.estado !== 'ko' ? 1 : 2;
    let n = 0, slot = 0;
    vivos.forEach(e => {
      if (e.T.chefe) { e.engajado = true; return; }
      if (n < limite) { e.engajado = true; n++; } else { e.engajado = false; e.slot = slot++; }
    });
  }

  function surgir(tipo) {
    const lado = J.tick % 2 ? -1 : 1;
    const e = novoLutador(tipo, lado < 0 ? -60 : W + 60, -lado);
    e.entrando = true;
    J.inis.push(e);
    if (e.T.chefe) {
      J.chefe = e;
      e.x = W + 80; e.face = -1; e.cd = 150;
      J.aviso = { txt: 'CHEFÃO', sub: e.T.nome, t: 170, chefe: true };
      Som.fase();
      Som.musica(3);
      Som.narrar('Chefão! Imperador Vulcano!', { rate: 0.9 });
    }
  }

  function andarAte(e, alvoX, vel) {
    const diff = alvoX - e.x;
    if (Math.abs(diff) > 10) {
      e.estado = 'andar';
      const v = vel * (Math.sign(diff) === e.face ? 1 : 0.7);
      e.vx = Math.sign(diff) * v;
      e.passo += v * 0.09;
    } else { e.estado = 'parado'; e.vx = 0; }
  }

  function atualizarInimigo(e) {
    atualizarCorpo(e);
    const p = J.jog;
    if (e.estado === 'ko') return;
    if (e.entrando) {
      e.face = e.x < W / 2 ? 1 : -1;
      e.estado = 'andar'; e.vx = e.face * e.T.vel * 1.3; e.passo += 0.2;
      if (e.x > 40 && e.x < W - 40) e.entrando = false;
      return;
    }
    e.x = clamp(e.x, 20, W - 20);
    if (e.cd > 0) e.cd--;
    if (e.estado === 'guarda') { if (--e.guardaT <= 0) e.estado = 'parado'; return; }
    if (!livre(e) || !noChao(e)) return;
    const dx = p.x - e.x, dist = Math.abs(dx);
    e.face = dx >= 0 ? 1 : -1;
    if (p.estado === 'ko') { e.estado = 'parado'; e.vx = 0; return; }
    // Defesa: decide uma vez por golpe do jogador se vai se defender.
    if (p.estado === 'golpe' && dist < 150) {
      if (!e.decidiu) {
        e.decidiu = true;
        if (Math.random() < e.T.bloq) { e.estado = 'guarda'; e.guardaT = 24; e.vx = 0; return; }
      }
    } else e.decidiu = false;

    if (e.T.chefe) { iaChefe(e, dist); return; }

    const alc = e.T.alcance * e.s;
    const pAlvo = !intocavel(p);
    if (e.T.atira && e.cd <= 0 && dist > 220 && Math.random() < 0.02) {
      iniciarGolpe(e, 'shuriken'); e.cd = rnd(e.T.cd[0], e.T.cd[1]); return;
    }
    if (e.engajado && e.cd <= 0 && pAlvo) {
      if (dist <= alc + 12) {
        const g = e.T.golpes.filter(n => n !== 'eVoadora');
        iniciarGolpe(e, g[Math.floor(Math.random() * g.length)]);
        e.cd = rnd(e.T.cd[0], e.T.cd[1]);
        return;
      }
      if (e.T.golpes.includes('eVoadora') && dist > 130 && dist < 230 && Math.random() < 0.03) {
        iniciarGolpe(e, 'eVoadora'); e.cd = rnd(e.T.cd[0], e.T.cd[1]); return;
      }
    }
    const lado = e.x < p.x ? -1 : 1;
    const d = e.engajado ? alc * 0.8 : 220 + e.slot * 55;
    andarAte(e, clamp(p.x + lado * d, 30, W - 30), e.T.vel);
  }

  function iaChefe(e, dist) {
    const T = e.T;
    if (!e.invocou && e.hp < T.hp * 0.55) {
      e.invocou = true;
      J.fila.push('ninja', 'ninja');
      texto(e.x, CHAO - 210, 'Guardas, ataquem!', '#ff8fa3', 22);
    }
    if (!e.furia && e.hp < T.hp * 0.35) {
      e.furia = true;
      texto(e.x, CHAO - 230, 'FÚRIA!', '#ff3b3b', 34);
      J.tremor = 10; Som.super();
    }
    const vel = T.vel * (e.furia ? 1.3 : 1);
    if (e.cd <= 0 && !intocavel(J.jog)) {
      const r = Math.random();
      let g;
      if (dist < 120) g = r < 0.55 ? 'bCombo' : r < 0.8 ? 'pisao' : 'investida';
      else if (dist < 320) g = r < 0.4 ? 'investida' : r < 0.7 ? 'pisao' : 'bolaFogo';
      else g = r < 0.5 ? 'bolaFogo' : r < 0.8 ? 'investida' : 'pisao';
      if (g === 'bolaFogo' && e.furia) g = 'bolaFogo3';
      iniciarGolpe(e, g);
      e.cd = rnd(T.cd[0], T.cd[1]) * (e.furia ? 0.6 : 1);
      return;
    }
    const lado = e.x < J.jog.x ? -1 : 1;
    andarAte(e, clamp(J.jog.x + lado * 95, 40, W - 40), vel);
  }

  // Corpos não se atravessam (empurrão suave).
  function empurrar() {
    const todos = [J.jog, ...J.inis].filter(f => noChao(f) && !['caido', 'ko', 'levantar'].includes(f.estado) && !f.entrando);
    for (let i = 0; i < todos.length; i++) {
      for (let k = i + 1; k < todos.length; k++) {
        const a = todos[i], b = todos[k];
        const min = 22 * a.s + 22 * b.s, d = b.x - a.x;
        if (Math.abs(d) >= min) continue;
        const sobra = (min - Math.abs(d)) / 2, s = Math.sign(d) || 1;
        if (b.T.chefe && a === J.jog) { a.x -= s * sobra * 2; continue; }
        if (a.T.chefe && b === J.jog) { b.x += s * sobra * 2; continue; }
        a.x -= s * sobra; b.x += s * sobra;
      }
    }
    J.jog.x = clamp(J.jog.x, 30, W - 30);
  }

  // ---------- Projéteis e efeitos ----------
  function atualizarProjeteis() {
    J.proj.forEach(pr => {
      pr.x += pr.vx; pr.t++; pr.vida--;
      if (pr.tipo === 'fogo' || pr.tipo === 'bola') {
        J.parts.push({ x: pr.x - Math.sign(pr.vx) * pr.raio, y: CHAO - pr.z + rnd(-6, 6), vx: -pr.vx * 0.2, vy: rnd(-1, 1), vida: 14, cor: pr.tipo === 'fogo' ? '#7dd3fc' : '#ff7b3b', tam: rnd(3, 6) });
      }
      const alvos = pr.ehJog ? J.inis : [J.jog];
      for (const t of alvos) {
        if (pr.vida <= 0 || intocavel(t) || t.entrando) continue;
        if (Math.abs(t.x - pr.x) > 22 * t.s + pr.raio) continue;
        if (pr.z + pr.raio < t.z || pr.z - pr.raio > t.z + altura(t)) continue;
        acertar(t, { x: pr.x - pr.vx, ehJog: pr.ehJog, altura: pr.z, g: { dano: pr.dano, kb: pr.kb, derruba: pr.derruba, tipo: pr.tipo, pesado: pr.tipo !== 'shuriken' } });
        pr.vida = 0;
      }
    });
    // Bola de energia do jogador anula a do inimigo.
    J.proj.forEach(a => J.proj.forEach(b => {
      if (a.vida > 0 && b.vida > 0 && a.ehJog && !b.ehJog && b.tipo !== 'onda' && Math.abs(a.x - b.x) < a.raio + b.raio && Math.abs(a.z - b.z) < a.raio + b.raio) {
        a.vida = 0; b.vida = 0; faiscas(a.x, CHAO - a.z, '#fff', 14); Som.defesa();
      }
    }));
    J.proj = J.proj.filter(pr => pr.vida > 0 && pr.x > -80 && pr.x < W + 80);
  }

  function faiscas(x, y, cor, n) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), v = rnd(2, 7);
      J.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: rnd(10, 20), cor, tam: rnd(2, 5), risco: true });
    }
  }
  function poeira(x, y, n) {
    for (let i = 0; i < n; i++) J.parts.push({ x: x + rnd(-20, 20), y: y - rnd(0, 6), vx: rnd(-2, 2), vy: rnd(-1.5, -0.3), vida: rnd(18, 30), cor: 'rgba(200,190,170,.7)', tam: rnd(4, 9), fumaca: true });
  }
  function texto(x, y, txt, cor, tam) { J.textos.push({ x, y, txt, cor, tam: tam || 22, vida: 70 }); }

  function atualizarEfeitos() {
    J.parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += p.fumaca ? -0.02 : 0.25; p.vx *= 0.95; p.vida--; });
    J.parts = J.parts.filter(p => p.vida > 0);
    J.textos.forEach(t => { t.y -= 0.7; t.vida--; });
    J.textos = J.textos.filter(t => t.vida > 0);
    if (J.tremor > 0.3) J.tremor *= 0.85; else J.tremor = 0;
    if (J.flash > 0) J.flash = Math.max(0, J.flash - 0.05);
    if (J.superT > 0) J.superT--;
    if (J.aviso && J.aviso.lute && J.aviso.t === 50) Som.narrar('Lute!', { rate: 1.1 });
    if (J.aviso && --J.aviso.t <= 0) J.aviso = null;
    [J.jog, ...J.inis].forEach(f => { if (f) f.hpVisto += (f.hp - f.hpVisto) * 0.06; });
  }

  // ---------- Passo do jogo (60 por segundo) ----------
  // Reiniciar (tecla R ou botão ↺ do celular): pede confirmação — apertar
  // de novo em até 3 s volta para a tela inicial, pronta para outro aluno.
  function voltarAoTitulo() {
    J.tela = 'titulo'; J.confirma = -999; J.mortes = 0; J.voltaFase1 = false;
    J.inis = []; J.proj = []; J.chefe = null;
    Som.musica(null);
    Som.menu();
  }

  function passo() {
    J.tick++;
    Rede.enviarEstado(false);
    if (Entrada.pegar('reiniciar') && J.tela !== 'titulo') {
      if (J.tick - J.confirma < 180) voltarAoTitulo();
      else { J.confirma = J.tick; Som.menu(); }
    }
    switch (J.tela) {
      case 'titulo':
        if (Entrada.pegar('soco', 'start', 'chute', 'esp')) { Som.menu(); novoJogo(); }
        break;
      case 'pausa':
        if (Entrada.pegar('pausa', 'start')) J.tela = 'jogo';
        break;
      case 'derrota':
        atualizarEfeitos();
        // 2ª derrota seguida: volta sozinho para a fase 1.
        if (J.voltaFase1) { if (--J.tt <= 0) { J.voltaFase1 = false; novoJogo(); } break; }
        if (--J.tt <= 0) voltarAoTitulo();
        else if (J.tt < 560 && Entrada.pegar('soco', 'start')) { Som.menu(); reiniciarFase(); }
        break;
      case 'vitoria':
        atualizarEfeitos();
        if (J.tt > 0) J.tt--;
        else if (Entrada.pegar('soco', 'start')) voltarAoTitulo();
        if (J.tick % 20 === 0) faiscas(rnd(100, W - 100), rnd(80, 260), ['#ffd166', '#7dd3fc', '#ff8fa3'][J.tick % 3], 16);
        break;
      default: atualizarJogo();
    }
    Entrada.limpar();
  }

  function atualizarJogo() {
    if (Entrada.pegar('pausa')) { J.tela = 'pausa'; return; }
    if (J.congelar > 0) { J.congelar--; atualizarEfeitos(); return; }
    // Super: o tempo para (só o Kaito carrega o golpe).
    if (J.superT > 0) { atualizarEfeitos(); if (J.jog.estado === 'golpe') atualizarGolpe(J.jog); return; }
    if (J.lento > 0) { J.lento--; if (J.tick % 3) { atualizarEfeitos(); return; } }
    if (J.travado > 0) J.travado--;

    // Surgem até 3 inimigos de cada vez (na luta do chefe, só os guardas).
    const vivos = J.inis.filter(e => e.estado !== 'ko').length;
    if (J.fila.length && vivos < 3 && J.travado < 60 && J.tick % 40 === 0) surgir(J.fila.shift());

    engajar();
    atualizarJogador();
    J.inis.forEach(atualizarInimigo);
    atualizarProjeteis();
    empurrar();
    atualizarEfeitos();
    J.inis = J.inis.filter(e => !(e.estado === 'ko' && e.et > 60));

    const p = J.jog;
    if (p.estado === 'ko' && p.et > 70) {
      J.tela = 'derrota';
      J.mortes++;
      Som.musica(null);
      if (J.mortes >= 2) {
        J.voltaFase1 = true; J.tt = 300;
        Som.narrar('Duas derrotas seguidas. De volta à fase um.');
      } else J.tt = 600;
      return;
    }
    if (p.estado === 'ko') return;

    if (J.trans > 0) {
      if (--J.trans === 0) {
        if (J.fase < FASES.length - 1) {
          p.hp = Math.min(p.T.hp, p.hp + 45);
          comecarFase(J.fase + 1);
        } else vencer();
      }
      return;
    }
    if (!J.fila.length && !J.inis.length) {
      const ondas = FASES[J.fase].ondas;
      if (J.onda < ondas.length - 1) {
        J.onda++;
        J.fila = ondas[J.onda].slice();
        J.aviso = { txt: `ONDA ${J.onda + 1}`, t: 80 };
      } else if (J.fase < FASES.length - 1) {
        J.trans = 170;
        J.pontos += p.hp * 10;
        J.aviso = { txt: 'FASE CONCLUÍDA!', sub: `Bônus de vida: ${p.hp * 10} · +45 de vida`, t: 170 };
        p.estado = 'vitoria'; p.vx = 0;
        J.mortes = 0;
        Som.fase();
        Som.narrar('Fase concluída!');
      } else {
        J.trans = 160;
        J.aviso = { txt: 'K.O.!', sub: 'O Imperador caiu!', t: 160 };
        p.estado = 'vitoria'; p.vx = 0;
      }
    }
  }

  function vencer() {
    J.pontos += J.jog.hp * 20;
    J.tela = 'vitoria'; J.tt = 120;
    if (J.pontos > J.recorde) { J.recorde = J.pontos; J.novoRecorde = true; try { localStorage.setItem('luta_recorde', String(J.recorde)); } catch (e) {} }
    else J.novoRecorde = false;
    Som.fase();
    Som.narrar('Você venceu!');
  }

  // ---------- Desenho dos lutadores ----------
  const POSES = {
    soco: (f, P) => { if (f === 'prep') P.bF = [60, 95]; else { P.bF = [90, -2]; P.bT = [-20, 120]; P.lean = 8; P.pF = [26, -24]; P.pT = [-30, -8]; } },
    soco2: (f, P) => { if (f === 'prep') P.bT = [40, 100]; else { P.bT = [92, -2]; P.bF = [50, 110]; P.lean = 12; P.pF = [26, -24]; P.pT = [-30, -8]; } },
    gancho: (f, P) => { if (f === 'prep') { P.bF = [25, 50]; P.lean = 12; P.pF = [40, -60]; P.pT = [-20, -60]; } else { P.bF = [165, -8]; P.lean = -8; P.pF = [12, -6]; P.pT = [-16, -4]; } },
    socoBaixo: (f, P) => { Object.assign(P, AGACHADO()); if (f !== 'prep') P.bF = [80, 0]; },
    chute: (f, P) => { P.bF = [70, 120]; P.bT = [55, 125]; if (f === 'prep') P.pF = [62, -95]; else { P.pF = [98, -4]; P.pT = [-12, -6]; P.lean = -18; } },
    rasteira: (f, P) => { Object.assign(P, AGACHADO()); P.lean = 22; P.pF = f === 'prep' ? [70, -100] : [55, 38]; },
    voadora: (f, P) => { P.pF = [100, -8]; P.pT = [35, -115]; P.lean = -18; P.bF = [80, 110]; P.bT = [-30, 90]; },
    hadouken: (f, P) => { P.pF = [35, -25]; P.pT = [-35, -5]; if (f === 'prep') { P.bF = [-30, 120]; P.bT = [-40, 120]; P.lean = -10; } else { P.bF = [90, 0]; P.bT = [86, 6]; P.lean = 12; } },
    super: (f, P) => { P.pF = [35, -25]; P.pT = [-35, -5]; if (f === 'prep') { P.bF = [172, 0]; P.bT = [160, 0]; P.lean = -6; } else { P.bF = [90, 0]; P.bT = [86, 6]; P.lean = 14; } },
    arremesso: (f, P) => { if (f === 'prep') { P.bF = [-60, 120]; P.lean = -8; } else { P.bF = [100, 10]; P.lean = 10; } },
    socoForte: (f, P) => { if (f === 'prep') { P.bF = [-50, 100]; P.lean = -12; } else { P.bF = [92, 0]; P.lean = 18; P.pF = [30, -20]; P.pT = [-32, -6]; } },
    investida: (f, P, l) => {
      if (f === 'prep') { Object.assign(P, AGACHADO()); P.bF = [-20, 90]; P.lean = 25; return; }
      const ph = J.tick * 0.5;
      P.lean = 25; P.bF = [95, 0]; P.bT = [-40, 60];
      P.pF = [20 + 30 * Math.sin(ph), -30 - 30 * Math.max(0, Math.cos(ph))]; P.pT = [20 - 30 * Math.sin(ph), -30 - 30 * Math.max(0, -Math.cos(ph))];
    },
    pisao: (f, P, l) => { if (f === 'prep' || noChao(l)) Object.assign(P, AGACHADO()); else { P.pF = [60, -110]; P.pT = [30, -120]; P.bF = [160, 10]; P.bT = [150, 20]; } },
    agachado: (f, P) => Object.assign(P, AGACHADO()),
  };
  function AGACHADO() { return { pF: [75, -115], pT: [-8, -122], lean: 10, bF: [55, 115], bT: [40, 120] }; }

  function poseDe(f) {
    const P = { lean: 0, cab: 0, bF: [40, 112], bT: [22, 125], pF: [18, -28], pT: [-22, -12] };
    const b = Math.sin(J.tick * 0.1 + f.id) * 3;
    switch (f.estado) {
      case 'parado':
        P.bF = [40 + b, 112]; P.bT = [22 + b, 125]; P.pF = [18, -28 + b]; P.pT = [-22, -12 + b];
        if (f.guarda) { P.bF = [72, 125]; P.bT = [62, 130]; P.lean = -6; }
        break;
      case 'andar': {
        const ph = f.passo;
        P.pF = [8 + 26 * Math.sin(ph), -18 - 30 * Math.max(0, Math.cos(ph))];
        P.pT = [8 - 26 * Math.sin(ph), -18 - 30 * Math.max(0, -Math.cos(ph))];
        P.bF = [40 + 8 * Math.sin(ph), 112]; P.lean = 5;
        if (f.guarda) { P.bF = [72, 125]; P.bT = [62, 130]; P.lean = -6; }
        break;
      }
      case 'guarda': P.bF = [75, 125]; P.bT = [65, 130]; P.lean = -8; P.pF = [22, -30]; P.pT = [-28, -10]; break;
      case 'agachar': Object.assign(P, AGACHADO()); if (f.guarda) { P.bF = [80, 125]; P.bT = [70, 130]; P.lean = -4; } break;
      case 'levantar': Object.assign(P, AGACHADO()); break;
      case 'pulo': P.pF = [60, -105]; P.pT = [20, -115]; P.bF = [60, 110]; P.bT = [40, 120]; break;
      case 'dor': P.lean = -22; P.cab = -15; P.bF = [30, 50]; P.bT = [-25, 40]; P.pF = [14, -12]; P.pT = [-28, -8]; break;
      case 'caido': case 'ko': P.bF = [160, 10]; P.bT = [150, 20]; P.pF = [4, 0]; P.pT = [-4, 0]; P.cab = -10; break;
      case 'vitoria': P.bF = [178, -5]; P.bT = [25, 125]; P.lean = -4; break;
      case 'golpe': {
        const g = f.golpe;
        if (!g) break;
        const fase = f.gt <= g.ini ? 'prep' : f.gt <= g.ini + g.ativo ? 'ativo' : 'rec';
        POSES[g.pose](fase, P, f);
        break;
      }
    }
    return P;
  }

  // Movimento suave: a pose desenhada persegue a pose-alvo em vez de pular
  // direto para ela (golpe e dor perseguem mais rápido).
  function suavizar(f, P) {
    if (!f.pv) { f.pv = { lean: P.lean, cab: P.cab, bF: P.bF.slice(), bT: P.bT.slice(), pF: P.pF.slice(), pT: P.pT.slice() }; return f.pv; }
    const k = f.estado === 'golpe' || f.estado === 'dor' ? 0.6 : 0.3, v = f.pv;
    v.lean += (P.lean - v.lean) * k; v.cab += (P.cab - v.cab) * k;
    ['bF', 'bT', 'pF', 'pT'].forEach(n => { v[n][0] += (P[n][0] - v[n][0]) * k; v[n][1] += (P[n][1] - v[n][1]) * k; });
    return v;
  }

  const CONTORNO = '#15100d';
  function escurecer(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${Math.round(((n >> 16) & 255) * k)},${Math.round(((n >> 8) & 255) * k)},${Math.round((n & 255) * k)})`;
  }
  // Cápsula afunilada de a (raio ra) até b (raio rb); entra no caminho atual.
  function capsula(a, b, ra, rb) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001, nx = -dy / d, ny = dx / d;
    ctx.moveTo(a.x + nx * ra, a.y + ny * ra); ctx.lineTo(b.x + nx * rb, b.y + ny * rb);
    ctx.lineTo(b.x - nx * rb, b.y - ny * rb); ctx.lineTo(a.x - nx * ra, a.y - ny * ra); ctx.closePath();
    ctx.moveTo(a.x + ra, a.y); ctx.arc(a.x, a.y, ra, 0, Math.PI * 2);
    ctx.moveTo(b.x + rb, b.y); ctx.arc(b.x, b.y, rb, 0, Math.PI * 2);
  }
  // Parte do corpo: contorno escuro, cor, sombra embaixo/direita e brilho
  // em cima/esquerda (luz vindo de cima).
  function parte(a, b, ra, rb, cor, s) {
    const o = 1.8 * s;
    ctx.fillStyle = CONTORNO; ctx.beginPath(); capsula(a, b, ra + o, rb + o); ctx.fill();
    ctx.fillStyle = cor; ctx.beginPath(); capsula(a, b, ra, rb); ctx.fill();
    ctx.save();
    ctx.beginPath(); capsula(a, b, ra, rb); ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,.24)';
    ctx.beginPath(); capsula({ x: a.x + ra * 0.6, y: a.y + ra * 0.6 }, { x: b.x + rb * 0.6, y: b.y + rb * 0.6 }, ra, rb); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.17)';
    ctx.beginPath(); capsula({ x: a.x - ra * 0.45, y: a.y - ra * 0.45 }, { x: b.x - rb * 0.45, y: b.y - rb * 0.45 }, ra * 0.35, rb * 0.35); ctx.fill();
    ctx.restore();
  }
  function circulo(p, r, cor, s) {
    ctx.fillStyle = CONTORNO; ctx.beginPath(); ctx.arc(p.x, p.y, r + 1.8 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc(p.x - r * 0.35, p.y - r * 0.35, r * 0.4, 0, Math.PI * 2); ctx.fill();
  }

  function desenharLutador(f) {
    const s = f.s, fc = f.face, P = suavizar(f, poseDe(f));
    let c = f.T.cores;
    if (f.branco > 0) c = Object.assign({}, c, { pele: '#ffffff', roupa: '#ffffff', calca: '#ffffff', faixa: '#ffffff', cabelo: '#ffffff', bandana: '#ffffff', luva: '#ffffff', capa: '#ffffff', ouro: '#ffffff', pes: '#ffffff', barba: '#ffffff' });
    const L1 = 33 * s, L2 = 33 * s, TR = 48 * s, A1 = 25 * s, A2 = 25 * s, CAB = 13 * s;
    const pt = (o, ang, len) => ({ x: o.x + Math.sin(ang * RAD) * len * fc, y: o.y + Math.cos(ang * RAD) * len });
    const H0 = { x: 0, y: 0 };
    const jF = pt(H0, P.pF[0], L1), peF = pt(jF, P.pF[0] + P.pF[1], L2);
    const jT = pt(H0, P.pT[0], L1), peT = pt(jT, P.pT[0] + P.pT[1], L2);
    const baixo = Math.max(jF.y, peF.y, jT.y, peT.y) + 3 * s;
    const deitado = f.estado === 'caido' || f.estado === 'ko';

    // sombra no chão
    ctx.save();
    ctx.globalAlpha = clamp(0.4 - f.z / 600, 0.1, 0.4);
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(f.x, CHAO + 4, (deitado ? 70 : 34) * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.save();
    if (f.invul > 0 && f.estado !== 'golpe' && J.tick % 6 < 3) ctx.globalAlpha = 0.45;
    if (f.estado === 'ko' && f.et > 30 && f !== J.jog && J.tick % 4 < 2) ctx.globalAlpha = 0.3;
    ctx.translate(f.x, CHAO - f.z);
    if (deitado) {
      // Gira o corpo para trás até deitar (cai de costas).
      const prog = noChao(f) ? 1 : clamp(1 - f.vz / 9, 0.2, 1);
      ctx.rotate(-fc * Math.PI / 2 * prog);
      ctx.translate(0, -12 * s * prog);
    }
    ctx.translate(0, -baixo);
    if (f.furia) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(J.tick * 0.3) * 0.15;
      ctx.fillStyle = '#ff2d2d';
      ctx.shadowColor = '#ff2d2d'; ctx.shadowBlur = 40;
      ctx.beginPath(); ctx.ellipse(0, -40 * s, 50 * s, 110 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Eixo do tronco (u, para cima) e a "frente" do corpo (nf).
    const u = { x: Math.sin(P.lean * RAD) * fc, y: -Math.cos(P.lean * RAD) };
    const nf = { x: Math.cos(P.lean * RAD) * fc, y: Math.sin(P.lean * RAD) };
    const em = (t, k) => ({ x: u.x * TR * t + nf.x * k, y: u.y * TR * t + nf.y * k });
    const S = em(1, 0);
    const ac = P.lean + P.cab;
    const C = { x: S.x + Math.sin(ac * RAD) * (CAB + 9 * s) * fc, y: S.y - Math.cos(ac * RAD) * (CAB + 9 * s) };
    const cab = (fx, fy) => ({ x: C.x + fx * s * fc, y: C.y + fy * s }); // ponto no rosto (fx > 0 = para a frente)
    const oF = em(0.93, 2 * s), oT = em(0.93, -5 * s);
    const cT = pt(oT, P.bT[0], A1), mT = pt(cT, P.bT[0] + P.bT[1], A2);
    const cF = pt(oF, P.bF[0], A1), mF = pt(cF, P.bF[0] + P.bF[1], A2);

    function braco(o, cot, mao) {
      const sup = c.manga === 'nenhuma' ? c.pele : c.roupa;
      const ant = c.manga === 'longa' ? c.roupa : c.pele;
      parte(o, cot, 7.2 * s, 5.8 * s, sup, s);
      parte(cot, mao, 6.2 * s, 4.6 * s, ant, s);
      if (c.ouro) { ctx.strokeStyle = c.ouro; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.arc(mao.x + (cot.x - mao.x) * 0.25, mao.y + (cot.y - mao.y) * 0.25, 5.5 * s, 0, Math.PI * 2); ctx.stroke(); }
      circulo(mao, 7 * s, c.luva, s);
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.2 * s;
      ctx.beginPath(); ctx.moveTo(mao.x - 3 * s, mao.y - 1 * s); ctx.lineTo(mao.x + 3 * s, mao.y - 1 * s); ctx.stroke();
    }
    function perna(joelho, pe) {
      const larga = c.calcaLarga;
      const dedo = { x: pe.x + fc * 12 * s, y: pe.y + 2 * s };
      parte(pe, dedo, 4.8 * s, 3.6 * s, c.pes, s);
      parte(H0, joelho, 10.5 * s, 8 * s, c.calca, s);
      parte(joelho, pe, larga ? 8 * s : 7.2 * s, larga ? 8.6 * s : 5 * s, c.calca, s);
    }

    // capa do chefe (atrás de tudo)
    if (c.capa) {
      const bal = Math.sin(J.tick * 0.08) * 8 * s;
      ctx.fillStyle = CONTORNO;
      ctx.beginPath();
      ctx.moveTo(S.x + 6 * s * fc, S.y - 2 * s);
      ctx.lineTo(S.x - 18 * s * fc, S.y - 2 * s);
      ctx.quadraticCurveTo(-46 * s * fc + bal, 20 * s, -40 * s * fc + bal, 62 * s);
      ctx.lineTo(4 * s * fc, 40 * s);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = c.capa;
      ctx.beginPath();
      ctx.moveTo(S.x + 4 * s * fc, S.y);
      ctx.lineTo(S.x - 16 * s * fc, S.y);
      ctx.quadraticCurveTo(-43 * s * fc + bal, 20 * s, -37 * s * fc + bal, 58 * s);
      ctx.lineTo(4 * s * fc, 38 * s);
      ctx.closePath(); ctx.fill();
    }

    // rastro do golpe (mão ou pé que está batendo)
    const g = f.estado === 'golpe' && f.golpe;
    const ativo = g && g.dano && f.gt > g.ini && f.gt <= g.ini + g.ativo + 2;
    const ponta = !ativo ? null : ['chute', 'rasteira', 'voadora'].includes(g.pose) ? peF : g.pose === 'soco2' ? mT : mF;
    if (ponta) { f.rastro = f.rastro || []; f.rastro.push({ x: ponta.x, y: ponta.y }); if (f.rastro.length > 6) f.rastro.shift(); } else f.rastro = [];

    braco(oT, cT, mT);
    if (c.ouro) circulo(oT, 8 * s, c.ouro, s);
    perna(jT, peT);

    // tronco
    const fr = [em(0, 12 * s), em(0.45, 10.5 * s), em(0.8, 16 * s), em(1, 11 * s)];
    const tr = [em(1, -15 * s), em(0.8, -13 * s), em(0.45, -10 * s), em(0, -12 * s)];
    const meio = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
    const caminhoTronco = () => {
      ctx.beginPath();
      ctx.moveTo(fr[0].x, fr[0].y);
      ctx.quadraticCurveTo(fr[1].x, fr[1].y, meio(fr[1], fr[2]).x, meio(fr[1], fr[2]).y);
      ctx.quadraticCurveTo(fr[2].x, fr[2].y, fr[3].x, fr[3].y);
      ctx.lineTo(tr[0].x, tr[0].y);
      ctx.quadraticCurveTo(tr[1].x, tr[1].y, meio(tr[1], tr[2]).x, meio(tr[1], tr[2]).y);
      ctx.quadraticCurveTo(tr[2].x, tr[2].y, tr[3].x, tr[3].y);
      ctx.closePath();
    };
    caminhoTronco();
    ctx.lineWidth = 3.6 * s; ctx.strokeStyle = CONTORNO; ctx.stroke();
    ctx.fillStyle = c.colete ? c.pele : c.roupa; ctx.fill();
    ctx.save();
    caminhoTronco(); ctx.clip();
    const poli = (pts, cor) => { ctx.fillStyle = cor; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.fill(); };
    if (c.colete) { // colete aberto: músculos à mostra
      poli([em(0, -14 * s), em(1.1, -16 * s), em(1.1, -2 * s), em(0, -4 * s)], c.roupa);
      poli([em(0, 14 * s), em(1.1, 17 * s), em(1.1, 12 * s), em(0, 9 * s)], c.roupa);
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.6 * s;
      const pe1 = em(0.72, 2 * s), pe2 = em(0.72, 13 * s);
      ctx.beginPath(); ctx.moveTo(pe1.x, pe1.y); ctx.quadraticCurveTo(em(0.62, 8 * s).x, em(0.62, 8 * s).y, pe2.x, pe2.y); ctx.stroke();
      [0.3, 0.45].forEach(t => { const a1 = em(t, 2 * s), a2 = em(t, 10 * s); ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.stroke(); });
    }
    if (c.gola) { // kimono: abertura em V no peito
      poli([em(1.05, 9 * s), em(1.05, -3 * s), em(0.5, 6 * s)], c.pele);
      ctx.strokeStyle = escurecer(c.roupa === '#ffffff' ? '#ffffff' : c.roupa, 0.6); ctx.lineWidth = 2.4 * s;
      const g1 = em(1.05, -3 * s), g2 = em(0.5, 6 * s), g3 = em(1.05, 10 * s);
      ctx.beginPath(); ctx.moveTo(g1.x, g1.y); ctx.lineTo(g2.x, g2.y); ctx.lineTo(g3.x, g3.y); ctx.stroke();
    }
    poli([em(-0.1, -20 * s), em(1.1, -20 * s), em(1.1, -8 * s), em(-0.1, -6 * s)], 'rgba(0,0,0,.22)');
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    const brilho = em(0.72, 6 * s);
    ctx.beginPath(); ctx.ellipse(brilho.x, brilho.y, 6 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // faixa na cintura, com nó e pontas balançando
    const f1 = em(0.07, 13 * s), f2 = em(0.07, -13 * s), no = em(0.07, 10 * s);
    ctx.lineCap = 'round';
    ctx.strokeStyle = CONTORNO; ctx.lineWidth = 8.6 * s; ctx.beginPath(); ctx.moveTo(f1.x, f1.y); ctx.lineTo(f2.x, f2.y); ctx.stroke();
    ctx.strokeStyle = c.faixa; ctx.lineWidth = 5.2 * s; ctx.beginPath(); ctx.moveTo(f1.x, f1.y); ctx.lineTo(f2.x, f2.y); ctx.stroke();
    if (c.gola) {
      const bal = Math.sin(J.tick * 0.15 + f.id) * 3 * s - f.vx * 1.5 * fc * s;
      [[4, 17], [8, 15]].forEach(([dx, dy]) => {
        ctx.strokeStyle = CONTORNO; ctx.lineWidth = 5.6 * s;
        ctx.beginPath(); ctx.moveTo(no.x, no.y); ctx.quadraticCurveTo(no.x + dx * s * fc, no.y + dy * 0.5 * s, no.x + dx * s * fc + bal, no.y + dy * s); ctx.stroke();
        ctx.strokeStyle = c.faixa; ctx.lineWidth = 3 * s; ctx.stroke();
      });
      circulo(no, 3.4 * s, c.faixa, s);
    }

    perna(jF, peF);

    // pescoço e cabeça
    parte(S, { x: S.x + (C.x - S.x) * 0.55, y: S.y + (C.y - S.y) * 0.55 }, 6.2 * s, 5.8 * s, c.pele, s);
    if (c.cabeloTipo === 'longo') {
      const bal = Math.sin(J.tick * 0.07 + f.id) * 4 * s;
      parte(cab(-6, -6), { x: C.x - 20 * s * fc + bal, y: C.y + 26 * s }, 10 * s, 5 * s, c.cabelo, s);
    }
    const queixo = cab(4.5, 9.5);
    const caminhoCabeca = extra => {
      ctx.beginPath();
      ctx.ellipse(C.x, C.y, 11.5 * s + extra, 13.2 * s + extra, 0, 0, Math.PI * 2);
      capsula({ x: C.x + 1 * s * fc, y: C.y + 2 * s }, queixo, 9 * s + extra, 6 * s + extra);
    };
    caminhoCabeca(1.8 * s); ctx.fillStyle = CONTORNO; ctx.fill();
    caminhoCabeca(0); ctx.fillStyle = c.mascara ? c.roupa : c.pele; ctx.fill();
    ctx.save(); caminhoCabeca(0); ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(C.x - 6 * s * fc, C.y + 4 * s, 9 * s, 14 * s, 0, 0, Math.PI * 2); ctx.fill();
    if (c.mascara) { ctx.fillStyle = c.pele; const m = cab(6, -1); ctx.fillRect(m.x - 7 * s, m.y - 4 * s, 14 * s, 7 * s); }
    ctx.restore();
    circulo(cab(-2.5, 1.5), 3.2 * s, c.mascara ? c.roupa : escurecer(c.pele, 0.88), s); // orelha

    // cabelo
    const cor = c.cabelo;
    if (c.cabeloTipo === 'espetado') {
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const ang = (150 + i * 17) * RAD, r = (i % 2 ? 19 : 12.5) * s, atras = i % 2 ? -4 * s : 0;
        const p = { x: C.x + (Math.cos(ang) * r + atras) * fc, y: C.y + Math.sin(ang) * r - 1 * s };
        if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
      }
      ctx.lineTo(C.x + 6 * s * fc, C.y - 3 * s); ctx.lineTo(C.x - 8 * s * fc, C.y + 6 * s);
      ctx.closePath();
      ctx.lineWidth = 3 * s; ctx.strokeStyle = CONTORNO; ctx.stroke();
      ctx.fillStyle = cor; ctx.fill();
    } else if (c.cabeloTipo === 'curto' || c.cabeloTipo === 'longo') {
      ctx.beginPath();
      ctx.moveTo(C.x - 12 * s * fc, C.y + 5 * s);
      ctx.quadraticCurveTo(C.x - 14 * s * fc, C.y - 15 * s, C.x + 2 * s * fc, C.y - 15 * s);
      ctx.quadraticCurveTo(C.x + 12 * s * fc, C.y - 13 * s, C.x + 11 * s * fc, C.y - 5 * s);
      ctx.lineTo(C.x - 4 * s * fc, C.y - 7 * s);
      ctx.lineTo(C.x - 6 * s * fc, C.y + 5 * s);
      ctx.closePath();
      ctx.lineWidth = 3 * s; ctx.strokeStyle = CONTORNO; ctx.stroke();
      ctx.fillStyle = cor; ctx.fill();
    }
    if (c.barba) {
      ctx.fillStyle = c.barba;
      ctx.beginPath(); capsula(cab(0, 7), cab(5, 12 + (c.cabeloTipo === 'longo' ? 6 : 0)), 7 * s, 4.5 * s); ctx.fill();
    }

    // rosto: olho, sobrancelha, nariz, boca
    const olho = cab(6.2, -1.5);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(olho.x, olho.y, 2.7 * s, 2 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(olho.x + 0.9 * s * fc, olho.y, 1.3 * s, 0, Math.PI * 2); ctx.fill();
    const bravo = f !== J.jog || f.estado === 'golpe';
    const sb1 = cab(2.5, bravo ? -6.5 : -5.5), sb2 = cab(9.5, bravo ? -4 : -5.5);
    ctx.strokeStyle = c.mascara ? c.roupa : CONTORNO; ctx.lineWidth = (f.T.chefe || f.tipo === 'brutamontes' ? 2.6 : 2) * s;
    ctx.beginPath(); ctx.moveTo(sb1.x, sb1.y); ctx.lineTo(sb2.x, sb2.y); ctx.stroke();
    if (!c.mascara) {
      const n1 = cab(10.5, -1), n2 = cab(13, 3.5), n3 = cab(10, 4.5);
      ctx.strokeStyle = escurecer(c.pele === '#ffffff' ? '#ffffff' : c.pele, 0.7); ctx.lineWidth = 1.4 * s;
      ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y); ctx.lineTo(n3.x, n3.y); ctx.stroke();
      const grita = f.estado === 'dor' || deitado || (g && f.gt > g.ini - 3 && f.gt <= g.ini + g.ativo + 4);
      const boca = cab(8, 8.5);
      if (grita) { ctx.fillStyle = '#3a0d0d'; ctx.beginPath(); ctx.ellipse(boca.x, boca.y, 2.4 * s, 2.8 * s, 0, 0, Math.PI * 2); ctx.fill(); }
      else { const b2 = cab(11, 8); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.4 * s; ctx.beginPath(); ctx.moveTo(boca.x - 2 * s * fc, boca.y); ctx.lineTo(b2.x, b2.y); ctx.stroke(); }
    }
    if (f.tipo === 'brutamontes') { // cicatriz
      const k1 = cab(3, -9), k2 = cab(8, 2);
      ctx.strokeStyle = '#a0522d'; ctx.lineWidth = 1.4 * s; ctx.beginPath(); ctx.moveTo(k1.x, k1.y); ctx.lineTo(k2.x, k2.y); ctx.stroke();
    }

    // bandana / diadema
    if (c.bandana || c.ouro) {
      const b1 = cab(-12, -4), b2 = cab(11.5, -7.5), corB = c.ouro || c.bandana;
      ctx.lineCap = 'round';
      ctx.strokeStyle = CONTORNO; ctx.lineWidth = 7.4 * s; ctx.beginPath(); ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
      ctx.strokeStyle = corB; ctx.lineWidth = 4.4 * s; ctx.beginPath(); ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
      if (c.ouro) {
        poli([cab(6, -8), cab(9, -17), cab(12, -8)], c.ouro);
      } else {
        const onda = Math.sin(J.tick * 0.25 + f.id) * 5 * s - f.vx * 2 * s;
        [[18, 0], [15, 7]].forEach(([dx, dy]) => {
          ctx.strokeStyle = CONTORNO; ctx.lineWidth = 5.4 * s;
          ctx.beginPath(); ctx.moveTo(b1.x, b1.y); ctx.quadraticCurveTo(b1.x - dx * 0.5 * s * fc, b1.y + dy * 0.5 * s, b1.x - dx * s * fc, b1.y + dy * s + onda); ctx.stroke();
          ctx.strokeStyle = corB; ctx.lineWidth = 3 * s; ctx.stroke();
        });
      }
    }

    braco(oF, cF, mF);
    if (c.ouro) circulo(oF, 8.5 * s, c.ouro, s);

    if (f.rastro && f.rastro.length > 1) {
      ctx.lineCap = 'round';
      for (let i = 1; i < f.rastro.length; i++) {
        const k = i / f.rastro.length;
        ctx.strokeStyle = `rgba(255,255,255,${k * 0.5})`; ctx.lineWidth = k * 14 * s;
        ctx.beginPath(); ctx.moveTo(f.rastro[i - 1].x, f.rastro[i - 1].y); ctx.lineTo(f.rastro[i].x, f.rastro[i].y); ctx.stroke();
      }
    }
    ctx.restore();

    // vida dos inimigos comuns (o chefe tem a barra grande)
    if (f !== J.jog && !f.T.chefe && f.estado !== 'ko' && f.hp < f.T.hp) {
      const w = 46, y = CHAO - f.z - 172 * s;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(f.x - w / 2 - 1, y - 1, w + 2, 6);
      ctx.fillStyle = '#ff5c5c'; ctx.fillRect(f.x - w / 2, y, w * f.hp / f.T.hp, 4);
    }
  }

  // ---------- Cenários ----------
  function cenario(n) {
    const t = J.tick;
    if (n === 0) {
      let g = ctx.createLinearGradient(0, 0, 0, 360);
      g.addColorStop(0, '#3b1d5a'); g.addColorStop(0.55, '#c2436b'); g.addColorStop(1, '#ffb15c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 360);
      ctx.fillStyle = '#ffe08a'; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(700, 300, 70, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#2a3b63'; ctx.fillRect(0, 300, W, 90);
      ctx.strokeStyle = 'rgba(255,214,140,.5)'; ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) { const y = 310 + i * 6, x = 620 + Math.sin(t * 0.03 + i) * 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 160 - i * 6, y); ctx.stroke(); }
      // guindastes
      ctx.fillStyle = '#1b1430'; ctx.strokeStyle = '#1b1430'; ctx.lineWidth = 6;
      [[120, 1], [420, -1]].forEach(([x, d]) => {
        ctx.fillRect(x, 120, 14, 200);
        ctx.beginPath(); ctx.moveTo(x - 60 * d, 130); ctx.lineTo(x + 160 * d, 130); ctx.stroke();
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 120 * d, 130); ctx.lineTo(x + 120 * d, 220); ctx.stroke(); ctx.lineWidth = 6;
      });
      // contêineres
      const cores = ['#b5442f', '#2f6db5', '#3c8c4a', '#c9922c', '#7a3c8c'];
      for (let i = 0; i < 9; i++) {
        const x = i * 110 - 20, alto = hash(i) > 0.5;
        ctx.fillStyle = cores[i % 5]; ctx.fillRect(x, 330, 104, 56);
        if (alto) { ctx.fillStyle = cores[(i + 2) % 5]; ctx.fillRect(x + 8, 274, 96, 56); }
        ctx.fillStyle = 'rgba(0,0,0,.25)';
        for (let k = 0; k < 6; k++) ctx.fillRect(x + 8 + k * 16, 334, 3, 48);
      }
      chao('#6b4a32', '#59392a', 'tabuas');
    } else if (n === 1) {
      ctx.fillStyle = '#0b1026'; ctx.fillRect(0, 0, W, 400);
      for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + hash(i) * 0.6})`; ctx.fillRect(hash(i + 3) * W, hash(i + 9) * 160, 2, 2); }
      for (let i = 0; i < 8; i++) {
        const x = i * 125 - 10, h = 170 + hash(i + 20) * 120, y = 400 - h;
        ctx.fillStyle = i % 2 ? '#151a3a' : '#1b2148'; ctx.fillRect(x, y, 118, h);
        for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) {
          if (hash(i * 50 + r * 7 + k) > 0.55) { ctx.fillStyle = hash(i + r + k) > 0.5 ? '#ffd27a' : '#7dd3fc'; ctx.fillRect(x + 12 + k * 26, y + 16 + r * 26, 12, 14); }
        }
      }
      // letreiros neon
      const pisca = (k) => (Math.sin(t * 0.07 + k) > -0.85) ? 1 : 0.25;
      [['RAMEN', 140, 250, '#ff4fa3'], ['DOJÔ', 520, 220, '#4fd1c5'], ['LUTA', 800, 260, '#ffd166']].forEach(([txt, x, y, cor], k) => {
        ctx.save(); ctx.globalAlpha = pisca(k * 3);
        ctx.font = 'bold 34px "Arial Black", sans-serif'; ctx.fillStyle = cor; ctx.shadowColor = cor; ctx.shadowBlur = 22;
        ctx.fillText(txt, x, y); ctx.restore();
      });
      // lanternas
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 300); ctx.quadraticCurveTo(W / 2, 350, W, 300); ctx.stroke();
      for (let i = 0; i < 10; i++) {
        const x = 40 + i * 96, y = 300 + Math.sin((x / W) * Math.PI) * 25 + 10;
        ctx.save(); ctx.fillStyle = i % 2 ? '#ff5c5c' : '#ffb347'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.ellipse(x, y, 10, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      // barracas
      ['#c0392b', '#2471a3', '#d68910', '#7d3c98'].forEach((cor, i) => {
        const x = 40 + i * 240;
        ctx.fillStyle = '#3a2618'; ctx.fillRect(x, 380, 150, 30);
        for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? cor : '#f4f4f4'; ctx.fillRect(x - 10 + k * 28, 350, 28, 26); }
      });
      chao('#3a3f4b', '#2f333d', 'pedras');
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, 400);
      g.addColorStop(0, '#05030f'); g.addColorStop(1, '#2a1145');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 400);
      ctx.fillStyle = '#f5f0d8'; ctx.shadowColor = '#f5f0d8'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(160, 90, 42, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      for (let i = 0; i < 16; i++) {
        const x = i * 62, h = 90 + hash(i + 40) * 180;
        ctx.fillStyle = '#120b26'; ctx.fillRect(x, 400 - h, 58, h);
        for (let r = 0; r < 10; r++) if (hash(i * 31 + r) > 0.6) { ctx.fillStyle = 'rgba(255,210,120,.7)'; ctx.fillRect(x + 8 + (r % 3) * 16, 410 - h + r * 16, 6, 8); }
      }
      // caixa d'água e antena
      ctx.fillStyle = '#0d0820';
      ctx.fillRect(760, 230, 120, 90); ctx.fillRect(770, 320, 10, 60); ctx.fillRect(860, 320, 10, 60);
      ctx.fillRect(80, 200, 6, 180);
      ctx.fillStyle = J.tick % 60 < 30 ? '#ff3b3b' : '#5a1010'; ctx.beginPath(); ctx.arc(83, 198, 5, 0, Math.PI * 2); ctx.fill();
      chao('#3d3a4a', '#322f3d', 'laje');
      // chuva
      ctx.strokeStyle = 'rgba(170,190,255,.35)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 90; i++) { const x = (hash(i) * W + t * 3) % W, y = (hash(i + 99) * H + t * 14) % H; ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14); }
      ctx.stroke();
      if (J.chefe && J.chefe.estado !== 'ko' && Math.random() < 0.004) J.raio = 1;
    }
  }

  function chao(cor, cor2, estilo) {
    const topo = CHAO - 46;
    const g = ctx.createLinearGradient(0, topo, 0, H);
    g.addColorStop(0, cor2); g.addColorStop(1, cor);
    ctx.fillStyle = g; ctx.fillRect(0, topo, W, H - topo);
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2;
    ctx.beginPath();
    if (estilo === 'tabuas') {
      for (let y = topo + 12; y < H; y += 16) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    } else if (estilo === 'pedras') {
      for (let y = topo + 14, r = 0; y < H; y += 18, r++) { ctx.moveTo(0, y); ctx.lineTo(W, y); for (let x = (r % 2) * 30; x < W; x += 60) { ctx.moveTo(x, y - 18); ctx.lineTo(x, y); } }
    } else {
      for (let x = -400; x < W + 400; x += 80) { ctx.moveTo(W / 2 + (x - W / 2) * 0.6, topo); ctx.lineTo(x, H); }
      ctx.moveTo(0, topo + 20); ctx.lineTo(W, topo + 20);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, topo, W, 4);
  }

  // ---------- Projéteis, partículas, HUD ----------
  function desenharProjeteis() {
    J.proj.forEach(pr => {
      const y = CHAO - pr.z;
      ctx.save();
      if (pr.tipo === 'shuriken') {
        ctx.translate(pr.x, y); ctx.rotate(pr.t * 0.5);
        ctx.fillStyle = '#cfd8e3';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) { const r = i % 2 ? 4 : 12, a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill();
      } else if (pr.tipo === 'onda') {
        ctx.fillStyle = '#ff9a3c'; ctx.shadowColor = '#ff5c00'; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.ellipse(pr.x, CHAO - 10, 18, 26 + Math.sin(pr.t * 0.6) * 6, 0, Math.PI, Math.PI * 2); ctx.fill();
      } else {
        const azul = pr.tipo === 'fogo';
        ctx.shadowColor = azul ? '#38bdf8' : '#ff3b00'; ctx.shadowBlur = 30;
        ctx.fillStyle = azul ? '#7dd3fc' : '#ff7b3b';
        ctx.beginPath(); ctx.arc(pr.x, y, pr.raio + Math.sin(pr.t * 0.8) * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(pr.x, y, pr.raio * 0.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });
  }

  function desenharParticulas() {
    J.parts.forEach(p => {
      ctx.globalAlpha = clamp(p.vida / 20, 0, 1);
      if (p.risco) {
        ctx.strokeStyle = p.cor; ctx.lineWidth = p.tam * 0.6;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2); ctx.stroke();
      } else {
        ctx.fillStyle = p.cor;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.tam, 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
    J.textos.forEach(t => {
      ctx.globalAlpha = clamp(t.vida / 25, 0, 1);
      txt(t.txt, t.x, t.y, t.tam, t.cor, 'center');
    });
    ctx.globalAlpha = 1;
  }

  function txt(s, x, y, tam, cor, alinha, borda) {
    ctx.font = `900 ${tam}px "Arial Black", Impact, sans-serif`;
    ctx.textAlign = alinha || 'left'; ctx.textBaseline = 'middle';
    ctx.lineWidth = borda || Math.max(3, tam / 7); ctx.strokeStyle = '#000';
    ctx.strokeText(s, x, y);
    ctx.fillStyle = cor; ctx.fillText(s, x, y);
  }

  function barra(x, y, w, h, frac, vista, cor, invertida) {
    ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    ctx.fillStyle = '#4a0d0d'; ctx.fillRect(x, y, w, h);
    const wv = w * clamp(vista, 0, 1), wf = w * clamp(frac, 0, 1);
    ctx.fillStyle = '#ff6b3d'; ctx.fillRect(invertida ? x + w - wv : x, y, wv, h);
    ctx.fillStyle = cor; ctx.fillRect(invertida ? x + w - wf : x, y, wf, h);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x, y, w, h / 3);
  }

  function desenharHud() {
    const p = J.jog;
    txt(p.T.nome, 24, 22, 20, '#ffd166');
    barra(24, 38, 360, 22, p.hp / p.T.hp, p.hpVisto / p.T.hp, p.hp / p.T.hp < 0.3 ? '#ff3b3b' : '#ffe14d');
    // energia em 4 partes (25 cada); cheia = super
    for (let i = 0; i < 4; i++) {
      const x = 24 + i * 62, cheio = clamp((p.en - i * 25) / 25, 0, 1);
      ctx.fillStyle = '#000'; ctx.fillRect(x - 2, 68, 60, 14);
      ctx.fillStyle = '#123'; ctx.fillRect(x, 70, 56, 10);
      ctx.fillStyle = p.en >= 100 ? (J.tick % 10 < 5 ? '#fff' : '#7dd3fc') : '#38bdf8';
      ctx.fillRect(x, 70, 56 * cheio, 10);
    }
    txt(p.en >= 100 ? 'SUPER PRONTO! (ESPECIAL)' : 'ESPECIAL', 280, 76, 13, p.en >= 100 ? '#7dd3fc' : '#9fb3c8');
    txt(`FASE ${J.fase + 1} · ONDA ${J.onda + 1}/${FASES[J.fase].ondas.length}`, W / 2, 22, 18, '#fff', 'center');
    txt(String(J.pontos).padStart(7, '0'), W - 24, 26, 26, '#fff', 'right');
    txt(`RECORDE ${J.recorde}`, W - 24, 54, 13, '#9fb3c8', 'right');
    txt(Rede.conectado() ? '📱 conectado' : '⌨ teclado', W - 24, 76, 13, Rede.conectado() ? '#4fd1c5' : '#9fb3c8', 'right');
    if (p.combo >= 2) txt(`${p.combo} GOLPES!`, 24, 120, 30, '#ffd166');
    const ch = J.chefe;
    if (ch && ch.estado !== 'ko' && !ch.entrando) {
      txt(ch.T.nome, W / 2, H - 52, 18, '#ff8fa3', 'center');
      barra(W / 2 - 300, H - 36, 600, 18, ch.hp / ch.T.hp, ch.hpVisto / ch.T.hp, ch.furia ? '#ff2d2d' : '#c81d4e', true);
    }
  }

  function desenharAviso() {
    const a = J.aviso;
    if (!a) return;
    const k = clamp(Math.min(a.t, 30) / 30, 0, 1);
    ctx.globalAlpha = k;
    if (a.chefe) { ctx.fillStyle = 'rgba(120,0,0,.35)'; ctx.fillRect(0, H / 2 - 80, W, 160); }
    if (a.lute && a.t < 50) txt('LUTE!', W / 2, H / 2 - 10, 92, '#ff3b3b', 'center', 10);
    else {
      txt(a.txt, W / 2, H / 2 - 30, a.chefe ? 84 : 64, a.chefe ? '#ff3b3b' : '#ffd166', 'center', 9);
      if (a.sub) txt(a.sub, W / 2, H / 2 + 36, 28, '#fff', 'center');
    }
    ctx.globalAlpha = 1;
  }

  function desenharTitulo() {
    cenario(1);
    ctx.fillStyle = 'rgba(5,6,20,.55)'; ctx.fillRect(0, 0, W, H);
    const ex = novoLutador('jogador', 200, 1); ex.id = 1;
    ex.estado = J.tick % 160 < 30 ? 'golpe' : 'parado';
    if (ex.estado === 'golpe') { ex.golpe = GOLPES.hadouken; ex.gt = J.tick % 160 < 12 ? 5 : 20; }
    const ch = novoLutador('chefe', 760, -1); ch.id = 7; ch.furia = true;
    ctx.save(); ctx.translate(-60, 0); desenharLutador(ex); ctx.restore();
    desenharLutador(ch);
    ctx.save();
    ctx.shadowColor = '#ff5c00'; ctx.shadowBlur = 30;
    txt('PUNHO', W / 2, 110, 92, '#ffd166', 'center', 12);
    txt('LENDÁRIO', W / 2, 200, 92, '#ff6b3d', 'center', 12);
    ctx.restore();
    txt('3 fases · ondas de inimigos · um chefão', W / 2, 262, 20, '#fff', 'center');
    if (J.tick % 60 < 40) txt('APERTE SOCO (CELULAR) OU ENTER', W / 2, 318, 26, '#7dd3fc', 'center');
    const linhas = [
      '⌨ Setas: mover · ↑ ou ESPAÇO: pular · ↓: agachar',
      'Z: soco (3x = combo) · X: chute · ↓ + X: rasteira',
      'C: especial (bola de energia) · energia cheia = SUPER',
      'Andar para TRÁS defende · P: pausa · R: reiniciar · M: som · F: tela cheia',
    ];
    linhas.forEach((l, i) => txt(l, W / 2, 372 + i * 26, 15, '#cbd5e1', 'center'));
    if (J.recorde) txt(`RECORDE: ${J.recorde}`, W / 2, 486, 18, '#ffd166', 'center');
    avisoSom(520);
  }

  // O navegador deixa o jogo mudo até alguém clicar NESTE computador.
  function avisoSom(y) {
    if (Som.ativo() || !Som.ligado()) return;
    txt('🔇 Clique na tela do computador para ligar o som', W / 2, y, 15, J.tick % 60 < 40 ? '#ffd166' : '#9aa6ba', 'center');
  }

  function desenhar() {
    ctx.setTransform(escalaBase, 0, 0, escalaBase, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (J.tela === 'titulo') { desenharTitulo(); return; }
    ctx.save();
    if (J.tremor) ctx.translate(rnd(-J.tremor, J.tremor), rnd(-J.tremor, J.tremor));
    cenario(J.fase);
    if (J.superT > 0) { ctx.fillStyle = 'rgba(0,0,30,.65)'; ctx.fillRect(-20, -20, W + 40, H + 40); }
    const ordem = [...J.inis, J.jog].sort((a, b) => (a === J.jog) - (b === J.jog));
    ordem.forEach(desenharLutador);
    desenharProjeteis();
    desenharParticulas();
    ctx.restore();
    if (J.raio > 0) { ctx.fillStyle = `rgba(230,230,255,${J.raio * 0.6})`; ctx.fillRect(0, 0, W, H); J.raio = Math.max(0, J.raio - 0.08); }
    if (J.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${J.flash})`; ctx.fillRect(0, 0, W, H); }
    desenharHud();
    desenharAviso();
    avisoSom(H - 70);
    if (J.tick - J.confirma < 180) {
      ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(0, H / 2 - 50, W, 100);
      txt('REINICIAR O JOGO?', W / 2, H / 2 - 14, 40, '#ffd166', 'center');
      txt('Aperte ↺ (celular) ou R de novo para voltar à tela inicial', W / 2, H / 2 + 26, 18, '#fff', 'center');
    }
    if (J.tela === 'pausa') {
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
      txt('PAUSA', W / 2, H / 2 - 20, 72, '#fff', 'center');
      txt('Aperte P (ou ⏸ no celular) para continuar', W / 2, H / 2 + 40, 20, '#cbd5e1', 'center');
      txt('R (ou ↺ no celular) reinicia o jogo', W / 2, H / 2 + 72, 16, '#9aa6ba', 'center');
    }
    if (J.tela === 'derrota') {
      ctx.fillStyle = 'rgba(40,0,0,.6)'; ctx.fillRect(0, 0, W, H);
      txt('K.O.', W / 2, H / 2 - 70, 110, '#ff3b3b', 'center', 12);
      if (J.voltaFase1) {
        txt('DUAS DERROTAS SEGUIDAS', W / 2, H / 2 + 30, 38, '#ffd166', 'center');
        txt(`Voltando para a FASE 1 em ${Math.ceil(J.tt / 60)}…`, W / 2, H / 2 + 80, 22, '#fff', 'center');
      } else if (J.tt < 560) {
        txt(`CONTINUAR? ${Math.ceil(J.tt / 60)}`, W / 2, H / 2 + 30, 44, '#ffd166', 'center');
        txt('Aperte SOCO ou ENTER para tentar a fase de novo', W / 2, H / 2 + 80, 20, '#fff', 'center');
        txt('Atenção: perder de novo volta para a FASE 1', W / 2, H / 2 + 112, 16, '#ff8fa3', 'center');
      }
    }
    if (J.tela === 'vitoria') {
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, W, H);
      txt('VOCÊ VENCEU!', W / 2, 150, 80, '#ffd166', 'center', 10);
      txt('O Imperador Vulcano foi derrotado', W / 2, 220, 24, '#fff', 'center');
      txt(`PONTOS: ${J.pontos}`, W / 2, 290, 40, '#7dd3fc', 'center');
      if (J.novoRecorde) txt('NOVO RECORDE!', W / 2, 340, 30, '#ff8fa3', 'center');
      if (!J.tt) txt('Aperte SOCO ou ENTER', W / 2, 410, 22, '#cbd5e1', 'center');
    }
  }

  // ---------- Celular (Supabase Realtime) ----------
  const Rede = (function () {
    const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', CHAVE = 'luta_sala';
    let canal = null, pronto = false, visto = 0, ultimo = '', enviadoEm = 0, aoConectar = null;
    function sala() {
      let s = '';
      try { s = sessionStorage.getItem(CHAVE) || ''; } catch (e) {}
      if (!/^[A-HJ-NP-Z2-9]{8}$/.test(s)) {
        const r = new Uint8Array(8); crypto.getRandomValues(r);
        s = Array.from(r, n => LETRAS[n % LETRAS.length]).join('');
        try { sessionStorage.setItem(CHAVE, s); } catch (e) {}
      }
      return s;
    }
    function marcar() {
      const novo = !conectado();
      visto = performance.now();
      if (novo && aoConectar) aoConectar();
    }
    function conectado() { return performance.now() - visto < 7000; }
    function enviar(evento, payload) {
      if (canal && pronto) canal.send({ type: 'broadcast', event: evento, payload }).catch(() => {});
    }
    function ligar(cb) {
      aoConectar = cb;
      let sb = null;
      try { sb = window.PortalSession && window.PortalSession.client(); } catch (e) {}
      if (!sb || typeof sb.channel !== 'function') return false;
      canal = sb.channel('luta_' + sala(), { config: { broadcast: { self: false } } });
      canal
        .on('broadcast', { event: 'j' }, ({ payload }) => {
          marcar();
          Entrada.cel.x = clamp(Number(payload && payload.x) || 0, -1, 1);
          Entrada.cel.y = clamp(Number(payload && payload.y) || 0, -1, 1);
          Entrada.cel.visto = performance.now();
        })
        .on('broadcast', { event: 'b' }, ({ payload }) => {
          marcar();
          const b = payload && payload.b;
          if (['soco', 'chute', 'esp', 'pulo', 'pausa', 'reiniciar'].includes(b)) Entrada.apertar(b);
        })
        .on('broadcast', { event: 'ola' }, () => { marcar(); enviarEstado(true); })
        .subscribe(st => { pronto = st === 'SUBSCRIBED'; });
      return true;
    }
    function enviarEstado(forcar) {
      if (!canal || !pronto) return;
      const p = J.jog;
      const e = { tela: J.tela, fase: J.fase + 1, hp: p ? Math.max(0, Math.round(p.hp)) : 0, hpMax: TIPOS.jogador.hp, en: p ? Math.floor(p.en) : 0, pontos: J.pontos };
      const t = JSON.stringify(e), agora = performance.now();
      if (!forcar && (t === ultimo || agora - enviadoEm < 250)) return;
      ultimo = t; enviadoEm = agora;
      enviar('estado', e);
    }
    return { sala, ligar, conectado, enviarEstado, vibrar: ms => enviar('vib', { ms }), get ligado() { return !!canal; } };
  })();

  // ---------- Início ----------
  function ajustar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const esc = Math.min(innerWidth / W, innerHeight / H);
    cv.style.width = `${Math.floor(W * esc)}px`;
    cv.style.height = `${Math.floor(H * esc)}px`;
    cv.width = Math.floor(W * esc * dpr);
    cv.height = Math.floor(H * esc * dpr);
    escalaBase = cv.width / W;
  }

  function iniciar({ canvas, aoConectarCelular }) {
    cv = canvas; ctx = cv.getContext('2d');
    ajustar();
    window.addEventListener('resize', ajustar);
    ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => Som.destravar(), true));
    document.addEventListener('keydown', e => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.code === 'KeyM') { const on = Som.alternar(); texto(W / 2, 120, on ? 'Som ligado' : 'Som desligado', '#fff', 20); return; }
      if (e.code === 'KeyF') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); return; }
      if (/^Arrow|^Space$/.test(e.code)) e.preventDefault();
      if (!e.repeat && TECLAS[e.code]) Entrada.apertar(TECLAS[e.code]);
      Entrada.tecla[e.code] = true;
    });
    document.addEventListener('keyup', e => { Entrada.tecla[e.code] = false; });
    window.addEventListener('blur', () => { Entrada.tecla = {}; if (J.tela === 'jogo') J.tela = 'pausa'; });
    const ligou = Rede.ligar(aoConectarCelular);
    let acc = 0, ult = performance.now();
    (function loop(agora) {
      acc += Math.min(100, agora - ult); ult = agora;
      while (acc >= 1000 / 60) { passo(); acc -= 1000 / 60; }
      desenhar();
      requestAnimationFrame(loop);
    })(ult);
    return { sala: Rede.sala(), ligou, conectado: Rede.conectado };
  }

  return { iniciar };
})();
