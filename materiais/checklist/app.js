// Site de exemplo da Aula 01 (ver index.html). Busca os equipamentos e os
// itens em equipamentos.json (mais um pedido na aba Rede) e monta o
// checklist. A regra "item crítico reprovado bloqueia" roda aqui, no
// navegador, SÓ para demonstração — num sistema de verdade ela fica no
// backend (é exatamente o que a aula discute no slide "Onde fica a regra?").
(async function () {
  const $ = id => document.getElementById(id);
  const resposta = await fetch('equipamentos.json');
  const dados = await resposta.json();

  $('equipamento').innerHTML = dados.equipamentos
    .map(e => `<option value="${e.codigo}">${e.codigo} — ${e.nome}</option>`).join('');

  const marcado = {};
  $('itens').innerHTML = dados.itens.map((it, i) => `
    <li class="item">
      <span><span class="nome">${it.nome}</span>${it.critico ? '<span class="critico">CRÍTICO</span>' : ''}</span>
      <span class="botoes">
        <button type="button" class="ok" data-i="${i}" data-v="ok">OK</button>
        <button type="button" class="reprovado" data-i="${i}" data-v="reprovado">Reprovado</button>
      </span>
    </li>`).join('');

  $('itens').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    marcado[b.dataset.i] = b.dataset.v;
    b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  });

  $('enviar').addEventListener('click', () => {
    const r = $('resultado');
    r.hidden = false;
    if (Object.keys(marcado).length < dados.itens.length) {
      r.className = 'resultado bloqueado';
      r.textContent = 'Marque todos os itens antes de enviar.';
      return;
    }
    const bloqueia = dados.itens.some((it, i) => it.critico && marcado[i] === 'reprovado');
    r.className = 'resultado ' + (bloqueia ? 'bloqueado' : 'liberado');
    r.textContent = bloqueia ? '⛔ BLOQUEADO — item crítico reprovado' : '✅ LIBERADO para o turno';
  });

  // ---------- Bastidores: a "aba Rede" de quem está no celular ----------
  // Lista os pedidos que o navegador já fez para montar esta página
  // (Resource Timing API). O status só aparece nos navegadores que o
  // informam (Chrome/Edge); nos outros, "—".
  const arquivo = url => decodeURIComponent(new URL(url).pathname.split('/').pop() || 'checklist (a página)');
  const TIPO = { navigation: 'página (HTML)', link: 'estilo (CSS)', css: 'estilo (CSS)', script: 'script (JS)', img: 'imagem', fetch: 'dados (JSON)' };
  const pintaStatus = s => !s ? '<td class="status">—</td>' : `<td class="status ${s >= 400 ? 'status-erro' : 'status-ok'}">${s}</td>`;

  $('verPedidos').addEventListener('click', () => {
    const lista = [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')];
    $('bastidoresSaida').innerHTML = `
      <table class="pedidos">
        <thead><tr><th>Arquivo</th><th>Tipo</th><th>Método</th><th>Status</th></tr></thead>
        <tbody>${lista.map(e => `<tr><td>${arquivo(e.name)}</td><td>${TIPO[e.initiatorType || e.entryType] || e.initiatorType}</td><td>GET</td>${pintaStatus(e.responseStatus)}</tr>`).join('')}</tbody>
      </table>
      <p class="total">Total: ${lista.length} pedidos HTTP</p>`;
  });

  $('pedir404').addEventListener('click', async () => {
    const saida = $('bastidoresSaida');
    try {
      const r = await fetch('nao-existe.html', { cache: 'no-store' });
      saida.innerHTML = `<p class="total">GET nao-existe.html → <span class="${r.ok ? 'status-ok' : 'status-erro'}">${r.status} ${r.statusText || (r.status === 404 ? 'Not Found' : '')}</span></p>
        <p>O servidor respondeu que esse arquivo <b>não existe</b>.</p>`;
    } catch (e) {
      saida.innerHTML = '<p class="total status-erro">Sem conexão com o servidor.</p>';
    }
  });
})();
