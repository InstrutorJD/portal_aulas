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
// Estado (advertências/bloqueio) mora numa linha própria da MESMA tabela que
// shared/progress-sync.js usa (student_activity_state), com
// progress_key = `${activityLocation}__guard` — separada da linha de
// progresso do quiz em si (dona: shared/quiz-teoria-engine.js, que
// sobrescreve o objeto inteiro a cada resposta — guardar advertência ali
// dentro se perderia a cada pergunta respondida). Sem tabela nova no
// Supabase.
window.PortalExamGuard = (function () {
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
      activityLocation, username: null, sb: null,
      warnings: 0, blocked: false, armed: false, disabled: false, _handler: null
    };

    if (window.PortalSession) {
      const user = await window.PortalSession.getUser();
      if (user && user.role !== 'professor' && user.role !== 'admin' && user.email) {
        instance.username = user.email;
        instance.sb = window.PortalSession.client();
      }
    }

    // Sem sessão de aluno reconhecida (professor espiando pela Gestão pra
    // gerar slides/gabarito, ou atividade aberta fora do fluxo normal do
    // portal) — guarda desligada: nunca bloqueia, nunca conta advertência.
    if (!instance.username) {
      instance.disabled = true;
      return instance;
    }

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

    return instance;
  }

  // Liga o listener de troca de aba. onWarning(count) roda na 1ª saída;
  // onBlocked() roda na 2ª (a instância já está com blocked:true antes de
  // chamar). Não faz nada se a instância estiver desligada, já bloqueada,
  // ou já armada (evita listener duplicado).
  function arm(instance, { onWarning, onBlocked } = {}) {
    if (instance.disabled || instance.blocked || instance.armed) return;
    instance.armed = true;
    instance._handler = function () {
      if (!document.hidden) return; // só conta ao SAIR, não ao voltar
      if (quizCompleted(instance.activityLocation, instance.username)) return;

      instance.warnings++;
      if (instance.warnings >= 2) {
        instance.blocked = true;
        instance.armed = false;
        document.removeEventListener('visibilitychange', instance._handler, true);
        persist(instance);
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
    document.addEventListener('visibilitychange', instance._handler, true);
  }

  function disarm(instance) {
    if (instance._handler) document.removeEventListener('visibilitychange', instance._handler, true);
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
    return result;
  }

  return { create, arm, disarm, unlock };
})();
