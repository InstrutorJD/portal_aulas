-- ============================================================
-- FINANCAPP NUMA TRILHA SÓ (card "Projetos") — turma Sistemas.
--
-- MOTIVO: as 5 peças do projeto FinancApp ficavam espalhadas em 5
-- matérias (cada uma com a própria trilha/módulo) e contavam na
-- contagem de concluídos/nota de cada matéria. Agora viraram UMA
-- trilha, 'projeto-financapp', na matéria nova 'projetos' (ver
-- turmas/sistemas/config.js). O progresso do Supabase é gravado por
-- (trilha_key, module_key), então sem este script o visto que os
-- alunos já receberam ficaria órfão nas chaves antigas.
--
-- DE → PARA (student_module_progress):
--   projeto-financapp-kickoff     / trabalho          → projeto-financapp / kickoff
--   projeto-financapp-modelagem   / trabalho          → projeto-financapp / modelagem
--   projeto-financapp-banco-dados / trabalho          → projeto-financapp / banco-dados
--   redes-servicos-modelos        / pratica-financapp → projeto-financapp / redes
--   projeto-financapp-app         / trabalho          → projeto-financapp / app
--
-- trilha_bimestre: a trilha nova recebe o MENOR bimestre que já estava
-- atribuído às trilhas antigas (se houver) e as linhas antigas são
-- apagadas. Confira depois em Gestão → "Liberação por Trilha".
--
-- O QUE NÃO É TOCADO: student_activity_state (o visto em si, por
-- progress_key) — as chaves de progresso das atividades não mudaram.
--
-- Idempotente: rodar de novo não duplica nada (on conflict + as linhas
-- antigas já não existem mais na 2ª vez).
-- ============================================================

-- PRÉVIA — o que vai ser movido:
select student_email, trilha_key, module_key, progress_current, progress_total, completed
from public.student_module_progress
where turma = 'sistemas'
  and ((trilha_key in ('projeto-financapp-kickoff', 'projeto-financapp-modelagem',
                       'projeto-financapp-banco-dados', 'projeto-financapp-app')
        and module_key = 'trabalho')
       or (trilha_key = 'redes-servicos-modelos' and module_key = 'pratica-financapp'))
order by student_email, trilha_key;

begin;

with mapa(trilha_antiga, modulo_antigo, modulo_novo) as (
  values
    ('projeto-financapp-kickoff',     'trabalho',          'kickoff'),
    ('projeto-financapp-modelagem',   'trabalho',          'modelagem'),
    ('projeto-financapp-banco-dados', 'trabalho',          'banco-dados'),
    ('redes-servicos-modelos',        'pratica-financapp', 'redes'),
    ('projeto-financapp-app',         'trabalho',          'app')
)
insert into public.student_module_progress
  (student_email, student_name, turma, trilha_key, module_key,
   progress_current, progress_total, completed, updated_at)
select p.student_email, p.student_name, p.turma, 'projeto-financapp', m.modulo_novo,
       p.progress_current, p.progress_total, p.completed, p.updated_at
from public.student_module_progress p
join mapa m on m.trilha_antiga = p.trilha_key and m.modulo_antigo = p.module_key
where p.turma = 'sistemas'
on conflict (student_email, trilha_key, module_key) do update set
  -- Se o aluno já sincronizou a chave nova antes deste script, fica o
  -- mais avançado dos dois — nunca desfaz um visto.
  completed = public.student_module_progress.completed or excluded.completed,
  progress_current = greatest(public.student_module_progress.progress_current, excluded.progress_current),
  updated_at = greatest(public.student_module_progress.updated_at, excluded.updated_at);

delete from public.student_module_progress
where turma = 'sistemas'
  and ((trilha_key in ('projeto-financapp-kickoff', 'projeto-financapp-modelagem',
                       'projeto-financapp-banco-dados', 'projeto-financapp-app')
        and module_key = 'trabalho')
       or (trilha_key = 'redes-servicos-modelos' and module_key = 'pratica-financapp'));

insert into public.trilha_bimestre (turma, trilha_key, bimestre, updated_at)
select 'sistemas', 'projeto-financapp', min(bimestre), now()
from public.trilha_bimestre
where turma = 'sistemas'
  and trilha_key in ('projeto-financapp-kickoff', 'projeto-financapp-modelagem',
                     'projeto-financapp-banco-dados', 'projeto-financapp-app')
  and bimestre is not null
having min(bimestre) is not null
on conflict (turma, trilha_key) do nothing;

delete from public.trilha_bimestre
where turma = 'sistemas'
  and trilha_key in ('projeto-financapp-kickoff', 'projeto-financapp-modelagem',
                     'projeto-financapp-banco-dados', 'projeto-financapp-app');

commit;

-- CONFERÊNCIA — progresso já na trilha nova:
select student_email, module_key, completed
from public.student_module_progress
where turma = 'sistemas' and trilha_key = 'projeto-financapp'
order by student_email, module_key;
