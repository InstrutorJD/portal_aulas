// Editor de código compartilhado — mesmo motor (Monaco) e visual do
// PixelCode (pixelcode.html), pra qualquer atividade poder ter um campo de
// código com realce de sintaxe de verdade em vez de um textarea simples,
// sem precisar embutir a página do PixelCode num iframe.
//
// Uso: window.PortalCodeEditor.create(containerEl, { value, readOnly, onRun })
// devolve uma Promise que resolve pra uma instância normal do Monaco
// (getValue/setValue/updateOptions({readOnly})/focus/addCommand, etc.).
(function () {
  const MONACO_BASE = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs';
  let loaderPromise = null;

  function loadMonaco() {
    if (window.monaco) return Promise.resolve();
    if (loaderPromise) return loaderPromise;

    loaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = MONACO_BASE + '/loader.js';
      script.onload = () => {
        // Monaco usa Web Workers pra recursos como diagnóstico de sintaxe.
        // Como não há bundler aqui (só CDN), o worker é montado num blob que
        // importa o script do próprio CDN — padrão usual pra rodar o Monaco
        // "solto", sem servidor de assets dedicado.
        window.MonacoEnvironment = {
          getWorkerUrl: function () {
            return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(
              `self.MonacoEnvironment = { baseUrl: '${MONACO_BASE}/../' };\n` +
              `importScripts('${MONACO_BASE}/base/worker/workerMain.js');`
            );
          }
        };
        require.config({ paths: { vs: MONACO_BASE } });
        require(['vs/editor/editor.main'], () => resolve(), reject);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return loaderPromise;
  }

  function create(container, options) {
    options = options || {};
    return loadMonaco().then(() => {
      const editor = monaco.editor.create(container, {
        value: options.value || '',
        language: 'javascript',
        theme: 'vs-dark',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        readOnly: !!options.readOnly,
      });

      if (typeof options.onRun === 'function') {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, options.onRun);
      }

      return editor;
    });
  }

  window.PortalCodeEditor = { create: create };
})();
