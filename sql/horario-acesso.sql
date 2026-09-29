-- "Horário de Acesso" (Gestão → Bloqueios e Liberações): o professor define
-- início e fim, por turma, e fora desse horário o aluno vê o portal fechado
-- (shared/horario-acesso.js). Rode UMA vez no SQL Editor do Supabase — é
-- seguro rodar de novo (idempotente). É o mesmo trecho que está em
-- sql/supabase-setup-completo.sql.
--
-- acesso_restrito false = livre a qualquer hora (os horários ficam gravados
-- pra religar depois sem digitar de novo). A hora "de agora" vem do servidor
-- (quizrush_server_now), então o aluno não abre o portal mexendo no relógio.
alter table public.classroom_settings add column if not exists acesso_restrito boolean not null default false;
alter table public.classroom_settings add column if not exists acesso_inicio time;
alter table public.classroom_settings add column if not exists acesso_fim time;
