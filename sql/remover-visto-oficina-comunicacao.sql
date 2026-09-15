-- ============================================================
-- REMOÇÃO DA ATIVIDADE "Oficina de Comunicação" (CodePen) — turma
-- Sistemas, matéria Introdução de Desenvolvimento de Projetos.
--
-- MOTIVO: a atividade (turmas/sistemas/atividades/
-- oficina-comunicacao-trabalho.html, trilha 'oficina-comunicacao' em
-- turmas/sistemas/config.js) foi removida do portal. Este script apaga
-- o "visto" e o progresso de TODOS os alunos que já tinham feito essa
-- atividade — sem isso, as linhas ficariam órfãs no banco (apontando
-- pra uma trilha/módulo que não existe mais no config.js).
--
-- O QUE É APAGADO:
--   • public.student_module_progress — linhas com trilha_key =
--     'oficina-comunicacao' e module_key = 'trabalho' (usadas pro
--     ranking e pelos relatórios de conclusão da Gestão).
--   • public.student_activity_state — linha com progress_key =
--     'oficina_comunicacao_trabalho' (guarda o objeto {completed,
--     vistoPor, vistoEm} de cada aluno — é esse registro que faz a
--     tela de "Atividade concluída" aparecer de novo se o aluno voltar).
--
-- O QUE NÃO É TOCADO:
--   • Qualquer outra trilha/matéria — Kickoff do FinancApp
--     ('projeto-financapp-kickoff', mesma matéria) continua intacto e
--     já cobre sozinho a mesma capacidade ("Reconhecer as diferentes
--     fases pertinentes à elaboração de um projeto").
--
-- ⚠️ ATENÇÃO — LEIA ANTES DE RODAR:
--   1) Isso é IRREVERSÍVEL. Não existe "desfazer" depois de rodar.
--   2) O progresso do aluno mora em DOIS lugares: aqui no Supabase (só
--      uma cópia sincronizada, usada pros relatórios) E no localStorage
--      do NAVEGADOR de cada aluno. Rodar só este SQL zera o Supabase —
--      mas como a página oficina-comunicacao-trabalho.html também foi
--      removida do portal, não tem mais como o navegador do aluno
--      reenviar esse progresso de volta (a atividade nem carrega mais).
--      Não precisa de um passo 2 de limpeza local como nos scripts de
--      reset de trilha — a página que gravava essa chave não existe mais.
--   3) Rode a consulta de PRÉVIA primeiro, confira quem vai ser
--      afetado, e só depois descomente e rode os 2 DELETEs.
-- ============================================================

-- PRÉVIA — rode isto primeiro e confira a lista antes de apagar:
select student_email, student_name, progress_current, progress_total, completed, updated_at
from public.student_module_progress
where trilha_key = 'oficina-comunicacao' and module_key = 'trabalho'
order by student_email;

select student_email, state, updated_at
from public.student_activity_state
where progress_key = 'oficina_comunicacao_trabalho'
order by student_email;

-- REMOÇÃO — descomente as linhas abaixo e rode depois de conferir a prévia:
-- delete from public.student_module_progress
-- where trilha_key = 'oficina-comunicacao' and module_key = 'trabalho';

-- delete from public.student_activity_state
-- where progress_key = 'oficina_comunicacao_trabalho';

-- CONFERÊNCIA — deve devolver 0 linhas nas duas consultas:
-- select count(*) from public.student_module_progress
-- where trilha_key = 'oficina-comunicacao' and module_key = 'trabalho';
-- select count(*) from public.student_activity_state
-- where progress_key = 'oficina_comunicacao_trabalho';
