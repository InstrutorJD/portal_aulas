-- ============================================================
-- QuizRush do portal (aba Jogos) — o professor escolhe uma trilha/módulo
-- teórico (STEPS + quiz) e o motor de gabarito já existente
-- (shared/gabarito-generator.js) fornece as perguntas de múltipla
-- escolha prontas; o professor hospeda uma partida ao vivo pra turma,
-- pergunta por pergunta, com cronômetro — quem acerta mais rápido
-- ganha mais pontos (shared/quizrush-engine.js calcula isso).
--
-- Só existe UMA sessão "corrente" por turma por vez (a mais recente,
-- criada por qualquer professor daquela turma) — students/host sempre
-- leem a última linha não encerrada. Ver games/quizrush.html.
--
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

create table if not exists public.quizrush_sessions (
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

create index if not exists idx_quizrush_sessions_turma on public.quizrush_sessions (turma, created_at desc);

create table if not exists public.quizrush_players (
  session_id uuid not null references public.quizrush_sessions(id) on delete cascade,
  student_email text not null,
  student_name text not null,
  joined_at timestamptz not null default now(),
  primary key (session_id, student_email)
);

create table if not exists public.quizrush_answers (
  session_id uuid not null references public.quizrush_sessions(id) on delete cascade,
  student_email text not null,
  student_name text not null,
  question_index int not null,
  choice_index int not null,
  is_correct boolean not null,
  score int not null default 0,
  answered_at timestamptz not null default now(),
  primary key (session_id, student_email, question_index)
);

create index if not exists idx_quizrush_answers_session on public.quizrush_answers (session_id, question_index);

alter table public.quizrush_sessions enable row level security;
alter table public.quizrush_players enable row level security;
alter table public.quizrush_answers enable row level security;

drop policy if exists "quizrush_sessions_select_all" on public.quizrush_sessions;
create policy "quizrush_sessions_select_all" on public.quizrush_sessions for select using (true);
drop policy if exists "quizrush_sessions_insert_all" on public.quizrush_sessions;
create policy "quizrush_sessions_insert_all" on public.quizrush_sessions for insert with check (true);
drop policy if exists "quizrush_sessions_update_all" on public.quizrush_sessions;
create policy "quizrush_sessions_update_all" on public.quizrush_sessions for update using (true) with check (true);

drop policy if exists "quizrush_players_select_all" on public.quizrush_players;
create policy "quizrush_players_select_all" on public.quizrush_players for select using (true);
drop policy if exists "quizrush_players_insert_all" on public.quizrush_players;
create policy "quizrush_players_insert_all" on public.quizrush_players for insert with check (true);
drop policy if exists "quizrush_players_update_all" on public.quizrush_players;
create policy "quizrush_players_update_all" on public.quizrush_players for update using (true) with check (true);

drop policy if exists "quizrush_answers_select_all" on public.quizrush_answers;
create policy "quizrush_answers_select_all" on public.quizrush_answers for select using (true);
drop policy if exists "quizrush_answers_insert_all" on public.quizrush_answers;
create policy "quizrush_answers_insert_all" on public.quizrush_answers for insert with check (true);
drop policy if exists "quizrush_answers_update_all" on public.quizrush_answers;
create policy "quizrush_answers_update_all" on public.quizrush_answers for update using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'quizrush_sessions'
  ) then
    alter publication supabase_realtime add table public.quizrush_sessions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'quizrush_players'
  ) then
    alter publication supabase_realtime add table public.quizrush_players;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'quizrush_answers'
  ) then
    alter publication supabase_realtime add table public.quizrush_answers;
  end if;
end $$;
