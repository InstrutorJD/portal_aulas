-- ============================================================
-- Diagnóstico pontual: mostra o que o banco tem gravado sobre o
-- progresso de UM aluno específico, pra investigar por que o
-- Relatório de Atividade do Dia (aba Gestão) está mostrando/escondendo
-- alguém de forma inesperada.
--
-- Rode as consultas UMA DE CADA VEZ (selecione o bloco e rode, em vez
-- do arquivo inteiro de uma vez) — são consultas separadas de
-- diagnóstico, não um script de setup. Nenhuma delas altera dados.
-- ============================================================

-- Os e-mails/nomes dos alunos NÃO ficam no Supabase — ficam em
-- shared/users-db.js, carregado no navegador (Ctrl+F pelo nome lá acha
-- o e-mail exato). A consulta 1) abaixo também serve pra achar o
-- e-mail certo: lista todo mundo que já tem alguma linha de progresso
-- gravada no Supabase.

-- ------------------------------------------------------------
-- 1) Sanity check: a sincronização de progresso está funcionando pra
--    ALGUÉM nesta turma? Se vier vazio aqui também, o problema é geral
--    (Supabase não configurado/alcançável nas sessões dos alunos), não
--    só desse aluno específico.
-- ------------------------------------------------------------
select student_email, student_name, turma, count(*) as linhas, max(updated_at) as ultima_sincronizacao
from public.student_module_progress
where turma = 'jogos' -- troque para 'sistemas' se for o caso
group by student_email, student_name, turma
order by ultima_sincronizacao desc
limit 30;

-- ------------------------------------------------------------
-- 2) Progresso detalhado de UM aluno específico. Troque
--    'EMAIL_DO_ALUNO' pelo e-mail exato (confirme com a consulta 1
--    acima, copiando o valor exato de student_email de lá).
-- ------------------------------------------------------------
select
  student_email,
  trilha_key,
  module_key,
  completed,
  completed_at,
  updated_at
from public.student_module_progress
where student_email = 'EMAIL_DO_ALUNO'
order by updated_at desc;

-- Mesma consulta, mas só as linhas REALMENTE concluídas (completed = true)
-- — pra não confundir com módulos ainda não feitos, que corretamente têm
-- completed_at vazio (isso não é bug, é o comportamento esperado).
select
  student_email,
  trilha_key,
  module_key,
  completed,
  completed_at,
  updated_at
from public.student_module_progress
where student_email = 'EMAIL_DO_ALUNO'
  and completed = true
order by updated_at desc;

-- ------------------------------------------------------------
-- 3) Confere se o gatilho que carimba completed_at existe de verdade
--    neste banco. Se vier VAZIO aqui, o script mais recente
--    (sql/supabase-chamada-notas.sql ou supabase-setup-completo.sql)
--    ainda não foi rodado neste projeto Supabase — é preciso rodá-lo
--    (o arquivo inteiro, não só este diagnóstico) pelo menos uma vez.
-- ------------------------------------------------------------
select tgname, tgrelid::regclass as tabela
from pg_trigger
where tgname = 'trg_student_module_progress_completed_at';

-- ------------------------------------------------------------
-- 4) CORRIGE AGORA os módulos que já estavam concluídos antes do
--    gatilho existir (completed_at nulo) — mesmo comando de backfill
--    que já está dentro do script principal, pra rodar isolado sem
--    precisar reexecutar o arquivo inteiro. Seguro de rodar mais de
--    uma vez (só afeta linhas com completed_at ainda nulo).
--
--    IMPORTANTE: desliga o próprio gatilho antes do UPDATE. Sem isso,
--    como completed não muda (continua true), o gatilho sobrescreve
--    completed_at de volta pro valor antigo (nulo) na mesma hora,
--    anulando o backfill inteiro mesmo reportando "N linhas alteradas"
--    (foi exatamente o que aconteceu na primeira tentativa).
-- ------------------------------------------------------------
alter table public.student_module_progress disable trigger trg_student_module_progress_completed_at;

update public.student_module_progress
set completed_at = updated_at
where completed = true and completed_at is null
returning student_email, trilha_key, module_key, completed_at;

alter table public.student_module_progress enable trigger trg_student_module_progress_completed_at;
