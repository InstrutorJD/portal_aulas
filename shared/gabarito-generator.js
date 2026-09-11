// Gerador de gabarito em texto simples (.txt) a partir dos itens (perguntas/
// desafios) de uma atividade — teórica (STEPS) ou prática (CHALLENGES).
//
// Qualquer atividade ganha o botão "Gerar Gabarito" na aba Gestão: ela só
// precisa incluir este arquivo e expor window.generateGabaritoForGestao(),
// que monta a lista `items` (ver formato abaixo) e chama
// window.PortalGabarito.generate({...}).
//
// Formato de cada item em `items`:
//   {
//     number: 1,                       // posição na lista (1-based)
//     title: 'Nome do desafio',        // opcional
//     prompt: 'Enunciado (aceita HTML, é convertido pra texto puro)',
//     options: ['Opção A', 'Opção B'], // opcional — lista de alternativas (HTML ok)
//     correctIndex: 0,                 // obrigatório se `options` for informado
//     answer: 'Resposta esperada'      // texto puro (ou várias linhas) já resolvido
//   }
//
// Não depende de internet nem de bibliotecas externas — é só dado -> .txt.
(function () {
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const LINE = '-'.repeat(78);
  const DLINE = '='.repeat(78);

  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = String(html == null ? '' : html);
    return (div.textContent || div.innerText || '').replace(/[ \t]+/g, ' ').trim();
  }

  function wrapText(text, width) {
    const out = [];
    String(text || '').split('\n').forEach(paragraph => {
      const words = paragraph.split(' ');
      let line = '';
      words.forEach(word => {
        const candidate = line ? `${line} ${word}` : word;
        if (candidate.length > width && line) {
          out.push(line);
          line = word;
        } else {
          line = candidate;
        }
      });
      out.push(line);
    });
    return out;
  }

  // Embaralha a ordem de exibição das opções pra a letra da resposta certa não
  // cair sempre em A no gabarito — mesmo com o quiz já embaralhando pro aluno
  // em tempo de jogo, o gabarito lia os dados-fonte (que guardam a resposta
  // certa sempre no índice 0) direto, sem aplicar nenhum embaralhamento.
  function shuffledOptionOrder(count) {
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }

  function formatItem(item) {
    const lines = [];
    const heading = item.title ? `${item.number}) ${item.title}` : `${item.number})`;
    lines.push(heading);

    wrapText(stripHtml(item.prompt), 74).forEach(l => lines.push(`   ${l}`));

    if (Array.isArray(item.options) && item.options.length) {
      lines.push('');
      const order = shuffledOptionOrder(item.options.length);
      order.forEach((origIdx, pos) => {
        const mark = origIdx === item.correctIndex ? '✔' : ' ';
        lines.push(`   ${mark} ${LETTERS[pos] || '?'}) ${stripHtml(item.options[origIdx])}`);
      });
    }

    lines.push('');
    const answerLines = String(item.answer == null ? '' : item.answer).split('\n');
    lines.push(`   RESPOSTA ESPERADA: ${answerLines[0] || ''}`);
    answerLines.slice(1).forEach(l => lines.push(`   ${' '.repeat('RESPOSTA ESPERADA: '.length)}${l}`));

    return lines.join('\n');
  }

  // config: { title, subtitle, items, fileName }
  function buildText(config) {
    const items = config.items || [];
    const now = new Date();
    const header = [
      DLINE,
      `GABARITO — ${config.title || ''}`,
      config.subtitle || null,
      `Gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`,
      `Total de itens: ${items.length}`,
      DLINE
    ].filter(l => l !== null).join('\n');

    const body = items.map(formatItem).join(`\n\n${LINE}\n\n`);

    return `${header}\n\n${body}\n`;
  }

  function download(content, fileName) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'gabarito.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function generate(config) {
    const text = buildText(config);
    download(text, config.fileName || 'gabarito.txt');
    return text;
  }

  window.PortalGabarito = { generate, buildText, stripHtml };

  // Botão flutuante "Gerar Gabarito" — some sozinho em qualquer atividade
  // (teórica ou prática) que defina window.generateGabaritoForGestao, sem
  // precisar de nenhum elemento HTML próprio nem alteração por atividade
  // (ao contrário do botão de Slides, que cada aula teórica declara na
  // mão — ver <button id="btnGenSlides"> nos arquivos de teoria). Só
  // aparece pro professor/admin, mesma checagem de PortalSession usada lá.
  //
  // Espera o documento terminar de carregar antes de checar
  // generateGabaritoForGestao: essa função só existe depois que o
  // <script> inline de CADA atividade roda, e esse script vem DEPOIS
  // deste arquivo no HTML — na hora que o código abaixo executa (carga
  // do <script src="gabarito-generator.js">), ainda não dá pra saber se a
  // atividade vai defini-la ou não.
  document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.generateGabaritoForGestao !== 'function') return;
    if (!window.PortalSession) return;
    let user = null;
    try {
      user = await window.PortalSession.getUser();
    } catch (e) {
      return;
    }
    if (!user || user.role !== 'professor') return;

    const btn = document.createElement('button');
    btn.id = 'btnGenGabaritoFloat';
    btn.textContent = '📋 Gerar Gabarito';
    // Canto inferior ESQUERDO de propósito: o topo de cada atividade já é
    // ocupado pela .topbar de cada arquivo (com o botão de Slides, "Pular
    // (professor)" etc. — tudo em fluxo normal, não fixed, mas ainda assim
    // na mesma faixa onde um botão fixed no topo entraria por cima) e o
    // canto inferior direito já é do widget de Libras (vlibras-widget.js).
    btn.style.cssText = 'position:fixed; bottom:16px; left:16px; z-index:9997; padding:8px 14px; font-family:Arial,Helvetica,sans-serif; font-size:12px; font-weight:700; background:#1a7a1a; color:#fff; border:1px solid #0d4d0d; border-radius:3px; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.4);';
    btn.addEventListener('click', () => {
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = '⏳ Gerando...';
      setTimeout(() => {
        try {
          window.generateGabaritoForGestao();
        } finally {
          btn.disabled = false;
          btn.textContent = original;
        }
      }, 50);
    });
    document.body.appendChild(btn);
  });
})();
