// Widget de tradução em Libras (VLibras) usado nas telas de atividade.
// Antes esse bloco (HTML do widget + <script> de terceiro) estava
// duplicado, byte a byte, em ~80 arquivos — centralizado aqui pra
// manutenção ficar num lugar só, e pra ganhar o mesmo tratamento de falha
// que a tela principal (plataforma.html) já tinha via setupVLibras():
// vlibras.gov.br é recurso de terceiro e pode ser bloqueado por proteção
// de rastreamento do navegador (ex: "Rastreamento" no Edge) sem disparar
// nenhum erro — antes disso, o botão simplesmente nunca aparecia, sem
// nenhuma pista pro aluno/professor do motivo.
(function () {
  var container = document.createElement('div');
  container.setAttribute('vw', '');
  container.className = 'enabled';
  container.innerHTML =
    '<div vw-access-button class="active"></div>' +
    '<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
  document.body.appendChild(container);

  function showFallback() {
    if (document.getElementById('vlibrasFallbackBtn')) return;
    var btn = document.createElement('button');
    btn.id = 'vlibrasFallbackBtn';
    btn.type = 'button';
    btn.textContent = '🤟';
    btn.title = 'Libras (VLibras) indisponível nesta tela';
    btn.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:9999;width:44px;height:44px;' +
      'border-radius:50%;border:none;background:#1a73e8;color:#fff;font-size:20px;cursor:pointer;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.35);';
    btn.addEventListener('click', function () {
      alert('O tradutor de Libras (VLibras) não carregou nesta tela — pode estar sendo bloqueado pelo ' +
        'navegador (ex: "Rastreamento" no Edge) ou por um bloqueador de anúncios. Tente de novo em ' +
        'alguns segundos, em outro navegador, ou libere vlibras.gov.br nas configurações de privacidade.');
    });
    document.body.appendChild(btn);
  }

  var script = document.createElement('script');
  script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
  script.onload = function () {
    try {
      if (window.VLibras) new window.VLibras.Widget('https://vlibras.gov.br/app');
    } catch (e) { showFallback(); }
    setTimeout(function () { if (!window.VLibras) showFallback(); }, 4000);
  };
  script.onerror = showFallback;
  document.body.appendChild(script);
})();
