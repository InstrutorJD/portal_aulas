// Som do portal (shared/platform-core.js, 🎨 Personalizar → Som): música
// ambiente + som de clique combinando com o cursor escolhido. Tudo
// SINTETIZADO na hora via Web Audio API (osciladores/ruído gerados por
// código) — sem nenhum arquivo de áudio/CDN externo, mesmo espírito do
// beep()/playCorrect()/playWrong() já usados em games/quizrush.html, só
// que reaproveitável pelo portal inteiro (e por dentro de qualquer
// <iframe> de atividade, via o "relé" de clique que
// shared/platform-core.js injeta — ver applyA11yToIframe/pfClickRelay).
//
// Autoplay: navegador só deixa criar/tocar áudio depois de um gesto real
// do usuário (clique/tecla) — shared/platform-core.js cuida de só chamar
// startAmbient() dentro de um clique de verdade (o próprio toggle na
// modal, ou o 1º clique/tecla da sessão se a preferência já vinha
// ligada). playClick() nunca tem esse problema: só é chamado DENTRO de um
// clique, que já é o gesto exigido.
window.PortalAudio = (function () {
  let ctx = null;
  let masterGain = null;

  function ensureCtx() {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.35;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  // ---------- Som de clique — um "timbre" por cursor (CURSOR_PRESETS em
  // shared/platform-core.js) ----------
  function tone(freq, dur, type, gainPeak) {
    const c = ensureCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(gainPeak || 0.16, c.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.connect(gain).connect(masterGain);
    osc.start();
    osc.stop(c.currentTime + dur + 0.03);
  }

  // Rajada curta de ruído branco (envelope decrescente) — usada pro
  // "clang" da espada, sem precisar de nenhum arquivo de amostra.
  function noiseBurst(dur, gainPeak) {
    const c = ensureCtx();
    if (!c) return;
    const size = Math.max(1, Math.floor(c.sampleRate * dur));
    const buffer = c.createBuffer(1, size, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    gain.gain.setValueAtTime(gainPeak || 0.14, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    src.connect(gain).connect(masterGain);
    src.start();
  }

  const CLICK_SOUNDS = {
    default: () => tone(720, 0.05, 'square', 0.12),
    seta:    () => tone(1040, 0.06, 'sine', 0.15),
    mira:    () => { tone(1500, 0.035, 'square', 0.13); setTimeout(() => tone(950, 0.05, 'square', 0.13), 40); },
    espada:  () => { noiseBurst(0.05, 0.16); tone(1800, 0.12, 'triangle', 0.07); },
    estrela: () => [0, 1, 2].forEach(i => setTimeout(() => tone(880 * Math.pow(1.25, i), 0.09, 'sine', 0.09), i * 35)),
    pata:    () => tone(220, 0.09, 'sine', 0.16),
    caveira: () => tone(130, 0.2, 'sawtooth', 0.11),
  };

  function playClick(cursorKey) {
    const fn = CLICK_SOUNDS[cursorKey] || CLICK_SOUNDS.default;
    try { fn(); } catch (e) { /* best-effort, nunca trava a UI por causa de som */ }
  }

  // ---------- Música ambiente — pad generativo em loop ----------
  // 4 acordes tocando devagar (~4s cada, com uma pequena sobreposição pra
  // não ter silêncio entre um e outro), cada um com 3 osciladores por nota
  // levemente destafinados entre si (efeito "chorus" simples) — sem
  // nenhum arquivo de música, só osciladores.
  const CHORDS = [
    [220.00, 261.63, 329.63], // Am
    [174.61, 220.00, 261.63], // F
    [196.00, 246.94, 293.66], // C
    [164.81, 207.65, 261.63], // G (com a 3ª emprestada, fecha o ciclo suave)
  ];
  const CHORD_DUR = 4.2;
  const CHORD_INTERVAL_MS = 4000;
  let ambientTimer = null;

  function playChord(freqs) {
    const c = ensureCtx();
    if (!c) return;
    const chordGain = c.createGain();
    chordGain.gain.setValueAtTime(0, c.currentTime);
    chordGain.gain.linearRampToValueAtTime(0.05, c.currentTime + CHORD_DUR * 0.3);
    chordGain.gain.linearRampToValueAtTime(0, c.currentTime + CHORD_DUR);
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    chordGain.connect(filter).connect(masterGain);
    freqs.forEach(f => {
      [1, 1.004, 0.996].forEach(detune => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f * detune;
        osc.connect(chordGain);
        osc.start();
        osc.stop(c.currentTime + CHORD_DUR + 0.1);
      });
    });
  }

  function ambientStep(i) {
    playChord(CHORDS[i % CHORDS.length]);
    ambientTimer = setTimeout(() => ambientStep(i + 1), CHORD_INTERVAL_MS);
  }

  // Idempotente: chamar de novo com o ambiente já tocando não duplica nada.
  function startAmbient() {
    if (!ensureCtx() || ambientTimer) return;
    ambientStep(0);
  }
  function stopAmbient() {
    if (ambientTimer) { clearTimeout(ambientTimer); ambientTimer = null; }
  }
  function isAmbientPlaying() { return !!ambientTimer; }

  return { ensureCtx, playClick, startAmbient, stopAmbient, isAmbientPlaying };
})();
