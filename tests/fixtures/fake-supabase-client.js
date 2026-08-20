// Cliente Supabase falso, em memória, só com o suficiente pra exercitar o
// mesmo código que a app roda de verdade (from/select/eq/upsert/update/
// delete/channel/rpc). Os dados vêm de window.__FAKE_DB__, que cada teste
// injeta via page.addInitScript antes de navegar.
(function () {
  function db() {
    window.__FAKE_DB__ = window.__FAKE_DB__ || {};
    return window.__FAKE_DB__;
  }

  function table(name) {
    const d = db();
    d[name] = d[name] || [];
    return d[name];
  }

  // Opt-in: window.__FAKE_DB__.__errors = { game_scores: 'relation "game_scores" does not exist' }
  // simula uma tabela/policy ausente no Supabase de verdade, pra testar como
  // a app reage a um erro de consulta (não só a "tabela vazia").
  function forcedError(name) {
    const err = db().__errors && db().__errors[name];
    return err ? { message: err } : null;
  }

  function matches(row, filters) {
    return filters.every(([col, val]) => row[col] === val);
  }

  function makeQuery(name) {
    const filters = [];
    let orderBy = null;
    let limitN = null;
    const api = {
      select() { return api; },
      eq(col, val) { filters.push([col, val]); return api; },
      order(col, opts) { orderBy = { col, ascending: !(opts && opts.ascending === false) }; return api; },
      limit(n) { limitN = n; return api; },
      maybeSingle() {
        const error = forcedError(name);
        return Promise.resolve({
          data: error ? null : (table(name).filter(r => matches(r, filters))[0] || null),
          error,
        });
      },
      upsert(payload, opts) {
        const rows = Array.isArray(payload) ? payload : [payload];
        const t = table(name);
        // onConflict pode ser uma coluna só ("id") ou composta ("turma,data,student_email"),
        // igual ao Supabase de verdade — nesse caso a linha só é a "mesma" se TODAS baterem.
        const conflictCols = ((opts && opts.onConflict) || (rows[0] && (rows[0].id !== undefined ? 'id' : rows[0].ip_address !== undefined ? 'ip_address' : rows[0].student_email !== undefined ? 'student_email' : null)) || '')
          .split(',').map(c => c.trim()).filter(Boolean);
        rows.forEach(row => {
          const idx = conflictCols.length ? t.findIndex(r => conflictCols.every(c => r[c] === row[c])) : -1;
          if (idx >= 0) t[idx] = Object.assign({}, t[idx], row);
          else t.push(row);
        });
        return Promise.resolve({ data: rows, error: null });
      },
      update(payload) {
        return {
          eq(col, val) {
            table(name).forEach(r => { if (r[col] === val) Object.assign(r, payload); });
            return Promise.resolve({ data: null, error: null });
          },
        };
      },
      delete() {
        return {
          eq(col, val) {
            const t = table(name);
            db()[name] = t.filter(r => r[col] !== val);
            return Promise.resolve({ data: null, error: null });
          },
        };
      },
      then(resolve, reject) {
        const error = forcedError(name);
        if (error) return Promise.resolve({ data: null, error }).then(resolve, reject);
        let rows = table(name).filter(r => matches(r, filters));
        if (orderBy) {
          rows = rows.slice().sort((a, b) => {
            const av = a[orderBy.col], bv = b[orderBy.col];
            if (av === bv) return 0;
            const cmp = av > bv ? 1 : -1;
            return orderBy.ascending ? cmp : -cmp;
          });
        }
        if (limitN != null) rows = rows.slice(0, limitN);
        return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
      },
    };
    return api;
  }

  // ---------- Auth fake ----------
  //
  // window.PortalSession.getUser() (shared/session.js) chama
  // auth.getUser() e depois consulta a tabela profiles pelo id — os dois
  // precisam bater pra qualquer página autenticada renderizar no teste.
  //
  // "Estar logado" precisa sobreviver a uma navegação de verdade (ex.:
  // index.html faz login e redireciona pra plataforma.html) — window.__FAKE_DB__
  // é reinjetado do zero a cada documento (addInitScript roda de novo em
  // toda página/iframe), então a sessão em si mora no localStorage (que o
  // navegador de verdade preserva entre navegações do mesmo site), não no
  // objeto __FAKE_DB__.
  const AUTH_STORAGE_KEY = '__fake_supabase_session';

  function getStoredAuthUser() {
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function setStoredAuthUser(user) {
    try {
      if (user) window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      else window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) { /* ignore */ }
  }

  // Modo 1 (explícito): o teste chama auth.signInWithPassword (ver
  // login.spec.js) ou seta window.__FAKE_DB__.__authUser antes de navegar
  // (ver helpers.js `loginAs`) — persiste em localStorage, sobrevive a
  // redirects de verdade.
  //
  // Modo 2 (auto, default): sem sessão explícita, sintetiza a identidade a
  // partir de "?user=...&role=...&turma=...&name=..." na própria URL da
  // página — o mesmo padrão que a suíte já usava pra montar URLs de teste
  // antes da migração pra Supabase Auth, então a maioria dos testes não
  // precisa mudar nada. Garante também a linha correspondente em
  // `profiles`, senão PortalSession.getUser() não encontra ninguém.
  function resolveFakeAuthUser() {
    const d = db();
    if (d.__authUser === null) { setStoredAuthUser(null); return null; } // teste pediu "deslogado" explicitamente
    if (d.__authUser) { setStoredAuthUser(d.__authUser); return d.__authUser; }

    // A URL da própria página manda, quando presente — cobre o padrão que
    // a suíte já usava (navegar direto pra "?user=X&role=Y") e permite um
    // mesmo teste trocar de usuário entre navegações. Só cai pro que foi
    // persistido (login.spec.js) quando a URL não traz identidade nenhuma.
    const params = new URLSearchParams(window.location.search);
    const email = params.get('user');
    if (email) {
      const id = 'fake-' + email;
      const authUser = { id, email: email + '@aluno.portal.local' };
      const profiles = table('profiles');
      if (!profiles.some(p => p.id === id)) {
        profiles.push({
          id,
          email,
          nome: params.get('name') || email,
          role: params.get('role') || 'aluno',
          turma: params.get('turma') || '',
        });
      }
      setStoredAuthUser(authUser);
      return authUser;
    }

    return getStoredAuthUser();
  }

  function createClient() {
    return {
      from(name) { return makeQuery(name); },
      auth: {
        getUser() {
          const user = resolveFakeAuthUser();
          return Promise.resolve({
            data: { user },
            error: user ? null : { message: 'not authenticated' },
          });
        },
        signInWithPassword({ email, password }) {
          const creds = db().__authCredentials || [];
          const match = creds.find(c => c.email === email && c.password === password);
          if (!match) {
            return Promise.resolve({ data: { user: null, session: null }, error: { message: 'Invalid login credentials' } });
          }
          const authUser = { id: match.id, email };
          setStoredAuthUser(authUser);
          return Promise.resolve({ data: { user: authUser, session: { user: authUser } }, error: null });
        },
        signOut() {
          setStoredAuthUser(null);
          return Promise.resolve({ error: null });
        },
      },
      channel() {
        const chan = {
          on(_event, filterConfig, callback) {
            const d = db();
            d.__realtimeCallbacks = d.__realtimeCallbacks || {};
            const t = filterConfig && filterConfig.table;
            if (t) (d.__realtimeCallbacks[t] = d.__realtimeCallbacks[t] || []).push(callback);
            return chan;
          },
          subscribe() { return chan; },
        };
        return chan;
      },
      removeChannel() {},
      // Casos especiais que espelham as funções reais do Supabase (ver
      // sql/supabase-setup-completo.sql, bloco 11): mutam a linha e devolvem question_started_at
      // como o now() do "banco" faria, em vez do relógio de quem chamou.
      rpc(name, params) {
        if (name === 'quizrush_start_session' || name === 'quizrush_next_question') {
          const row = table('quizrush_sessions').find(r => r.id === params.p_session_id);
          if (!row) return Promise.resolve({ data: null, error: null });
          const now = new Date().toISOString();
          row.status = 'question';
          row.current_index = name === 'quizrush_next_question' ? params.p_index : 0;
          row.question_started_at = now;
          return Promise.resolve({ data: now, error: null });
        }
        if (name === 'quizrush_server_now') {
          return Promise.resolve({ data: new Date().toISOString(), error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
    };
  }

  window.supabase = { createClient };

  // Ajuda os testes a simular uma atualização em tempo real (o mock acima
  // não entrega eventos sozinho): modifique window.__FAKE_DB__.<tabela>
  // primeiro, depois chame isto pra disparar os callbacks inscritos nela —
  // exercita o caminho de verdade (subscribe → callback → refetch), não só
  // uma função interna chamada direto pelo teste.
  window.__fireFakeRealtime = function (table) {
    ((db().__realtimeCallbacks && db().__realtimeCallbacks[table]) || []).forEach(cb => cb());
  };
})();
