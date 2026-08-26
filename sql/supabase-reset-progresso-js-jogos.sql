-- ============================================================
-- RESET DA TRILHA "JAVASCRIPT" — turma Jogos Digitais — zera só o
-- progresso dos módulos Básico e Intermediário, sem mexer em mais
-- nada (outras trilhas, jogos, chamada, notas, turma Sistemas
-- continuam intactos).
--
-- MOTIVO: o módulo Intermediário (js-intermediario.html) ganhou 8
-- desafios novos, inseridos ENTRE o que já existia e o boss final —
-- isso deslocou o id do boss de 10 pra 18 e reaproveitou os ids
-- 10 a 17 pra conteúdo novo (objeto literal, spread, .slice(),
-- &&/||, .some(), função recebendo função). O progresso salvo é só
-- uma lista de ids concluídos, sem saber que o CONTEÚDO por trás de
-- cada id mudou — então quem já tinha terminado (ou avançado) a
-- trilha antiga corre o risco do navegador achar que já resolveu
-- desafios novos que nunca viu, pulando conteúdo sem querer.
--
-- O QUE É ZERADO:
--   • student_module_progress — só as linhas de turma='jogos' e
--     trilha_key='js' (módulos 'basico' e 'intermediario')
--
-- O QUE NÃO É TOCADO:
--   • Qualquer outra trilha/matéria (C#, GDScript, Cobrinha, etc.),
--     jogos, chamada, notas, liberação de jogos, turma Sistemas
--     (a trilha JS de lá tem outra trilha_key, 'js-fundamentos', e
--     não foi alterada — não precisa de reset).
--
-- ⚠️ ATENÇÃO — LEIA ANTES DE RODAR:
--   1) Isso é IRREVERSÍVEL. Não existe "desfazer" depois de rodar.
--   2) O progresso do aluno mora em DOIS lugares: aqui no Supabase (só
--      uma cópia sincronizada, usada pros relatórios) E no localStorage
--      do NAVEGADOR de cada aluno (é essa cópia local que decide o que
--      aparece "concluído" na tela dele). Rodar só este SQL zera o
--      Supabase — mas se o aluno abrir o portal no MESMO navegador de
--      antes, o app relê o localStorage antigo e "reenvia" o progresso
--      velho pro Supabase de novo, desfazendo o reset sem querer.
--      Pra valer 100%, cada aluno também precisa limpar o progresso
--      local — veja o script de console no final deste arquivo. Em
--      laboratório com máquina compartilhada, isso já costuma
--      acontecer sozinho quando o perfil do navegador é limpo entre
--      turmas.
--   3) Rode a consulta de PRÉVIA primeiro, confira quem vai ser
--      afetado, e só depois descomente e rode o DELETE.
-- ============================================================

-- PRÉVIA — rode isto primeiro e confira a lista antes de apagar:
select student_email, module_key, progress_current, progress_total, completed, updated_at
from public.student_module_progress
where turma = 'jogos' and trilha_key = 'js'
order by student_email, module_key;

-- RESET — descomente as 2 linhas abaixo e rode depois de conferir a prévia:
-- delete from public.student_module_progress
-- where turma = 'jogos' and trilha_key = 'js';

-- ============================================================
-- PASSO 2 (opcional, mas recomendado) — limpar o progresso local
-- Cada aluno cola isto no console do navegador (F12 → Console),
-- estando no portal (qualquer página do domínio, logado), e aperta
-- Enter. Detecta o próprio usuário pela URL e apaga só as duas
-- chaves da trilha JS — não mexe em mais nada do aluno.
-- ============================================================
--
-- (() => {
--   const u = new URLSearchParams(location.search).get('user');
--   if (!u) { console.log('Não achei o parâmetro ?user= na URL atual.'); return; }
--   localStorage.removeItem(`js_basico_progress_${u}`);
--   localStorage.removeItem(`js_intermediario_progress_${u}`);
--   console.log('Progresso local de JS (Básico e Intermediário) limpo pra', u);
-- })();
