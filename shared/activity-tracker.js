(async function () {
  const HEARTBEAT_MS = 15000;
  const IDLE_TIMEOUT_MS = 120000;

  if (!window.PortalSession) return;

  // plataforma.html já resolveu a identidade (via sessão) e injeta esses
  // globais antes de carregar este script (ver shared/platform-core.js);
  // fora desse caminho (atividade/jogo aberto direto), resolve a própria
  // sessão aqui.
  let role = window.ACTIVITY_STUDENT_ROLE;
  let studentEmail = window.ACTIVITY_STUDENT_EMAIL;
  let studentName = window.ACTIVITY_STUDENT_NAME;
  let studentTurma = window.ACTIVITY_STUDENT_TURMA;

  if (!studentEmail) {
    const user = await window.PortalSession.getUser();
    if (!user) return;
    role = user.role;
    studentEmail = user.email;
    studentName = user.nome;
    studentTurma = user.turma;
  }

  // Não rastreamos professor/admin — o painel é para acompanhar alunos.
  if (role === 'professor' || role === 'admin') {
    return;
  }

  studentEmail = (studentEmail || '').trim();
  if (!studentEmail) {
    return;
  }

  studentName = studentName || studentEmail;
  studentTurma = studentTurma || null;

  const sb = window.PortalSession.client();
  if (!sb) return;

  let currentLocation = window.ACTIVITY_LOCATION || 'desconhecido';
  let currentLabel = window.ACTIVITY_LABEL || null;
  let currentDetail = window.ACTIVITY_DETAIL || null;
  let paused = false;
  let lastInteraction = Date.now();

  ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(evt => {
    document.addEventListener(evt, () => { lastInteraction = Date.now(); }, { passive: true });
  });

  function computeStatus() {
    if (document.hidden) return 'idle';
    if (Date.now() - lastInteraction > IDLE_TIMEOUT_MS) return 'idle';
    return 'active';
  }

  async function sendHeartbeat() {
    if (paused) return;

    const payload = {
      student_email: studentEmail,
      student_name: studentName,
      turma: studentTurma,
      status: computeStatus(),
      location: currentLocation,
      location_label: currentLabel,
      detail: currentDetail,
      last_interaction_at: new Date(lastInteraction).toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await sb.from('student_activity').upsert(payload, { onConflict: 'student_email' });
    } catch (err) {
      // presença é best-effort: nunca deve travar a experiência do aluno
    }
  }

  // API pública usada pelas páginas para reportar onde o aluno está
  window.reportActivity = function (location, label, detail) {
    currentLocation = location || currentLocation;
    currentLabel = label !== undefined ? label : currentLabel;
    currentDetail = detail !== undefined ? detail : currentDetail;
    sendHeartbeat();
  };

  // Usado pela plataforma.html quando um iframe (jogo/módulo) assume o rastreamento
  window.pauseActivityHeartbeat = function () {
    paused = true;
  };

  window.resumeActivityHeartbeat = function (location, label, detail) {
    paused = false;
    window.reportActivity(location, label, detail);
  };

  sendHeartbeat();
  setInterval(sendHeartbeat, HEARTBEAT_MS);
  document.addEventListener('visibilitychange', sendHeartbeat);
})();
