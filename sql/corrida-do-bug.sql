-- Corrida do Bug (games/corrida-do-bug.html) — une Fuga do Bug + QuizRush.
-- Rode UMA vez no SQL Editor do Supabase — é seguro rodar de novo
-- (idempotente). É o mesmo trecho que está logo depois do BLOCO 16 de
-- sql/supabase-setup-completo.sql, pra quem já tem o banco montado e não
-- quer rodar o script completo de novo.
--
-- O que isso cria:
--   • corridadobug_sessions — uma corrida ao vivo por turma (fase +
--     perguntas sorteadas na criação, fixas pra todo mundo).
--   • corridadobug_players — quem entrou na sala.
--   • corridadobug_progress — progresso ao vivo de cada aluno (checkpoint
--     atual, pontuação, se já chegou na bandeira) — atualizado a cada
--     checkpoint, não a cada frame de física.

create table if not exists public.corridadobug_sessions (
  id uuid primary key default gen_random_uuid(),
  turma text not null,
  created_by text not null,
  level_index int not null,
  trilha_label text,
  module_title text,
  questions jsonb not null,
  status text not null default 'lobby' check (status in ('lobby', 'racing', 'ended')),
  started_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_corridadobug_sessions_turma on public.corridadobug_sessions (turma, created_at desc);

create table if not exists public.corridadobug_players (
  session_id uuid not null references public.corridadobug_sessions(id) on delete cascade,
  student_email text not null,
  student_name text not null,
  joined_at timestamptz not null default now(),
  primary key (session_id, student_email)
);

create table if not exists public.corridadobug_progress (
  session_id uuid not null references public.corridadobug_sessions(id) on delete cascade,
  student_email text not null,
  student_name text not null,
  checkpoint int not null default 0,
  misses int not null default 0,
  score int not null default 0,
  finished boolean not null default false,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (session_id, student_email)
);

alter table public.corridadobug_sessions enable row level security;
alter table public.corridadobug_players enable row level security;
alter table public.corridadobug_progress enable row level security;

drop policy if exists "corridadobug_sessions_select_all" on public.corridadobug_sessions;
create policy "corridadobug_sessions_select_all"
  on public.corridadobug_sessions for select using (true);
drop policy if exists "corridadobug_sessions_insert_professor" on public.corridadobug_sessions;
create policy "corridadobug_sessions_insert_professor"
  on public.corridadobug_sessions for insert with check (public.is_professor());
drop policy if exists "corridadobug_sessions_update_professor" on public.corridadobug_sessions;
create policy "corridadobug_sessions_update_professor"
  on public.corridadobug_sessions for update
  using (public.is_professor()) with check (public.is_professor());

drop policy if exists "corridadobug_players_select_all" on public.corridadobug_players;
create policy "corridadobug_players_select_all"
  on public.corridadobug_players for select using (true);
drop policy if exists "corridadobug_players_insert_self" on public.corridadobug_players;
create policy "corridadobug_players_insert_self"
  on public.corridadobug_players for insert
  with check (student_email = public.current_email());

drop policy if exists "corridadobug_progress_select_all" on public.corridadobug_progress;
create policy "corridadobug_progress_select_all"
  on public.corridadobug_progress for select using (true);
drop policy if exists "corridadobug_progress_insert_self" on public.corridadobug_progress;
create policy "corridadobug_progress_insert_self"
  on public.corridadobug_progress for insert
  with check (student_email = public.current_email());
drop policy if exists "corridadobug_progress_update_self" on public.corridadobug_progress;
create policy "corridadobug_progress_update_self"
  on public.corridadobug_progress for update
  using (student_email = public.current_email())
  with check (student_email = public.current_email());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'corridadobug_sessions'
  ) then
    alter publication supabase_realtime add table public.corridadobug_sessions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'corridadobug_players'
  ) then
    alter publication supabase_realtime add table public.corridadobug_players;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'corridadobug_progress'
  ) then
    alter publication supabase_realtime add table public.corridadobug_progress;
  end if;
end $$;
