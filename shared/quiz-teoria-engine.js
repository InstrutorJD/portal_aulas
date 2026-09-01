// Motor compartilhado das aulas "história + quiz" (formato descrito no
// README, seção "Trilha por capacidade (MSEP)"). Extraído da lógica que
// antes estava colada, idêntica, em cada *-teoria.html — só os textos/tema
// (mentor, rótulos de progresso, tela de sucesso) variam por aula.
//
// No erro, o quiz NÃO revela qual era a opção certa (nem destaca ela, nem
// escreve a resposta no feedback) — o aluno erra e segue pra próxima
// pergunta. A única nova chance é reiniciar o quiz inteiro ao final, se
// ficar abaixo de 80% de acerto (finishJourney/#btnRestart) — como a
// resposta nunca foi revelada durante o percurso, esse reinício continua
// medindo compreensão de verdade, em vez de decoreba.
//
// Trava contra "responder até acertar" recarregando a página: o progresso
// salvo carrega um flag `answered` junto do `lastStepIndex` — se a pergunta
// salva já tinha sido respondida (certo OU errado), sair/voltar pula pra
// PRÓXIMA pergunta em vez de reexibir a mesma (ver resumeIndex() abaixo).
// Sem isso, dava pra responder, ver que errou, recarregar a página (o save
// anterior gravava o MESMO índice, sem marcar que já tinha sido respondida)
// e tentar de novo à vontade — e o mesmo furo também deixava inflar
// `correctCount` além de `steps.length` (respondendo a MESMA pergunta certa
// repetidas vezes recarregando logo depois de acertar), o que fazia o %
// final passar de 100%. Só sem responder nada (saiu no meio da pergunta,
// sem clicar em nenhuma opção) é que volta na mesma pergunta, do jeito que
// sempre foi.
(function () {
  function shuffleIndexes(length) {
    const arr = Array.from({ length }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function run(config) {
    const { activityLocation, steps, reportLabel, mentor, finishPassed } = config;

    const username = new URLSearchParams(window.location.search).get('user') || 'anon';
    const PROGRESS_KEY = `${activityLocation}_progress_${username}`;
    const ORDER_KEY = PROGRESS_KEY.replace('_progress_', '_order_');

    const storyWrap = document.getElementById('storyWrap');
    const lblStepNum = document.getElementById('lblStepNum');
    const lblStepTotal = document.getElementById('lblStepTotal');
    const progressFill = document.getElementById('progressFill');

    lblStepTotal.textContent = steps.length;

    // Bypass pro professor: ele quer revisar/projetar o conteúdo em aula sem
    // precisar responder cada pergunta pra avançar (ver PENDENCIAS.md,
    // "Desbloquear todas as etapas das atividades para o professor"). A
    // checagem é assíncrona — a 1ª pergunta pode renderizar antes dela
    // resolver, mas a partir da 2ª (renderQuestion roda de novo a cada
    // etapa) o botão de pular já aparece.
    let isProfessor = false;
    (async function () {
      const user = window.PortalSession ? await window.PortalSession.getUser() : null;
      isProfessor = !!(user && user.role === 'professor');
    })();

    function loadProgress() {
      try {
        return JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
      } catch (e) {
        return null;
      }
    }

    function saveProgress(data) {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
    }

    function shuffleOrder() {
      return shuffleIndexes(steps.length);
    }

    function loadOrder() {
      try {
        const parsed = JSON.parse(localStorage.getItem(ORDER_KEY) || 'null');
        if (Array.isArray(parsed) && parsed.length === steps.length && parsed.every(n => Number.isInteger(n) && n >= 0 && n < steps.length)) {
          return parsed;
        }
      } catch (e) {}
      return null;
    }

    const saved = loadProgress();
    // stepOrder/currentStepIndex ficam em window (não em variável fechada
    // aqui) de propósito: tests/quiz-80-percent-threshold.spec.js lê os dois
    // via page.evaluate() como globais da página.
    window.stepOrder = (saved && !saved.completed) ? (loadOrder() || shuffleOrder()) : shuffleOrder();
    localStorage.setItem(ORDER_KEY, JSON.stringify(window.stepOrder));
    let correctCount = (saved && typeof saved.correctCount === 'number') ? saved.correctCount : 0;

    // Pergunta salva já respondida (saved.answered) -> resume na PRÓXIMA.
    // Ainda sem resposta -> resume na mesma, como sempre foi.
    if (saved && !saved.completed) {
      const savedIndex = Math.min(saved.lastStepIndex || 0, steps.length - 1);
      window.currentStepIndex = saved.answered ? savedIndex + 1 : savedIndex;
    } else {
      window.currentStepIndex = 0;
    }

    function updateProgressBar() {
      const pct = Math.round((window.currentStepIndex / steps.length) * 100);
      progressFill.style.width = pct + '%';
      lblStepNum.textContent = Math.min(window.currentStepIndex + 1, steps.length);
    }

    function reportStep(label) {
      if (typeof window.reportActivity === 'function') {
        window.reportActivity(activityLocation, label, {
          step: window.currentStepIndex + 1,
          total: steps.length,
          correctCount: correctCount
        });
      }
    }

    function renderStory() {
      updateProgressBar();
      const step = steps[window.stepOrder[window.currentStepIndex]];
      reportStep(`${reportLabel} — Etapa ${window.currentStepIndex + 1}/${steps.length}`);

      storyWrap.innerHTML = '';

      const row = document.createElement('div');
      row.className = `${mentor.rowClass}-row`;
      row.innerHTML = `
        <div class="${mentor.rowClass}-avatar">${mentor.avatar}</div>
        <div class="speech-bubble">
          <span class="${mentor.rowClass}-name">${mentor.name}</span>
          ${step.story}
        </div>
      `;
      storyWrap.appendChild(row);

      const actions = document.createElement('div');
      actions.className = 'actions';
      actions.innerHTML = `<button class="btn" id="btnNext">Próximo →</button>`;
      storyWrap.appendChild(actions);

      document.getElementById('btnNext').addEventListener('click', renderQuestion);
    }

    function renderQuestion() {
      const step = steps[window.stepOrder[window.currentStepIndex]];
      const q = step.question;

      storyWrap.innerHTML = '';

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<h2>❓ ${q.prompt}</h2>`;

      const optionsWrap = document.createElement('div');
      const letters = ['A', 'B', 'C', 'D'];
      let answered = false;

      const order = shuffleIndexes(q.options.length);
      const correctPos = order.indexOf(q.correctIndex);

      order.forEach((origIdx, pos) => {
        const optText = q.options[origIdx];
        const opt = document.createElement('div');
        opt.className = 'option';
        opt.innerHTML = `<span class="opt-letter">${letters[pos]}</span><span>${optText}</span>`;
        opt.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          selectAnswer(pos);
        });
        optionsWrap.appendChild(opt);

        function selectAnswer(chosenIdx) {
          const allOptionEls = optionsWrap.querySelectorAll('.option');
          allOptionEls.forEach(el => el.classList.add('disabled'));

          const isCorrect = chosenIdx === correctPos;
          allOptionEls[chosenIdx].classList.add(isCorrect ? 'correct' : 'incorrect');
          if (isCorrect) correctCount++;

          const feedback = document.createElement('div');
          feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
          feedback.innerHTML = isCorrect
            ? `✅ Correto! ${q.explanation}`
            : `❌ Não foi dessa vez. Vamos para a próxima pergunta.`;
          card.appendChild(feedback);

          const actions = document.createElement('div');
          actions.className = 'actions';
          actions.style.marginTop = '14px';
          actions.innerHTML = `<button class="btn" id="btnNextAfterAnswer">Próximo →</button>`;
          card.appendChild(actions);

          saveProgress({ lastStepIndex: window.currentStepIndex, correctCount, completed: false, answered: true });
          reportStep(`${reportLabel} — Etapa ${window.currentStepIndex + 1}/${steps.length} (respondida)`);

          document.getElementById('btnNextAfterAnswer').addEventListener('click', () => {
            window.currentStepIndex++;
            if (window.currentStepIndex >= steps.length) {
              finishJourney();
            } else {
              saveProgress({ lastStepIndex: window.currentStepIndex, correctCount, completed: false, answered: false });
              renderStory();
            }
          });
        }
      });

      card.appendChild(optionsWrap);

      if (isProfessor) {
        const profActions = document.createElement('div');
        profActions.className = 'actions';
        profActions.style.marginTop = '10px';
        profActions.innerHTML = `<button class="btn btn-secondary" id="btnSkipProfessor">⏭️ Pular (professor)</button>`;
        card.appendChild(profActions);
      }

      storyWrap.innerHTML = '';
      storyWrap.appendChild(card);

      if (isProfessor) {
        document.getElementById('btnSkipProfessor').addEventListener('click', () => {
          window.currentStepIndex++;
          if (window.currentStepIndex >= steps.length) {
            finishJourney(true);
          } else {
            renderStory();
          }
        });
      }
    }

    function finishJourney(reviewOnly) {
      // Math.min defensivo: com resumeIndex fechando o furo de recarregar-e-
      // responder-de-novo (ver comentário no topo do arquivo), correctCount
      // não deveria mais passar de steps.length — mas o clamp aqui garante
      // que o % exibido nunca estoura 100 mesmo se algum estado antigo (de
      // antes dessa correção) ainda estiver salvo no localStorage/Supabase
      // de algum aluno.
      const pct = steps.length > 0 ? Math.min(Math.round((correctCount / steps.length) * 100), 100) : 0;
      const passed = reviewOnly ? true : pct >= 80;
      if (!reviewOnly) {
        saveProgress({ lastStepIndex: steps.length, correctCount, completed: passed });
        reportStep(`${reportLabel} — ${passed ? 'Concluída' : 'Não concluída'} (${correctCount}/${steps.length})`);
      }

      progressFill.style.width = '100%';
      lblStepNum.textContent = steps.length;

      storyWrap.innerHTML = passed ? `
        <div class="card finish-screen">
          <div class="trophy">🏆</div>
          <h2>${finishPassed.title}</h2>
          ${finishPassed.introHtml}
          <div class="score">Você acertou ${correctCount} de ${steps.length} perguntas (${pct}%).</div>
          ${finishPassed.closingHtml}
          <div class="actions" style="justify-content:center; margin-top:12px;">
            <button class="btn btn-secondary" id="btnRestart">${finishPassed.restartLabel}</button>
          </div>
        </div>
      ` : `
        <div class="card finish-screen">
          <div class="trophy">📚</div>
          <h2>Quase lá!</h2>
          <p>Você acertou ${correctCount} de ${steps.length} perguntas (${pct}%) — é preciso pelo menos 80% de acerto para concluir esta atividade.</p>
          <div class="actions" style="justify-content:center; margin-top:12px;">
            <button class="btn" id="btnRestart">🔁 Tentar novamente</button>
          </div>
        </div>
      `;

      document.getElementById('btnRestart').addEventListener('click', () => {
        window.currentStepIndex = 0;
        correctCount = 0;
        window.stepOrder = shuffleOrder();
        localStorage.setItem(ORDER_KEY, JSON.stringify(window.stepOrder));
        saveProgress({ lastStepIndex: 0, correctCount: 0, completed: false });
        renderStory();
      });
    }

    const btnGenSlides = document.getElementById('btnGenSlides');
    if (btnGenSlides) {
      (async function () {
        const user = window.PortalSession ? await window.PortalSession.getUser() : null;
        if (!user || user.role !== 'professor') return;
        btnGenSlides.style.display = 'inline-block';
        btnGenSlides.addEventListener('click', () => {
          btnGenSlides.disabled = true;
          btnGenSlides.textContent = '⏳ Gerando...';
          setTimeout(() => {
            window.generateSlidesForGestao();
            btnGenSlides.disabled = false;
            btnGenSlides.textContent = '🖨️ Gerar Slides (PPTX)';
          }, 50);
        });
      })();
    }

    if (saved && saved.completed) {
      window.currentStepIndex = steps.length;
      finishJourney(true);
    } else if (window.currentStepIndex >= steps.length) {
      // resumeIndex empurrou pra depois da última pergunta — o aluno
      // respondeu tudo e saiu antes de ver a tela de resultado. Não sobrou
      // pergunta nova pra mostrar, então fecha a jornada de verdade agora
      // (não reviewOnly: decide completed conforme o % de acerto de sempre).
      finishJourney();
    } else {
      renderStory();
    }
  }

  window.PortalQuizTeoria = { run: run };
})();
