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

      const modules = trilha.modules || [];
      const cardsHtml = modules.length
        ? modules.map(m => `
            <div class="game-card" onclick="PortalCore.openModule('${trilha.key}','${m.key}')">
              <div class="icon">${m.icon || '📘'}</div>
              <h3>${m.title}</h3>
              <p>${m.desc || ''}</p>
            </div>`).join('')
        : `<div class="empty-state">Nenhum módulo cadastrado ainda em "${trilha.label}".</div>`;

      page.innerHTML = `
        <div id="moduleSelector_${trilha.key}" class="card" style="padding:16px;">
          <h2 style="margin:0 0 4px;">Trilha ${trilha.label}</h2>
          <p style="font-size:11px; color:var(--ink-dim); margin:0 0 16px;">${trilha.desc || 'Escolha um módulo para começar.'}</p>
          <div class="card-grid">${cardsHtml}</div>
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

  function isModuleComplete(mod) {
    try {
      if (mod.progressMode === 'flag') {
        const data = JSON.parse(localStorage.getItem(`${mod.progressKey}${paramUser}`) || 'null');
        return !!(data && data.completed);
      }
      const data = JSON.parse(localStorage.getItem(`${mod.progressKey}${paramUser}`) || '[]');
      return Array.isArray(data) && data.length >= mod.progressTotal;
    } catch (e) {
      return false;
    }
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

  // ---------- Tabs principais ----------
  function switchTab(tabName) {
    checkGamesUnlock();

    document.querySelectorAll('#mainNavTabs .tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
    });
    document.getElementById('tabContentAulas').style.display = (tabName === 'aulas') ? 'block' : 'none';
    document.getElementById('tabContentJogos').style.display = (tabName === 'jogos') ? 'block' : 'none';

    logAction(`Acessou a aba: ${tabName.toUpperCase()}`);

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
    const mod = findModule(trilhaKey, modKey);
    if (!mod) return;

    document.getElementById(`moduleSelector_${trilhaKey}`).style.display = 'none';
    document.getElementById(`moduleFrameArea_${trilhaKey}`).style.display = 'block';
    document.getElementById(`moduleFrameTitle_${trilhaKey}`).textContent = mod.title;
    document.getElementById(`moduleFrameDesc_${trilhaKey}`).textContent = mod.desc || '';

    const frame = document.getElementById(`moduleFrame_${trilhaKey}`);
    frame.src = `${mod.src}?user=${encodeURIComponent(paramUser)}&role=${encodeURIComponent(currentUser.role)}&name=${encodeURIComponent(currentUser.nome)}&turma=${encodeURIComponent(currentUser.turma)}`;

    openModuleFrame[trilhaKey] = true;
    if (typeof window.pauseActivityHeartbeat === 'function') window.pauseActivityHeartbeat();
    logAction(`Abriu o módulo: ${mod.title}`);
  }

  function closeModule(trilhaKey) {
    document.getElementById(`moduleFrameArea_${trilhaKey}`).style.display = 'none';
    document.getElementById(`moduleSelector_${trilhaKey}`).style.display = 'block';
    document.getElementById(`moduleFrame_${trilhaKey}`).src = 'about:blank';
    openModuleFrame[trilhaKey] = false;
    checkGamesUnlock();

    const trilha = (cfg.trilhas || []).find(t => t.key === trilhaKey);
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
  window.PortalCore = { openGame, closeGame, openModule, closeModule };

  document.addEventListener('DOMContentLoaded', init);
})();
