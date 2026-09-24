// Ajudas de comportamento das PRÁTICAS do padrão novo de trilhas
// (docs/padrao-trilhas.md, seção 8) — par do shared/aula-base.css. Pequeno e
// sem dependências: a página continua dona da própria lógica (etapas,
// correção, progresso, visto); isto só dá o acabamento.
//
//   AulaBase.decorar(el, { chaveChecklist })
//     - cada <pre> vira uma "janela de editor" com botão Copiar (some
//       sozinho quando o professor bloqueia "Copiar e Colar" — ver
//       shared/clipboard-guard.js, classe .clipboard-guard-blocked);
//     - cada item de checklist (li.md-check, "- [ ]" no Markdown da página)
//       vira uma caixinha clicável que lembra o que o aluno marcou
//       (localStorage, na chave passada — uma por etapa).
//   AulaBase.transicao(el, direcao)   — entrada animada (1 = avançou, -1 = voltou)
//   AulaBase.teclado({ proximo, anterior }) — setas → e ← navegam
window.AulaBase = (function () {
  function bloqueado() {
    return document.documentElement.classList.contains('clipboard-guard-blocked');
  }

  function janelaDeCodigo(pre) {
    if (pre.closest('.ab-codigo')) return;
    const box = document.createElement('div');
    box.className = 'ab-codigo';
    box.innerHTML = '<div class="ab-codigo-barra"><span class="ab-dots"><i></i><i></i><i></i></span><button type="button" class="ab-copiar">Copiar</button></div>';
    pre.parentNode.insertBefore(box, pre);
    box.appendChild(pre);
    const btn = box.querySelector('.ab-copiar');
    btn.addEventListener('click', async () => {
      if (bloqueado()) return;
      const texto = pre.innerText;
      try {
        await navigator.clipboard.writeText(texto);
        btn.textContent = '✔ Copiado';
        btn.classList.add('ab-copiado');
      } catch (e) {
        btn.textContent = 'Selecione e copie';
      }
      setTimeout(() => { btn.textContent = 'Copiar'; btn.classList.remove('ab-copiado'); }, 1600);
    });
  }

  function checklist(el, chave) {
    const itens = el.querySelectorAll('li.md-check');
    if (!itens.length) return;
    let marcados = {};
    try { marcados = JSON.parse(localStorage.getItem(chave) || '{}') || {}; } catch (e) {}
    itens.forEach((li, i) => {
      const label = document.createElement('label');
      label.className = 'ab-check';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!marcados[i];
      const span = document.createElement('span');
      span.innerHTML = li.innerHTML;
      label.append(input, span);
      li.innerHTML = '';
      li.classList.add('ab-check-item');
      li.appendChild(label);
      input.addEventListener('change', () => {
        marcados[i] = input.checked;
        if (!chave) return;
        try { localStorage.setItem(chave, JSON.stringify(marcados)); } catch (e) {}
      });
    });
  }

  function decorar(el, { chaveChecklist } = {}) {
    if (!el) return;
    el.querySelectorAll('pre').forEach(janelaDeCodigo);
    checklist(el, chaveChecklist);
  }

  function transicao(el, direcao) {
    if (!el) return;
    el.classList.remove('ab-entra-prox', 'ab-entra-ant');
    void el.offsetWidth;
    el.classList.add(direcao < 0 ? 'ab-entra-ant' : 'ab-entra-prox');
  }

  function teclado({ proximo, anterior }) {
    document.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      // Só campos de DIGITAÇÃO seguram as setas — depois de clicar numa
      // caixinha do checklist, ← → continuam trocando de etapa.
      if (e.target.closest && e.target.closest('textarea, select, [contenteditable], input:not([type="checkbox"]):not([type="radio"])')) return;
      if (e.key === 'ArrowRight' && proximo) { e.preventDefault(); proximo(); }
      else if (e.key === 'ArrowLeft' && anterior) { e.preventDefault(); anterior(); }
    });
  }

  return { decorar, transicao, teclado };
})();
