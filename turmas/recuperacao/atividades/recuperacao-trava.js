// Trava "não sair da tela" da Recuperação (teoria e jogo). Reaproveita a
// mesma regra das provas (shared/exam-proctor.js): trocar de aba,
// minimizar ou clicar em outra janela — inclusive com a TELA DIVIDIDA —
// conta advertência; na 2ª, a atividade fica bloqueada até o professor
// liberar (token de 6 dígitos, shared/professor-visto.js, ou "Liberar" no
// sino de alertas da Gestão). Também bloqueia copiar/colar/arrastar.
//
// Só vale pra aluno: professor (e a Gestão gerando gabarito) abre direto.
// Atividade já concluída também abre direto — não há mais o que proteger.
//
// Incluir depois de supabase-config.js, @supabase/supabase-js, session.js,
// professor-visto.js e exam-proctor.js. Uso:
//   RecuperacaoTrava.iniciar({ activityLocation, nome, isCompleted });
// Enquanto a tela de regras/bloqueio estiver aberta, RecuperacaoTrava.ativa()
// devolve true (o jogo usa isso pra ficar pausado).
window.RecuperacaoTrava = (function () {
  let ativa = false;
  let overlayEl = null;

  function fechar() {
    if (overlayEl) overlayEl.remove();
    overlayEl = null;
    ativa = false;
  }

  function abrir(html) {
    fechar();
    ativa = true;
    overlayEl = document.createElement('div');
    overlayEl.id = 'recuperacaoTrava';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2147483000', 'display:flex', 'align-items:center',
      'justify-content:center', 'padding:16px', 'background:rgba(2,6,2,0.94)',
    ].join(';');
    overlayEl.innerHTML = `
      <div style="max-width:520px; width:100%; background:var(--panel,#10140f); border:1px solid var(--green-dim,#4a9a2a);
                  color:var(--ink,#d9e6d2); padding:20px 22px; text-align:center; font-size:13.5px; line-height:1.6;">
        ${html}
      </div>`;
    document.body.appendChild(overlayEl);
  }

  const btnStyle = 'font-family:inherit; font-weight:800; font-size:12px; letter-spacing:1px; text-transform:uppercase;'
    + ' background:var(--green,#7cff3f); color:#04220a; border:none; padding:10px 20px; cursor:pointer; border-radius:2px;';

  // A faixa "Modo prova" do exam-proctor entra no topo do <body>; aqui ela
  // vai pra dentro do .env (coluna flex das duas páginas), pra não empurrar
  // o jogo pra fora da tela, e ganha o texto da Recuperação.
  function ajustarFaixa() {
    const bar = document.getElementById('__examRulesBar');
    if (!bar) return;
    bar.innerHTML = '🔒 <b>Recuperação:</b> copiar e colar estão bloqueados. '
      + 'Trocar de aba, minimizar ou clicar em outra janela (inclusive com a tela dividida) conta <b>advertência</b> — na 2ª, a atividade é <b>bloqueada</b>.';
    const env = document.querySelector('.env');
    if (env) {
      bar.style.position = 'static';
      bar.style.flexShrink = '0';
      env.insertBefore(bar, env.firstChild);
    }
  }

  function telaInicio(guard, opts) {
    abrir(`
      <div style="font-size:44px;">🔒</div>
      <h2 style="font-family:var(--user-font-display,'VT323',monospace); font-size:26px; color:var(--yellow,#d4c86a); margin:6px 0 10px;">Antes de começar</h2>
      <p>${opts.nome} é uma atividade de <b>recuperação</b>: faça sozinho(a), sem sair desta tela.</p>
      <p>Trocar de aba, minimizar, abrir outro programa ou clicar em outra janela — <b>inclusive com a tela dividida</b> — conta <b>1 aviso</b>. No <b>2º aviso</b>, a atividade fica bloqueada até o professor liberar.</p>
      <p>Copiar e colar também estão bloqueados.</p>
      <div style="margin-top:14px;"><button id="btnTravaComecar" style="${btnStyle}">▶ Começar</button></div>
    `);
    document.getElementById('btnTravaComecar').addEventListener('click', () => {
      fechar();
      window.PortalExamGuard.arm(guard, {
        onWarning: (n) => telaAviso(n),
        onBlocked: () => telaBloqueada(guard, opts),
        isCompleted: opts.isCompleted
      });
    });
  }

  function telaAviso(n) {
    abrir(`
      <div style="font-size:44px;">⚠️</div>
      <h2 style="font-family:var(--user-font-display,'VT323',monospace); font-size:26px; color:var(--blood-bright,#ff3b30); margin:6px 0 10px;">Aviso ${n}/2</h2>
      <p>Você saiu da tela da recuperação. Na <b>2ª vez</b>, a atividade fica <b>bloqueada</b> até o professor liberar.</p>
      <div style="margin-top:14px;"><button id="btnTravaOk" style="${btnStyle}">Entendi</button></div>
    `);
    document.getElementById('btnTravaOk').addEventListener('click', fechar);
  }

  function telaBloqueada(guard, opts) {
    abrir(`
      <div style="font-size:44px;">🔒</div>
      <h2 style="font-family:var(--user-font-display,'VT323',monospace); font-size:26px; color:var(--blood-bright,#ff3b30); margin:6px 0 10px;">Atividade bloqueada</h2>
      <p>Você saiu da tela 2 vezes. Chame o professor: ele libera com o token de "Dar visto" (Gestão → Token) ou pelo sino de alertas.</p>
      <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:12px;">
        <input type="text" id="travaToken" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="Token"
               style="font-family:inherit; font-size:15px; width:120px; text-align:center; background:#020402; color:var(--green,#7cff3f); border:1px solid var(--line,#223022); padding:8px;">
        <button id="btnTravaDesbloquear" style="${btnStyle}">Desbloquear</button>
      </div>
      <div id="travaMsg" style="display:none; margin-top:10px; color:var(--blood-bright,#ff3b30); font-size:12.5px;"></div>
    `);
    const btn = document.getElementById('btnTravaDesbloquear');
    const msg = document.getElementById('travaMsg');
    btn.addEventListener('click', async () => {
      msg.style.display = 'none';
      btn.disabled = true;
      const r = await window.PortalExamGuard.unlock(guard, document.getElementById('travaToken').value);
      btn.disabled = false;
      if (!r.ok) { msg.textContent = r.erro; msg.style.display = 'block'; return; }
      telaInicio(guard, opts);
    });
  }

  async function iniciar(opts) {
    if (!window.PortalExamGuard) return;
    // Pausa desde já (o jogo não anda por trás enquanto a trava carrega).
    ativa = true;
    let guard;
    try { guard = await window.PortalExamGuard.create(opts.activityLocation); } catch (e) { ativa = false; return; }
    if (guard.disabled || (opts.isCompleted && opts.isCompleted())) { ativa = false; return; }
    ajustarFaixa();
    if (guard.blocked) telaBloqueada(guard, opts);
    else telaInicio(guard, opts);
  }

  return { iniciar, ativa: () => ativa };
})();
