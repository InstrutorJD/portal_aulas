-- "Pegar pontos" (opção que o professor liga ao criar a partida do QuizRush)
-- e a penalidade de sair da tela durante uma pergunta (sempre ativa, não é
-- opcional). Rode UMA vez no SQL Editor do Supabase — é seguro rodar de novo
-- (idempotente) e não mexe em nenhuma sessão/resposta já existente. É o
-- mesmo trecho que está logo depois do BLOCO 11 de
-- sql/supabase-setup-completo.sql, pra quem já tem o banco montado e não
-- quer rodar o script completo de novo.
--
-- O que isso cria:
--   • quizrush_sessions.allow_steal — a opção marcada na tela de criação
--     ("Criar um QuizRush" / "Iniciar Quizz Prático").
--   • quizrush_powers — um aluno que ACERTOU a pergunta escolhe pegar
--     pontos de um colega (valor interno 'roubar', mostrado na tela como
--     "pegar") ou ficar com um 'bonus' pra si. Uma linha por aluno por
--     pergunta (só dá pra usar o poder uma vez por pergunta).
--   • quizrush_penalties — quem troca de aba/minimiza durante uma pergunta
--     ao vivo perde pontos na hora (continua logado, só perde pontuação).
--     Também uma linha por aluno por pergunta.
--
-- shared/quizrush-engine.js (leaderboardFrom) soma as duas tabelas junto
-- com quizrush_answers pra chegar no placar de cada aluno. Sem rodar este
-- script, os dois recursos ficam quietos/sem efeito (a opção "pegar
-- pontos" nem aparece na tela de criação, e sair da tela não perde nada).

alter table public.quizrush_sessions add column if not exists allow_steal boolean not null default false;

create table if not exists public.quizrush_powers (
  session_id uuid not null references public.quizrush_sessions(id) on delete cascade,
  question_index int not null,
  student_email text not null,
  student_name text not null,
  action text not null check (action in ('roubar', 'bonus')),
  target_email text,
  target_name text,
  amount int not null,
  created_at timestamptz not null default now(),
  primary key (session_id, student_email, question_index)
);

create index if not exists idx_quizrush_powers_session on public.quizrush_powers (session_id, question_index);

alter table public.quizrush_powers enable row level security;
drop policy if exists "quizrush_powers_select_all" on public.quizrush_powers;
create policy "quizrush_powers_select_all" on public.quizrush_powers for select using (true);
drop policy if exists "quizrush_powers_insert_self" on public.quizrush_powers;
create policy "quizrush_powers_insert_self" on public.quizrush_powers for insert with check (student_email = public.current_email());

create table if not exists public.quizrush_penalties (
  session_id uuid not null references public.quizrush_sessions(id) on delete cascade,
  question_index int not null,
  student_email text not null,
  student_name text not null,
  amount int not null default 1000,
  created_at timestamptz not null default now(),
  primary key (session_id, student_email, question_index)
);

create index if not exists idx_quizrush_penalties_session on public.quizrush_penalties (session_id, question_index);

alter table public.quizrush_penalties enable row level security;
drop policy if exists "quizrush_penalties_select_all" on public.quizrush_penalties;
create policy "quizrush_penalties_select_all" on public.quizrush_penalties for select using (true);
drop policy if exists "quizrush_penalties_insert_self" on public.quizrush_penalties;
create policy "quizrush_penalties_insert_self" on public.quizrush_penalties for insert with check (student_email = public.current_email());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'quizrush_powers'
  ) then
    alter publication supabase_realtime add table public.quizrush_powers;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'quizrush_penalties'
  ) then
    alter publication supabase_realtime add table public.quizrush_penalties;
  end if;
end $$;

-- Conferência (opcional): as duas tabelas devem aparecer aqui.
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('quizrush_powers', 'quizrush_penalties');
