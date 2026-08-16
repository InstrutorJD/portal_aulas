// Motor genérico da plataforma de ensino — compartilhado por TODAS as turmas.
//
// Cada turmas/<turma>/plataforma.html só precisa:
//   1) definir o tema (cores) num <style>,
//   2) definir window.TURMA_CONFIG com o rótulo da turma e suas trilhas/módulos,
//   3) incluir, nessa ordem: shared/users-db.js, supabase-js, shared/supabase-config.js,
//      shared/platform-core.css, o TURMA_CONFIG e por fim este arquivo.
//
// Para criar uma tela/trilha nova numa turma, edite APENAS o TURMA_CONFIG
// daquela turma — este arquivo e as outras turmas não são tocados.
(function () {
  const cfg = window.TURMA_CONFIG;
  if (!cfg) {
    console.error('TURMA_CONFIG não definido — defina-o antes de carregar platform-core.js');
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const paramUser = urlParams.get('user') || '';
  const paramIp = urlParams.get('ip') || '';
  const paramSaldo = urlParams.get('saldo') || '';

  const DB = { users: {} };
  (window.USERS_DB || []).forEach(u => {
    DB.users[u.email] = { ...u, progress: 0 };
  });

  const currentUser = DB.users[paramUser] || {
    email: paramUser,
    nome: paramUser,
    role: 'aluno',
    turma: cfg.id,
    progress: 0
  };

  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_KEY = window.SUPABASE_ANON_KEY;
  const sbClient = (window.supabase && SUPABASE_URL && SUPABASE_KEY)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

  let teacherUnlockOverride = false;
  let a11y = { fontMode: 'pixel', fontScale: 1, libras: false };
  let currentGameKey = null;
  const openModuleFrame = {}; // trilhaKey -> bool (módulo aberto)

  // ---------- Shell HTML ----------
  function renderShell() {
    const mount = document.getElementById('app');
    mount.innerHTML = `
      <div class="a11y-bar">
        <div>
          <span class="label">Acessibilidade: </span>
          <button id="btnFontStyle">Fonte: pixelada</button>
          <button id="btnFontSmaller">A−</button>
          <button id="btnFontBigger">A+</button>
          <button id="btnLibras">Libras</button>
        </div>
        <div id="sessionControl">
          <span id="sessionUser" class="label" style="color:var(--yellow)"></span>
          <button id="btnLogout" class="btn-danger" style="padding:4px 8px; font-size:10px;">Sair</button>
        </div>
      </div>

      <div class="app-container">
        <header>
          <h1>PIXELFORGE STUDIOS — PLATAFORMA DE ENSINO</h1>
          <div class="sub">Sistema de Gestão de Aprendizagem & Auditoria</div>
        </header>

        <div class="statusbar">
          <div class="user-info">Usuário: <b id="txtUserNom">--</b> | Turma: <b id="txtUserTurma">--</b></div>
          <div style="font-size:11px; color:var(--ink-dim);">
            Status Jogos: <span id="lblGamesUnlock" style="color:var(--blood-bright)">BLOQUEADO</span>
          </div>
        </div>

        <div class="tabs" id="mainNavTabs">
          <button class="tab-btn active" data-tab="aulas">Aulas & Atividades</button>
          <button class="tab-btn disabled" id="tabBtnJogos" data-tab="jogos">Jogos 🔒</button>
          ${currentUser.role === 'professor' ? '<button class="tab-btn" data-tab="gestao">Gestão 🛠️</button>' : ''}
        </div>

        <div class="viewport-content">
          <div id="tabContentAulas" class="tab-page">
            <div class="subtabs" id="aulasSubTabs"><span class="subtab-label">↳ Conteúdo:</span></div>
            <div id="aulasSubTabPages"></div>
          </div>

          <div id="tabContentJogos" class="tab-page" style="display:none;">
            <div id="gameSelector" class="card" style="padding:16px;">
              <h2 style="margin:0 0 4px;">Escolha um Jogo</h2>
              <p style="font-size:11px; color:var(--ink-dim); margin:0 0 16px;">Selecione uma atividade para praticar.</p>
              <div class="card-grid" id="gameCardGrid"></div>
            </div>
            <div id="gameFrameArea" style="display:none; height:100%; flex-direction:column;">
              <div class="card module-frame-header" style="flex-shrink:0;">
                <div>
                  <h2 id="gameFrameTitle" style="margin:0; font-size:18px;">--</h2>
                  <p id="gameFrameDesc" style="font-size:11px; color:var(--ink-dim); margin:4px 0 0 0;"></p>
                </div>
                <button class="btn btn-secondary" onclick="PortalCore.closeGame()">← Voltar</button>
              </div>
              <div class="game-frame-wrapper" style="flex:1; min-height:0; border:1px solid var(--green-dim);">
                <iframe id="gameFrame" src="about:blank"></iframe>
              </div>
            </div>
          </div>

          <div id="tabContentGestao" class="tab-page" style="display:none;">
            <div class="card">
              <h2>Restrições — ${cfg.label}</h2>
              <p style="font-size:11px; color:var(--ink-dim); margin:-4px 0 12px;">
                É um desincentivo dentro do portal, não uma trava de verdade — um aluno pode contornar pelo DevTools do navegador.
              </p>
              <button class="btn" id="btnToggleClipboard">Bloquear Copiar/Colar (${cfg.label})</button>
            </div>

            <div class="card">
              <h2>Liberação de Jogos — ${cfg.label}</h2>
              <div style="display:flex; gap:10px; margin-bottom:12px;">
                <button class="btn" id="btnUnlockGamesTurma">Liberar Jogos (Todos)</button>
                <button class="btn btn-danger" id="btnLockGamesTurma">Bloquear Jogos (Todos)</button>
              </div>
              <table class="audit-table">
                <thead><tr><th>Aluno</th><th>Acesso Jogos</th><th>Ações</th></tr></thead>
                <tbody id="tblGestaoStudentsBody"></tbody>
              </table>
            </div>

            <div class="card">
              <h2>Atividade em Tempo Real</h2>
              <p style="font-size:11px; color:var(--ink-dim); margin:-4px 0 4px;">Onde cada aluno desta turma está agora — atualiza sozinho.</p>
              <table class="audit-table">
                <thead><tr><th>Aluno</th><th>Onde está</th><th>Status</th><th>Última atualização</th></tr></thead>
                <tbody id="tblGestaoActivityBody"></tbody>
              </table>
            </div>

            <div class="card">
              <h2>Monitoramento e Logs (Auditoria)</h2>
              <p style="font-size:11px; color:var(--ink-dim); margin:-4px 0 4px;">Registros gerados neste navegador (login, troca de aba, módulos abertos).</p>
              <div class="log-box" id="gestaoAuditLogBox"></div>
            </div>
          </div>
        </div>
      </div>

      <div vw class="enabled" style="display:none;">
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>
      </div>
    `;
  }

  function renderTrilhas() {
    const tabsEl = document.getElementById('aulasSubTabs');
    const pagesEl = document.getElementById('aulasSubTabPages');
    const trilhas = cfg.trilhas || [];

    if (trilhas.length === 0) {
      pagesEl.innerHTML = `<div class="empty-state">Nenhuma trilha cadastrada ainda para esta turma. O professor pode liberar os jogos manualmente enquanto isso.</div>`;
      return;
    }

    trilhas.forEach((trilha, idx) => {
      const btn = document.createElement('button');
      btn.className = 'subtab-btn' + (idx === 0 ? ' active' : '');
      btn.setAttribute('data-subtab', trilha.key);
      btn.textContent = trilha.label;
      btn.addEventListener('click', () => switchAulasSubTab(trilha.key));
      tabsEl.appendChild(btn);

      const page = document.createElement('div');
      page.className = 'subtab-page';
      page.id = `subTabContent_${trilha.key}`;
      page.style.display = idx === 0 ? 'block' : 'none';

      page.innerHTML = `
        <div id="moduleSelector_${trilha.key}" class="card" style="padding:16px;">
          <h2 style="margin:0 0 4px;">Trilha ${trilha.label}</h2>
          ${trilha.capacidade ? `<p style="font-size:11px; color:var(--yellow); margin:0 0 4px;"><b>Capacidade:</b> ${trilha.capacidade}</p>` : ''}
          <p style="font-size:11px; color:var(--ink-dim); margin:0 0 16px;">${trilha.desc || 'Escolha um módulo para começar.'}</p>
          <div class="card-grid">${buildModuleCardsHtml(trilha)}</div>
        </div>
        <div id="moduleFrameArea_${trilha.key}" style="display:none;">
          <div class="card module-frame-header">
            <div>
              <h2 id="moduleFrameTitle_${trilha.key}" style="margin:0; font-size:18px;">--</h2>
              <p id="moduleFrameDesc_${trilha.key}" style="font-size:11px; color:var(--ink-dim); margin:4px 0 0 0;"></p>
            </div>
            <button class="btn btn-secondary" onclick="PortalCore.closeModule('${trilha.key}')">← Voltar</button>
          </div>
          <div class="game-frame-wrapper" style="height:560px; border:1px solid var(--green-dim);">
            <iframe id="moduleFrame_${trilha.key}" src="about:blank"></iframe>
          </div>
        </div>
      `;
      pagesEl.appendChild(page);
    });
  }

  function switchAulasSubTab(key) {
    document.querySelectorAll('#aulasSubTabs .subtab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-subtab') === key);
    });
    document.querySelectorAll('#aulasSubTabPages .subtab-page').forEach(p => {
      p.style.display = (p.id === `subTabContent_${key}`) ? 'block' : 'none';
    });

    const trilha = (cfg.trilhas || []).find(t => t.key === key);
    if (trilha && !openModuleFrame[key] && typeof window.reportActivity === 'function') {
      window.reportActivity(`aulas_${key}`, `${trilha.label} — Escolhendo módulo`);
    }
  }

  // ---------- Progresso / desbloqueio de jogos ----------
  function findModule(trilhaKey, modKey) {
    const trilha = (cfg.trilhas || []).find(t => t.key === trilhaKey);
    return trilha ? (trilha.modules || []).find(m => m.key === modKey) : null;
  }

  // { current, total, completed } — mesma leitura de localStorage usada tanto
  // pro cadeado/card de conclusão quanto pra sincronizar com o Supabase.
  function getModuleProgress(mod) {
    try {
      if (mod.progressMode === 'flag') {
        const data = JSON.parse(localStorage.getItem(`${mod.progressKey}${paramUser}`) || 'null');
        const completed = !!(data && data.completed);
        return { current: completed ? 1 : 0, total: 1, completed };
      }
      const data = JSON.parse(localStorage.getItem(`${mod.progressKey}${paramUser}`) || '[]');
      const current = Array.isArray(data) ? data.length : 0;
      const total = mod.progressTotal || 1;
      return { current, total, completed: current >= total };
    } catch (e) {
      return { current: 0, total: mod.progressTotal || 1, completed: false };
    }
  }

  function isModuleComplete(mod) {
    return getModuleProgress(mod).completed;
  }

  // Manda o progresso local (localStorage) pro Supabase, pra o painel do
  // professor conseguir calcular % de desempenho por trilha nos relatórios
  // — sem isso, esse dado nunca sai do navegador do aluno.
  async function syncModuleProgress(trilha, mod) {
    if (!sbClient || currentUser.role !== 'aluno' || !paramUser) return;
    const { current, total, completed } = getModuleProgress(mod);
    try {
      await sbClient.from('student_module_progress').upsert({
        student_email: paramUser,
        student_name: currentUser.nome,
        turma: cfg.id,
        trilha_key: trilha.key,
        module_key: mod.key,
        progress_current: current,
        progress_total: total,
        completed,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_email,trilha_key,module_key' });
    } catch (e) {
      // progresso sincronizado é best-effort: nunca deve travar a experiência do aluno
    }
  }

  function syncAllModulesProgress() {
    (cfg.trilhas || []).forEach(trilha => {
      (trilha.modules || []).forEach(mod => syncModuleProgress(trilha, mod));
    });
  }

  function isModuleLocked(trilha, mod) {
    if (!mod.requires) return false;
    if (currentUser.role === 'professor') return false;
    const requiredMod = (trilha.modules || []).find(m => m.key === mod.requires);
    return !!requiredMod && !isModuleComplete(requiredMod);
  }

  function buildModuleCardsHtml(trilha) {
    const modules = trilha.modules || [];
    if (!modules.length) return `<div class="empty-state">Nenhum módulo cadastrado ainda em "${trilha.label}".</div>`;

    return modules.map(m => {
      const locked = isModuleLocked(trilha, m);
      const done = isModuleComplete(m);
      const statusLabel = locked ? '🔒 Bloqueado' : (done ? '✅ Concluído' : '');
      const classes = 'game-card' + (locked ? ' locked' : '') + (done ? ' completed' : '');
      const click = locked ? '' : `onclick="PortalCore.openModule('${trilha.key}','${m.key}')"`;
      return `
        <div class="${classes}" ${click}>
          <div class="icon">${m.icon || '📘'}</div>
          <h3>${m.title}</h3>
          <p>${m.desc || ''}</p>
          ${statusLabel ? `<div class="card-status">${statusLabel}</div>` : ''}
        </div>`;
    }).join('');
  }

  function allModulesComplete() {
    const modules = (cfg.trilhas || []).flatMap(t => t.modules || []);
    if (modules.length === 0) return false;
    return modules.every(isModuleComplete);
  }

  function checkGamesUnlock() {
    const isUnlocked = allModulesComplete() || teacherUnlockOverride || currentUser.role === 'professor';
    const btnJogos = document.getElementById('tabBtnJogos');
    const lblStatus = document.getElementById('lblGamesUnlock');

    if (isUnlocked) {
      btnJogos.classList.remove('disabled');
      btnJogos.textContent = 'Jogos 🎮';
      lblStatus.textContent = 'LIBERADO';
      lblStatus.style.color = 'var(--green)';
    } else {
      btnJogos.classList.add('disabled');
      btnJogos.textContent = 'Jogos 🔒';
      lblStatus.textContent = 'BLOQUEADO (conclua as atividades ou aguarde liberação do professor)';
      lblStatus.style.color = 'var(--blood-bright)';
    }
  }

  async function fetchTeacherOverride() {
    if (!sbClient) return;
    const { data } = await sbClient
      .from('student_overrides')
      .select('games_unlocked')
      .eq('student_email', paramUser)
      .maybeSingle();
    teacherUnlockOverride = !!(data && data.games_unlocked);
    checkGamesUnlock();
  }

  function setupOverrideRealtime() {
    if (!sbClient) return;
    sbClient.channel('realtime_student_override_' + paramUser)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_overrides', filter: `student_email=eq.${paramUser}` }, () => fetchTeacherOverride())
      .subscribe();
  }

  // ---------- Log de auditoria (best-effort, local ao navegador) ----------
  function logAction(action, targetUser = null) {
    const logs = JSON.parse(localStorage.getItem('pf_audit_logs') || '[]');
    const u = targetUser || (currentUser ? currentUser.nome : 'Sistema');
    logs.unshift({ time: new Date().toLocaleTimeString(), user: u, action });
    if (logs.length > 50) logs.pop();
    localStorage.setItem('pf_audit_logs', JSON.stringify(logs));
  }

  // ---------- Gestão da turma (só professor) ----------
  // Mesma coisa que professor/painel.html fazia antes num painel central
  // misturando as duas turmas — agora cada turma cuida só dos seus alunos.
  let gestaoOverridesCache = {};
  let gestaoClipboardBlocked = false;
  let gestaoActivityRealtimeStarted = false;
  let gestaoActivityPollStarted = false;

  function turmaStudents() {
    return Object.values(DB.users)
      .filter(u => u.role === 'aluno' && u.turma === cfg.id)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  async function fetchGestaoOverrides() {
    if (!sbClient) return;
    const { data } = await sbClient.from('student_overrides').select('*');
    gestaoOverridesCache = {};
    (data || []).forEach(r => { gestaoOverridesCache[r.student_email] = r.games_unlocked; });
  }

  async function renderGestaoStudents() {
    await fetchGestaoOverrides();
    const tbody = document.getElementById('tblGestaoStudentsBody');
    if (!tbody) return;
    const students = turmaStudents();
    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="color:var(--ink-dim); text-align:center; padding:14px;">Nenhum aluno cadastrado nessa turma.</td></tr>`;
      return;
    }
    tbody.innerHTML = students.map(u => {
      const isUnl = !!gestaoOverridesCache[u.email];
      return `
        <tr>
          <td>${u.nome}</td>
          <td><span style="color:${isUnl ? 'var(--green)' : 'var(--blood-bright)'}">${isUnl ? 'LIBERADO' : 'BLOQUEADO'}</span></td>
          <td><button class="btn btn-secondary" style="padding:4px 8px; font-size:10px;" onclick="PortalCore.toggleStudentGamesTurma('${u.email}')">${isUnl ? 'Revogar Acesso' : 'Liberar Jogos'}</button></td>
        </tr>
      `;
    }).join('');
  }

  async function toggleStudentGamesTurma(userKey) {
    if (!sbClient) return;
    const newValue = !gestaoOverridesCache[userKey];
    await sbClient.from('student_overrides').upsert({
      student_email: userKey, games_unlocked: newValue, updated_at: new Date().toISOString()
    }, { onConflict: 'student_email' });
    renderGestaoStudents();
  }

  function renderClipboardButtonGestao() {
    const btn = document.getElementById('btnToggleClipboard');
    if (!btn) return;
    if (gestaoClipboardBlocked) {
      btn.textContent = `Copiar/Colar BLOQUEADO (${cfg.label}) — Clique para liberar`;
      btn.classList.add('btn-danger');
    } else {
      btn.textContent = `Bloquear Copiar/Colar (${cfg.label})`;
      btn.classList.remove('btn-danger');
    }
  }

  async function fetchClipboardStateGestao() {
    if (!sbClient) return;
    const { data } = await sbClient.from('classroom_settings').select('clipboard_blocked').eq('id', cfg.id).maybeSingle();
    gestaoClipboardBlocked = !!(data && data.clipboard_blocked);
    renderClipboardButtonGestao();
  }

  function computeGestaoDisplayStatus(row) {
    const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    if (!updatedAt || (Date.now() - updatedAt) > 45000) return 'offline';
    return row.status || 'offline';
  }

  async function renderGestaoActivity() {
    const tbody = document.getElementById('tblGestaoActivityBody');
    if (!tbody || !sbClient) return;

    const { data, error } = await sbClient.from('student_activity').select('*').eq('turma', cfg.id).order('student_name', { ascending: true });
    const rows = error ? [] : (data || []);

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="color:var(--ink-dim); text-align:center; padding:14px;">Nenhum registro de atividade ainda.</td></tr>`;
      return;
    }

    const statusMeta = {
      active: { color: 'var(--green)', label: '🟢 Ativo' },
      idle: { color: 'var(--yellow)', label: '🟡 Inativo' },
      offline: { color: 'var(--ink-dim)', label: '⚫ Offline' }
    };

    tbody.innerHTML = rows.map(r => {
      const meta = statusMeta[computeGestaoDisplayStatus(r)] || statusMeta.offline;
      const lastUpdate = r.updated_at ? new Date(r.updated_at).toLocaleTimeString() : '--';
      return `<tr><td><b>${r.student_name || r.student_email}</b></td><td>${r.location_label || r.location || '--'}</td><td><span style="color:${meta.color}">${meta.label}</span></td><td>${lastUpdate}</td></tr>`;
    }).join('');
  }

  function renderGestaoLogs() {
    const box = document.getElementById('gestaoAuditLogBox');
    if (!box) return;
    const logs = JSON.parse(localStorage.getItem('pf_audit_logs') || '[]');
    box.innerHTML = logs.map(l => `<div class="log-entry"><span class="time">[${l.time}]</span> <b>${l.user}</b>: ${l.action}</div>`).join('');
  }

  function renderGestaoTab() {
    renderGestaoStudents();
    renderGestaoLogs();
    fetchClipboardStateGestao();

    if (!sbClient) return;
    renderGestaoActivity();
    if (!gestaoActivityRealtimeStarted) {
      gestaoActivityRealtimeStarted = true;
      sbClient.channel('realtime_gestao_activity_' + cfg.id)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'student_activity', filter: `turma=eq.${cfg.id}` }, () => renderGestaoActivity())
        .subscribe();
    }
    if (!gestaoActivityPollStarted) {
      gestaoActivityPollStarted = true;
      setInterval(renderGestaoActivity, 15000);
    }
  }

  function setupGestaoButtons() {
    document.getElementById('btnUnlockGamesTurma').addEventListener('click', async () => {
      if (!sbClient) return;
      const rows = turmaStudents().map(u => ({ student_email: u.email, games_unlocked: true, updated_at: new Date().toISOString() }));
      if (rows.length) await sbClient.from('student_overrides').upsert(rows, { onConflict: 'student_email' });
      renderGestaoStudents();
    });

    document.getElementById('btnLockGamesTurma').addEventListener('click', async () => {
      if (!sbClient) return;
      const rows = turmaStudents().map(u => ({ student_email: u.email, games_unlocked: false, updated_at: new Date().toISOString() }));
      if (rows.length) await sbClient.from('student_overrides').upsert(rows, { onConflict: 'student_email' });
      renderGestaoStudents();
    });

    document.getElementById('btnToggleClipboard').addEventListener('click', async () => {
      if (!sbClient) return;
      gestaoClipboardBlocked = !gestaoClipboardBlocked;
      await sbClient.from('classroom_settings').upsert({
        id: cfg.id, clipboard_blocked: gestaoClipboardBlocked, updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      renderClipboardButtonGestao();
    });
  }

  // ---------- Tabs principais ----------
  function switchTab(tabName) {
    checkGamesUnlock();

    document.querySelectorAll('#mainNavTabs .tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
    });
    document.getElementById('tabContentAulas').style.display = (tabName === 'aulas') ? 'block' : 'none';
    document.getElementById('tabContentJogos').style.display = (tabName === 'jogos') ? 'block' : 'none';
    document.getElementById('tabContentGestao').style.display = (tabName === 'gestao') ? 'block' : 'none';

    logAction(`Acessou a aba: ${tabName.toUpperCase()}`);

    if (tabName === 'gestao') renderGestaoTab();

    if (tabName === 'jogos') {
      document.getElementById('gameSelector').style.display = currentGameKey ? 'none' : 'block';
      document.getElementById('gameFrameArea').style.display = currentGameKey ? 'flex' : 'none';
      if (!currentGameKey && typeof window.resumeActivityHeartbeat === 'function') {
        window.resumeActivityHeartbeat('jogos_selecao', 'Jogos — Escolhendo um jogo');
      }
    }

    if (tabName === 'aulas') {
      const activeSub = document.querySelector('#aulasSubTabs .subtab-btn.active')?.getAttribute('data-subtab');
      const trilha = (cfg.trilhas || []).find(t => t.key === activeSub);
      if (trilha && !openModuleFrame[activeSub] && typeof window.resumeActivityHeartbeat === 'function') {
        window.resumeActivityHeartbeat(`aulas_${activeSub}`, `${trilha.label} — Escolhendo módulo`);
      }
    }
  }

  // ---------- Jogos (compartilhados por todas as turmas) ----------
  const GAMES = {
    hacker: {
      title: 'GitHack OS — Terminal de Cibersegurança',
      desc: 'Ambiente de simulação sandbox. Conecte-se à subnet para realizar ataques e defesas.',
      icon: '🕹️',
      src: '../../games/jogo.html'
    },
    digitacao: {
      title: 'Digitação — Treino de Velocidade',
      desc: 'Pratique velocidade e precisão de digitação.',
      icon: '⌨️',
      src: '../../games/digitacao.html'
    },
    campominado: {
      title: 'Campo Minado — Lógica com JavaScript',
      desc: 'Programe o robô em JavaScript para desviar das minas e chegar à bandeira.',
      icon: '💣',
      src: '../../games/campo-minado.html'
    }
  };

  function renderGameCards() {
    const grid = document.getElementById('gameCardGrid');
    grid.innerHTML = Object.keys(GAMES).map(key => {
      const g = GAMES[key];
      return `
        <div class="game-card" onclick="PortalCore.openGame('${key}')">
          <div class="icon">${g.icon}</div>
          <h3>${g.title.split(' — ')[0]}</h3>
          <p>${g.desc}</p>
        </div>`;
    }).join('');
  }

  function openGame(key) {
    const game = GAMES[key];
    if (!game) return;

    currentGameKey = key;
    document.getElementById('gameSelector').style.display = 'none';
    document.getElementById('gameFrameArea').style.display = 'flex';
    document.getElementById('gameFrameTitle').textContent = game.title;
    document.getElementById('gameFrameDesc').textContent = game.desc;

    const frame = document.getElementById('gameFrame');
    frame.src = `${game.src}?user=${encodeURIComponent(paramUser)}&ip=${encodeURIComponent(paramIp)}&saldo=${encodeURIComponent(paramSaldo)}&role=${encodeURIComponent(currentUser.role)}&name=${encodeURIComponent(currentUser.nome)}&turma=${encodeURIComponent(currentUser.turma)}`;

    if (typeof window.pauseActivityHeartbeat === 'function') window.pauseActivityHeartbeat();
    logAction(`Abriu o jogo: ${game.title}`);
  }

  function closeGame() {
    currentGameKey = null;
    document.getElementById('gameFrameArea').style.display = 'none';
    document.getElementById('gameSelector').style.display = 'block';
    document.getElementById('gameFrame').src = 'about:blank';
    if (typeof window.resumeActivityHeartbeat === 'function') {
      window.resumeActivityHeartbeat('jogos_selecao', 'Jogos — Escolhendo um jogo');
    }
  }

  // ---------- Módulos de trilha (Aulas & Atividades) ----------
  function openModule(trilhaKey, modKey) {
    const trilha = (cfg.trilhas || []).find(t => t.key === trilhaKey);
    const mod = findModule(trilhaKey, modKey);
    if (!mod || (trilha && isModuleLocked(trilha, mod))) return;

    document.getElementById(`moduleSelector_${trilhaKey}`).style.display = 'none';
    document.getElementById(`moduleFrameArea_${trilhaKey}`).style.display = 'block';
    document.getElementById(`moduleFrameTitle_${trilhaKey}`).textContent = mod.title;
    document.getElementById(`moduleFrameDesc_${trilhaKey}`).textContent = mod.desc || '';

    const frame = document.getElementById(`moduleFrame_${trilhaKey}`);
    frame.src = `${mod.src}?user=${encodeURIComponent(paramUser)}&role=${encodeURIComponent(currentUser.role)}&name=${encodeURIComponent(currentUser.nome)}&turma=${encodeURIComponent(currentUser.turma)}`;

    openModuleFrame[trilhaKey] = modKey;
    if (typeof window.pauseActivityHeartbeat === 'function') window.pauseActivityHeartbeat();
    logAction(`Abriu o módulo: ${mod.title}`);
  }

  function closeModule(trilhaKey) {
    const closedModKey = openModuleFrame[trilhaKey];
    document.getElementById(`moduleFrameArea_${trilhaKey}`).style.display = 'none';
    document.getElementById(`moduleSelector_${trilhaKey}`).style.display = 'block';
    document.getElementById(`moduleFrame_${trilhaKey}`).src = 'about:blank';
    openModuleFrame[trilhaKey] = false;
    checkGamesUnlock();

    const trilha = (cfg.trilhas || []).find(t => t.key === trilhaKey);
    if (trilha) {
      const grid = document.querySelector(`#moduleSelector_${trilhaKey} .card-grid`);
      if (grid) grid.innerHTML = buildModuleCardsHtml(trilha);

      const closedMod = closedModKey && findModule(trilhaKey, closedModKey);
      if (closedMod) syncModuleProgress(trilha, closedMod);
    }
    if (trilha && typeof window.resumeActivityHeartbeat === 'function') {
      window.resumeActivityHeartbeat(`aulas_${trilhaKey}`, `${trilha.label} — Escolhendo módulo`);
    }
  }

  // ---------- Acessibilidade ----------
  function applyA11y() {
    const root = document.documentElement;
    if (a11y.fontMode === 'traditional') {
      root.style.setProperty('--user-font', 'system-ui, -apple-system, sans-serif');
      root.style.setProperty('--user-font-display', 'system-ui, -apple-system, sans-serif');
      document.getElementById('btnFontStyle').textContent = 'Fonte: tradicional';
      document.getElementById('btnFontStyle').classList.add('on');
    } else {
      root.style.setProperty('--user-font', "'JetBrains Mono', monospace");
      root.style.setProperty('--user-font-display', "'VT323', monospace");
      document.getElementById('btnFontStyle').textContent = 'Fonte: pixelada';
      document.getElementById('btnFontStyle').classList.remove('on');
    }
    root.style.setProperty('--user-font-scale', a11y.fontScale);

    const vw = document.querySelector('div[vw]');
    if (vw) vw.style.display = a11y.libras ? '' : 'none';
    document.getElementById('btnLibras').classList.toggle('on', a11y.libras);
  }

  function setupVLibras() {
    const script = document.createElement('script');
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.onload = () => { if (window.VLibras) new window.VLibras.Widget('https://vlibras.gov.br/app'); };
    document.body.appendChild(script);
  }

  // ---------- Bootstrap ----------
  function setupRBAC() {
    document.getElementById('sessionUser').textContent = currentUser.nome;
    document.getElementById('txtUserNom').textContent = currentUser.nome;
    document.getElementById('txtUserTurma').textContent = currentUser.role === 'professor' ? 'Corpo Docente' : cfg.label;

    if (currentUser.role === 'aluno') {
      fetchTeacherOverride();
      setupOverrideRealtime();
    }

    checkGamesUnlock();
    switchTab('aulas');
    if ((cfg.trilhas || []).length > 0) switchAulasSubTab(cfg.trilhas[0].key);
  }

  function init() {
    renderShell();
    renderTrilhas();
    renderGameCards();
    setupVLibras();
    syncAllModulesProgress();
    if (currentUser.role === 'professor') setupGestaoButtons();

    document.querySelectorAll('#mainNavTabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabTarget = e.target.getAttribute('data-tab');
        if (tabTarget === 'jogos' && e.target.classList.contains('disabled')) {
          alert('A aba de jogos está bloqueada! Conclua 100% das suas tarefas do dia ou aguarde a liberação do professor.');
          return;
        }
        switchTab(tabTarget);
      });
    });

    document.getElementById('btnLogout').addEventListener('click', () => {
      logAction('Efetuou logout', currentUser.nome);
      sessionStorage.clear();
      window.location.href = '../../index.html';
    });

    document.getElementById('btnFontStyle').addEventListener('click', () => {
      a11y.fontMode = a11y.fontMode === 'pixel' ? 'traditional' : 'pixel';
      applyA11y();
    });
    document.getElementById('btnFontBigger').addEventListener('click', () => {
      a11y.fontScale = Math.min(1.6, Math.round((a11y.fontScale + 0.1) * 10) / 10);
      applyA11y();
    });
    document.getElementById('btnFontSmaller').addEventListener('click', () => {
      a11y.fontScale = Math.max(0.85, Math.round((a11y.fontScale - 0.1) * 10) / 10);
      applyA11y();
    });
    document.getElementById('btnLibras').addEventListener('click', () => {
      a11y.libras = !a11y.libras;
      applyA11y();
    });

    setupRBAC();
    applyA11y();

    window.ACTIVITY_STUDENT_NAME = currentUser.nome;
    window.ACTIVITY_STUDENT_EMAIL = currentUser.email;
    window.ACTIVITY_STUDENT_TURMA = currentUser.turma;
    window.ACTIVITY_STUDENT_ROLE = currentUser.role;
    window.ACTIVITY_LOCATION = (cfg.trilhas && cfg.trilhas[0]) ? `aulas_${cfg.trilhas[0].key}` : 'aulas';
    window.ACTIVITY_LABEL = (cfg.trilhas && cfg.trilhas[0]) ? `${cfg.trilhas[0].label} — Escolhendo módulo` : 'Aulas & Atividades';

    const tracker = document.createElement('script');
    tracker.src = '../../shared/activity-tracker.js';
    document.body.appendChild(tracker);
  }

  // API usada pelos onclick="" gerados dinamicamente
  window.PortalCore = { openGame, closeGame, openModule, closeModule, toggleStudentGamesTurma };

  document.addEventListener('DOMContentLoaded', init);
})();
