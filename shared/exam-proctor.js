// Proctor de "saiu do portal durante o questionário" — nasceu pro
// questionário de Modelagem de Dados e Requisitos
// (turmas/sistemas/atividades/modelagem-dados-requisitos-questionario.html),
// mas é genérico: qualquer atividade avaliativa nova que precise da mesma
// regra pode incluir este arquivo e usar o mesmo `create()`/`arm()`.
//
// Regra: só conta a partir do momento que o aluno clica em "Iniciar" (quem
// chama arm()). Se a ABA/JANELA do navegador sai de foco enquanto o
// questionário ainda não foi concluído, conta 1 advertência. Na 2ª, a
// atividade fica bloqueada — só o professor libera de novo, com o mesmo
// token de 6 dígitos que ele já usa pra "Dar visto"/"Pular etapa" em outras
// atividades (ver shared/professor-visto.js — reaproveitado aqui tal e
// qual, sem token novo nem tela nova pro professor aprender).
//
// Importante: NÃO usa o evento 'blur' de propósito. A atividade roda dentro
// de um <iframe> da plataforma (ver o comentário no topo de
// shared/activity-tracker.js) — 'blur' dispararia até clicando em qualquer
// canto da própria página do portal, FORA do iframe mas ainda dentro do
// portal (ex.: abrir o menu de acessibilidade), o que seria falso positivo.
// 'visibilitychange'/`document.hidden` só muda quando a aba/janela do
// navegador sai de foco de verdade (troca de aba, minimiza, troca de app) —
// é a mesma leitura que shared/activity-tracker.js já usa pra status idle.
//
// Só que com a TELA DIVIDIDA (ChatGPT numa janela, portal na outra) o
// portal continua visível e `document.hidden` nunca muda — por isso arm()
// também confere o FOCO a cada meio segundo (ver isPortalFocused): se o foco
// ficar fora do portal inteiro por FOCUS_GRACE_MS, conta advertência igual
// a trocar de aba. A checagem é feita no documento do TOPO (a plataforma),
// que continua "com foco" enquanto o aluno clica dentro do iframe da
// atividade ou em qualquer canto do portal — o falso positivo do 'blur'
// acima não acontece.
//
// Toda prova também liga o bloqueio de copiar/colar/arrastar
// (shared/clipboard-guard.js) mesmo que a Gestão esteja com "Copiar e
// Colar" liberado, e mostra uma faixa fixa com essas regras (ver
// lockClipboardAndShowRules).
//
// Estado (advertências/bloqueio) mora numa linha própria da MESMA tabela que
// shared/progress-sync.js usa (student_activity_state), com
// progress_key = `${activityLocation}__guard` — separada da linha de
// progresso do quiz em si (dona: shared/quiz-teoria-engine.js, que
// sobrescreve o objeto inteiro a cada resposta — guardar advertência ali
// dentro se perderia a cada pergunta respondida). Sem tabela nova no
// Supabase.
window.PortalExamGuard = (function () {
  const FOCUS_POLL_MS = 500;
  const FOCUS_GRACE_MS = 1500;

  function isPortalFocused() {
    try {
      return window.top.document.hasFocus();
    } catch (e) {
      return document.hasFocus(); // topo de outra origem — cai pro próprio documento
    }
  }

  function lockClipboardAndShowRules() {
    window.__PORTAL_EXAM_LOCK__ = true;
    window.dispatchEvent(new Event('portal-exam-lock'));
    if (document.getElementById('__examRulesBar')) return;
    const bar = document.createElement('div');
    bar.id = '__examRulesBar';
    bar.setAttribute('role', 'note');
    bar.innerHTML = '🔒 <b>Modo prova:</b> copiar, colar e arrastar texto estão bloqueados. '
      + 'Trocar de aba, minimizar ou clicar em outra janela (inclusive com a tela dividida) conta <b>advertência</b> — na 2ª, a prova é <b>bloqueada</b>.';
    bar.style.cssText = [
      'position:sticky', 'top:0', 'z-index:2147483646', 'margin:0',
      'background:#7f1d1d', 'color:#fff', 'font:600 12px/1.4 system-ui,sans-serif',
      'padding:6px 12px', 'text-align:center', 'box-shadow:0 1px 6px rgba(0,0,0,.35)',
    ].join(';');
    const insert = () => document.body.insertBefore(bar, document.body.firstChild);
    if (document.body) insert();
    else document.addEventListener('DOMContentLoaded', insert, { once: true });
  }

  function localKey(activityLocation, username) {
    return `${activityLocation}_guard_${username}`;
  }

  function readLocal(activityLocation, username) {
    try {
      return JSON.parse(localStorage.getItem(localKey(activityLocation, username)) || 'null');
    } catch (e) {
      return null;
    }
  }

  function writeLocal(activityLocation, username, state) {
    try {
      localStorage.setItem(localKey(activityLocation, username), JSON.stringify(state));
    } catch (e) { /* localStorage indisponível (modo privado etc.) — segue só em memória */ }
  }

  // O quiz-teoria-engine grava `{ lastStepIndex, correctCount, completed }`
  // nessa chave (ver PROGRESS_KEY em shared/quiz-teoria-engine.js). Uma vez
  // completed:true, sair da aba não é mais risco de cola — não conta advertência.
  function quizCompleted(activityLocation, username) {
    try {
      const data = JSON.parse(localStorage.getItem(`${activityLocation}_progress_${username}`) || 'null');
      return !!(data && data.completed);
    } catch (e) {
      return false;
    }
  }

  function persist(instance) {
    if (instance.disabled) return;
    const state = { warnings: instance.warnings, blocked: instance.blocked, updatedAt: new Date().toISOString() };
    writeLocal(instance.activityLocation, instance.username, state);
    if (instance.sb) {
      instance.sb.from('student_activity_state').upsert({
        student_email: instance.username,
        progress_key: `${instance.activityLocation}__guard`,
        state,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_email,progress_key' }).then(() => {}, () => {});
    }
  }

  // create(activityLocation) -> instância ligada a UM aluno/atividade.
  //
  // Uso típico:
  //   const guard = await window.PortalExamGuard.create('modelagem_dados_requisitos_questionario');
  //   if (guard.blocked) { renderBloqueado(guard); }
  //   else { renderTelaInicial(() => { window.PortalExamGuard.arm(guard, {...}); iniciarQuiz(); }); }
  async function create(activityLocation) {
    const instance = {
      activityLocation, username: null, sb: null, turma: null, studentName: null,
      warnings: 0, blocked: false, armed: false, disabled: false, _handler: null, _focusTimer: null, _away: false, _remoteUnlockChannel: null
    };

    if (window.PortalSession) {
      // getUser() pode rejeitar (Supabase fora do ar, mal configurado etc.)
      // — nesse caso trata igual a "sem sessão reconhecida" (guarda
      // desligada) em vez de deixar a Promise de create() rejeitar e travar
      // a atividade inteira numa tela em branco pro aluno.
      try {
        const user = await window.PortalSession.getUser();
        if (user && user.role !== 'professor' && user.role !== 'admin' && user.email) {
          instance.username = user.email;
          instance.studentName = user.nome || null;
          instance.turma = user.turma || null;
          instance.sb = window.PortalSession.client();
        }
      } catch (e) { /* segue com instance.username null — vira disabled abaixo */ }
    }

    // Sem sessão de aluno reconhecida (professor espiando pela Gestão pra
    // gerar slides/gabarito, ou atividade aberta fora do fluxo normal do
    // portal) — guarda desligada: nunca bloqueia, nunca conta advertência.
    if (!instance.username) {
      instance.disabled = true;
      return instance;
    }

    lockClipboardAndShowRules();

    const local = readLocal(activityLocation, instance.username) || {};
    instance.warnings = local.warnings || 0;
    instance.blocked = !!local.blocked;

    // Reconcilia com o Supabase (troca de computador) — mesmo espírito do
    // isRemoteFurtherAlong de shared/progress-sync.js: só o estado "mais
    // grave" (bloqueado, ou mais advertências) é que deve prevalecer.
    if (instance.sb) {
      try {
        const { data } = await instance.sb.from('student_activity_state')
          .select('state')
          .eq('student_email', instance.username)
          .eq('progress_key', `${activityLocation}__guard`)
          .maybeSingle();
        const remote = data && data.state;
        if (remote) {
          const remoteFurther = (!!remote.blocked && !instance.blocked) || ((remote.warnings || 0) > instance.warnings);
          if (remoteFurther) {
            instance.warnings = remote.warnings || 0;
            instance.blocked = !!remote.blocked;
            writeLocal(activityLocation, instance.username, { warnings: instance.warnings, blocked: instance.blocked });
          }
        }
      } catch (e) { /* best-effort — localStorage já é a fonte confiável local */ }
    }

    // Já chega bloqueado (reload, ou troca de dispositivo) — liga a escuta
    // de liberação remota igual a um bloqueio que acabou de acontecer nesta
    // mesma aba (ver watchForRemoteUnlock).
    if (instance.blocked) watchForRemoteUnlock(instance);

    return instance;
  }

  // Assina exam_guard_events em tempo real pra recarregar a atividade
  // sozinha assim que o PROFESSOR clicar "Liberar" no sino de alertas
  // (ver setupExamGuardAlerts em shared/platform-core.js). Sem isso, um
  // "Liberar" clicado remotamente só valeria depois que o aluno recarregar
  // a página por conta própria — o professor ficaria achando que já
  // liberou, mas o aluno continuaria preso na tela de bloqueio.
  function watchForRemoteUnlock(instance) {
    if (instance.disabled || !instance.sb || instance._remoteUnlockChannel) return;
    instance._remoteUnlockChannel = instance.sb
      .channel('realtime_exam_guard_owner_' + instance.username)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'exam_guard_events', filter: `student_email=eq.${instance.username}` }, (payload) => {
        const row = payload.new;
        if (row && row.activity_location === instance.activityLocation && row.resolved && row.resolution === 'liberado') {
          writeLocal(instance.activityLocation, instance.username, { warnings: 0, blocked: false });
          window.location.reload();
        }
      })
      .subscribe();
  }

  // Liga o listener de troca de aba. onWarning(count) roda na 1ª saída;
  // onBlocked() roda na 2ª (a instância já está com blocked:true antes de
  // chamar). Não faz nada se a instância estiver desligada, já bloqueada,
  // ou já armada (evita listener duplicado).
  //
  // `isCompleted` é opcional — por padrão usa quizCompleted() (progresso no
  // formato `{ completed: true }` do quiz-teoria-engine). Atividades com
  // outro formato de progresso (ex.: array de ids resolvidos, como a
  // prática de Depuração) podem passar sua própria função pra reconhecer
  // "já terminei tudo, sair da aba não é mais risco" nesse formato.
  function arm(instance, { onWarning, onBlocked, isCompleted } = {}) {
    if (instance.disabled || instance.blocked || instance.armed) return;
    instance.armed = true;
    const hasFinished = typeof isCompleted === 'function'
      ? isCompleted
      : () => quizCompleted(instance.activityLocation, instance.username);
    // Conta UMA advertência por saída: trocar de aba costuma disparar as
    // duas detecções (visibilitychange E perda de foco) — `_away` segura
    // até o aluno voltar pro portal (visível e com foco).
    instance._away = false;
    const registerLeave = function () {
      if (instance._away) return;
      instance._away = true;
      if (hasFinished()) return;

      instance.warnings++;
      if (instance.warnings >= 2) {
        instance.blocked = true;
        instance.armed = false;
        stopListening(instance);
        persist(instance);
        // Avisa o professor (sino de alertas em shared/platform-core.js) —
        // só no BLOQUEIO de verdade (2ª saída), não a cada advertência
        // isolada: é o momento em que o aluno efetivamente saiu de uma
        // atividade/prova que não podia sair.
        if (instance.sb) {
          instance.sb.from('exam_guard_events').insert({
            student_email: instance.username,
            student_name: instance.studentName,
            turma: instance.turma,
            activity_location: instance.activityLocation,
            warnings: instance.warnings,
            resolved: false
          }).then(() => {}, () => {});
        }
        watchForRemoteUnlock(instance);
        if (typeof window.reportActivity === 'function') {
          window.reportActivity(instance.activityLocation, 'Questionário BLOQUEADO — saiu do portal 2x', { blocked: true });
        }
        if (onBlocked) onBlocked();
      } else {
        persist(instance);
        if (typeof window.reportActivity === 'function') {
          window.reportActivity(instance.activityLocation, `Questionário — advertência ${instance.warnings}/2 (saiu do portal)`, { warnings: instance.warnings });
        }
        if (onWarning) onWarning(instance.warnings);
      }
    };
    instance._handler = function () {
      if (document.hidden) registerLeave(); // só conta ao SAIR, não ao voltar
      else if (isPortalFocused()) instance._away = false;
    };
    let unfocusedSince = null;
    instance._focusTimer = setInterval(() => {
      if (!document.hidden && isPortalFocused()) {
        unfocusedSince = null;
        instance._away = false;
        return;
      }
      if (unfocusedSince === null) unfocusedSince = Date.now();
      if (Date.now() - unfocusedSince >= FOCUS_GRACE_MS) registerLeave();
    }, FOCUS_POLL_MS);
    document.addEventListener('visibilitychange', instance._handler, true);
  }

  function stopListening(instance) {
    if (instance._handler) document.removeEventListener('visibilitychange', instance._handler, true);
    if (instance._focusTimer) clearInterval(instance._focusTimer);
    instance._focusTimer = null;
  }

  function disarm(instance) {
    stopListening(instance);
    instance.armed = false;
  }

  // Desbloqueia com o token de 6 dígitos do professor — mesmo token/fluxo de
  // shared/professor-visto.js, sem tela nova pro professor aprender.
  async function unlock(instance, token) {
    if (!window.PortalProfessorVisto) {
      return { ok: false, erro: 'Verificação indisponível nesta tela.' };
    }
    const result = await window.PortalProfessorVisto.verificarToken(token);
    if (!result.ok) return result;
    instance.warnings = 0;
    instance.blocked = false;
    persist(instance);
    // Desbloqueio pelo token físico (professor presente, sem passar pelo
    // sino) — fecha o alerta pendente também, senão ele fica pra sempre na
    // lista do professor mesmo depois de o aluno já estar liberado.
    if (instance.sb) {
      instance.sb.from('exam_guard_events')
        .update({ resolved: true, resolution: 'liberado', resolved_at: new Date().toISOString() })
        .eq('student_email', instance.username)
        .eq('activity_location', instance.activityLocation)
        .eq('resolved', false)
        .then(() => {}, () => {});
    }
    return result;
  }

  return { create, arm, disarm, unlock };
})();
