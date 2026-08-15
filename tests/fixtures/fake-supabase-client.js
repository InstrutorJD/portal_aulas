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

  function matches(row, filters) {
    return filters.every(([col, val]) => row[col] === val);
  }

  function makeQuery(name) {
    const filters = [];
    const api = {
      select() { return api; },
      eq(col, val) { filters.push([col, val]); return api; },
      order() { return api; },
      maybeSingle() {
        return Promise.resolve({
          data: table(name).filter(r => matches(r, filters))[0] || null,
          error: null,
        });
      },
      upsert(payload, opts) {
        const rows = Array.isArray(payload) ? payload : [payload];
        const t = table(name);
        const conflictCol = (opts && opts.onConflict) || (rows[0] && (rows[0].id !== undefined ? 'id' : rows[0].ip_address !== undefined ? 'ip_address' : rows[0].student_email !== undefined ? 'student_email' : null));
        rows.forEach(row => {
          const idx = conflictCol ? t.findIndex(r => r[conflictCol] === row[conflictCol]) : -1;
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
        return Promise.resolve({
          data: table(name).filter(r => matches(r, filters)),
          error: null,
        }).then(resolve, reject);
      },
    };
    return api;
  }

  function createClient() {
    return {
      from(name) { return makeQuery(name); },
      channel() {
        const chan = { on() { return chan; }, subscribe() { return chan; } };
        return chan;
      },
      rpc(_name, _params) {
        return Promise.resolve({ data: null, error: null });
      },
    };
  }

  window.supabase = { createClient };
})();
