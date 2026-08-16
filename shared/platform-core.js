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
  let trilhaLockCache = {}; // trilhaKey -> bool (bloqueada pelo professor, além da regra interna de pré-requisito)
  let a11y = { fontMode: 'pixel', fontScale: 1, libras: false };
  let currentGameKey = null;
  const openModuleFrame = {}; // trilhaKey -> bool (módulo aberto)

  // ---------- Shell HTML ----------
  function renderShell() {
    const mount = document.getElementById('app');
    mount.innerHTML = `
      <div class="a11y-bar">
        <div>
          <button id="btnFontStyle" title="Alternar estilo da fonte" aria-label="Alternar estilo da fonte">🔤</button>
          <button id="btnFontSmaller" title="Diminuir fonte" aria-label="Diminuir fonte">A−</button>
          <button id="btnFontBigger" title="Aumentar fonte" aria-label="Aumentar fonte">A+</button>
          <button id="btnLibras" title="Ativar Libras (VLibras)" aria-label="Ativar Libras">🤟</button>
        </div>
        <div id="sessionControl">
          <button id="btnLogout" class="btn-danger" style="padding:4px 8px; font-size:10px;">Sair</button>
        </div>
      </div>

      <div class="app-container">
        <div class="statusbar">
          <div class="user-info">Usuário: <b id="txtUserNom">--</b> | Turma: <b id="txtUserTurma">--</b></div>
        </div>

        <div class="tabs" id="mainNavTabs">
          <button class="tab-btn active" data-tab="aulas">Aulas & Atividades</button>
          <button class="tab-btn disabled" id="tabBtnJogos" data-tab="jogos">Jogos 🔒</button>
          ${currentUser.role === 'professor' ? '<button class="tab-btn" data-tab="gestao">Gestão 🛠️</button>' : ''}
        </div>

        <div class="viewport-content">
          <div id="tabContentAulas" class="tab-page">
            <div id="materiaSelectorArea">
              <div class="card">
                <h2 style="margin:0 0 4px;">Matérias</h2>
                <p style="font-size:11px; color:var(--ink-dim); margin:0 0 16px;">Escolha uma matéria para ver as trilhas dela.</p>
                <div class="card-grid" id="materiaCardGrid"></div>
              </div>
            </div>

            <div id="materiaDetailArea" style="display:none;">
              <div class="card module-frame-header">
                <div>
                  <h2 id="materiaDetailTitle" style="margin:0; font-size:18px;">--</h2>
                </div>
                <button class="btn btn-secondary" onclick="PortalCore.closeMateria()">← Voltar</button>
              </div>
              <div class="subtabs" id="aulasSubTabs"><span class="subtab-label">Trilha:</span></div>
              <div id="aulasSubTabPages"></div>
            </div>
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
            <div class="card collapsible-card">
              <div class="collapsible-head" onclick="PortalCore.toggleGestaoSection(this)">
                <h2>Bloqueios e Liberações</h2>
                <span class="collapsible-arrow">▶</span>
              </div>
              <div class="collapsible-body">
                <h3 class="gestao-subhead">Restrições</h3>
                <p style="font-size:11px; color:var(--ink-dim); margin:-4px 0 12px;">
                  É um desincentivo dentro do portal, não uma trava de verdade — um aluno pode contornar pelo DevTools do navegador.
                </p>
                <button class="btn" id="btnToggleClipboard">Bloquear Copiar/Colar</button>

                <h3 class="gestao-subhead">Liberação de Jogos</h3>
                <div style="display:flex; gap:10px; margin-bottom:12px;">
                  <button class="btn" id="btnUnlockGamesTurma">Liberar Todos</button>
                  <button class="btn btn-danger" id="btnLockGamesTurma">Bloquear Todos</button>
                </div>
                <table class="audit-table">
                  <thead><tr><th>Aluno</th><th>Acesso Jogos</th><th>Ações</th></tr></thead>
                  <tbody id="tblGestaoStudentsBody"></tbody>
                </table>

                <h3 class="gestao-subhead">Trilhas</h3>
                <p style="font-size:11px; color:var(--ink-dim); margin:-4px 0 12px;">
                  Bloqueia uma trilha inteira pra turma — não muda a regra interna dela (a prática continua exigindo a teoria concluída, por exemplo), só impede o acesso enquanto estiver bloqueada.
                </p>
                <table class="audit-table">
                  <thead><tr><th>Matéria</th><th>Trilha</th><th>Status</th><th>Ações</th></tr></thead>
                  <tbody id="tblGestaoTrilhasBody"></tbody>
                </table>
              </div>
            </div>

            <div class="card collapsible-card">
              <div class="collapsible-head" onclick="PortalCore.toggleGestaoSection(this)">
                <h2>Apresentações (Slides)</h2>
                <span class="collapsible-arrow">▶</span>
              </div>
              <div class="collapsible-body">
                <p style="font-size:11px; color:var(--ink-dim); margin:-4px 0 12px;">
                  Gera um .pptx pronto pra apresentar em aula, a partir de cada aula teórica — sem precisar abrir o módulo pra achar o botão.
                </p>
                <div id="gestaoSlidesList"></div>
              </div>
            </div>

            <div class="card collapsible-card">
              <div class="collapsible-head" onclick="PortalCore.toggleGestaoSection(this)">
                <h2>Chamada e Notas</h2>
                <span class="collapsible-arrow">▶</span>
              </div>
              <div class="collapsible-body">
                <h3 class="gestao-subhead">Chamada</h3>
                <div class="field-row">
                  <div>
                    <label class="field-label" for="chamadaData">Data</label>
                    <input type="date" id="chamadaData">
                  </div>
                </div>
                <table class="audit-table">
                  <thead><tr><th>Aluno</th><th style="width:110px; text-align:center;">Faltou</th></tr></thead>
                  <tbody id="chamadaBody"></tbody>
                </table>
                <div style="display:flex; align-items:center; gap:12px; margin-top:14px;">
                  <button class="btn" id="btnFinalizarChamada">Finalizar</button>
                  <span class="status-msg" id="chamadaStatus"></span>
                </div>
                <div id="chamadaResumoBox" style="display:none; margin-top:14px;">
                  <label class="field-label" for="chamadaResumoTexto">Resumo (copiar e colar)</label>
                  <textarea id="chamadaResumoTexto" readonly rows="2" style="width:100%; resize:vertical; font-family:inherit; font-size:11px; background:var(--panel2); color:var(--ink); border:1px solid var(--line); padding:8px;"></textarea>
                  <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
                    <button class="btn btn-secondary" id="btnCopiarResumoChamada">Copiar</button>
                    <span class="status-msg" id="chamadaResumoStatus"></span>
                  </div>
                </div>

                <h3 class="gestao-subhead">Lançar Notas</h3>
                <p style="font-size:11px; color:var(--ink-dim); margin:-4px 0 12px;">4 notas por bimestre — a média é calculada sozinha.</p>
                <div class="field-row">
                  <div>
                    <label class="field-label" for="notasBimestre">Bimestre</label>
                    <select id="notasBimestre">
                      <option value="1">1º Bimestre</option>
                      <option value="2">2º Bimestre</option>
                      <option value="3">3º Bimestre</option>
                      <option value="4">4º Bimestre</option>
                    </select>
                  </div>
                </div>
                <div style="overflow-x:auto;">
                  <table class="audit-table">
                    <thead><tr><th>Aluno</th><th>Nota 1</th><th>Nota 2</th><th>Nota 3</th><th>Nota 4</th><th>Média</th></tr></thead>
                    <tbody id="notasBody"></tbody>
                  </table>
                </div>
                <div style="display:flex; align-items:center; gap:12px; margin-top:14px;">
                  <button class="btn" id="btnSalvarNotas">Salvar</button>
                  <span class="status-msg" id="notasStatus"></span>
                </div>
              </div>
            </div>

            <div class="card collapsible-card">
              <div class="collapsible-head" onclick="PortalCore.toggleGestaoSection(this)">
                <h2>Relatórios</h2>
                <span class="collapsible-arrow">▶</span>
              </div>
              <div class="collapsible-body">
                <h3 class="gestao-subhead">Relatório de Presença</h3>
                <table class="audit-table">
                  <thead><tr><th>Aluno</th><th>Dias com chamada</th><th>Faltas</th><th>% Presença</th></tr></thead>
                  <tbody id="presencaBody"></tbody>
                </table>

                <h3 class="gestao-subhead">Relatório de Notas</h3>
                <p style="font-size:11px; color:var(--ink-dim); margin:-4px 0 12px;">Só as médias — os 4 campos de nota ficam em "Chamada e Notas".</p>
                <div style="overflow-x:auto;">
                  <table class="audit-table">
                    <thead><tr id="relatorioNotasHead"></tr></thead>
                    <tbody id="relatorioNotasBody"></tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="card collapsible-card">
              <div class="collapsible-head" onclick="PortalCore.toggleGestaoSection(this)">
                <h2>Atividade em Tempo Real</h2>
                <span class="collapsible-arrow">▶</span>
              </div>
              <div class="collapsible-body">
                <p style="font-size:11px; color:var(--ink-dim); margin:-4px 0 4px;">Onde cada aluno desta turma está agora — atualiza sozinho.</p>
                <table class="audit-table">
                  <thead><tr><th>Aluno</th><th>Onde está</th><th>Status</th><th>Última atualização</th></tr></thead>
                  <tbody id="tblGestaoActivityBody"></tbody>
                </table>
              </div>
            </div>

            <div class="card collapsible-card">
              <div class="collapsible-head" onclick="PortalCore.toggleGestaoSection(this)">
                <h2>Auditoria</h2>
                <span class="collapsible-arrow">▶</span>
              </div>
              <div class="collapsible-body">
                <p style="font-size:11px; color:var(--ink-dim); margin:-4px 0 4px;">Registros gerados neste navegador (login, troca de aba, módulos abertos).</p>
                <div class="log-box" id="gestaoAuditLogBox"></div>
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

  // Lista achatada de todas as trilhas da turma, não importa em qual matéria
  // estejam — usada por tudo que não é a navegação em si (progresso, gate
  // de jogos, abrir/fechar módulo, relatório de notas, geração de slides).
  // Trilha keys são únicas na turma inteira, então isso equivale ao antigo
  // cfg.trilhas de antes de existir o nível de matéria.
  function allTrilhas() {
    return (cfg.materias || []).flatMap(m => m.trilhas || []);
  }

  function renderMaterias() {
    const grid = document.getElementById('materiaCardGrid');
    const materias = cfg.materias || [];
    if (materias.length === 0) {
      grid.innerHTML = `<div class="empty-state">Nenhuma matéria cadastrada ainda para esta turma.</div>`;
      return;
    }
    grid.innerHTML = materias.map(m => {
      const vazia = (m.trilhas || []).length === 0;
      return `
        <div class="game-card" onclick="PortalCore.openMateria('${m.key}')">
          <div class="icon">📚</div>
          <h3>${m.label}</h3>
          ${vazia ? '<div class="card-status">Em breve</div>' : ''}
        </div>`;
    }).join('');
  }

  function openMateria(key) {
    const materia = (cfg.materias || []).find(m => m.key === key);
    if (!materia) return;
    document.getElementById('materiaSelectorArea').style.display = 'none';
    document.getElementById('materiaDetailArea').style.display = 'block';
    document.getElementById('materiaDetailTitle').textContent = materia.label;
    renderTrilhasFor(materia);
    if ((materia.trilhas || []).length > 0) switchAulasSubTab(materia.trilhas[0].key);
    logAction(`Abriu a matéria: ${materia.label}`);
  }

  function closeMateria() {
    document.getElementById('materiaDetailArea').style.display = 'none';
    document.getElementById('materiaSelectorArea').style.display = 'block';
    if (typeof window.resumeActivityHeartbeat === 'function') {
      window.resumeActivityHeartbeat('aulas_materias', 'Aulas & Atividades — Escolhendo matéria');
    }
  }

  function renderTrilhasFor(materia) {
    const tabsEl = document.getElementById('aulasSubTabs');
    const pagesEl = document.getElementById('aulasSubTabPages');
    const trilhas = materia.trilhas || [];
    pagesEl.innerHTML = '';
    tabsEl.querySelectorAll('select').forEach(s => s.remove());

    if (trilhas.length === 0) {
      tabsEl.style.display = 'none';
      pagesEl.innerHTML = `<div class="empty-state">Nenhuma trilha cadastrada ainda nesta matéria.</div>`;
      return;
    }

    // Só faz sentido pedir pra escolher quando há mais de uma trilha. Com 2+,
    // um <select> é mais conciso que uma fileira de botões (1 linha, tátil
    // no celular) — sem precisar de sidebar/hambúrguer pra 2-4 itens.
    if (trilhas.length > 1) {
      tabsEl.style.display = '';
      const select = document.createElement('select');
      select.id = 'trilhaSelect';
      select.innerHTML = trilhas.map(t => `<option value="${t.key}">${t.label}</option>`).join('');
      select.addEventListener('change', () => switchAulasSubTab(select.value));
      tabsEl.appendChild(select);
    } else {
      tabsEl.style.display = 'none';
    }

    trilhas.forEach((trilha, idx) => {
      const page = document.createElement('div');
      page.className = 'subtab-page';
      page.id = `subTabContent_${trilha.key}`;
      page.style.display = idx === 0 ? 'block' : 'none';

      page.innerHTML = `
        <div id="moduleSelector_${trilha.key}" class="card" style="padding:16px;">
          <h2 style="margin:0 0 4px;">Trilha ${trilha.label}</h2>
          ${trilha.capacidade ? `<p style="font-size:11px; color:var(--yellow); margin:0 0 4px;"><b>Capacidade:</b> ${trilha.capacidade}</p>` : ''}
          <p style="font-size:11px; color:var(--ink-dim); margin:0 0 16px;">${trilha.desc || 'Escolha um módulo para começar.'}</p>
          <div id="trilhaLockedBanner_${trilha.key}">${trilhaLockedBannerHtml(trilha)}</div>
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
          <div class="game-frame-wrapper" style="height:min(560px, 70vh); border:1px solid var(--green-dim);">
            <iframe id="moduleFrame_${trilha.key}" src="about:blank"></iframe>
          </div>
        </div>
      `;
      pagesEl.appendChild(page);
    });
  }

  function switchAulasSubTab(key) {
    const select = document.getElementById('trilhaSelect');
    if (select && select.value !== key) select.value = key;
    document.querySelectorAll('#aulasSubTabPages .subtab-page').forEach(p => {
      p.style.display = (p.id === `subTabContent_${key}`) ? 'block' : 'none';
    });

    const trilha = allTrilhas().find(t => t.key === key);
    if (trilha && !openModuleFrame[key] && typeof window.reportActivity === 'function') {
      window.reportActivity(`aulas_${key}`, `${trilha.label} — Escolhendo módulo`);
    }
  }

  // ---------- Progresso / desbloqueio de jogos ----------
  function findModule(trilhaKey, modKey) {
    const trilha = allTrilhas().find(t => t.key === trilhaKey);
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
    allTrilhas().forEach(trilha => {
      (trilha.modules || []).forEach(mod => syncModuleProgress(trilha, mod));
    });
  }

  function isModuleLocked(trilha, mod) {
    if (currentUser.role === 'professor') return false;
    // Bloqueio do professor trava a trilha inteira, por cima da regra interna
    // de pré-requisito (que continua valendo assim que a trilha for liberada).
    if (trilhaLockCache[trilha.key]) return true;
    if (!mod.requires) return false;
    const requiredMod = (trilha.modules || []).find(m => m.key === mod.requires);
    return !!requiredMod && !isModuleComplete(requiredMod);
  }

  function trilhaLockedBannerHtml(trilha) {
    if (currentUser.role === 'professor' || !trilhaLockCache[trilha.key]) return '';
    return `<p style="font-size:11px; color:var(--blood-bright); margin:0 0 12px; padding:8px 10px; border:1px dashed var(--blood-bright);">🔒 Trilha bloqueada pelo professor no momento — aguarde a liberação.</p>`;
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
    const modules = allTrilhas().flatMap(t => t.modules || []);
    if (modules.length === 0) return false;
    return modules.every(isModuleComplete);
  }

  function checkGamesUnlock() {
    const isUnlocked = allModulesComplete() || teacherUnlockOverride || currentUser.role === 'professor';
    const btnJogos = document.getElementById('tabBtnJogos');

    if (isUnlocked) {
      btnJogos.classList.remove('disabled');
      btnJogos.textContent = 'Jogos 🎮';
      btnJogos.removeAttribute('title');
    } else {
      btnJogos.classList.add('disabled');
      btnJogos.textContent = 'Jogos 🔒';
      // não depende só do cadeado/opacidade pra passar a mensagem — leitor de tela também explica o porquê.
      btnJogos.title = 'Bloqueado: conclua as atividades ou aguarde a liberação do professor.';
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

  // Refaz os cards de módulo (e o aviso de trilha bloqueada) de qualquer
  // trilha que já esteja renderizada na tela — usado depois que o cadeado
  // de uma trilha muda, pra refletir sem precisar recarregar a página.
  function refreshAllModuleCards() {
    allTrilhas().forEach(trilha => {
      const banner = document.getElementById(`trilhaLockedBanner_${trilha.key}`);
      if (banner) banner.innerHTML = trilhaLockedBannerHtml(trilha);
      const grid = document.querySelector(`#moduleSelector_${trilha.key} .card-grid`);
      if (grid) grid.innerHTML = buildModuleCardsHtml(trilha);
    });
  }

  async function fetchTrilhaLocks() {
    if (!sbClient) return;
    const { data } = await sbClient.from('trilha_overrides').select('*').eq('turma', cfg.id);
    trilhaLockCache = {};
    (data || []).forEach(r => { trilhaLockCache[r.trilha_key] = !!r.locked; });
    refreshAllModuleCards();
  }

  function setupTrilhaLockRealtime() {
    if (!sbClient) return;
    sbClient.channel('realtime_trilha_overrides_' + cfg.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trilha_overrides', filter: `turma=eq.${cfg.id}` }, () => fetchTrilhaLocks())
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
          <td><button class="btn btn-secondary" style="padding:4px 8px; font-size:10px;" onclick="PortalCore.toggleStudentGamesTurma('${u.email}')">${isUnl ? 'Revogar' : 'Liberar'}</button></td>
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

  // Lista achatada de trilhas com o rótulo da matéria dona, só pra exibição
  // na tabela de bloqueio — allTrilhas() perde essa referência de propósito.
  function allTrilhasComMateria() {
    return (cfg.materias || []).flatMap(m => (m.trilhas || []).map(t => ({ materiaLabel: m.label, trilha: t })));
  }

  async function renderGestaoTrilhas() {
    await fetchTrilhaLocks();
    const tbody = document.getElementById('tblGestaoTrilhasBody');
    if (!tbody) return;
    const pares = allTrilhasComMateria();
    if (pares.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="color:var(--ink-dim); text-align:center; padding:14px;">Nenhuma trilha cadastrada ainda nesta turma.</td></tr>`;
      return;
    }
    tbody.innerHTML = pares.map(({ materiaLabel, trilha }) => {
      const locked = !!trilhaLockCache[trilha.key];
      return `
        <tr>
          <td>${materiaLabel}</td>
          <td>${trilha.label}</td>
          <td><span style="color:${locked ? 'var(--blood-bright)' : 'var(--green)'}">${locked ? 'BLOQUEADA' : 'LIBERADA'}</span></td>
          <td><button class="btn btn-secondary" style="padding:4px 8px; font-size:10px;" onclick="PortalCore.toggleTrilhaLock('${trilha.key}')">${locked ? 'Liberar' : 'Bloquear'}</button></td>
        </tr>
      `;
    }).join('');
  }

  async function toggleTrilhaLock(trilhaKey) {
    if (!sbClient) return;
    const newValue = !trilhaLockCache[trilhaKey];
    await sbClient.from('trilha_overrides').upsert({
      turma: cfg.id, trilha_key: trilhaKey, locked: newValue, updated_at: new Date().toISOString()
    }, { onConflict: 'turma,trilha_key' });
    renderGestaoTrilhas();
  }

  function renderClipboardButtonGestao() {
    const btn = document.getElementById('btnToggleClipboard');
    if (!btn) return;
    if (gestaoClipboardBlocked) {
      btn.textContent = 'Copiar/Colar BLOQUEADO — Clique para liberar';
      btn.classList.add('btn-danger');
    } else {
      btn.textContent = 'Bloquear Copiar/Colar';
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

  // ---------- Chamada / Notas (dentro da aba Gestão, já sabe a turma) ----------
  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function noSupabaseRow(colspan) {
    return `<tr><td colspan="${colspan}" style="color:var(--ink-dim); text-align:center; padding:14px;">Configure o Supabase (shared/supabase-config.js) para usar esta tela.</td></tr>`;
  }

  function noStudentsRow(colspan) {
    return `<tr><td colspan="${colspan}" style="color:var(--ink-dim); text-align:center; padding:14px;">Nenhum aluno cadastrado nessa turma.</td></tr>`;
  }

  async function loadChamada() {
    const tbody = document.getElementById('chamadaBody');
    const dataInput = document.getElementById('chamadaData');
    if (!dataInput.value) dataInput.value = todayStr();
    if (!sbClient) { tbody.innerHTML = noSupabaseRow(2); return; }

    const students = turmaStudents();
    if (students.length === 0) { tbody.innerHTML = noStudentsRow(2); return; }

    const { data: rows } = await sbClient.from('attendance').select('*').eq('turma', cfg.id).eq('data', dataInput.value);
    const existing = {};
    (rows || []).forEach(r => { existing[r.student_email] = r; });

    tbody.innerHTML = students.map(u => {
      const row = existing[u.email];
      const faltou = row ? !row.presente : false;
      return `
        <tr>
          <td>${u.nome}</td>
          <td style="text-align:center;"><input type="checkbox" data-email="${u.email}" ${faltou ? 'checked' : ''}></td>
        </tr>
      `;
    }).join('');
    document.getElementById('chamadaStatus').textContent = '';
  }

  async function finalizarChamada() {
    if (!sbClient) return;
    const data = document.getElementById('chamadaData').value || todayStr();
    const students = turmaStudents();
    const now = new Date().toISOString();

    const rows = students.map(u => {
      const checkbox = document.querySelector(`#chamadaBody input[data-email="${u.email}"]`);
      const faltou = !!(checkbox && checkbox.checked);
      return {
        turma: cfg.id, data,
        student_email: u.email,
        student_name: u.nome,
        presente: !faltou,
        finalizada_em: now,
        updated_at: now
      };
    });

    if (rows.length === 0) return;
    await sbClient.from('attendance').upsert(rows, { onConflict: 'turma,data,student_email' });
    document.getElementById('chamadaStatus').textContent = `Chamada registrada às ${new Date().toLocaleTimeString('pt-BR')}.`;
    renderRelatorioPresenca();
    exibirResumoChamada(data, rows);
  }

  // Abreviação usada no texto de resumo da chamada, pra copiar/colar num
  // grupo/relatório fora do portal sem precisar digitar o nome da turma toda.
  function turmaAbrev() {
    return cfg.id === 'sistemas' ? 'DS' : 'JD';
  }

  function formatDataBr(isoDate) {
    const [ano, mes, dia] = isoDate.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function exibirResumoChamada(data, rows) {
    const ausentes = rows.filter(r => !r.presente).map(r => r.student_name);
    const presentesCount = rows.length - ausentes.length;
    const texto = `Turma: ${turmaAbrev()} | Data: ${formatDataBr(data)} | Alunos presentes: ${presentesCount} | Ausentes: ${ausentes.length ? ausentes.join(', ') : 'Nenhum'}`;

    document.getElementById('chamadaResumoTexto').value = texto;
    document.getElementById('chamadaResumoBox').style.display = 'block';
    document.getElementById('chamadaResumoStatus').textContent = '';
  }

  async function renderRelatorioPresenca() {
    const tbody = document.getElementById('presencaBody');
    if (!sbClient) { tbody.innerHTML = noSupabaseRow(4); return; }

    const students = turmaStudents();
    if (students.length === 0) { tbody.innerHTML = noStudentsRow(4); return; }

    const { data: rows } = await sbClient.from('attendance').select('*').eq('turma', cfg.id);
    const byStudent = {};
    (rows || []).forEach(r => {
      byStudent[r.student_email] = byStudent[r.student_email] || { dias: 0, faltas: 0 };
      byStudent[r.student_email].dias += 1;
      if (!r.presente) byStudent[r.student_email].faltas += 1;
    });

    tbody.innerHTML = students.map(u => {
      const s = byStudent[u.email] || { dias: 0, faltas: 0 };
      const pct = s.dias > 0 ? Math.round(((s.dias - s.faltas) / s.dias) * 100) : null;
      return `<tr><td>${u.nome}</td><td>${s.dias}</td><td>${s.faltas}</td><td>${pct === null ? '—' : pct + '%'}</td></tr>`;
    }).join('');
  }

  function calcMedia(n1, n2, n3, n4) {
    const vals = [n1, n2, n3, n4].map(v => (v === '' || v === null || v === undefined || isNaN(v)) ? 0 : parseFloat(v));
    return Math.round(((vals[0] + vals[1] + vals[2] + vals[3]) / 4) * 100) / 100;
  }

  async function loadNotas() {
    const tbody = document.getElementById('notasBody');
    if (!sbClient) { tbody.innerHTML = noSupabaseRow(6); return; }

    const bimestre = parseInt(document.getElementById('notasBimestre').value, 10);
    const students = turmaStudents();
    if (students.length === 0) { tbody.innerHTML = noStudentsRow(6); return; }

    const { data: rows } = await sbClient.from('grades').select('*').eq('turma', cfg.id).eq('bimestre', bimestre);
    const byStudent = {};
    (rows || []).forEach(r => { byStudent[r.student_email] = r; });

    tbody.innerHTML = students.map(u => {
      const g = byStudent[u.email] || {};
      const n1 = g.nota1 ?? '', n2 = g.nota2 ?? '', n3 = g.nota3 ?? '', n4 = g.nota4 ?? '';
      return `
        <tr data-email="${u.email}">
          <td>${u.nome}</td>
          <td><input type="number" step="0.1" min="0" max="10" class="nota-input" data-campo="nota1" value="${n1}"></td>
          <td><input type="number" step="0.1" min="0" max="10" class="nota-input" data-campo="nota2" value="${n2}"></td>
          <td><input type="number" step="0.1" min="0" max="10" class="nota-input" data-campo="nota3" value="${n3}"></td>
          <td><input type="number" step="0.1" min="0" max="10" class="nota-input" data-campo="nota4" value="${n4}"></td>
          <td class="media-cell">${calcMedia(n1, n2, n3, n4).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('tr[data-email]').forEach(tr => {
      const inputs = tr.querySelectorAll('.nota-input');
      const mediaCell = tr.querySelector('.media-cell');
      inputs.forEach(inp => {
        inp.addEventListener('input', () => {
          const vals = Array.from(inputs).map(i => i.value);
          mediaCell.textContent = calcMedia(vals[0], vals[1], vals[2], vals[3]).toFixed(2);
        });
      });
    });

    document.getElementById('notasStatus').textContent = '';
  }

  async function salvarNotas() {
    if (!sbClient) return;
    const bimestre = parseInt(document.getElementById('notasBimestre').value, 10);
    const now = new Date().toISOString();

    const rows = Array.from(document.querySelectorAll('#notasBody tr[data-email]')).map(tr => {
      const email = tr.getAttribute('data-email');
      const u = DB.users[email];
      const get = campo => {
        const inp = tr.querySelector(`.nota-input[data-campo="${campo}"]`);
        const v = inp ? inp.value : '';
        return v === '' ? null : parseFloat(v);
      };
      return {
        student_email: email,
        student_name: u ? u.nome : email,
        turma: cfg.id, bimestre,
        nota1: get('nota1'), nota2: get('nota2'), nota3: get('nota3'), nota4: get('nota4'),
        updated_at: now
      };
    });

    if (rows.length === 0) return;
    await sbClient.from('grades').upsert(rows, { onConflict: 'student_email,bimestre' });
    document.getElementById('notasStatus').textContent = `Notas salvas às ${new Date().toLocaleTimeString('pt-BR')}.`;
    renderRelatorioNotas();
  }

  // % de desempenho de uma MATÉRIA pro aluno: média das frações de conclusão
  // de TODOS os módulos de TODAS as trilhas dela (crédito parcial, não só
  // 0%/100%). Lê direto de cfg.materias, então recalcula sozinho sempre que
  // o professor adiciona uma trilha/módulo novo — nenhuma tabela guarda o %,
  // só o progresso bruto por módulo (student_module_progress).
  function materiaPercentForStudent(materia, progressRows) {
    const modules = (materia.trilhas || []).flatMap(t => (t.modules || []).map(m => ({ trilhaKey: t.key, mod: m })));
    if (modules.length === 0) return null;
    let sum = 0;
    modules.forEach(({ trilhaKey, mod }) => {
      const row = progressRows.find(r => r.trilha_key === trilhaKey && r.module_key === mod.key);
      if (!row) return;
      const total = row.progress_total || 1;
      sum += Math.min((row.progress_current || 0) / total, 1);
    });
    return Math.round((sum / modules.length) * 100);
  }

  async function renderRelatorioNotas() {
    const materias = cfg.materias || [];
    const students = turmaStudents();
    const theadRow = document.getElementById('relatorioNotasHead');
    const tbody = document.getElementById('relatorioNotasBody');
    const totalCols = 6 + materias.length;

    theadRow.innerHTML = `<th>Aluno</th><th>Média B1</th><th>Média B2</th><th>Média B3</th><th>Média B4</th><th>Média Geral</th>${materias.map(m => `<th>${m.label}</th>`).join('')}`;

    if (!sbClient) { tbody.innerHTML = noSupabaseRow(totalCols); return; }
    if (students.length === 0) { tbody.innerHTML = noStudentsRow(totalCols); return; }

    const [gradesRes, progressRes] = await Promise.all([
      sbClient.from('grades').select('*').eq('turma', cfg.id),
      sbClient.from('student_module_progress').select('*').eq('turma', cfg.id)
    ]);

    const gradesByStudent = {};
    (gradesRes.data || []).forEach(r => {
      gradesByStudent[r.student_email] = gradesByStudent[r.student_email] || {};
      gradesByStudent[r.student_email][r.bimestre] = r.media;
    });
    const progressByStudent = {};
    (progressRes.data || []).forEach(r => {
      progressByStudent[r.student_email] = progressByStudent[r.student_email] || [];
      progressByStudent[r.student_email].push(r);
    });

    tbody.innerHTML = students.map(u => {
      const bims = gradesByStudent[u.email] || {};
      const bimCells = [1, 2, 3, 4].map(b => `<td>${bims[b] !== undefined && bims[b] !== null ? Number(bims[b]).toFixed(2) : '—'}</td>`).join('');
      const lancadas = [1, 2, 3, 4].map(b => bims[b]).filter(v => v !== undefined && v !== null);
      const mediaGeral = lancadas.length ? (lancadas.reduce((a, b) => a + Number(b), 0) / lancadas.length).toFixed(2) : '—';

      const pRows = progressByStudent[u.email] || [];
      const materiaCells = materias.map(m => {
        const pct = materiaPercentForStudent(m, pRows);
        return `<td>${pct === null ? '—' : pct + '%'}</td>`;
      }).join('');

      return `<tr><td>${u.nome}</td>${bimCells}<td><b>${mediaGeral}</b></td>${materiaCells}</tr>`;
    }).join('');
  }

  // Carrega o módulo (aula teórica) num iframe escondido só pra rodar a
  // geração de slides dele — o professor não precisa abrir o módulo na
  // aba "Aulas & Atividades" nem achar o botão lá dentro pra gerar o .pptx.
  function generateSlidesFor(mod) {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:absolute; width:0; height:0; border:0; visibility:hidden;';
      iframe.src = `${mod.src}?user=${encodeURIComponent(paramUser)}&role=${encodeURIComponent(currentUser.role)}&name=${encodeURIComponent(currentUser.nome)}&turma=${encodeURIComponent(cfg.id)}`;

      const cleanup = () => { iframe.remove(); resolve(); };
      iframe.onload = async () => {
        try {
          const win = iframe.contentWindow;
          if (win && typeof win.generateSlidesForGestao === 'function') {
            await win.generateSlidesForGestao();
          }
        } catch (e) {
          // best-effort: se der erro, só limpa o iframe e segue
        }
        setTimeout(cleanup, 400);
      };
      iframe.onerror = cleanup;
      document.body.appendChild(iframe);
    });
  }

  function renderGestaoSlidesList() {
    const container = document.getElementById('gestaoSlidesList');
    if (!container) return;

    const slideModules = [];
    allTrilhas().forEach(trilha => {
      (trilha.modules || []).forEach(mod => {
        if (mod.hasSlides) slideModules.push(mod);
      });
    });

    if (slideModules.length === 0) {
      container.innerHTML = `<div class="empty-state">Nenhuma aula teórica com geração de slides nesta turma ainda.</div>`;
      return;
    }

    container.innerHTML = slideModules.map((mod, i) => `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 0; border-bottom:1px solid var(--line);">
        <span>${mod.title}</span>
        <button class="btn btn-secondary" style="padding:6px 12px; font-size:10px;" data-slide-mod="${i}">🖨️ Gerar Slides</button>
      </div>
    `).join('');

    container.querySelectorAll('[data-slide-mod]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const mod = slideModules[parseInt(btn.getAttribute('data-slide-mod'), 10)];
        const original = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳ Gerando...';
        await generateSlidesFor(mod);
        btn.disabled = false;
        btn.textContent = original;
      });
    });
  }

  function toggleGestaoSection(headEl) {
    headEl.closest('.collapsible-card').classList.toggle('expanded');
  }

  function renderGestaoTab() {
    renderGestaoStudents();
    renderGestaoTrilhas();
    renderGestaoLogs();
    fetchClipboardStateGestao();
    renderGestaoSlidesList();
    loadChamada();
    renderRelatorioPresenca();
    loadNotas();
    renderRelatorioNotas();

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
      const newValue = !gestaoClipboardBlocked;
      const { error } = await sbClient.from('classroom_settings').upsert({
        id: cfg.id, clipboard_blocked: newValue, updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) {
        alert('Não foi possível salvar o bloqueio de copiar/colar: ' + error.message);
        return;
      }
      gestaoClipboardBlocked = newValue;
      renderClipboardButtonGestao();
    });

    document.getElementById('chamadaData').addEventListener('change', () => {
      document.getElementById('chamadaResumoBox').style.display = 'none';
      loadChamada();
    });
    document.getElementById('btnFinalizarChamada').addEventListener('click', finalizarChamada);
    document.getElementById('btnCopiarResumoChamada').addEventListener('click', async () => {
      const texto = document.getElementById('chamadaResumoTexto').value;
      const statusEl = document.getElementById('chamadaResumoStatus');
      try {
        await navigator.clipboard.writeText(texto);
        statusEl.textContent = 'Copiado!';
      } catch (e) {
        statusEl.textContent = 'Não foi possível copiar automaticamente — selecione e copie manualmente.';
      }
    });
    document.getElementById('notasBimestre').addEventListener('change', loadNotas);
    document.getElementById('btnSalvarNotas').addEventListener('click', salvarNotas);
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
      const materiaAberta = document.getElementById('materiaDetailArea').style.display !== 'none';
      if (!materiaAberta) {
        if (typeof window.resumeActivityHeartbeat === 'function') {
          window.resumeActivityHeartbeat('aulas_materias', 'Aulas & Atividades — Escolhendo matéria');
        }
      } else {
        const select = document.getElementById('trilhaSelect');
        const activeSub = select ? select.value : document.querySelector('#aulasSubTabPages .subtab-page')?.id.replace('subTabContent_', '');
        const trilha = allTrilhas().find(t => t.key === activeSub);
        if (trilha && !openModuleFrame[activeSub] && typeof window.resumeActivityHeartbeat === 'function') {
          window.resumeActivityHeartbeat(`aulas_${activeSub}`, `${trilha.label} — Escolhendo módulo`);
        }
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
    frame.onload = () => applyA11yToIframe(frame);
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
    const trilha = allTrilhas().find(t => t.key === trilhaKey);
    const mod = findModule(trilhaKey, modKey);
    if (!mod || (trilha && isModuleLocked(trilha, mod))) return;

    document.getElementById(`moduleSelector_${trilhaKey}`).style.display = 'none';
    document.getElementById(`moduleFrameArea_${trilhaKey}`).style.display = 'block';
    document.getElementById(`moduleFrameTitle_${trilhaKey}`).textContent = mod.title;
    document.getElementById(`moduleFrameDesc_${trilhaKey}`).textContent = mod.desc || '';

    const frame = document.getElementById(`moduleFrame_${trilhaKey}`);
    frame.onload = () => applyA11yToIframe(frame);
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

    const trilha = allTrilhas().find(t => t.key === trilhaKey);
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
  // Módulos/jogos abrem em <iframe> com documento próprio — as variáveis de
  // fonte do documento pai não "vazam" pra dentro sozinhas. Aplica as mesmas
  // variáveis no <html> do iframe (mesma origem, então contentDocument é
  // acessível) sempre que ele carrega e sempre que o professor/aluno troca
  // a fonte com um módulo já aberto.
  function applyA11yToIframe(frame) {
    if (!frame || !frame.src || frame.src === 'about:blank') return;
    try {
      const root = frame.contentDocument && frame.contentDocument.documentElement;
      if (!root) return;
      if (a11y.fontMode === 'traditional') {
        root.style.setProperty('--user-font', 'system-ui, -apple-system, sans-serif');
        root.style.setProperty('--user-font-display', 'system-ui, -apple-system, sans-serif');
      } else {
        root.style.setProperty('--user-font', "'JetBrains Mono', monospace");
        root.style.setProperty('--user-font-display', "'VT323', monospace");
      }
      root.style.setProperty('--user-font-scale', a11y.fontScale);
    } catch (e) {
      // iframe ainda não carregou o document, ou é de outra origem — ignora
    }
  }

  function applyA11yToOpenIframes() {
    applyA11yToIframe(document.getElementById('gameFrame'));
    document.querySelectorAll('iframe[id^="moduleFrame_"]').forEach(applyA11yToIframe);
  }

  function applyA11y() {
    const root = document.documentElement;
    const btnFontStyle = document.getElementById('btnFontStyle');
    if (a11y.fontMode === 'traditional') {
      root.style.setProperty('--user-font', 'system-ui, -apple-system, sans-serif');
      root.style.setProperty('--user-font-display', 'system-ui, -apple-system, sans-serif');
      btnFontStyle.classList.add('on');
      btnFontStyle.title = 'Fonte tradicional ativa — clique para usar a fonte pixelada';
    } else {
      root.style.setProperty('--user-font', "'JetBrains Mono', monospace");
      root.style.setProperty('--user-font-display', "'VT323', monospace");
      btnFontStyle.classList.remove('on');
      btnFontStyle.title = 'Fonte pixelada ativa — clique para usar a fonte tradicional';
    }
    root.style.setProperty('--user-font-scale', a11y.fontScale);
    applyA11yToOpenIframes();

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
    document.getElementById('txtUserNom').textContent = currentUser.nome;
    document.getElementById('txtUserTurma').textContent = currentUser.role === 'professor' ? 'Corpo Docente' : cfg.label;

    if (currentUser.role === 'aluno') {
      fetchTeacherOverride();
      setupOverrideRealtime();
      fetchTrilhaLocks();
      setupTrilhaLockRealtime();
    }

    checkGamesUnlock();
    switchTab('aulas');
    // Tela padrão da aba Aulas agora é o grid de matérias (renderMaterias,
    // chamado em init()) — nenhuma trilha é aberta sozinha no carregamento.
  }

  function init() {
    renderShell();
    renderMaterias();
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
    window.ACTIVITY_LOCATION = 'aulas_materias';
    window.ACTIVITY_LABEL = 'Aulas & Atividades — Escolhendo matéria';

    const tracker = document.createElement('script');
    tracker.src = '../../shared/activity-tracker.js';
    document.body.appendChild(tracker);
  }

  // API usada pelos onclick="" gerados dinamicamente
  window.PortalCore = { openGame, closeGame, openModule, closeModule, openMateria, closeMateria, toggleStudentGamesTurma, toggleGestaoSection, toggleTrilhaLock };

  document.addEventListener('DOMContentLoaded', init);
})();
