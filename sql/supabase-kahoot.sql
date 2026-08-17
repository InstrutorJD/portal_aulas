-- ============================================================
-- Kahoot do portal (aba Jogos) — o professor escolhe uma trilha/módulo
-- teórico (STEPS + quiz) e o motor de gabarito já existente
-- (shared/gabarito-generator.js) fornece as perguntas de múltipla
-- escolha prontas; o professor hospeda uma partida ao vivo pra turma,
-- pergunta por pergunta, com cronômetro — quem acerta mais rápido
-- ganha mais pontos (shared/kahoot-engine.js calcula isso).
--
-- Só existe UMA sessão "corrente" por turma por vez (a mais recente,
-- criada por qualquer professor daquela turma) — students/host sempre
-- leem a última linha não encerrada. Ver games/kahoot.html.
--
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

create table if not exists public.kahoot_sessions (
  id uuid primary key default gen_random_uuid(),
  turma text not null,
  created_by text not null,
  trilha_label text,
  module_title text,
  -- array de { prompt, options: [...], correctIndex } — congelado no
  -- momento da criação, pra todo mundo (host + alunos) jogar a MESMA
  -- lista/ordem, mesmo que a atividade original mude depois.
  questions jsonb not null,
  status text not null default 'lobby' check (status in ('lobby', 'question', 'reveal', 'podium', 'ended')),
  current_index int not null default 0,
  question_started_at timestamptz,
  question_duration_ms int not null default 20000,
  created_at timestamptz not null default now()
);

create index if not exists idx_kahoot_sessions_turma on public.kahoot_sessions (turma, created_at desc);

create table if not exists public.kahoot_players (
  session_id uuid not null references public.kahoot_sessions(id) on delete cascade,
  student_email text not null,
  student_name text not null,
  joined_at timestamptz not null default now(),
  primary key (session_id, student_email)
);

create table if not exists public.kahoot_answers (
  session_id uuid not null references public.kahoot_sessions(id) on delete cascade,
  student_email text not null,
  student_name text not null,
  question_index int not null,
  choice_index int not null,
  is_correct boolean not null,
  score int not null default 0,
  answered_at timestamptz not null default now(),
  primary key (session_id, student_email, question_index)
);

create index if not exists idx_kahoot_answers_session on public.kahoot_answers (session_id, question_index);

alter table public.kahoot_sessions enable row level security;
alter table public.kahoot_players enable row level security;
alter table public.kahoot_answers enable row level security;

drop policy if exists "kahoot_sessions_select_all" on public.kahoot_sessions;
create policy "kahoot_sessions_select_all" on public.kahoot_sessions for select using (true);
drop policy if exists "kahoot_sessions_insert_all" on public.kahoot_sessions;
create policy "kahoot_sessions_insert_all" on public.kahoot_sessions for insert with check (true);
drop policy if exists "kahoot_sessions_update_all" on public.kahoot_sessions;
create policy "kahoot_sessions_update_all" on public.kahoot_sessions for update using (true) with check (true);

drop policy if exists "kahoot_players_select_all" on public.kahoot_players;
create policy "kahoot_players_select_all" on public.kahoot_players for select using (true);
drop policy if exists "kahoot_players_insert_all" on public.kahoot_players;
create policy "kahoot_players_insert_all" on public.kahoot_players for insert with check (true);
drop policy if exists "kahoot_players_update_all" on public.kahoot_players;
create policy "kahoot_players_update_all" on public.kahoot_players for update using (true) with check (true);

drop policy if exists "kahoot_answers_select_all" on public.kahoot_answers;
create policy "kahoot_answers_select_all" on public.kahoot_answers for select using (true);
drop policy if exists "kahoot_answers_insert_all" on public.kahoot_answers;
create policy "kahoot_answers_insert_all" on public.kahoot_answers for insert with check (true);
drop policy if exists "kahoot_answers_update_all" on public.kahoot_answers;
create policy "kahoot_answers_update_all" on public.kahoot_answers for update using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'kahoot_sessions'
  ) then
    alter publication supabase_realtime add table public.kahoot_sessions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'kahoot_players'
  ) then
    alter publication supabase_realtime add table public.kahoot_players;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'kahoot_answers'
  ) then
    alter publication supabase_realtime add table public.kahoot_answers;
  end if;
end $$;
