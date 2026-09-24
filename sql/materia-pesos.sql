-- Peso de cada matéria na nota (Gestão → Lançar Notas: campo "Peso"
-- embaixo do nome de cada matéria). É quanto as ATIVIDADES da matéria
-- valem contra Prova Diagnóstica e Prova Final (peso 1 cada):
--   nota = (peso × atividades + Prova + Prova Final) / (peso + 2)
-- Um peso por turma+matéria, vale pra todos os bimestres. Matéria sem
-- linha aqui vale peso 1 (média simples). Ver pesoMateria/fetchMateriaPesos
-- em shared/platform-core.js.
--
-- Rode UMA vez no SQL Editor do Supabase — é seguro rodar de novo
-- (idempotente). É o mesmo trecho que está em
-- sql/supabase-setup-completo.sql, pra quem já tem o banco montado.

create table if not exists public.materia_pesos (
  turma text not null,
  materia_key text not null,
  peso numeric not null default 1 check (peso > 0),
  updated_at timestamptz not null default now(),
  primary key (turma, materia_key)
);

alter table public.materia_pesos enable row level security;

-- O aluno também lê: o Perfil dele calcula a nota com o mesmo peso.
drop policy if exists "materia_pesos_select_all" on public.materia_pesos;
create policy "materia_pesos_select_all"
  on public.materia_pesos for select
  using (true);

drop policy if exists "materia_pesos_insert_professor" on public.materia_pesos;
create policy "materia_pesos_insert_professor"
  on public.materia_pesos for insert
  with check (public.is_professor());

drop policy if exists "materia_pesos_update_professor" on public.materia_pesos;
create policy "materia_pesos_update_professor"
  on public.materia_pesos for update
  using (public.is_professor())
  with check (public.is_professor());
