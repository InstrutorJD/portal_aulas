-- ============================================================
-- Liberação manual de jogos pelo professor (compartilhada entre
-- o navegador do professor e o navegador do aluno via Supabase).
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

create table if not exists public.student_overrides (
  student_email text primary key,
  games_unlocked boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.student_overrides enable row level security;

create policy "student_overrides_select_all"
  on public.student_overrides for select
  using (true);

create policy "student_overrides_insert_all"
  on public.student_overrides for insert
  with check (true);

create policy "student_overrides_update_all"
  on public.student_overrides for update
  using (true)
  with check (true);

alter publication supabase_realtime add table public.student_overrides;
