-- Marca como CONCLUÍDAS as 5 atividades da matéria "Banco de Dados"
-- (trilhas sql e sql-comentarios, ver turmas/sistemas/config.js) pra TODOS
-- os alunos da turma Sistemas.
--
-- ATENÇÃO — isso ESCREVE em produção pra todo mundo da turma de uma vez,
-- sem volta fácil (não existe backup automático do valor anterior). Revise
-- antes de rodar; se quiser testar num aluno só primeiro, troque a cláusula
-- "where p.role = 'aluno' and p.turma = 'sistemas'" por
-- "where p.email = 'ALGUM_USERNAME'" nas duas consultas abaixo.
--
-- Grava nas DUAS tabelas de propósito — uma só não basta:
--   1) public.student_module_progress: o que o professor vê no ranking e
--      nos relatórios de conclusão.
--   2) public.student_activity_state: a fonte real do "concluído ✅" que
--      aparece na TELA do próprio aluno (shared/platform-core.js,
--      hydrateLocalProgressFromRemote) — sem isso, o registro no banco fica
--      certo mas o aluno continua vendo a atividade como pendente até abrir
--      ela nesse módulo especificamente.
--
-- Os 5 módulos e o "tamanho" de cada um (progressTotal) vêm direto de
-- turmas/sistemas/config.js — se o currículo de Banco de Dados mudar
-- (adicionar/remover desafio), atualize os valores abaixo também.

-- 1) student_module_progress
insert into public.student_module_progress
  (student_email, student_name, turma, trilha_key, module_key, progress_current, progress_total, completed)
select p.email, p.nome, 'sistemas', m.trilha_key, m.module_key, m.progress_total, m.progress_total, true
from public.profiles p
cross join (values
  ('sql', 'teoria', 1),        -- Teoria — Fundamentos de SQL e PL/SQL (progressMode: flag)
  ('sql', 'basico', 8),        -- Prática — Central de Dados (8 desafios)
  ('sql', 'join', 5),          -- Prática — Relatórios (JOIN) (5 desafios)
  ('sql', 'agregacao', 5),     -- Prática — Estatísticas (GROUP BY) (5 desafios)
  ('sql-comentarios', 'teoria', 1) -- Teoria — Comentários em SQL e PL/SQL (flag)
) as m(trilha_key, module_key, progress_total)
where p.role = 'aluno' and p.turma = 'sistemas'
on conflict (student_email, trilha_key, module_key) do update
  set progress_current = excluded.progress_current,
      progress_total = excluded.progress_total,
      completed = true,
      updated_at = now();

-- 2) student_activity_state — teoria (progressMode 'flag') usa
--    {"completed": true}; prática usa um array com os índices dos desafios
--    já feitos (0..N-1), mesmo formato que o navegador do aluno grava de
--    verdade ao concluir cada desafio.
insert into public.student_activity_state (student_email, progress_key, state)
select p.email, a.progress_key, a.state
from public.profiles p
cross join (values
  ('sql_basico_teoria', '{"completed": true}'::jsonb),
  ('sql_basico', '[0,1,2,3,4,5,6,7]'::jsonb),
  ('sql_join', '[0,1,2,3,4]'::jsonb),
  ('sql_agregacao', '[0,1,2,3,4]'::jsonb),
  ('sql_comentarios_teoria', '{"completed": true}'::jsonb)
) as a(progress_key, state)
where p.role = 'aluno' and p.turma = 'sistemas'
on conflict (student_email, progress_key) do update
  set state = excluded.state, updated_at = now();

-- 3) conferência — deve mostrar 5 linhas, cada uma com uma contagem igual
--    ao número de alunos de Sistemas.
select trilha_key, module_key, count(*) as alunos_marcados
from public.student_module_progress
where turma = 'sistemas' and trilha_key in ('sql', 'sql-comentarios') and completed = true
group by trilha_key, module_key
order by trilha_key, module_key;
