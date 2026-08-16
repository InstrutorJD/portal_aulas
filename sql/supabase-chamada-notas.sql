-- ============================================================
-- Chamada (frequência), notas por bimestre e progresso de trilha
-- (usado no relatório de notas para mostrar % de desempenho).
--
-- Mesmo padrão das demais tabelas deste projeto: sem Supabase Auth,
-- então RLS pública (using(true)/with check(true)) via chave anon.
--
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Chamada: uma linha por (turma, data, aluno). O painel do
--    professor faz upsert de uma linha por aluno ao "Finalizar".
-- ------------------------------------------------------------

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  turma text not null,
  data date not null,
  student_email text not null,
  student_name text,
  presente boolean not null default true,
  finalizada_em timestamptz,
  updated_at timestamptz not null default now(),
  unique (turma, data, student_email)
);

create index if not exists idx_attendance_turma_data on public.attendance (turma, data);
create index if not exists idx_attendance_student on public.attendance (student_email);

alter table public.attendance enable row level security;

create policy "attendance_select_all"
  on public.attendance for select
  using (true);

create policy "attendance_insert_all"
  on public.attendance for insert
  with check (true);

create policy "attendance_update_all"
  on public.attendance for update
  using (true)
  with check (true);

-- ------------------------------------------------------------
-- 2) Notas: uma linha por (aluno, bimestre), com 4 campos de nota.
--    A média é uma coluna gerada (calculada pelo próprio banco).
-- ------------------------------------------------------------

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_email text not null,
  student_name text,
  turma text not null,
  bimestre smallint not null check (bimestre between 1 and 4),
  nota1 numeric,
  nota2 numeric,
  nota3 numeric,
  nota4 numeric,
  media numeric generated always as (
    round((coalesce(nota1, 0) + coalesce(nota2, 0) + coalesce(nota3, 0) + coalesce(nota4, 0)) / 4.0, 2)
  ) stored,
  updated_at timestamptz not null default now(),
  unique (student_email, bimestre)
);

create index if not exists idx_grades_turma_bimestre on public.grades (turma, bimestre);

alter table public.grades enable row level security;

create policy "grades_select_all"
  on public.grades for select
  using (true);

create policy "grades_insert_all"
  on public.grades for insert
  with check (true);

create policy "grades_update_all"
  on public.grades for update
  using (true)
  with check (true);

-- ------------------------------------------------------------
-- 3) Progresso de trilha, sincronizado pelo shared/platform-core.js
--    (roda no navegador do aluno) — permite o relatório de notas
--    mostrar o desempenho por trilha em %, algo que hoje só existe
--    espalhado pelo localStorage de cada aluno.
-- ------------------------------------------------------------

create table if not exists public.student_module_progress (
  student_email text not null,
  student_name text,
  turma text not null,
  trilha_key text not null,
  module_key text not null,
  progress_current int not null default 0,
  progress_total int not null default 1,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (student_email, trilha_key, module_key)
);

create index if not exists idx_student_module_progress_turma on public.student_module_progress (turma);

alter table public.student_module_progress enable row level security;

create policy "student_module_progress_select_all"
  on public.student_module_progress for select
  using (true);

create policy "student_module_progress_insert_all"
  on public.student_module_progress for insert
  with check (true);

create policy "student_module_progress_update_all"
  on public.student_module_progress for update
  using (true)
  with check (true);
