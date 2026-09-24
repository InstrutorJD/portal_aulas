-- "Fechar bimestre" (Gestão → Bloqueios e Liberações, coluna "Notas" da
-- tabela de bimestres). A nota de cada matéria não fica guardada em lugar
-- nenhum: é recalculada toda vez a partir das trilhas do config.js e do
-- progresso dos alunos. Fechar um bimestre CONGELA o resultado:
--
-- - grades.notas_congeladas: { "<materia_key>": nota | null } — a nota
--   final de cada matéria de cada aluno no momento do fechamento (junto com
--   nota1–nota4, que também são gravadas nessa hora);
-- - bimestre_dates.fechado: true = Lançar Notas, Perfil e Relatório leem o
--   que foi congelado, sem recalcular.
--
-- Com o bimestre fechado, o professor pode apagar as trilhas, atividades e
-- o progresso daquele bimestre sem mudar nenhuma nota. "Reabrir" só
-- desmarca bimestre_dates.fechado (ver fecharBimestre/reabrirBimestre em
-- shared/platform-core.js).
--
-- Rode UMA vez no SQL Editor do Supabase — é seguro rodar de novo
-- (idempotente). É o mesmo trecho que está em sql/supabase-setup-completo.sql.
alter table public.bimestre_dates add column if not exists fechado boolean not null default false;
alter table public.grades add column if not exists notas_congeladas jsonb;
