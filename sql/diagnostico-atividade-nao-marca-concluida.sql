-- Diagnóstico: atividades concluídas pelo aluno não aparecem mais como
-- concluídas depois da migração pro login real (Supabase Auth). Só
-- leitura, não altera nada.
--
-- Por que checar student_activity_state e não só student_module_progress:
-- o selo "concluído" no card da atividade (shared/platform-core.js,
-- getModuleProgress/isModuleComplete) lê do localStorage do navegador, que
-- só é atualizado a partir do servidor via hydrateLocalProgressFromRemote()
-- — e essa função busca em public.student_activity_state (BLOCO 12 do
-- supabase-setup-completo.sql), não em student_module_progress (que é só
-- um espelho usado pro ranking e pros relatórios do professor). Se
-- student_activity_state não estiver recebendo gravação, a atividade fica
-- "esquecida" toda vez que o aluno abre o portal num navegador/dispositivo
-- sem aquele progresso local — exatamente o sintoma relatado.

-- 1) as policies de student_activity_state existem?
select tablename, policyname, cmd
from pg_policies
where tablename = 'student_activity_state'
order by cmd;

-- 2) quantos alunos de Sistemas têm alguma linha em cada tabela de
--    progresso — se "com_activity_state" for bem menor que
--    "com_module_progress", a gravação em student_activity_state está
--    falhando (mesmo com o card mostrando "salvo" localmente).
select
  (select count(*) from public.profiles where turma = 'sistemas' and role = 'aluno') as total_alunos_sistemas,
  (select count(distinct smp.student_email) from public.student_module_progress smp
     join public.profiles p on p.email = smp.student_email where p.turma = 'sistemas') as com_module_progress,
  (select count(distinct sas.student_email) from public.student_activity_state sas
     join public.profiles p on p.email = sas.student_email where p.turma = 'sistemas') as com_activity_state;

-- 3) o profile dele está certo? (email/role/turma exatamente como
--    esperado — espaço a mais ou maiúscula/minúscula diferente já quebra
--    o match usado pelas policies e pelo login)
select id, email, nome, role, turma, length(email) as tam_email, length(turma) as tam_turma
from public.profiles
where email = 'lauan.souza';

-- 4) progresso bruto do aluno em student_module_progress (espelho usado só
--    pro ranking/relatórios do professor)
select trilha_key, module_key, progress_current, progress_total, completed, updated_at
from public.student_module_progress
where student_email = 'lauan.souza'
order by updated_at desc;

-- 5) estado bruto do aluno em student_activity_state (fonte real do
--    "concluído" que aparece no card — se isso vier vazio mas a consulta 4
--    tiver linhas com completed=true, achamos o problema)
select progress_key, state, updated_at
from public.student_activity_state
where student_email = 'lauan.souza'
order by updated_at desc;
