// Passador de slides no celular para as ATIVIDADES do padrão novo (as que
// usam shared/aula-base.js — FinancApp, Cibersegurança, Phaser...). É o
// mesmo passador das apresentações do "Criar Material" (shared/slides-md.js,
// ver ligarRemoto lá), falando o MESMO protocolo com o mesmo celular
// (professor/controle.html):
//   - canal de broadcast do Supabase Realtime 'slides_remoto_<sala>', sem
//     tabela e sem SQL;
//   - o celular manda 'cmd' ({ acao: 'next' | 'prev' | 'revelar' | 'ola' });
//   - a tela responde 'estado' ({ aberta, i, total, titulo, aula, ... }).
// A sala fica no sessionStorage ('sm_sala_remoto', a mesma chave das
// apresentações): trocar de atividade na mesma aba do portal mantém o
// celular pareado, sem ler o QR de novo.
//
// Não é carregado direto pelas atividades: o AulaBase.teclado (aula-base.js)
// carrega este arquivo sozinho, só quando quem abriu é professor.
window.PassadorRemoto = (function () {
  const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const CHAVE_SALA = 'sm_sala_remoto';
  const BASE = (document.currentScript && document.currentScript.src) || location.href;
  const URL_CONTROLE = new URL('../professor/controle.html', BASE).href;
  const QR_LIB = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';

  const FORMATO_SALA = /^[A-HJ-NP-Z2-9]{8}$/; // o mesmo de slides-md.js
  function salaSalva() {
    try { const s = sessionStorage.getItem(CHAVE_SALA); return FORMATO_SALA.test(s || '') ? s : ''; } catch (e) { return ''; }
  }
  function codigoSala() {
    let sala = salaSalva();
    if (!sala) {
      const sorteio = new Uint8Array(8);
      crypto.getRandomValues(sorteio);
      sala = Array.from(sorteio, n => LETRAS[n % LETRAS.length]).join('');
      try { sessionStorage.setItem(CHAVE_SALA, sala); } catch (e) {}
    }
    return sala;
  }
  function carregarQr() {
    return new Promise(resolve => {
      if (window.qrcode) { resolve(); return; }
      const s = document.createElement('script');
      s.src = QR_LIB;
      s.onload = resolve;
      s.onerror = resolve; // sem QR ainda dá pra digitar o código no celular
      document.head.appendChild(s);
    });
  }

  // client(): cliente do Supabase; proximo/anterior: mesmas ações das
  // setas; estado(): { i, total, titulo, aula } da tela agora; botaoEm:
  // onde o botão 📱 entra.
  function iniciar({ client, proximo, anterior, estado, botaoEm }) {
    let canal = null, pronto = false, ultimo = '', painel = null;

    function ligar() {
      if (canal) return;
      let sb = null;
      try { sb = client(); } catch (e) {}
      if (!sb || typeof sb.channel !== 'function') return;
      canal = sb.channel('slides_remoto_' + codigoSala(), { config: { broadcast: { self: false } } });
      canal.on('broadcast', { event: 'cmd' }, ({ payload }) => {
        const acao = payload && payload.acao;
        if (acao === 'ola') conectou();
        else if (acao === 'next' && proximo) proximo();
        else if (acao === 'prev' && anterior) anterior();
        // A etapa nova é desenhada na hora; responde logo em seguida.
        setTimeout(() => enviar(true), 80);
      }).subscribe(status => {
        pronto = status === 'SUBSCRIBED';
        if (pronto) enviar(true);
      });
    }

    function enviar(sempre) {
      if (!canal || !pronto) return;
      const e = Object.assign({ aberta: true, tipo: 'atividade', semRevelar: true }, estado());
      const txt = JSON.stringify(e);
      if (!sempre && txt === ultimo) return;
      ultimo = txt;
      canal.send({ type: 'broadcast', event: 'estado', payload: e }).catch(() => {});
    }

    function conectou() {
      if (!painel || painel.hidden) return;
      painel.querySelector('.ab-passador-status').textContent = '✔ Celular conectado!';
      painel.classList.add('ab-passador-ok');
      setTimeout(() => { painel.hidden = true; }, 1200);
    }

    function montarPainel() {
      painel = document.createElement('div');
      painel.className = 'ab-passador';
      painel.hidden = true;
      painel.innerHTML = `
        <div class="ab-passador-card" role="dialog" aria-label="Passador de slides no celular">
          <h3>📱 Passador de slides no celular</h3>
          <div class="ab-passador-qr"></div>
          <p>Aponte a câmera do celular para o QR Code. Na primeira vez, entre com o seu login de professor.</p>
          <p>Se a câmera não ler, abra <a class="ab-passador-link" target="_blank" rel="noopener"></a> no celular e digite o código:</p>
          <div class="ab-passador-codigo"></div>
          <p class="ab-passador-status">Aguardando o celular…</p>
          <button type="button" class="btn btn-secondary">Fechar</button>
        </div>`;
      painel.addEventListener('click', e => { if (e.target === painel) painel.hidden = true; });
      painel.querySelector('button').addEventListener('click', () => { painel.hidden = true; });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && painel && !painel.hidden) painel.hidden = true; });
      document.body.appendChild(painel);
    }

    async function abrir() {
      ligar();
      if (!painel) montarPainel();
      const sala = codigoSala();
      const url = `${URL_CONTROLE}#${sala}`;
      painel.querySelector('.ab-passador-codigo').textContent = `${sala.slice(0, 4)}-${sala.slice(4)}`;
      const link = painel.querySelector('.ab-passador-link');
      link.href = URL_CONTROLE;
      link.textContent = URL_CONTROLE.replace(/^https?:\/\//, '');
      painel.querySelector('.ab-passador-status').textContent = canal ? 'Aguardando o celular…' : 'Não deu para conectar ao servidor. Confira a internet.';
      painel.classList.remove('ab-passador-ok');
      painel.hidden = false;
      await carregarQr();
      const qrEl = painel.querySelector('.ab-passador-qr');
      qrEl.innerHTML = '';
      if (window.qrcode) {
        try {
          // Mesmos ajustes do QR das apresentações: correção "L" e 4
          // módulos de borda branca, pra ler de perto numa tela de notebook.
          const qr = window.qrcode(0, 'L');
          qr.addData(url);
          qr.make();
          qrEl.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 32, scalable: true });
        } catch (e) {}
      }
    }

    if (botaoEm) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ab-passador-btn';
      btn.title = 'Passar as etapas pelo celular';
      btn.textContent = '📱';
      btn.addEventListener('click', abrir);
      botaoEm.appendChild(btn);
    }

    // Qualquer troca de etapa (setas, botões da página, celular) redesenha
    // a tela — observa isso e manda o estado novo pro celular.
    let espera = 0;
    new MutationObserver(() => {
      clearTimeout(espera);
      espera = setTimeout(() => enviar(false), 150);
    }).observe(document.body, { subtree: true, childList: true, characterData: true });

    // Já pareou nesta aba (outra atividade ou uma apresentação)? Liga o
    // canal sozinho: o celular continua passando as etapas sem QR novo.
    if (salaSalva()) ligar();

    return { abrir };
  }

  return { iniciar };
})();
