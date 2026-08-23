-- Diagnóstico do ranking (badge de progresso + placar dos minigames) depois
-- da migração pra Supabase Auth (commit c2eb9b2). Só leitura, não altera
-- nada — cole no SQL Editor do Supabase e rode.
--
-- O que cada consulta checa:
--   1) public.profiles está populado, com role/turma corretos pra cada aluno
--      (precisa bater com 'aluno'/'professor' e 'jogos'/'sistemas' — ver
--      turmas/jogos/config.js e turmas/sistemas/config.js).
--   2) as 3 functions SECURITY DEFINER que as policies novas dependem
--      (current_email, is_professor, current_turma) existem.
--   3) a tabela game_scores (placar dos minigames, BLOCO 9 do
--      supabase-setup-completo.sql) foi criada.
--   4) as policies de RLS esperadas existem nas tabelas certas — se algum
--      bloco do supabase-setup-completo.sql não rodou até o fim (por causa
--      de um erro no meio do script), é aqui que aparece a lacuna.

-- 1) profiles está populado e com turma/role corretos?
select role, turma, count(*) from public.profiles group by role, turma order by 1, 2;

-- 2) as 3 functions de identidade existem?
select proname from pg_proc where proname in ('current_email', 'is_professor', 'current_turma');

-- 3) game_scores existe?
select to_regclass('public.game_scores') as game_scores_existe;

-- 4) as policies certas estão nas tabelas certas?
select tablename, policyname, cmd
from pg_policies
where tablename in ('profiles', 'student_module_progress', 'game_scores')
order by tablename, cmd;
