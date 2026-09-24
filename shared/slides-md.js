// Motor dos slides de "Criar Material" (professor/materiais.html): lê um
// arquivo Markdown e monta uma apresentação pra projetar na aula — tudo no
// navegador, sem servidor, sem Supabase. Formato do .md (guia completo em
// materiais/guia-do-formato.md, que é ele mesmo uma apresentação):
//
//   (topo) --- aula: 3 / data: 2026-09-30 / titulo: ... ---  identificação
//          da aula (ver lerMeta) — vira os cards e a etiqueta da abertura
//   ---                  separa um slide do outro
//   # Título             slide de abertura/seção (grande, centralizado)
//   ## Título            título de um slide comum
//   - item / 1. item     lista normal
//   + item               lista revelada em etapas (um item por avanço)
//   - [ ] / - [x]        pergunta pra turma (x = certa; clique revela)
//   > texto              destaque
//   ```js ... ```        código com cores de sintaxe e botão Copiar
//   ![legenda](link)     imagem (relativa à pasta do .md, ou URL)
//   | a | b |            tabela (1ª linha = cabeçalho)
//   [cronômetro 15]      cronômetro de 15 minutos (atividade prática)
//   [qrcode link Legenda] QR Code grande (clique ou Q amplia pra sala toda)
//   **negrito** *itálico* `código` ==marca-texto== [link](url)
//
// SlidesMD.parse(md, baseUrl) devolve { titulo, slides: [{ kind, html }] }
// e SlidesMD.createPresenter(root) cuida da navegação, efeitos e interação.
window.SlidesMD = (function () {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function resolve(src, baseUrl) {
    if (!baseUrl) return src;
    try { return new URL(src, baseUrl).href; } catch (e) { return src; }
  }

  // Formatação dentro de uma linha. Escapa o HTML antes de tudo — o .md é
  // texto, nunca HTML cru — e protege o `código` pra nada dentro dele virar
  // negrito/itálico.
  function inline(text, baseUrl) {
    const codes = [];
    let s = esc(text).replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => `<img class="sm-inline-img" src="${resolve(src, baseUrl)}" alt="${alt}">`);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
    s = s.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
    return s;
  }

  // Quebra nos "---" que estão FORA de bloco de código.
  function splitSlides(md) {
    const lines = md.replace(/\r\n?/g, '\n').split('\n');
    const slides = [];
    let cur = [];
    let fence = null;
    lines.forEach(line => {
      const f = line.match(/^\s*(```|~~~)/);
      if (f) fence = fence ? (line.trim().startsWith(fence) ? null : fence) : f[1];
      if (!fence && /^\s*-{3,}\s*$/.test(line)) { slides.push(cur); cur = []; return; }
      cur.push(line);
    });
    slides.push(cur);
    return slides.filter(l => l.some(x => x.trim()));
  }

  const RE = {
    fence: /^\s*(```|~~~)\s*([\w+#.-]*)/,
    heading: /^(#{1,3})\s+(.*)$/,
    timer: /^\s*\[(?:cron[oô]metro|timer)\s+(\d+(?:[.,]\d+)?)\s*\]\s*$/i,
    qr: /^\s*\[qr\s*code\s+(\S+)(?:\s+([^\]]+))?\]\s*$/i,
    image: /^\s*!\[([^\]]*)\]\(([^)\s]+)\)\s*$/,
    quiz: /^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/,
    reveal: /^\s*\+\s+(.*)$/,
    ul: /^\s*[-*]\s+(.*)$/,
    ol: /^\s*\d+[.)]\s+(.*)$/,
    quote: /^\s*>\s?(.*)$/,
    table: /^\s*\|/,
  };
  const isBlockStart = line => Object.values(RE).some(re => re.test(line));

  function parseBlocks(lines, baseUrl) {
    const blocks = [];
    let i = 0;
    const takeWhile = re => {
      const out = [];
      while (i < lines.length && re.test(lines[i])) { out.push(lines[i].match(re)); i++; }
      return out;
    };
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      let m;
      if ((m = line.match(RE.fence))) {
        const fence = m[1];
        const code = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith(fence)) { code.push(lines[i]); i++; }
        i++;
        blocks.push({ t: 'code', lang: m[2] || '', code: code.join('\n') });
      } else if ((m = line.match(RE.heading))) {
        blocks.push({ t: 'h', level: m[1].length, html: inline(m[2], baseUrl) });
        i++;
      } else if ((m = line.match(RE.timer))) {
        blocks.push({ t: 'timer', seg: Math.round(parseFloat(m[1].replace(',', '.')) * 60) });
        i++;
      } else if ((m = line.match(RE.qr))) {
        blocks.push({ t: 'qr', texto: m[1], legenda: (m[2] || '').trim() });
        i++;
      } else if ((m = line.match(RE.image))) {
        blocks.push({ t: 'img', alt: m[1], src: resolve(m[2], baseUrl) });
        i++;
      } else if (RE.quiz.test(line)) {
        blocks.push({ t: 'quiz', opts: takeWhile(RE.quiz).map(x => ({ ok: x[1].toLowerCase() === 'x', html: inline(x[2], baseUrl) })) });
      } else if (RE.reveal.test(line)) {
        blocks.push({ t: 'reveal', items: takeWhile(RE.reveal).map(x => inline(x[1], baseUrl)) });
      } else if (RE.ul.test(line)) {
        blocks.push({ t: 'ul', items: takeWhile(RE.ul).map(x => inline(x[1], baseUrl)) });
      } else if (RE.ol.test(line)) {
        blocks.push({ t: 'ol', items: takeWhile(RE.ol).map(x => inline(x[1], baseUrl)) });
      } else if (RE.quote.test(line)) {
        blocks.push({ t: 'quote', html: takeWhile(RE.quote).map(x => inline(x[1], baseUrl)).join('<br>') });
      } else if (RE.table.test(line)) {
        const rows = takeWhile(RE.table).map(x => x.input.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
        const corpo = rows.filter((r, idx) => !(idx === 1 && r.every(c => /^:?-{2,}:?$/.test(c))));
        blocks.push({ t: 'table', head: corpo[0] || [], rows: corpo.slice(1), baseUrl });
      } else {
        const para = [line.trim()];
        i++;
        while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) { para.push(lines[i].trim()); i++; }
        blocks.push({ t: 'p', html: inline(para.join(' '), baseUrl) });
      }
    }
    return blocks;
  }

  function fmtTempo(seg) {
    const s = Math.max(0, Math.round(seg));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  // Cada bloco de topo ganha .sm-anim com um atraso crescente (--d): os
  // elementos entram um depois do outro quando o slide aparece.
  function renderBlocks(blocks) {
    let d = 0;
    const anim = () => `class="sm-anim" style="--d:${d++}"`;
    return blocks.map(b => {
      switch (b.t) {
        case 'h': return `<h${b.level} ${anim()}>${b.html}</h${b.level}>`;
        case 'p': return `<p ${anim()}>${b.html}</p>`;
        case 'ul': return `<ul ${anim()}>${b.items.map(it => `<li>${it}</li>`).join('')}</ul>`;
        case 'ol': return `<ol ${anim()}>${b.items.map(it => `<li>${it}</li>`).join('')}</ol>`;
        case 'reveal': return `<ul class="sm-anim sm-reveal" style="--d:${d++}">${b.items.map(it => `<li class="sm-step">${it}</li>`).join('')}</ul>`;
        case 'quote': return `<blockquote ${anim()}>${b.html}</blockquote>`;
        case 'img': return `<figure ${anim()}><img src="${b.src}" alt="${esc(b.alt)}">${b.alt ? `<figcaption>${esc(b.alt)}</figcaption>` : ''}</figure>`;
        case 'code': return `
          <div class="sm-anim sm-code" style="--d:${d++}">
            <div class="sm-code-bar"><span class="sm-dots"><i></i><i></i><i></i></span><span class="sm-code-lang">${esc(b.lang)}</span><button type="button" class="sm-copy">Copiar</button></div>
            <pre><code class="${b.lang ? 'language-' + esc(b.lang) : 'nohighlight'}">${esc(b.code)}</code></pre>
          </div>`;
        case 'quiz': return `
          <div class="sm-anim sm-quiz" style="--d:${d++}">
            ${b.opts.map((o, i) => `<button type="button" class="sm-opt" data-ok="${o.ok ? 1 : 0}"><span class="sm-letter">${String.fromCharCode(65 + i)}</span><span>${o.html}</span></button>`).join('')}
          </div>`;
        case 'table': return `
          <table ${anim()}>
            <thead><tr>${b.head.map(c => `<th>${inline(c, b.baseUrl)}</th>`).join('')}</tr></thead>
            <tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${inline(c, b.baseUrl)}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>`;
        // O desenho do QR é gerado depois, já no DOM (ver desenharQrs).
        case 'qr': return `
          <figure class="sm-anim sm-qr" style="--d:${d++}" data-qr="${esc(b.texto)}" title="Clique para ampliar">
            <div class="sm-qr-img"></div>
            <figcaption>${b.legenda ? `<strong>${esc(b.legenda)}</strong><br>` : ''}<span class="sm-qr-texto">${esc(b.texto)}</span></figcaption>
          </figure>`;
        case 'timer': return `
          <div class="sm-anim sm-timer" style="--d:${d++}" data-seg="${b.seg}">
            <div class="sm-timer-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="sm-timer-track"/><circle cx="60" cy="60" r="54" class="sm-timer-fill"/></svg><div class="sm-timer-display">${fmtTempo(b.seg)}</div></div>
            <div class="sm-timer-btns"><button type="button" data-timer="play">▶ Iniciar</button><button type="button" data-timer="reset">↺ Zerar</button></div>
          </div>`;
        default: return '';
      }
    }).join('');
  }

  // ---------- Identificação da aula (cabeçalho no topo do .md) ----------
  //   ---
  //   aula: 3
  //   data: 2026-09-30        (ou 30/09/2026)
  //   titulo: Introdução a Redes
  //   turma: 2º DS
  //   descricao: IP, máscara e gateway
  //   ---
  // Só vale se for a PRIMEIRA coisa do arquivo e todas as linhas forem
  // "chave: valor" — senão é só um "---" de separar slide, como sempre.
  // Chaves sem acento/maiúscula ("Título" = "titulo").
  function normChave(k) {
    return k.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  // "30/09/2026" ou "2026-09-30" → "2026-09-30"; outra coisa → ''.
  function normData(v) {
    let m = String(v || '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    m = String(v || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return '';
  }

  function lerMeta(md) {
    const texto = String(md || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    const m = texto.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
    const vazio = { meta: {}, corpo: texto };
    if (!m) return vazio;
    const linhas = m[1].split('\n').filter(l => l.trim());
    if (!linhas.length || !linhas.every(l => /^[^:#\-+>|`\s][^:]*:/.test(l))) return vazio;
    const meta = {};
    linhas.forEach(l => {
      const i = l.indexOf(':');
      meta[normChave(l.slice(0, i))] = l.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
    });
    if (meta.aula !== undefined) {
      const n = parseInt(meta.aula, 10);
      meta.aula = isNaN(n) ? meta.aula : n;
    }
    if (meta.data) meta.data = normData(meta.data);
    return { meta, corpo: texto.slice(m[0].length) };
  }

  const DIAS = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
  // "2026-09-30" → "qua., 30/09/2026" (curta: "30/09").
  function formatarData(iso, curta) {
    if (!iso) return '';
    const [a, mes, d] = iso.split('-');
    if (curta) return `${d}/${mes}`;
    const dia = new Date(Number(a), Number(mes) - 1, Number(d)).getDay();
    return `${DIAS[dia]}, ${d}/${mes}/${a}`;
  }

  // "Aula 03 · qua., 30/09/2026 · 2º DS" — etiqueta do slide de abertura e
  // do título da aba.
  function rotuloMeta(meta) {
    const partes = [];
    if (meta.aula !== undefined && meta.aula !== '') partes.push(`Aula ${typeof meta.aula === 'number' ? String(meta.aula).padStart(2, '0') : meta.aula}`);
    if (meta.data) partes.push(formatarData(meta.data));
    if (meta.turma) partes.push(meta.turma);
    return partes.join(' · ');
  }

  function parse(md, baseUrl) {
    const { meta, corpo } = lerMeta(md);
    const rotulo = rotuloMeta(meta);
    const slides = splitSlides(corpo).map((lines, i) => {
      const blocks = parseBlocks(lines, baseUrl);
      const primeiro = blocks[0];
      const kind = primeiro && primeiro.t === 'h' && primeiro.level === 1 ? 'title' : 'content';
      const temMidia = blocks.some(b => ['code', 'img', 'table', 'qr'].includes(b.t));
      // A abertura ganha a etiqueta "Aula 03 · data" acima do título.
      const chip = i === 0 && kind === 'title' && rotulo ? `<div class="sm-anim sm-meta-chip" style="--d:0">${esc(rotulo)}</div>` : '';
      return { kind, html: chip + renderBlocks(blocks), temMidia };
    });
    const h1 = corpo.match(/^#\s+(.+)$/m);
    return { titulo: meta.titulo || (h1 ? h1[1].trim() : ''), meta, rotulo, slides };
  }

  // ---------- Apresentação ----------
  const W = 1280, H = 720;

  function createPresenter(root, { onExit } = {}) {
    root.innerHTML = `
      <div class="sm-bg"><span></span><span></span><span></span></div>
      <div class="sm-stage-wrap"><div class="sm-stage"></div></div>
      <div class="sm-progress"><div></div></div>
      <div class="sm-hud">
        <button type="button" data-acao="prev" title="Anterior (←)">⟵</button>
        <span class="sm-count"></span>
        <button type="button" data-acao="next" title="Próximo (→ ou espaço)">⟶</button>
        <span class="sm-hud-sep"></span>
        <button type="button" data-acao="overview" title="Visão geral (O)">▦</button>
        <button type="button" data-acao="theme" title="Tema claro/escuro (T)">◐</button>
        <button type="button" data-acao="fullscreen" title="Tela cheia (F)">⛶</button>
        <button type="button" data-acao="exit" title="Sair (Esc)">✕</button>
      </div>
      <div class="sm-overview" hidden><div class="sm-overview-grid"></div></div>
    `;
    const stage = root.querySelector('.sm-stage');
    const overview = root.querySelector('.sm-overview');
    let deck = null, idx = 0, atual = null, hudTimer = 0;
    const timers = new Set();

    try { root.dataset.theme = localStorage.getItem('sm_tema') || 'dark'; } catch (e) { root.dataset.theme = 'dark'; }

    function fit() {
      const s = Math.min(window.innerWidth / W, window.innerHeight / H);
      stage.style.transform = `translate(-50%, -50%) scale(${s})`;
    }

    function realcarCodigo(el) {
      if (!window.hljs) return;
      el.querySelectorAll('pre code:not(.nohighlight)').forEach(c => { try { window.hljs.highlightElement(c); } catch (e) {} });
    }

    // QR Code em SVG (qrcode-generator, carregado pela página) — vetor,
    // então fica nítido em qualquer tamanho, inclusive ampliado. Correção de
    // erro "M" aguenta um projetor meio fora de foco. Sem a biblioteca,
    // fica só o link escrito embaixo.
    function desenharQrs(el) {
      el.querySelectorAll('.sm-qr').forEach(box => {
        const alvo = box.querySelector('.sm-qr-img');
        if (!window.qrcode) { alvo.remove(); return; }
        try {
          const qr = window.qrcode(0, 'M');
          qr.addData(box.dataset.qr);
          qr.make();
          alvo.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
        } catch (e) {
          alvo.remove();
        }
      });
    }

    function montarSlide(i) {
      const s = deck.slides[i];
      const el = document.createElement('section');
      el.className = `sm-slide sm-${s.kind}${s.temMidia ? ' sm-midia' : ''}`;
      el.innerHTML = `<div class="sm-slide-inner">${s.html}</div>`;
      realcarCodigo(el);
      desenharQrs(el);
      return el;
    }

    function pararTimers() {
      timers.forEach(t => clearInterval(t));
      timers.clear();
    }

    function ir(i, dir) {
      if (!deck || i < 0 || i >= deck.slides.length) return;
      const antigo = atual;
      pararTimers();
      idx = i;
      atual = montarSlide(i);
      atual.classList.add(dir < 0 ? 'sm-in-prev' : 'sm-in-next');
      stage.appendChild(atual);
      if (antigo) {
        antigo.classList.add(dir < 0 ? 'sm-out-prev' : 'sm-out-next');
        setTimeout(() => antigo.remove(), 650);
      }
      if (finalizar && i === deck.slides.length - 1) atual.appendChild(botaoFinalizar());
      root.querySelector('.sm-count').textContent = `${i + 1} / ${deck.slides.length}`;
      root.querySelector('.sm-progress > div').style.width = `${((i + 1) / deck.slides.length) * 100}%`;
      try { history.replaceState(null, '', `#${i + 1}`); } catch (e) {}
    }

    // "Finalizar aula" no último slide (só quando quem abriu passou
    // onFinalizar — ver abrir): é o ÚNICO jeito de a aula virar
    // "Concluída" na lista; chegar no fim sem clicar não conta.
    let finalizar = null;
    function botaoFinalizar() {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sm-finalizar' + (finalizar.feita ? ' sm-finalizada' : '');
      btn.textContent = finalizar.feita ? '✔ Aula concluída' : '✅ Finalizar aula';
      return btn;
    }
    function clicarFinalizar(btn) {
      if (!finalizar || finalizar.feita) return;
      finalizar.feita = true;
      btn.classList.add('sm-finalizada');
      btn.textContent = '✔ Aula concluída';
      confete(btn);
      finalizar.onFinalizar();
    }

    // Avançar primeiro esgota o que o slide ainda tem pra mostrar: próximo
    // item de uma lista "+", depois a resposta de uma pergunta — só então
    // vai pro próximo slide. Assim um passador de slides (que só manda
    // "próximo") conduz a aula inteira.
    function next() {
      const passo = atual && atual.querySelector('.sm-step:not(.sm-on)');
      if (passo) { passo.classList.add('sm-on'); return; }
      const quiz = atual && atual.querySelector('.sm-quiz:not(.sm-revealed)');
      if (quiz) { revelarQuiz(quiz); return; }
      ir(idx + 1, 1);
    }
    function prev() {
      const passos = atual ? atual.querySelectorAll('.sm-step.sm-on') : [];
      if (passos.length) { passos[passos.length - 1].classList.remove('sm-on'); return; }
      ir(idx - 1, -1);
    }

    function revelarQuiz(quiz) {
      quiz.classList.add('sm-revealed');
      const certa = quiz.querySelector('.sm-opt[data-ok="1"]');
      if (certa) confete(certa);
    }

    function confete(alvo) {
      const r = alvo.getBoundingClientRect();
      const cores = ['#4fd1c5', '#ff9466', '#ffd166', '#7c9cff', '#ff5c8a', '#7cff6b'];
      for (let k = 0; k < 36; k++) {
        const p = document.createElement('i');
        p.className = 'sm-confete';
        p.style.left = `${r.left + r.width / 2}px`;
        p.style.top = `${r.top + r.height / 2}px`;
        p.style.background = cores[k % cores.length];
        document.body.appendChild(p);
        const ang = Math.random() * Math.PI * 2;
        const dist = 120 + Math.random() * 220;
        p.animate([
          { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist + 160}px)) rotate(${Math.random() * 720}deg)`, opacity: 0 },
        ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => p.remove();
      }
    }

    function bip() {
      try {
        const C = window.AudioContext || window.webkitAudioContext;
        const c = new C();
        [0, 0.25, 0.5].forEach(t => {
          const o = c.createOscillator(), g = c.createGain();
          o.frequency.value = 880;
          g.gain.setValueAtTime(0.2, c.currentTime + t);
          g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.2);
          o.connect(g).connect(c.destination);
          o.start(c.currentTime + t);
          o.stop(c.currentTime + t + 0.22);
        });
      } catch (e) {}
    }

    function acaoTimer(box, acao) {
      const total = parseInt(box.dataset.seg, 10);
      const disp = box.querySelector('.sm-timer-display');
      const fill = box.querySelector('.sm-timer-fill');
      const btn = box.querySelector('[data-timer="play"]');
      const pintar = rest => {
        disp.textContent = fmtTempo(rest);
        fill.style.strokeDashoffset = String(339.3 * (1 - rest / total));
      };
      if (acao === 'reset') {
        clearInterval(box._t); timers.delete(box._t); box._t = 0;
        box._rest = total; box.classList.remove('sm-rodando', 'sm-fim');
        btn.textContent = '▶ Iniciar';
        pintar(total);
        return;
      }
      if (box._t) { // pausar
        clearInterval(box._t); timers.delete(box._t); box._t = 0;
        box.classList.remove('sm-rodando');
        btn.textContent = '▶ Continuar';
        return;
      }
      if (box._rest === undefined || box._rest <= 0) box._rest = total;
      box.classList.add('sm-rodando');
      box.classList.remove('sm-fim');
      btn.textContent = '⏸ Pausar';
      let fim = Date.now() + box._rest * 1000;
      box._t = setInterval(() => {
        box._rest = (fim - Date.now()) / 1000;
        pintar(box._rest);
        if (box._rest <= 0) {
          clearInterval(box._t); timers.delete(box._t); box._t = 0;
          box.classList.remove('sm-rodando');
          box.classList.add('sm-fim');
          btn.textContent = '▶ Iniciar';
          bip();
        }
      }, 200);
      timers.add(box._t);
    }

    function abrirOverview() {
      const grid = overview.querySelector('.sm-overview-grid');
      grid.innerHTML = '';
      deck.slides.forEach((s, i) => {
        const thumb = document.createElement('button');
        thumb.type = 'button';
        thumb.className = 'sm-thumb' + (i === idx ? ' sm-thumb-atual' : '');
        const slide = montarSlide(i);
        slide.classList.add('sm-estatico');
        slide.querySelectorAll('.sm-step').forEach(p => p.classList.add('sm-on'));
        thumb.innerHTML = `<span class="sm-thumb-num">${i + 1}</span>`;
        const mini = document.createElement('div');
        mini.className = 'sm-thumb-mini';
        mini.appendChild(slide);
        thumb.appendChild(mini);
        thumb.addEventListener('click', () => { fecharOverview(); ir(i, i < idx ? -1 : 1); });
        grid.appendChild(thumb);
      });
      overview.hidden = false;
      const atualThumb = grid.querySelector('.sm-thumb-atual');
      // Rola só a própria visão geral (scrollIntoView rolaria o palco junto).
      if (atualThumb) overview.scrollTop = atualThumb.offsetTop - overview.clientHeight / 2 + atualThumb.offsetHeight / 2;
    }
    function fecharOverview() { overview.hidden = true; }

    function alternarTema() {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('sm_tema', root.dataset.theme); } catch (e) {}
      document.dispatchEvent(new CustomEvent('sm-tema', { detail: root.dataset.theme }));
    }

    function telaCheia() {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else root.requestFullscreen().catch(() => {});
    }

    function sair() {
      pararTimers();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      root.hidden = true;
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', fit);
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
      if (onExit) onExit();
    }

    function onKey(e) {
      if (e.target.closest && e.target.closest('input, textarea')) return;
      const k = e.key;
      if (!overview.hidden) {
        if (k === 'Escape' || k === 'o' || k === 'O') { e.preventDefault(); fecharOverview(); }
        return;
      }
      // QR ampliado: Esc (ou Q) primeiro volta ao tamanho normal.
      const qrGrande = atual && atual.querySelector('.sm-qr-grande');
      if (qrGrande && (k === 'Escape' || k === 'q' || k === 'Q')) { e.preventDefault(); qrGrande.classList.remove('sm-qr-grande'); return; }
      if (k === 'q' || k === 'Q') { const q = atual && atual.querySelector('.sm-qr'); if (q) q.classList.add('sm-qr-grande'); return; }
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); next(); }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
      else if (k === 'Home') { e.preventDefault(); ir(0, -1); }
      else if (k === 'End') { e.preventDefault(); ir(deck.slides.length - 1, 1); }
      else if (k === 'o' || k === 'O') abrirOverview();
      else if (k === 't' || k === 'T') alternarTema();
      else if (k === 'f' || k === 'F') telaCheia();
      else if (k === 'r' || k === 'R') { const q = atual && atual.querySelector('.sm-quiz:not(.sm-revealed)'); if (q) revelarQuiz(q); }
      else if (k === 'Escape' && !document.fullscreenElement) sair();
    }

    root.addEventListener('click', e => {
      const acao = e.target.closest('[data-acao]');
      if (acao) {
        ({ prev, next, overview: abrirOverview, theme: alternarTema, fullscreen: telaCheia, exit: sair })[acao.dataset.acao]();
        return;
      }
      const opt = e.target.closest('.sm-opt');
      if (opt) {
        const quiz = opt.closest('.sm-quiz');
        if (opt.dataset.ok === '1') { opt.classList.add('sm-certa'); revelarQuiz(quiz); }
        else { opt.classList.remove('sm-errada'); void opt.offsetWidth; opt.classList.add('sm-errada'); }
        return;
      }
      const copy = e.target.closest('.sm-copy');
      if (copy) {
        const code = copy.closest('.sm-code').querySelector('code').innerText;
        (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => {
          copy.textContent = '✔ Copiado';
          setTimeout(() => { copy.textContent = 'Copiar'; }, 1400);
        }).catch(() => {});
        return;
      }
      const fin = e.target.closest('.sm-finalizar');
      if (fin) { clicarFinalizar(fin); return; }
      const tb = e.target.closest('[data-timer]');
      if (tb) { acaoTimer(tb.closest('.sm-timer'), tb.dataset.timer); return; }
      const qr = e.target.closest('.sm-qr');
      if (qr) { qr.classList.toggle('sm-qr-grande'); return; }
    });

    // Deslizar no celular/tablet.
    let toqueX = null;
    root.addEventListener('touchstart', e => { toqueX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', e => {
      if (toqueX === null) return;
      const dx = e.changedTouches[0].clientX - toqueX;
      if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
      toqueX = null;
    });

    // Barra de controles some sozinha com o mouse parado (pra projetar limpo).
    root.addEventListener('mousemove', () => {
      root.classList.add('sm-hud-on');
      clearTimeout(hudTimer);
      hudTimer = setTimeout(() => root.classList.remove('sm-hud-on'), 2500);
    });

    // opcoes.onFinalizar: mostra "Finalizar aula" no último slide e é
    // chamado no clique; opcoes.finalizada: a aula já estava concluída.
    function abrir(novoDeck, inicio = 0, opcoes = {}) {
      deck = novoDeck;
      finalizar = opcoes.onFinalizar ? { feita: !!opcoes.finalizada, onFinalizar: opcoes.onFinalizar } : null;
      stage.innerHTML = '';
      atual = null;
      root.hidden = false;
      fecharOverview();
      fit();
      window.addEventListener('resize', fit);
      document.removeEventListener('keydown', onKey);
      document.addEventListener('keydown', onKey);
      ir(Math.min(Math.max(inicio, 0), deck.slides.length - 1), 1);
    }

    return { abrir, sair };
  }

  return { parse, lerMeta, formatarData, rotuloMeta, createPresenter };
})();
