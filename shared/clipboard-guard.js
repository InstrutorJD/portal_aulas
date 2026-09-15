// Bloqueio de Ctrl+A/C/V/X ligado pelo professor, por turma (aba "Gestão"
// dentro de turmas/<turma>/plataforma.html). Quando ligado, também bloqueia
// clique/seleção em áreas de LEITURA (texto de instrução/enunciado e código
// de exemplo) — o aluno só interage com botões, campos de digitação (Central
// de Dados, desafios de JavaScript etc.) e outros controles reais. Ctrl+A
// selecionava a página inteira (inclusive código de exemplo) e dava pra
// arrastar/copiar o conteúdo mesmo com a página protegida contra clique —
// por isso o atalho de "selecionar tudo" é cortado junto com copiar/colar,
// não só o clique+arrasto nas áreas de leitura.
//
// IMPORTANTE — isso é um desincentivo pedagógico, não segurança de verdade:
// só intercepta copiar/colar DENTRO das páginas do portal. Um aluno pode
// contornar abrindo o DevTools, desativando JS, ou colando em outra janela.
// Não existe forma de um site impedir isso de verdade fora de si mesmo.
//
// Roda em toda página que o incluir (plataforma de cada turma + cada jogo/
// atividade, já que iframes são documentos separados e não herdam listeners
// do documento pai). Não afeta o professor.
(async function () {
  if (!window.PortalSession) return;
  const user = await window.PortalSession.getUser();
  if (!user || user.role === 'professor' || user.role === 'admin') return;

  // O bloqueio agora é ligado por turma (dentro do portal de cada uma), não mais global.
  const turma = user.turma || 'global';

  const sb = window.PortalSession.client();
  if (!sb) return;

  let blocked = false;
  let toastTimer = null;

  // Tags usadas SÓ pra conteúdo de leitura (texto de instrução/enunciado e
  // código de exemplo mostrado como referência) em todo o portal — nunca
  // pra controles interativos, que são sempre <button>, <input>/<textarea>
  // (onde o aluno digita código de verdade: Central de Dados, desafios de
  // JavaScript etc.) ou <div>/<span> com onclick próprio (cards de módulo,
  // alternativas de quiz). Por isso dá pra bloquear clique/seleção nessas
  // tags sem checar seletor específico de cada tipo de atividade.
  const READONLY_SELECTOR = 'p, pre, code, li, td, th, blockquote, dt, dd, h1, h2, h3, h4, h5, h6';
  const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, label, [contenteditable], [onclick]';

  function isReadOnlyTarget(el) {
    if (!el || typeof el.closest !== 'function') return false;
    if (el.closest(INTERACTIVE_SELECTOR)) return false;
    return !!el.closest(READONLY_SELECTOR);
  }

  // user-select:none é a 1ª linha de defesa (impede até seleção por
  // teclado/mobile); os handlers de mousedown/click abaixo cobrem o que o
  // CSS sozinho não pega e dão o mesmo aviso visual do copiar/colar.
  function injectReadOnlyStyle() {
    if (document.getElementById('__clipboardGuardStyle')) return;
    const style = document.createElement('style');
    style.id = '__clipboardGuardStyle';
    style.textContent = `html.clipboard-guard-blocked :is(${READONLY_SELECTOR}) { user-select: none; -webkit-user-select: none; }`;
    document.head.appendChild(style);
  }

  function onMousedownReadOnly(e) {
    if (!blocked || !isReadOnlyTarget(e.target)) return;
    e.preventDefault(); // corta a seleção por clique+arrasto antes de começar
  }

  function onClickReadOnly(e) {
    if (!blocked || !isReadOnlyTarget(e.target)) return;
    e.preventDefault();
    showToast();
  }

  function showToast() {
    let toast = document.getElementById('__clipboardGuardToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = '__clipboardGuardToast';
      toast.textContent = 'Copiar/colar e selecionar tudo desabilitados pelo professor.';
      toast.style.cssText = [
        'position:fixed', 'left:50%', 'bottom:18px', 'transform:translateX(-50%)',
        'background:#1a1a1a', 'color:#f5f5f5', 'font:600 12px system-ui,sans-serif',
        'padding:8px 16px', 'border-radius:4px', 'z-index:2147483647',
        'box-shadow:0 2px 10px rgba(0,0,0,.4)', 'pointer-events:none',
        'opacity:0', 'transition:opacity .15s ease',
      ].join(';');
      document.body.appendChild(toast);
    }
    toast.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 1600);
  }

  function onKeydown(e) {
    if (!blocked) return;
    const key = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (key === 'c' || key === 'v' || key === 'x' || key === 'a')) {
      e.preventDefault();
      e.stopPropagation();
      showToast();
      // Ctrl+A pode ter selecionado algo por outro caminho antes do
      // preventDefault (ex.: repetição de tecla) — limpa a seleção do
      // documento pra garantir que nada fica selecionável pra arrastar.
      if (key === 'a' && window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    }
  }

  function onClipboardEvent(e) {
    if (!blocked) return;
    e.preventDefault();
    showToast();
  }

  // "Pesquisar no Google por…" do menu de botão direito não passa pelo
  // evento 'copy' (é uma ação nativa do navegador que lê a seleção direto)
  // — sem bloquear o menu em si, o aluno contornava o Ctrl+C selecionando
  // o código e pesquisando: o texto selecionado vai inteiro pra barra de
  // busca do Google numa aba nova, sem clipboard-guard nenhum rodando lá,
  // e dá pra copiar dali à vontade.
  function onContextMenu(e) {
    if (!blocked) return;
    e.preventDefault();
    showToast();
  }

  document.addEventListener('keydown', onKeydown, true);
  document.addEventListener('copy', onClipboardEvent, true);
  document.addEventListener('cut', onClipboardEvent, true);
  document.addEventListener('paste', onClipboardEvent, true);
  document.addEventListener('contextmenu', onContextMenu, true);
  document.addEventListener('mousedown', onMousedownReadOnly, true);
  document.addEventListener('click', onClickReadOnly, true);
  injectReadOnlyStyle();

  async function fetchState() {
    const { data } = await sb
      .from('classroom_settings')
      .select('clipboard_blocked')
      .eq('id', turma)
      .maybeSingle();
    blocked = !!(data && data.clipboard_blocked);
    document.documentElement.classList.toggle('clipboard-guard-blocked', blocked);
  }

  function setupRealtime() {
    sb.channel('realtime_classroom_settings_' + turma)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classroom_settings', filter: `id=eq.${turma}` }, fetchState)
      .subscribe();
  }

  fetchState();
  setupRealtime();
})();
