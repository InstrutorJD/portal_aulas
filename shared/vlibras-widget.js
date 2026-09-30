// Widget de tradução em Libras (VLibras) usado nas telas de atividade e jogos.
// Antes esse bloco (HTML do widget + <script> de terceiro) estava
// duplicado, byte a byte, em ~80 arquivos — centralizado aqui pra
// manutenção ficar num lugar só, e pra ganhar o mesmo tratamento de falha
// que a tela principal (plataforma.html) já tinha via setupVLibras():
// vlibras.gov.br é recurso de terceiro e pode ser bloqueado por proteção
// de rastreamento do navegador (ex: "Rastreamento" no Edge) sem disparar
// nenhum erro — antes disso, o botão simplesmente nunca aparecia, sem
// nenhuma pista pro aluno/professor do motivo.
//
// Como o plugin 7.x funciona (conferido na 7.12.2):
// - vlibras.gov.br/app/vlibras-plugin.js redireciona pro cdn.jsdelivr.net e
//   é só um carregador pequeno (~2 KB): monta o botão azul em
//   #vlibras-access-wrapper (shadow DOM, no meio da borda direita) e ignora
//   o <div vw> (mantido abaixo só por compatibilidade com o plugin antigo).
// - O tradutor de verdade (avatar Unity/WebGL, alguns MB) só é baixado
//   quando o aluno clica no botão — então carregar o plugin em toda página
//   custa pouco.
// - Dentro da plataforma, a atividade abre num <iframe>: o 🤟 da barra de
//   acessibilidade chama window.VLibrasWidget.open() DESTE documento (ver
//   abrirLibras() em shared/platform-core.js), e a plataforma esconde o
//   botão dela enquanto o iframe está aberto, pra não ficarem dois.
(function () {
  if (window.__pfVLibrasCarregado) return;
  window.__pfVLibrasCarregado = true;

  var container = document.createElement('div');
  container.setAttribute('vw', '');
  container.className = 'enabled';
  container.innerHTML =
    '<div vw-access-button class="active"></div>' +
    '<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
  document.body.appendChild(container);

  function montou() { return !!document.getElementById('vlibras-access-wrapper'); }

  // Aviso pequeno, sem travar a tela (alert() bloqueava a atividade).
  function mostrarAviso(texto) {
    var box = document.getElementById('vlibrasAviso');
    if (!box) {
      box = document.createElement('div');
      box.id = 'vlibrasAviso';
      box.setAttribute('role', 'alert');
      box.style.cssText = 'position:fixed;right:10px;top:calc(50vh + 30px);z-index:2147483646;max-width:min(320px,calc(100vw - 20px));' +
        'background:#fff;color:#1b1b1b;border:2px solid #1351b4;border-radius:8px;padding:12px 36px 12px 12px;' +
        'font:14px/1.4 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.35);';
      var fechar = document.createElement('button');
      fechar.type = 'button';
      fechar.textContent = '✕';
      fechar.setAttribute('aria-label', 'Fechar aviso');
      fechar.style.cssText = 'position:absolute;top:6px;right:6px;border:none;background:none;font-size:16px;cursor:pointer;color:#1b1b1b;';
      fechar.addEventListener('click', function () { box.remove(); });
      var p = document.createElement('p');
      p.style.margin = '0';
      box.appendChild(fechar);
      box.appendChild(p);
      document.body.appendChild(box);
    }
    box.querySelector('p').textContent = texto;
  }

  var MSG_BLOQUEADO = 'O tradutor de Libras (VLibras) não carregou nesta tela — pode estar sendo bloqueado pelo ' +
    'navegador (ex: "Rastreamento" no Edge) ou por um bloqueador de anúncios. Tente de novo em ' +
    'alguns segundos, em outro navegador, ou libere vlibras.gov.br e cdn.jsdelivr.net nas configurações de privacidade.';

  function showFallback() {
    if (document.getElementById('vlibrasFallbackBtn') || montou()) return;
    var btn = document.createElement('button');
    btn.id = 'vlibrasFallbackBtn';
    btn.type = 'button';
    btn.textContent = '🤟';
    btn.title = 'Libras (VLibras) indisponível nesta tela';
    btn.setAttribute('aria-label', 'Libras (VLibras) indisponível nesta tela');
    // Mesmo lugar do botão azul de verdade (meio da borda direita), pra não
    // cobrir o "Próximo →" que fica embaixo à direita nas atividades.
    btn.style.cssText = 'position:fixed;right:10px;top:calc(50vh - 20px);z-index:9999;width:40px;height:40px;' +
      'border-radius:8px;border:none;background:#1351b4;color:#fff;font-size:20px;cursor:pointer;opacity:.75;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.35);';
    btn.addEventListener('click', function () { mostrarAviso(MSG_BLOQUEADO); });
    document.body.appendChild(btn);
  }

  // O app do tradutor só é baixado no clique do botão azul (ou no 🤟 da
  // plataforma). Se o navegador bloquear esse download, o plugin não avisa
  // nada — o aluno clica e nada acontece. Confere depois de um tempo.
  var vigiando = false;
  function vigiarAbertura() {
    if (vigiando) return;
    vigiando = true;
    setTimeout(function () {
      vigiando = false;
      if (!document.getElementById('vlibras-app-root')) {
        mostrarAviso('O tradutor de Libras (VLibras) demorou demais para abrir — a internet pode estar lenta ou o ' +
          'navegador está bloqueando vlibras.gov.br / cdn.jsdelivr.net. Tente de novo em alguns segundos.');
      }
    }, 20000);
  }
  // Clique dentro do shadow DOM chega aqui com o target no próprio wrapper.
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'vlibras-access-wrapper') vigiarAbertura();
  }, true);

  var script = document.createElement('script');
  script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
  script.onload = function () {
    try {
      if (window.VLibras) new window.VLibras.Widget('https://vlibras.gov.br/app');
    } catch (e) { showFallback(); }
    setTimeout(function () { if (!montou()) showFallback(); }, 4000);
  };
  script.onerror = showFallback;
  document.body.appendChild(script);
})();
