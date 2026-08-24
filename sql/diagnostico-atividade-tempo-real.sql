-- Diagnóstico do painel "Atividade em Tempo Real" (aba Gestão) mostrando
-- alunos sempre como Offline. Só leitura, não altera nada.
--
-- Causa encontrada: o heartbeat (shared/activity-tracker.js) grava
-- updated_at usando o relógio do PRÓPRIO NAVEGADOR do aluno — um
-- computador de laboratório com relógio desacertado (comum sem NTP) faz
-- esse valor não bater com o relógio do professor, que é contra quem o
-- painel compara (offline se a diferença passar de 45s). Corrigido em
-- sql/supabase-setup-completo.sql: agora um gatilho sobrescreve
-- updated_at com now() do banco em toda gravação, então a comparação
-- passa a ser sempre contra o relógio do servidor, não do aluno.
--
-- Depois de rodar a versão atualizada de supabase-setup-completo.sql,
-- rode a consulta abaixo (pede pra um aluno deixar o portal aberto e
-- rode de novo depois de alguns segundos): idade_segundos deve ficar
-- sempre baixa e subindo devagar (não mais um número gigante e parado).

select
  student_email,
  student_name,
  turma,
  status,
  location_label,
  updated_at,
  round(extract(epoch from (now() - updated_at))) as idade_segundos
from public.student_activity
order by updated_at desc;
